// GYOKUTO - 揺れる炎に居続けるやつ
//
// `light` is how much of the moon the clouds have left uncovered, 0..1, and it
// scales BOTH the fill and the clock. The clock therefore measures moonlight,
// not wall time, and the theoretical best is MOON_NEED / FILL_RATE no matter how
// the clouds happen to fall - dividing both sides by the same light cancels it.
// Clouds drift at a constant speed, so their width on screen is readable as the
// light they are about to take away: a perfect player leaves the fire, waits out
// the cloud, and is back in the core as the light returns, losing nothing. What
// the clouds change is the char budget, never the floor.
bestIsTime = true;

var hiscore = 1800000;
var score = 0;          // ms of moonlight: real time weighted by `light`

var TITLE = 0;
var GAME = 1;
var step = TITLE;

var result_score;
var result_frame = 0;
var result_ok = false;
var anim = 0;           // frames since the run ended, drives the camera pan

// --- tuning -----------------------------------------------------------------

var MOON_NEED = 100;
var FILL_RATE = 12;     // moon per second at d = 1  -> floor is 8.33s
var CHAR_BASE = 5;      // char per second scale     -> 10/s at d = 1
var HP_MAX = 100;       // 83 of it goes on the fill itself; the rest is slack

var RABBIT_SPEED = 260; // px per second
var RABBIT_Y = 340;     // it walks the fire line and nothing else
var RABBIT_H = 76;
var RABBIT_W = RABBIT_H * 159 / 300;   // the sprite's own aspect

var FIRE_X = 400;
var FIRE_Y = 330;
var FIRE_R = 112;
var FIRE_CORE = 28;     // within this of the centre the fire is at full strength

// straight overhead, so the clear pan is one vertical sweep off the fire
var MOON_X = 400;
var MOON_Y = 84;
var MOON_R = 46;

// constant, so distance on screen reads directly as seconds
var CLOUD_SPEED = 110;

// --- state ------------------------------------------------------------------

var moon = 0;
var charred = 0;
var rx = FIRE_X;
var hop = 0;
var light = 1;          // 1 = clear moon, 0 = fully behind cloud
var last_ms = 0;
var asc_x = 0;          // where the rabbit stood when the moon filled
var asc_y = 0;

var clouds = [];
var stars = [];

var imgs = [];
var tanukis = [];

// difficulty. `moon` cannot exceed MOON_NEED, so these are clamped by
// construction: the run tops out at a fixed hardest setting.
function visibleWindow() {
  return map(moon, 0, MOON_NEED, 3.2, 1.6);
}

// long enough that sitting in the fire through the dark is fatal: that is what
// makes ducking out a decision rather than a formality
function cloudHide() {
  return map(moon, 0, MOON_NEED, 1.6, 2.8);
}

// --- pure rates (no p5, exercised by test_gyokuto.js) -----------------------

function depthAt(dist) {
  var d = (FIRE_R - dist) / (FIRE_R - FIRE_CORE);
  return d < 0 ? 0 : (d > 1 ? 1 : d);
}

function fillRate(d) {
  return FILL_RATE * d;
}

// fraction of the moon's width the clouds have not taken. Integrated over one
// crossing this costs exactly cloud.w / CLOUD_SPEED seconds of light, which is
// what cloudHide() is written in.
function coverOf(x, w) {
  var lo = max(x, MOON_X - MOON_R);
  var hi = min(x + w, MOON_X + MOON_R);
  return hi <= lo ? 0 : (hi - lo) / (2 * MOON_R);
}

// Stepping into the fire at all costs 30% of the deep rate: the rim is not a
// free place to loiter, so "in or out" stays a real decision.
function charRate(d) {
  return d <= 0 ? 0 : CHAR_BASE * (0.3 + 1.7 * d * d);
}

function moonLight() {
  var cover = 0;
  for (var i = 0; i < clouds.length; i++) cover += coverOf(clouds[i].x, clouds[i].w);
  return constrain(1 - cover, 0, 1);
}

// --- setup ------------------------------------------------------------------

function init() {
  moon = 0;
  charred = 0;
  score = 0;
  rx = FIRE_X + FIRE_R + 60;
  hop = 0;
  light = 1;
  anim = 0;
  clouds = [];
  scheduleCloud();
  last_ms = millis();
}

