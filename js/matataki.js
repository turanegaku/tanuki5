var hiscore = 0;
var score = 0;

var raccoon1;
var raccoon2;
var questions = [];

var result_score = 0;
var result_select = 0;
var result_frame = 0;

var TITLE = 0;
var GAME = 1;

var step = TITLE;
var Q = 0;
var A = 1;
var games = Q;

var tanuki_maxtime;
var tanuki_time;
var tanuki_wait;

var tanuki = [];
var item = [];
var ans = 0;

var d = 0;
var timed = 0;
var limit = 0;
var limit_start;

function Objec(i1, i2, x0, y0, correct) {
  this.tanuans = i1;
  this.itemans = i2;
  this.x0 = x0;
  this.y0 = y0;
  this.x = width / 2;
  this.y = height / 2;
  this.t = 20;
  this.r = 50;
  this.ison = false;
  this.correct = correct;

  this.update = function() {
    if (this.t > 0) {
      this.t--;
      this.x = map(this.t, 20, 0, this.x, this.x0);
      this.y = map(this.t, 20, 0, this.y, this.y0);
    } else {
      this.x = this.x0;
      this.y = this.y0;
      if (sq(mouseX - this.x) + sq(mouseY - this.y) < this.r * this.r) {
        this.ison = true;
      } else {
        this.ison = false;
      }
    }
  };

  this.drawTanuki = function(x, y, s) {
    image(item[this.itemans], x, y, s, s);
    image(tanuki[this.tanuans], x, y, s, s);
  };

  this.drawTanukiEn = function(x, y, s) {
    noStroke();
    fill(255);
    rr = map(this.t, 20, 0, 0, this.r + 10);
    ellipse(x, y, rr * 2, rr * 2);
    if (this.ison)
      fill(200);
    else
      fill(100);
    ellipse(x, y, this.r * 2, this.r * 2);
    if (this.t <= 0) {
      this.drawTanuki(x, y, s);
    }
  };

  this.draw = function() {
    this.drawTanukiEn(this.x, this.y, 60);
  };
}

function init() {
  score = 0;
  ans = 0;
  timed = 0;
  nextTanuki();
}

function shuffle(array) {
  var m = array.length,
    t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

function nextTanuki() {
  gameS = Q;
  tanuki_maxtime = map(min(score, 30), 0, 30, 300, 30);
  if (score % 7 === 2) tanuki_maxtime /= random(2, 3);
  if (score % 5 === 3) tanuki_maxtime += 60;
  tanuki_time = tanuki_maxtime;

  tanuki_wait = random(60, 120);
  if (score % 10 === 0) tanuki_wait = 0;
  if (score === 0 && d !== 0) tanuki_wait = 100;


  qs = [];
  var lv = int(min(score / 5 + 1, 4));
  for (var i = 0; i < lv; i++) {
    for (var j = 0; j < tanuki.length; j++) {
      qs.push(new Objec(j, i, 0, 0, false));
    }
  }
  qs = shuffle(qs);
  while (qs.length > 1 + lv) qs.pop();
  ans = int(random(qs.length));
  qs[ans].correct = true;
  var a = TWO_PI / qs.length;
  var da = random(a);
  if (score < 3) da = 0;
  $.each(qs, function(i, q) {
    q.x0 = width / 2 + cos(a * i + da) * 150;
    q.y0 = height / 2 + sin(a * i + da) * 150;
  });
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  tanuki.push(loadImage('./img/tanuki.png'));
  tanuki.push(loadImage('./img/tanuki2.png'));
  item.push(loadImage('./img/item0.png'));
  item.push(loadImage('./img/item1.png'));
  item.push(loadImage('./img/item2.png'));
  item.push(loadImage('./img/item3.png'));
  textAlign(CENTER);
  textSize(30);
  imageMode(CENTER);
  // init();

  var localStorageManager = new LocalStorageManager();
  localStorageManager.open(document.title);
  var best = localStorageManager.getValue(document.title, 'best');
  if (best) {
    hiscore = int(best);
  }
  $(window).on("beforeunload", function(e) {
    localStorageManager.setValue(document.title, 'best', hiscore);
    localStorageManager.close(document.title);
  });
}

// call when game to title
function gameEnd() {
  step = TITLE;
  result_frame = 60;
  result_score = score;
}

// draw title & result
function title() {
  if (result_frame > 0) {
    if (result_frame != 30)
      result_frame--;
    var dd = map(result_frame, 60, 0, sqrt(width), -sqrt(width));
    dd = dd * dd;
    textSize(50);
    noStroke();
    fill(255, 255, 255, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2 - 50, 250, 300, 30);
    rectMode(CORNER);
    fill(0);
    text('RESULT', width / 2 + dd, height / 5);
    text(result_score, width / 2 + dd, height * 3 / 5);
    qs[ans].drawTanukiEn(width / 2 + dd + 200, height * 3 / 5, 60);
    if (result_select != -1)
      qs[result_select].drawTanuki(width / 2 + dd - 200, height * 3 / 5, 80);
  } else {
    textSize(32);
    fill(255, 200);
    rectMode(CENTER);
    noStroke();
    rect(width / 2, height / 2 - 10, 250, 100, 30);
    rectMode(CORNER);
    textSize(30);
    fill(0);
    text('Click to start', width / 2, height / 2);
  }
}

function draw() {
  background(255, 255, 255);

  if (step == GAME) {

    if (gameS == Q) {
      if (--tanuki_wait <= 0) {
        qs[ans].drawTanuki(map(tanuki_time, tanuki_maxtime, 0, width + 100, -100), height / 2, 80);
        fill(0);
        if (--tanuki_time <= 0) {
          gameS = A;
          limit = moment().add(map(min(score, 20), 0, 20, 60, 5), 's');
        }
      }
    }
  }
  fill(50, 50, 200);
  var dd = sqrt(map(min(score + timed, 50), 0, 50, 0, 1)) * (width / 2 - 2);
  d = (d * 19 + dd) / 20;
  if (d > 0) {
    noStroke();
    rect(0, 0, d, height);
    rect(width - d, 0, d, height);
  }
  if (step == GAME) {
    if (gameS == A) {
      timed += 0.001 * score;
      $.each(qs, function(i, q) {
        q.update();
        q.draw();
      });
      var now = moment();
      if (limit.isBefore(now)) {
        result_select = -1;
        gameEnd();
      }
      var dt = int(limit.diff(now) / 1000) + 1;
      fill(255, 200, 200);
      text(dt, width / 2 + 2, height / 2 + 2);
      text(dt, width / 2 - 2, height / 2 - 2);
      fill(200, 100, 100);
      text(dt, width / 2, height / 2);
    }
  }

  if (step == TITLE) {
    title();
  }

  hiscore = int(max(score, hiscore));
  $('#score').text(int(score));
  $('#hiscore').text(hiscore);
}

function mousePressed() {
  if (step == TITLE) {
    if (result_frame == 30) result_frame--;
    if (result_frame <= 0) {
      step = GAME;
      init();
    }
  } else if (step == GAME) {
    if (gameS == A) {
      $.each(qs, function(i, q) {
        if (q.ison) {
          if (q.correct) {
            score++;
            nextTanuki();
          } else {
            result_select = i;
            gameEnd();
          }
        }
      });
    }
  }
}
