// node test_gyokuto.js
// Guards the one property GYOKUTO is built around: the theoretical clear time
// must not move when the clouds do. Everything here is the game's own numbers,
// read straight out of docs/js/gyokuto.js.
const assert = require('assert');

// gyokuto.js only assigns globals and defines functions at load time, so the
// p5 names it mentions are enough to let it evaluate.
global.sin = Math.sin;
global.max = Math.max;
global.min = Math.min;
global.constrain = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
global.map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
global.millis = () => now;
let now = 0;
new (require('vm').Script)(require('fs').readFileSync('docs/js/gyokuto.js', 'utf8')).runInThisContext();

const FLOOR = MOON_NEED / FILL_RATE;   // seconds of moonlight the run needs

// take the cloud timings from the game rather than repeating them here, so
// retuning visibleWindow()/cloudHide() cannot quietly invalidate this file
moon = 0;
const EASY = [visibleWindow(), cloudHide()];
moon = MOON_NEED;
const HARD = [visibleWindow(), cloudHide()];
moon = 0;

// --- the rates ---------------------------------------------------------------

assert.strictEqual(depthAt(0), 1);                 // dead centre
assert.strictEqual(depthAt(FIRE_CORE), 1);         // the core is a disc, not a point
assert.strictEqual(depthAt(FIRE_R), 0);            // rim
assert.strictEqual(depthAt(FIRE_R + 50), 0);       // outside never goes negative
assert.ok(depthAt(FIRE_R - 1) > 0 && depthAt(FIRE_R - 1) < 0.05);

assert.strictEqual(charRate(0), 0);                // out of the fire is free
assert.ok(charRate(0.001) > 1, 'stepping in at all must cost, or the rim is a free seat');
assert.ok(charRate(1) > charRate(0.5) && charRate(0.5) > charRate(0.1));

// deep is faster but dearer: moon bought per point of char must fall with depth,
// otherwise there is no decision to make about how far in to stand
const perChar = (d) => fillRate(d) / charRate(d);
assert.ok(perChar(0.42) > perChar(1.0));
assert.ok(perChar(0.42) > perChar(0.15));

// the light a cloud takes away is exactly what cloudHide() promises, so the
// tuning numbers still mean seconds
{
  const w = CLOUD_SPEED * 1.6;
  let lost = 0;
  const STEP = 1 / 2000;
  for (let x = MOON_X + MOON_R + 5; x > MOON_X - MOON_R - w - 5; x -= CLOUD_SPEED * STEP) {
    lost += coverOf(x, w) * STEP;
  }
  assert.ok(Math.abs(lost - 1.6) < 5e-3, 'a 1.6s cloud cost ' + lost.toFixed(3) + 's of light');
}

// the whole HP bar cannot be spent on filling alone, or nothing is left to
// gamble with while the moon is behind a cloud
assert.ok(charRate(1) * FLOOR < HP_MAX);
assert.ok(charRate(1) * FLOOR > HP_MAX * 0.7, 'slack this big makes the run a formality');

// --- clouds must not move the floor ------------------------------------------

// The clock advances with the light whether or not the rabbit is in the fire, so
// every photon spent outside the fire is clock without fill. An ideal harvester
// therefore sits in the core for as long as there is ANY light, and clocks
// exactly the floor - whatever the clouds do. `leaveAt` is the light level the
// player gives up at: 0 is that ideal, higher is a player who ducks out early.
function simulate(schedule, leaveAt, immortal) {
  let moon = 0, char = 0, clock = 0;
  const STEP = 1 / 480;
  const ramp = 2 * MOON_R / CLOUD_SPEED;      // time for a cloud edge to cross
  const advance = (secs, lightOf) => {
    for (let t = 0; t < secs; t += STEP) {
      const L = lightOf(t);
      const d = L > leaveAt ? 1 : 0;          // in the fire only while it pays
      moon += fillRate(d) * L * STEP;
      char += charRate(d) * STEP;
      clock += L * STEP;
      if (char >= HP_MAX && !immortal) return 'ash';
      if (moon >= MOON_NEED) return 'clear';
    }
    return null;
  };
  for (const [visible, cloud] of schedule) {
    let r = advance(visible, () => 1);
    if (r) return {r, clock, char};
    r = advance(cloud + ramp, (t) => {        // ramp down, dark, ramp back up
      if (t < ramp) return 1 - t / ramp;
      if (t < cloud) return 0;
      return (t - cloud) / ramp;
    });
    if (r) return {r, clock, char};
  }
  return {r: 'ranout', clock, char};
}