function prizeupdate() {
  updatePrize(hiscore);
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  imgs[0] = loadImage('./img/gyokuto.png');
  imgs[1] = loadImage('./img/gyokuto2.png');
  tanukis[0] = loadImage('./img/tanuki.png');
  tanukis[1] = loadImage('./img/tanuki2.png');
  textAlign(CENTER, CENTER);
  textSize(30);

  randomSeed(7);
  for (var i = 0; i < 60; i++) {
    stars.push([random(width), random(200), random(0.6, 1.8)]);
  }
  init();

  var best = loadBest();
  if (best !== null) {
    hiscore = best;
    prizeupdate();
  }
  onExit(function () {
    saveBest(hiscore);
  });
}

// --- run --------------------------------------------------------------------

function scheduleCloud() {
  // spawn far enough right that it starts biting into the moon exactly one
  // window from now
  clouds.push({
    x: MOON_X + MOON_R + CLOUD_SPEED * visibleWindow(),
    w: CLOUD_SPEED * cloudHide(),
    y: MOON_Y + random(-14, 10),
    seed: random(100),
  });
}

function update(dt) {
  var i;
  var moved = false;

  // rabbit: left and right only, with a speed cap - that cap is what makes
  // leaving the fire cost something
  var want = constrain(mouseX, FIRE_X - FIRE_R - 70, FIRE_X + FIRE_R + 70);
  var dx = want - rx;
  var stepLen = RABBIT_SPEED * dt;
  if (abs(dx) > 0.5) {
    moved = true;
    rx += abs(dx) > stepLen ? (dx > 0 ? stepLen : -stepLen) : dx;
  }
  if (moved) hop += dt * 9;

  // clouds
  for (i = clouds.length - 1; i >= 0; i--) {
    clouds[i].x -= CLOUD_SPEED * dt;
    if (clouds[i].x + clouds[i].w < -60) clouds.splice(i, 1);
  }
  light = moonLight();
  var pending = false;
  for (i = 0; i < clouds.length; i++) {
    if (clouds[i].x + clouds[i].w > MOON_X - MOON_R) pending = true;
  }
  if (!pending) scheduleCloud();

  var d = depthAt(abs(rx - fireCentre()[0]));

  charred += charRate(d) * dt;
  // one factor for both, so the floor cannot move with the weather
  moon += fillRate(d) * light * dt;
  score += light * dt * 1000;

  if (moon >= MOON_NEED) {
    moon = MOON_NEED;
    runEnd(true);
  } else if (charred >= HP_MAX) {
    charred = HP_MAX;
    runEnd(false);
  }
}

function runEnd(ok) {
  step = TITLE;
  result_frame = 60;
  result_ok = ok;
  result_score = score;
  anim = 0;
  asc_x = rx;
  asc_y = RABBIT_Y;
  if (ok && hiscore > score) {
    hiscore = score;
    prizeupdate();
  }
}

// The centre drifts sideways, so holding the core is an active chase. Peak
// speed here is 26*2.0 + 14*3.7 = 104 px/s, well under RABBIT_SPEED - the drift
// is never a wall, only work. It moves the fire, never its strength, so the
// time floor is untouched by it.
function fireCentre() {
  var t = millis() / 1000;
  return [FIRE_X + sin(t * 2.0) * 26 + sin(t * 3.7 + 1.2) * 14, FIRE_Y];
}

// --- drawing ----------------------------------------------------------------

// camView: identity while playing, sweeping up into the moon once cleared
function camView() {
  if (step == GAME || !result_ok) return [width / 2, height / 2, 1];
  var e = constrain(anim / 46, 0, 1) * (result_frame < 30 ? max(result_frame, 0) / 29 : 1);
  var cx, cy, s;
  if (e < 0.25) {
    // wind-up: drop onto the fire before the sweep
    var a = ease(e / 0.25);
    cx = lerp(width / 2, FIRE_X, a);
    cy = lerp(height / 2, FIRE_Y, a);
    s = lerp(1, 1.7, a);
  } else {
    var b = ease((e - 0.25) / 0.75);
    cx = lerp(FIRE_X, MOON_X, b);
    cy = lerp(FIRE_Y, MOON_Y, b);
    s = lerp(1.7, 4.6, b);
  }
  return [cx, cy, s];
}

