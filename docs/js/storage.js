// Shared runtime for every page: DOM access, time formatting, score persistence.
// Loaded before the per-game script (and on the index, without p5), so nothing
// here may depend on p5 globals.

function el(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  var e = el(id);
  if (e) e.textContent = value;
}

// --- time helpers -----------------------------------------------------------
// Times are plain millisecond numbers. They are shown as 'mm:ss.SS' and stored
// as 'mmssSS', both at centisecond precision, both wrapping at one hour.

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function fmtTime(ms) {
  var t = Math.max(0, Math.floor(ms));
  return pad2(Math.floor(t / 60000) % 60) + ':' +
    pad2(Math.floor(t / 1000) % 60) + '.' +
    pad2(Math.floor(t / 10) % 100);
}

// Accepts both 'mm:ss.SS' and the stored 'mmssSS'.
function parseTime(str) {
  var d = String(str).replace(/\D/g, '');
  return (+d.slice(0, 2) || 0) * 60000 + (+d.slice(2, 4) || 0) * 1000 + (+d.slice(4, 6) || 0) * 10;
}

function packTime(ms) {
  return fmtTime(ms).replace(/\D/g, '');
}

// --- persistence ------------------------------------------------------------

function loadGame(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (e) {
    // corrupt or disabled storage must not take the game down with it
    return {};
  }
}

function saveGame(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // quota exceeded or private mode: a lost best score is not worth throwing
  }
}

// --- best score & prize -----------------------------------------------------
// Timed games set `bestIsTime = true` before calling loadBest(): their best is
// a duration in ms and lower wins.

var prize = 0;
var bestIsTime = false;

function loadBest() {
  var v = loadGame(document.title).best;
  if (v === undefined || v === null || v === '') return null;
  return bestIsTime ? parseTime(v) : parseInt(v, 10);
}

function saveBest(best) {
  var data = loadGame(document.title);
  data.best = bestIsTime ? packTime(best) : Math.floor(best);
  data.prize = prize;
  saveGame(document.title, data);
}

// Light the prize icons once `best` beats the thresholds printed on the page.
function updatePrize(best) {
  var beats = function (id) {
    var goal = el(id).textContent;
    return bestIsTime ? Math.floor(best / 10) * 10 <= parseTime(goal) : best >= parseInt(goal, 10);
  };
  if (!beats('q_score')) return;
  el('queen').style.color = '#dd5';
  prize = Math.max(prize, 1);
  if (!beats('k_score')) return;
  el('king').style.color = '#dd5';
  prize = Math.max(prize, 2);
}

// beforeunload never fires on iOS Safari, so save on hide instead.
function onExit(fn) {
  addEventListener('pagehide', fn);
  addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') fn();
  });
}
