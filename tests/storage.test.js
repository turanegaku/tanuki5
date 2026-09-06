// node tests/storage.test.js
// Checks the two pieces of storage.js that carry real logic: the time
// formatting that replaced moment.js, and the prize threshold comparison.
const assert = require('assert');

const fake = {};
global.document = {title: 'T', getElementById: (id) => fake[id]};
global.localStorage = {
  data: {},
  getItem(k) { return k in this.data ? this.data[k] : null; },
  setItem(k, v) { this.data[k] = v; },
};
new (require('vm').Script)(require('fs').readFileSync('docs/js/storage.js', 'utf8')).runInThisContext();

// fmtTime matches what moment(ms).format('mm:ss.SS') used to print
assert.strictEqual(fmtTime(0), '00:00.00');
assert.strictEqual(fmtTime(1800000), '30:00.00');
assert.strictEqual(fmtTime(123456), '02:03.45');   // centiseconds truncate, never round
assert.strictEqual(fmtTime(-5), '00:00.00');

// parseTime reads both the displayed and the stored spelling
assert.strictEqual(parseTime('02:03.45'), 123450);
assert.strictEqual(parseTime('020345'), 123450);
assert.strictEqual(packTime(123456), '020345');
assert.strictEqual(parseTime(packTime(123456)), 123450);  // stable after one round trip

// storage survives junk left by an older version
localStorage.setItem('T', 'not json');
assert.deepStrictEqual(loadGame('T'), {});
saveGame('T', {best: 7});
assert.deepStrictEqual(loadGame('T'), {best: 7});

function prizeOf(isTime, best, q, k) {
  prize = 0;
  bestIsTime = isTime;
  fake.q_score = {textContent: q};
  fake.k_score = {textContent: k};
  fake.queen = {style: {}};
  fake.king = {style: {}};
  updatePrize(best);
  return prize;
}

// points: higher is better
assert.strictEqual(prizeOf(false, 1999, '2000', '4000'), 0);
assert.strictEqual(prizeOf(false, 2000, '2000', '4000'), 1);
assert.strictEqual(prizeOf(false, 4000, '2000', '4000'), 2);

// time: lower is better, and a best that *displays* as the goal must count
assert.strictEqual(prizeOf(true, 120001, '02:00.00', '00:45.00'), 1);
assert.strictEqual(prizeOf(true, 120010, '02:00.00', '00:45.00'), 0);
assert.strictEqual(prizeOf(true, 45000, '02:00.00', '00:45.00'), 2);

// best round trips through storage at the precision the page shows
bestIsTime = true;
prize = 2;
saveBest(123456);
assert.strictEqual(loadBest(), 123450);
bestIsTime = false;
saveBest(4000);
assert.strictEqual(loadBest(), 4000);
assert.strictEqual(loadGame('T').prize, 2);

console.log('storage.js ok');