function ease(t) {
  return 1 - pow(1 - constrain(t, 0, 1), 3);
}

// one layer of flame: a zigzag of tongues along the top, tallest in the middle
function flames(cx, base, r, seed) {
  var tips = 11;
  beginShape();
  vertex(cx - r, base);
  for (var i = 0; i <= tips; i++) {
    var t = i / tips;
    var x = cx - r + 2 * r * t;
    var edge = 1 - pow(abs(t - 0.5) * 2, 1.7);
    var n = noise(seed + i * 0.7, millis() / 190);
    var h = r * edge * (i % 2 ? 1.25 : 0.5) * (0.7 + 0.6 * n);
    vertex(x, base - h);
  }
  vertex(cx + r, base);
  endShape(CLOSE);
}

function drawSky() {
  noStroke();
  for (var i = 0; i < 18; i++) {
    fill(lerpColor(color(8, 10, 34), color(46, 34, 62), i / 17));
    rect(-400, height * i / 18 - 300, width + 800, height / 18 + 302);
  }
  for (i = 0; i < stars.length; i++) {
    fill(255, 255, 230, 120 + 100 * sin(millis() / 700 + i));
    ellipse(stars[i][0], stars[i][1], stars[i][2], stars[i][2]);
  }
}

// the moon is the score board twice over: how far it has filled is the
// progress, how brightly it burns is how much light the clouds are still
// letting through - and light is exactly the rate everything advances at.
function drawMoon() {
  noStroke();
  var lit = lerpColor(color(96, 92, 112), color(252, 248, 214), light);

  // halo: the glow reaches out as far as the light is strong
  for (var g = 10; g >= 1; g--) {
    fill(red(lit), green(lit), blue(lit), 5 * light);
    ellipse(MOON_X, MOON_Y, MOON_R * 2 * (1 + g * 0.17), MOON_R * 2 * (1 + g * 0.17));
  }

  fill(70, 66, 92);
  ellipse(MOON_X, MOON_Y, MOON_R * 2, MOON_R * 2);

  var lv = moon / MOON_NEED;
  if (lv >= 1) {
    fill(lit);
    ellipse(MOON_X, MOON_Y, MOON_R * 2, MOON_R * 2);
  } else if (lv > 0) {
    fill(lit);
    beginShape();
    for (var s = -1; s <= 1; s += 2) {
      for (var k = 0; k <= 40; k++) {
        var y = MOON_R - 2 * MOON_R * lv * (s < 0 ? k / 40 : 1 - k / 40);
        var w = sqrt(max(0, MOON_R * MOON_R - y * y));
        vertex(MOON_X + s * w, MOON_Y + y);
      }
    }
    endShape(CLOSE);
  }
  if (lv > 0) {
    fill(red(lit) * 0.9, green(lit) * 0.9, blue(lit) * 0.86);
    if (lv > 0.62) ellipse(MOON_X - 13, MOON_Y - 8, 14, 11);
    if (lv > 0.3) ellipse(MOON_X + 15, MOON_Y + 14, 10, 8);
    if (lv > 0.78) ellipse(MOON_X + 6, MOON_Y - 24, 8, 7);
  }
}

function drawClouds() {
  noStroke();
  for (var i = 0; i < clouds.length; i++) {
    var c = clouds[i];
    fill(58, 54, 78, 240);
    var n = max(3, round(c.w / 46));
    for (var k = 0; k <= n; k++) {
      var x = c.x + c.w * k / n;
      var r = 26 + 12 * sin(c.seed + k * 1.7);
      ellipse(x, c.y + 6 * sin(c.seed + k), r * 2.1, r * 1.35);
    }
  }
}

function drawGround() {
  noStroke();
  fill(24, 20, 32);
  beginShape();
  vertex(-50, height + 50);
  vertex(-50, 300);
  for (var x = -50; x <= width + 50; x += 50) {
    vertex(x, 300 + sin(x / 90) * 8);
  }
  vertex(width + 50, height + 50);
  endShape(CLOSE);
}

