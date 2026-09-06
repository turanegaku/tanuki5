var hiscore = 0;
var score = 0;

var TITLE = 0;
var GAME = 1;

var step = TITLE;

var result_score;
var result_frame = 0;
var result_note = '';

// the priest's gaze
var CALM = 0;
var WARN = 1;
var WATCH = 2;

var gaze = CALM;
var gaze_timer = 0;
var watch_len = 90;

// per cup difficulty, all set in nextCup()
var need;
var heat_rate;
var cool_rate;
var watch_rate;
var warn_frame;
var feint_rate;

var BOIL_RATE = 1;
// letting go must cost less boil than it buys back in patience, or the
// hardest cups become mathematically unreachable
var BOIL_DECAY = 0.35;
var HEAT_MAX = 100;
// 0.4s, comfortably above human reaction time
var WARN_MIN = 24;

var heat = HEAT_MAX;
var boil = 0;

// leaves: a tanuki needs one on its head to hold a disguise. Being spotted
// costs one; running out of them ends the run. Losing your nerve to the heat
// is not covered - that failure is entirely in the player's own hands.
var LEAVES = 3;
var lives = LEAVES;
var leaf_fall = 0;

var raccoon1;
var img_pot;
var img_lid;
var img_osho;
var img_head;
var pot_buf;

// patches inside tanuki.png (285x291, transparent background): x, y, w, h
// Each patch keeps the whole part plus the stump where it met the tanuki, and
// is placed so that straight cut edge lands inside the kettle's silhouette.
// The tail is drawn mirrored: its cut edge is on the base side, so flipping
// puts the striped tip outwards and tucks the cut under the kettle.
var EAR_L = [62, 10, 56, 61];
var EAR_R = [194, 10, 56, 61];
// the tail is cut with a polygon, not a box: any rectangle big enough to hold
// the whole tail also holds a slice of the hind leg
var TAIL_POLY = [[1, 211], [56, 173], [121, 200], [139, 284], [43, 279]];
var tail_cut = null;
// drawn straight off the cut, so the parts can never come out distorted
var EAR_SCALE = 0.57;
var TAIL_SCALE = 0.54;

// each ear is placed on its own, since the kettle is not symmetric: the spout
// is on one side and the handle on the other. [hidden, showing]
var EAR_LX = [-26, -53];
var EAR_RX = [1, 38];
var EAR_Y = [8, -40];

// embers popping: decoration only, never touches play
var shake = 0;
var lift = 0;   // how far the head is raised off the sutra

// 0 = a plain kettle, 1 = ears and tail all the way out
var slip = 0;

var KETTLE_X = 300;
var KETTLE_Y = 285;
var PRIEST_X = 545;
var HEARTH_Y = 395;
var LEAF_X = 150;
var LEAF_Y = 150;

// Both kettle parts share one 300x248 frame and both priest parts one 247x300
// frame, so each pair lines up when drawn at the same rect. Everything below
// is measured off those frames.
var KW = 210;
var KH = 174;
var POT_TOP = 43 * KH / 248;      // rim, where the lid sits
var POT_BOTTOM = 190 * KH / 248;  // below this the frame holds the trivet
var PW = 134;
var PH = 195;
// the art has the head drawn clear of the body; this drops it back down so the
// chin rests in the collar instead of the neck floating above it
var HEAD_SEAT = 27;
// the lid is drawn hovering above the pot in the source art
var LID_SEAT = 10;
var EYE_FX = 101 / 206;           // eye centre inside the priest frame
var EYE_FY = 60 / 300;
var EYE_GAP = 24 / 206;

function init() {
  score = 0;
  lives = LEAVES;
  leaf_fall = 0;
  nextCup();
  gaze = CALM;
  gaze_timer = 150;
  watch_len = 90;
}

// difficulty saturates at 15 cups, same shape as the other games
function nextCup() {
  var d = min(score, 12);
  need = map(d, 0, 12, 150, 330);
  heat_rate = map(d, 0, 12, 0.62, 0.95);
  cool_rate = map(d, 0, 12, 0.90, 1.25);
  watch_rate = map(d, 0, 12, 0.30, 0.52);
  // never below WARN_MIN: a window shorter than a person can react to is not
  // difficulty, it is a coin toss
  warn_frame = max(WARN_MIN, map(d, 0, 12, 48, 26));
  feint_rate = map(d, 0, 12, 0, 0.35);

  // perturbation, so the curve cannot be memorised cup by cup
  if (score % 7 === 4) warn_frame = max(WARN_MIN, warn_frame * 0.75);
  if (score % 5 === 3) need *= 0.7;

  heat = HEAT_MAX;
  boil = 0;
}