let seed = 12345;
const rnd = (lo, hi) => lo + (hi - lo) * ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

let idealChar = 0, dodgeWorst = 0, dodgeBest = 1e9;
for (let i = 0; i < 200; i++) {
  const schedule = [];
  for (let k = 0; k < 60; k++) schedule.push([rnd(HARD[0], EASY[0]), rnd(EASY[1], HARD[1])]);

  // the floor, and the whole point of this file: the clouds may not move it
  // the floor is kinematics, not endurance: run it with the char ignored
  const ideal = simulate(schedule, 0, true);
  // 10ms of slack is the fixed-step integration overshooting the goal; a real
  // dependence on the weather would show up as seconds, not milliseconds
  assert.ok(Math.abs(ideal.clock - FLOOR) < 1e-2,
    'clouds moved the floor: ' + ideal.clock.toFixed(3) + ' vs ' + FLOOR.toFixed(3));
  idealChar = Math.max(idealChar, ideal.char);
  assert.strictEqual(ideal.r, 'clear');

  // sitting in the fire through the dark has to kill: the clouds are only a
  // decision if ignoring them is fatal
  assert.strictEqual(simulate(schedule, -1).r, 'ash', 'never leaving the fire survived');

  // a player who ducks out as the light dies must be able to finish
  const dodge = simulate(schedule, 0.5);
  assert.strictEqual(dodge.r, 'clear', 'ducking out at half light must still clear');
  assert.ok(dodge.clock > FLOOR);
  dodgeWorst = Math.max(dodgeWorst, dodge.clock);
  dodgeBest = Math.min(dodgeBest, dodge.clock);
}

// the floor must be out of reach on the char budget, or there is no decision to
// make about when to duck out - you would simply never leave the fire
assert.ok(idealChar > HP_MAX, 'harvesting every photon costs only ' + idealChar.toFixed(0) + ' char');

// and the affordable play has to land in a range worth competing over
assert.ok(dodgeWorst < 20, 'half-light play takes ' + dodgeWorst.toFixed(2) + 's');
assert.ok(dodgeWorst - dodgeBest < 1.5,
  'cloud luck swings the achievable time by ' + (dodgeWorst - dodgeBest).toFixed(2) + 's');

// and the floor is what the page advertises as the king's threshold, minus room
assert.ok(FLOOR * 1000 < 12000, 'k_score 00:12.00 must be above the floor');

// --- the drift is work, never a wall -----------------------------------------

// the fire's centre may never outrun the rabbit, or holding the core becomes
// luck rather than skill
let peak = 0;
let prev = (now = 0, fireCentre());
for (now = 1; now < 20000; now++) {
  const c = fireCentre();
  peak = Math.max(peak, Math.hypot(c[0] - prev[0], c[1] - prev[1]) * 1000);
  prev = c;
}
assert.ok(peak < RABBIT_SPEED * 0.6, 'fire drifts at ' + peak.toFixed(0) + ' px/s');

console.log('gyokuto.js ok  (floor ' + FLOOR.toFixed(2) + 's, half-light play ' +
  dodgeBest.toFixed(2) + '-' + dodgeWorst.toFixed(2) + 's, drift ' + peak.toFixed(0) + 'px/s)');