function drawFire(fc) {
  noStroke();
  // logs, laid by the monkey and lit by the fox - they are why there is a fire
  fill(52, 34, 24);
  push();
  translate(FIRE_X, FIRE_Y + 52);
  rotate(-0.16);
  rect(-64, -6, 128, 12, 6);
  rotate(0.38);
  rect(-58, -5, 116, 10, 5);
  pop();

  // the heat reaches exactly FIRE_R, so show it: the rim is where 'in or out'
  // is decided and the player may not have to guess where it is
  for (var i = 5; i >= 1; i--) {
    fill(224, 108, 40, 15);
    ellipse(fc[0], fc[1], FIRE_R * 2 * i / 5, FIRE_R * 2 * i / 5);
  }

  var base = fc[1] + 44;
  fill(206, 78, 26);
  flames(fc[0], base, FIRE_R * 0.98, 11);
  fill(240, 146, 34);
  flames(fc[0], base, FIRE_R * 0.62, 27);
  fill(255, 206, 96);
  flames(fc[0], base - 2, FIRE_CORE * 1.7, 43);
}

// half the health read-out: the rabbit itself scorches from white to black.
// No bar, no number - the thing on the board is the gauge.
function drawRabbit() {
  var i = (hop % 2 < 1) ? 0 : 1;
  if (!imgs[i]) i = 0;
  if (!imgs[i]) return;
  var f = charred / HP_MAX;
  var x = rx;
  var y = RABBIT_Y;
  var w = RABBIT_W;
  var h = RABBIT_H;
  var r = 255 - 205 * f;
  var g = 255 - 222 * f;
  var b = 255 - 224 * f;
  if (step == TITLE && result_ok) {
    // Carried up into the moon: position, size and colour all run on the same
    // ease, so the figure the camera lands on IS this sprite - there is no
    // moment where one drawing is swapped for another.
    var e = ease(constrain((anim - 6) / 40, 0, 1));
    x = lerp(asc_x, MOON_X, e);
    y = lerp(asc_y, MOON_Y - MOON_R * 0.2, e);
    w = lerp(RABBIT_W, MOON_R * 1.05 * 159 / 300, e);
    h = lerp(RABBIT_H, MOON_R * 1.05, e);
    // the mark left on the moon is however far the rabbit actually burned:
    // a run that only just made it leaves a faint one, a run that burned to
    // the last of itself leaves a dark, unmistakable one
    r = lerp(r, lerp(208, 104, f), e);
    g = lerp(g, lerp(202, 97, f), e);
    b = lerp(b, lerp(174, 80, f), e);
    i = 0;
  }
  tint(r, g, b);
  image(imgs[i], x - w / 2, y - h / 2, w, h);
  noTint();
}

// The tanuki line both banks of the fire and can only watch. How hard they are
// jittering is the other half of the health read-out: calm at full, frantic
// near the end. Same reading as the rabbit's colour, twice over, so a glance at
// either answers 'how much is left' with no bar or number on screen. They stand
// outside the rabbit's lane, so they are scenery and never in the way.
//
// This is a gauge in the corner of the eye, not something to look at: the work
// is holding the drifting core, and six figures twitching beside it steals that.
// So they sit dead still through the first half and only start moving once the
// answer matters, slowly even then.
var TANUKI = [
  [66, 0.0, 62], [126, 1.9, 70], [188, 3.4, 58],
  [612, 0.8, 60], [674, 2.6, 70], [734, 4.5, 62],
];

function drawTanuki() {
  var f = charred / HP_MAX;
  var t = millis() / 1000;
  var panic = constrain((f - 0.45) / 0.55, 0, 1);
  var shake = panic * panic * 9;
  for (var k = 0; k < TANUKI.length; k++) {
    var p = TANUKI[k];
    var ph = t * (1.6 + panic * 7) + p[1];
    var x = p[0] + sin(t * (2 + panic * 8) + p[1]) * shake;
    var y = 348 - abs(sin(ph)) * shake * 1.1;
    var i = (panic > 0.5 && sin(ph) > 0) ? 1 : 0;
    if (!tanukis[i]) i = 0;
    if (!tanukis[i]) continue;
    push();
    translate(x, y);
    rotate(sin(t * (2.2 + panic * 7) + p[1]) * panic * 0.14);
    if (p[0] > FIRE_X) scale(-1, 1);        // the far bank faces back at the fire
    image(tanukis[i], -p[2] / 2, -p[2] / 2, p[2], p[2]);
    pop();
  }
}