// tanuki.png loads asynchronously, so the cut is made on first use
function buildTailCut() {
  var xs = [];
  var ys = [];
  for (var i = 0; i < TAIL_POLY.length; i++) {
    xs.push(TAIL_POLY[i][0]);
    ys.push(TAIL_POLY[i][1]);
  }
  var x0 = min(xs);
  var y0 = min(ys);
  tail_cut = createGraphics(max(xs) - x0, max(ys) - y0);
  var g = tail_cut.drawingContext;
  g.beginPath();
  for (i = 0; i < TAIL_POLY.length; i++) {
    g[i ? 'lineTo' : 'moveTo'](TAIL_POLY[i][0] - x0, TAIL_POLY[i][1] - y0);
  }
  g.closePath();
  g.clip();
  tail_cut.image(raccoon1, -x0, -y0);
}

function prizeupdate() {
  updatePrize(hiscore);
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  raccoon1 = loadImage('./img/tanuki.png');
  img_pot = loadImage('./img/chagama.png');
  img_lid = loadImage('./img/chagama_futa.png');
  img_osho = loadImage('./img/osho.png');
  img_head = loadImage('./img/osho_head.png');
  // the heat is painted onto the kettle with source-atop, which needs its own
  // surface or it would tint the hearth and the fire as well
  pot_buf = createGraphics(KW, KH);
  pot_buf.imageMode(CORNER);
  pot_buf.noStroke();
  textAlign(CENTER);
  textSize(30);
  imageMode(CENTER);
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

// call when game to title
function gameEnd(note) {
  step = TITLE;
  result_frame = 60;
  result_score = score;
  result_note = note;
  prizeupdate();
}

// keep the share of watched frames near watch_rate
function restLength() {
  // one glance must never outlast patience on its own, or a long look kills
  // a full gauge no matter how well it was played
  watch_len = random(70, HEAT_MAX / heat_rate * 0.72);
  return max(24, watch_len * (1 - watch_rate) / watch_rate - warn_frame);
}

function updatePriest() {
  if (--gaze_timer > 0) return;
  switch (gaze) {
    case CALM:
      gaze = WARN;
      gaze_timer = warn_frame;
      break;
    case WARN:
      // sometimes he only pretends to look up
      if (random(1) < feint_rate) {
        gaze = CALM;
        gaze_timer = restLength();
      } else {
        gaze = WATCH;
        gaze_timer = watch_len;
      }
      break;
    case WATCH:
      gaze = CALM;
      gaze_timer = restLength();
      break;
  }
}

function updateGame(held) {
  if (held) {
    // stay a kettle: the water heats, the patience burns
    boil += BOIL_RATE;
    heat -= heat_rate;
  } else {
    // let go and the tail comes out, but the heat escapes
    heat = min(HEAT_MAX, heat + cool_rate);
    boil = max(0, boil - BOIL_DECAY);
    if (gaze == WATCH) {
      lives--;
      leaf_fall = 45;
      if (lives <= 0) return gameEnd('SEEN!!');
      // he doubts what he saw; that pause is the whole mercy
      gaze = CALM;
      gaze_timer = 90;
    }
  }
  if (heat <= 0) return gameEnd('TOO HOT!!');
  if (boil >= need) {
    score++;
    nextCup();
  }
  updatePriest();
}

function drawHearth() {
  noStroke();
  fill(90, 70, 55);
  rect(0, HEARTH_Y, width, height - HEARTH_Y);

  // fire, taller while the kettle sits on it
  var n = 7;
  for (var i = 0; i < n; i++) {
    var x = KETTLE_X - 90 + i * 30;
    var h = 40 + sin(radians(frameCount * 3 + i * 50)) * 12;
    fill(255, 150 + i * 8, 40, 200);
    triangle(x - 14, HEARTH_Y, x + 14, HEARTH_Y, x, HEARTH_Y - h);
    fill(255, 230, 120, 200);
    triangle(x - 6, HEARTH_Y, x + 6, HEARTH_Y, x, HEARTH_Y - h * 0.55);
  }
}

function drawKettle(held) {
  noStroke();

  // the disguise slides back into the kettle rather than blinking off:
  // the ears sink down through the rim, the tail retracts into its stump
  slip = (slip * 4 + (held ? 0 : 1)) / 5;

  var ey = lerp(EAR_Y[0], EAR_Y[1], slip);
  var exl = lerp(EAR_LX[0], EAR_LX[1], slip);
  var exr = lerp(EAR_RX[0], EAR_RX[1], slip);
  var ew = EAR_L[2] * EAR_SCALE;
  var eh = EAR_L[3] * EAR_SCALE;
  image(raccoon1, KETTLE_X + exl, KETTLE_Y + ey, ew, eh, EAR_L[0], EAR_L[1], EAR_L[2], EAR_L[3]);
  image(raccoon1, KETTLE_X + exr, KETTLE_Y + ey, ew, eh, EAR_R[0], EAR_R[1], EAR_R[2], EAR_R[3]);

  if (!tail_cut && raccoon1.width) buildTailCut();

  push();
  // pivot on the stump, not the middle, so the angle swings the tip and
  // leaves the cut edge buried in the kettle
  translate(KETTLE_X - 61, KETTLE_Y - 2);
  rotate(-0.39);
  var tw = tail_cut ? tail_cut.width * TAIL_SCALE * slip : 0;
  // p5 treats a zero width as "not given" and falls back to the source size,
  // which would flash the whole tail out while it is meant to be hidden
  if (tw > 1) {
    image(tail_cut, -tw / 2, 0, tw, tail_cut.height * TAIL_SCALE);
  }
  pop();

  // patience, with no gauge to read: the heat climbs up inside the kettle.
  // source-atop keeps the paint inside the drawn kettle, and the band stops
  // at POT_BOTTOM so the trivet underneath is left alone
  var stress = 1 - max(0, heat) / HEAT_MAX;
  pot_buf.clear();
  pot_buf.image(img_pot, 0, 0, KW, KH);
  if (stress > 0.01) {
    var surface = POT_BOTTOM - (POT_BOTTOM - POT_TOP) * stress;
    pot_buf.drawingContext.save();
    pot_buf.drawingContext.globalCompositeOperation = 'source-atop';
    pot_buf.fill(214, 68, 32);
    pot_buf.rect(0, surface, KW, POT_BOTTOM - surface);
    pot_buf.fill(255, 190, 90);
    pot_buf.rect(0, surface, KW, 2);
    pot_buf.drawingContext.restore();
  }

  var fx = KETTLE_X - KW * 0.507;
  var fy = KETTLE_Y - KH * 0.469;
  imageMode(CORNER);
  image(pot_buf, fx, fy, KW, KH);
  // the lid starts to rattle once the pressure is on
  image(img_lid, fx, fy + LID_SEAT - stress * stress * 6 - random(0, stress * 3), KW, KH);
  imageMode(CENTER);

  // steam, thicker as the cup gets closer
  var p = boil / need;
  if (p > 0.15) {
    noFill();
    stroke(200, 200, 220, 60 + p * 160);
    strokeWeight(5);
    for (var i = -1; i <= 1; i++) {
      beginShape();
      for (var y = 0; y < 60; y += 10) {
        vertex(KETTLE_X + i * 34 + sin(radians(frameCount * 2 + y * 6 + i * 90)) * 10, KETTLE_Y - 96 - y);
      }
      endShape();
    }
    noStroke();
  }
}

function drawPriest() {
  // the head drifts up off the sutra instead of snapping
  // a small lift only: the overlap with the collar is all that hides the neck
  var want = gaze == WATCH ? 7 : (gaze == WARN ? 3 : 0);
  lift = (lift * 8 + want) / 9;

  var fx = PRIEST_X - PW / 2;
  var fy = HEARTH_Y - PH;
  var hy = fy + HEAD_SEAT - lift;
  var ex = fx + EYE_FX * PW;
  var ey = hy + EYE_FY * PH;
  var gap = EYE_GAP * PW;

  if (gaze == WATCH) {
    noStroke();
    fill(255, 110, 110, 80);
    ellipse(ex, ey + 8, 150, 150);
  }

  imageMode(CORNER);
  image(img_osho, fx, fy, PW, PH);
  image(img_head, fx, hy, PW, PH);
  imageMode(CENTER);

  // the eyes are the whole signal, which is why they are not part of the art
  if (gaze == WATCH) {
    noStroke();
    fill(228, 60, 24);
    ellipse(ex - gap, ey, 14, 14);
    ellipse(ex + gap, ey, 14, 14);
  } else {
    stroke(40);
    strokeWeight(3);
    line(ex - gap - 7, ey, ex - gap + 7, ey);
    line(ex + gap - 7, ey, ex + gap + 7, ey);
    noStroke();
  }

  if (gaze == WARN) {
    fill(80);
    textSize(30);
    text('...', ex, hy - 6);
  }
}

// a disguise leaf. Loses one and it drifts off rather than blinking out
function drawLeaf(x, y, s, a) {
  push();
  translate(x, y);
  rotate(-0.45);
  noStroke();
  fill(112, 168, 72, a);
  ellipse(0, 0, s * 0.56, s);
  stroke(66, 108, 44, a);
  strokeWeight(2);
  line(0, -s * 0.42, 0, s * 0.46);
  pop();
  noStroke();
}

function drawLeaves() {
  for (var i = 0; i < lives; i++) {
    drawLeaf(LEAF_X + i * 38, LEAF_Y, 34, 255);
  }
  if (leaf_fall > 0) {
    leaf_fall--;
    var t = 1 - leaf_fall / 45;
    drawLeaf(LEAF_X + lives * 38 + t * 18, LEAF_Y + t * t * 100, 34, 255 * (1 - t));
  }
}

// one teacup, filling as the water comes to the boil
function drawCup(x, y, s, ratio) {
  noStroke();
  fill(248, 246, 238);
  rect(x - s / 2, y - s * 0.55, s, s * 0.9, 4, 4, s * 0.45, s * 0.45);
  if (ratio > 0.02) {
    var th = (s * 0.78) * min(1, ratio);
    fill(126, 158, 74);
    rect(x - s / 2 + 4, y + s * 0.33 - th, s - 8, th, 0, 0, s * 0.38, s * 0.38);
  }
}

// the cup being brewed, plus every cup already poured, standing on the hearth
function drawCups() {
  drawCup(442, 352, 70, boil / need);

  var n = int(score);
  if (n <= 0) return;
  var gap = min(32, 700 / n);
  for (var i = 0; i < n; i++) {
    drawCup(48 + i * gap, 424, min(26, gap * 0.85), 1);
  }
}

// draw title & result
function title() {
  noStroke();
  fill(255, 255, 255, 200);
  rectMode(CENTER);
  rect(width / 2, height / 2 - 20, 420, 220, 30);
  rectMode(CORNER);

  if (result_frame > 0) {
    if (result_frame != 30)
      result_frame--;
    var dd = map(result_frame, 60, 0, sqrt(width), -sqrt(width));
    dd = dd * dd;
    textSize(50);
    fill(0);
    text('RESULT', width / 2 + dd, height / 5 + 40);
    text(result_score + ' CUPS', width / 2 + dd, height / 2 + 10);
    textSize(26);
    fill(200, 80, 80);
    text(result_note, width / 2 + dd, height / 2 + 55);
  } else {
    textSize(32);
    fill(0);
    text('Click & HOLD', width / 2, height / 2);
  }
}

function draw() {
  background(255);

  // touches too: holding is the whole game, it has to work on a phone
  var held = (mouseIsPressed || touches.length > 0) && step == GAME;

  if (step == GAME) {
    updateGame(held);
  }

  // embers popping
  if (frameCount % 150 === 0 && random(1) < 0.5) shake = 7;
  shake *= 0.85;

  push();
  translate(random(-shake, shake), 0);
  drawHearth();
  drawKettle(held);
  pop();

  drawPriest();
  drawCups();
  drawLeaves();

  if (step == TITLE) {
    title();
  }

  hiscore = int(max(score, hiscore));
  setText('score', int(score));
  setText('hiscore', hiscore);
}

function mousePressed() {
  if (step == TITLE) {
    if (result_frame == 30) result_frame--;
    if (result_frame <= 0) {
      step = GAME;
      init();
    }
  }
}