function drawScene() {
  drawSky();
  drawMoon();
  drawClouds();
  drawGround();
  var fc = fireCentre();
  drawFire(fc);
  drawTanuki();
  drawRabbit();
}

function draw() {
  var now = millis();
  var dt = min((now - last_ms) / 1000, 0.05);
  last_ms = now;

  if (step == GAME) update(dt);
  else anim++;

  var cam = camView();
  push();
  translate(width / 2, height / 2);
  scale(cam[2]);
  translate(-cam[0], -cam[1]);
  drawScene();
  pop();

  if (step == TITLE) title(cam);

  setText('score', fmtTime(score));
  setText('hiscore', fmtTime(hiscore));
}

function title(cam) {
  if (result_frame > 0 && result_frame != 30) result_frame--;

  if (result_frame <= 0) {
    // the camera is back off the moon by now, but keep the prompt legible even
    // mid-pull-out: dark while any of the moon's glare is still filling frame
    fill(cam[2] > 2 ? color(58, 46, 30) : color(255));
    textSize(30);
    text('Tap or Click!!', width / 2, height / 2);
    return;
  }

  if (!result_ok) {
    death();
    return;
  }

  // score lands inside the full moon once the camera gets there
  var e = constrain(anim / 46, 0, 1);
  if (e < 1) return;
  var p = constrain((anim - 46) / 12, 0, 1);
  var sx = (MOON_X - cam[0]) * cam[2] + width / 2;
  var sy = (MOON_Y + MOON_R * 0.5 - cam[1]) * cam[2] + height / 2;
  fill(58, 46, 30);
  textSize(56 * cam[2] / 4.6 * (1 + 2.2 * (1 - p) * (1 - p)));
  text(fmtTime(result_score), sx, sy);
}

// The run ended in the fire, so the screen says so the way that kind of screen
// has said it since Demon's Souls: the world dims, a band settles across the
// middle, and the words come up slowly, wide apart - in ash grey, not blood.
function death() {
  var e = ease(constrain(anim / 55, 0, 1));
  if (result_frame < 30) e *= max(result_frame, 0) / 29;   // fade back out on the click
  noStroke();
  fill(0, 0, 0, 185 * e);
  rect(0, 0, width, height);

  // the band is stacked, not a rectangle: hard edges read as a UI panel, and
  // this is supposed to read as the light going out
  for (var i = 0; i < 14; i++) {
    fill(0, 0, 0, 11 * e * (1 - i / 14));
    rect(0, height / 2 - 58 + i * 2, width, 116 - i * 4);
  }

  push();
  textFont('Georgia, "Times New Roman", serif');
  var sc = lerp(0.9, 1, e);
  // ash, not blood: pale warm grey, the colour the rabbit just turned
  fill(150, 144, 138, 45 * e);
  spacedText('TURNED TO ASH', width / 2, height / 2, 48 * sc, 7 * sc);
  fill(0, 0, 0, 190 * e);
  spacedText('TURNED TO ASH', width / 2 + 2, height / 2 + 3, 46 * sc, 7 * sc);
  fill(198, 192, 185, 255 * e);
  spacedText('TURNED TO ASH', width / 2, height / 2, 46 * sc, 7 * sc);
  pop();
}

// p5 has no letter-spacing, and the spacing is most of the look
function spacedText(str, cx, cy, size, gap) {
  textSize(size);
  var i;
  var w = -gap;
  for (i = 0; i < str.length; i++) w += textWidth(str[i]) + gap;
  var x = cx - w / 2;
  for (i = 0; i < str.length; i++) {
    text(str[i], x + textWidth(str[i]) / 2, cy);
    x += textWidth(str[i]) + gap;
  }
}

function start() {
  if (step != TITLE) return;
  if (result_frame == 30) result_frame--;
  if (result_frame <= 0) {
    step = GAME;
    init();
  }
}

function onCanvas() {
  return 0 <= mouseX && mouseX < width && 0 <= mouseY && mouseY < height;
}

// p5 1.11 routes touches to touchStarted only, and swallows the mouse event the
// tap would synthesise. Returning false also kills scroll/zoom on the tap.
function touchStarted() {
  if (onCanvas()) {
    start();
    return false;
  }
}

function mousePressed() {
  if (onCanvas()) start();
}
