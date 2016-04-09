var score = 0;
var combo = 0;
var hitanu = 0;

var start_time;
var ms = moment(0);
var hims = moment(1800000);

var mx = 0;
var my = 0;

var shoot_time = 0;
var shoot_frame = 20;

var add_frame = 0;

var apple_img;
var balloon_img = [];
var raccoon_img;
var raccoon2_img;

var result_score;
var result_frame = 0;

var tanuki_color;
var tanuki_frame;

var tanuki_count = 0;
var balloon_count = 0;
var apple_count = 0;

var BALLOON = 0;
var APPLE = 1;
var TANUKI = 2;

function Balloon(x, y, object, diff, i) {
  this.x = x;
  this.y = y;
  this.dy = -1 * diff;
  this.dx = 0;
  this.ddy = 0;
  this.r = 50;
  this.i = int(random(3));

  if (object != BALLOON) {
    this.r = 20;
    this.dy = -3 * sqrt(diff);
    this.ddy = 0.1;
    this.dx = random(-1, 1);
  }
  if (object == TANUKI) {
    this.i = i;
  }

  this.draw = function() {
    switch (object) {
      case APPLE:
        image(apple_img, this.x, this.y, this.r * 3, this.r * 3);
        break;
      case BALLOON:
        image(balloon_img[this.i], this.x, this.y + 18, this.r * 6, this.r * 6);
        break;
      case TANUKI:
        if (this.dy <= -1)
          image(raccoon2_img, this.x, this.y, this.r * 3, this.r * 3);
        else
          image(raccoon_img, this.x, this.y, this.r * 3, this.r * 3);
        break;
    }
  };

  this.update = function() {
    this.x += this.dx;
    this.y += this.dy;
    this.dy += this.ddy;
  };

  this.add_apple = function() {
    switch (object) {
      case APPLE:
        apple_count++;
        score += 500;
        break;
      case BALLOON:
        balloon_count++;
        if (score > 5000)
          balloons.push(new Balloon(this.x, this.y, int(random(1, 2.8)), diff, this.i));
        else
          balloons.push(new Balloon(this.x, this.y, 1, diff, false));
        score += 100;
        break;
      case TANUKI:
        tanuki_count++;
        tanuki_color = this.i;
        tanuki_frame = 30;
        score = 0;
        break;
    }
  };
}

var balloons = [];

var TITLE = 0;
var GAME = 1;
var step = TITLE;

function init() {
  start_time = moment();
  score = 0;
  frameCount = 0;
  combo = 0;
  balloons = [];
  tanuki_count = 0;
  balloon_count = 0;
  apple_count = 0;
}

var prize = 0;

function prizeupdate() {
  if (hims <= moment($('#q_score').text(), 'mm:ss.SS')) {
    $('#queen').css('color', '#dd5');
    prize = max(prize, 1);
    if (hims <= moment($('#k_score').text(), 'mm:ss.SS')) {
      $('#king').css('color', '#dd5');
      prize = max(prize, 2);
    }
  }
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');

  mx = width / 2;
  my = height / 2;

  apple_img = loadImage('./img/apple.png');
  raccoon_img = loadImage('./img/tanuki.png');
  raccoon2_img = loadImage('./img/tanuki2.png');
  balloon_img.push(loadImage('./img/balloon1.png'));
  balloon_img.push(loadImage('./img/balloon2.png'));
  balloon_img.push(loadImage('./img/balloon3.png'));

  init();

  imageMode(CENTER);

  var localStorageManager = new LocalStorageManager();
  localStorageManager.open(document.title);
  var best = localStorageManager.getValue(document.title, 'best');
  if (best) {
    hims = moment(best, 'mmssSS');
    prizeupdate();
  }
  var bestanu = localStorageManager.getValue(document.title, 'best');
  if (bestanu) {
    hitanu = int(bestanu);
  }
  $(window).on("beforeunload", function(e) {
    localStorageManager.setValue(document.title, 'best', hims.format('mmssSS'));
    localStorageManager.setValue(document.title, 'prize', prize);
    localStorageManager.close(document.title);
  });
}

// call when game to title
function gameEnd() {
  step = TITLE;
  result_score = ms;
  result_frame = 60;
  if (ms < hims) {
    hims = ms;
    prizeupdate();
  }
}

// draw title & result
function title() {
  if (result_frame > 0) {
    if (result_frame != 30)
      result_frame--;
    var dd = map(result_frame, 60, 0, sqrt(width), -sqrt(width));
    dd = dd * dd;
    fill(0);
    textSize(50);
    textAlign(CENTER);
    for (var i = 0; i < tanuki_count; i++) {
      image(raccoon_img, width / 3 + dd + i * 50, height * 4 / 5, 60, 60);
    }
    text(result_score.format('mm:ss.SS'), width / 2 + dd, height / 5);
    for (i = 0; i < 3; i++) {
      image(balloon_img[i], width / 2 - 100 + dd + i * 30, height * 2 / 5, 120, 120);
    }
    image(apple_img, width / 2 - 80 + dd, height * 3 / 5, 60, 60);
    text(balloon_count, width / 2 + dd + 100, height * 2 / 5);
    text(apple_count, width / 2 + dd + 100, height * 3 / 5);
  } else {
    textSize(20);
    textAlign(CENTER);
    noStroke();
    fill(100, 100, 200);
    ellipse(width / 2, height / 2, 100, 100);
    stroke(0);
    fill(255);
    noStroke();
    text("START!!", width / 2, height / 2 + 10);
  }
}

function draw() {
  background(255);
  if (tanuki_frame > 0) {
    tanuki_frame--;
    var d = 255 - tanuki_frame * 5;
    var d2 = 255 - tanuki_frame;
    switch (tanuki_color) {
      case 0:
        background(d2, d, d);
        break;
      case 1:
        background(d, d2, d);
        break;
      case 2:
        background(d, d, d2);
        break;
      default:

    }
  }
  if (mouseX !== 0 || mouseY !== 0) {
    mx = constrain((mouseX + mx * 4) / 5, 0, width);
    my = constrain((mouseY + my * 4) / 5, 0, height);
  }
  if (shoot_time > 0) {
    shoot_time--;
  }
  if (step == GAME) {
    $.each(balloons, function(i, v) {
      v.update();
    });
    $.each(balloons, function(i, v) {
      v.draw();
    });
  } else if (step == TITLE) {
    title();
  }
  var p = sq(shoot_time / shoot_frame);
  var r = 20 * (1 - p);
  var c = HALF_PI * p;
  stroke(0);
  line(mx + r * cos(c), my + r * sin(c), mx + r * cos(c + PI), my + r * sin(c + PI));
  c += HALF_PI;
  line(mx + r * cos(c), my + r * sin(c), mx + r * cos(c + PI), my + r * sin(c + PI));
  if (step == GAME) {
    if (combo > 0) {
      textSize(30);
      textAlign(CENTER);
      fill(0);
      text(combo + ' CHAIN', width / 2, 60);
    }

    if (--add_frame <= 0) {
      add_frame = map(min(combo, 30), 0, 30, 100, 10);
      balloons.push(new Balloon(random(100, width - 100), height + 100, 0, map(score, 0, 10000, 1, 3)));
    }
  }

  balloons = balloons.filter(function(v) {
    if (v.x > -200 && v.y > -200 && v.x < width + 200 && v.y < height + 200)
      return true;
    return false;
  });

  if (step == GAME) {
    ms = moment(moment() - start_time);
  }
  hitanu = max(hitanu, tanuki_count);

  $('#point').text(score + ' / 10000');
  $('#score').text(ms.format('mm:ss.SS'));
  $('#hiscore').text(hims.format('mm:ss.SS'));
  $('#hitanu').text(max($('#hitanu').text(), tanuki_count));
}

function shoot() {
  var del_bal = balloons.filter(function(v) {
    return (mx - v.x) * (mx - v.x) + (my - v.y) * (my - v.y) < v.r * v.r;
  });
  balloons = balloons.filter(function(v) {
    if ((mx - v.x) * (mx - v.x) + (my - v.y) * (my - v.y) >= v.r * v.r)
      return true;
    return false;
  });
  $.each(del_bal, function(i, v) {
    v.add_apple();
  });
  if (del_bal.length === 0) {
    combo = 0;
  } else {
    combo += sq(del_bal.length);
  }

  if (score >= 10000) {
    score = 10000;
    gameEnd();
  }
}

function mousePressed() {
  if (shoot_time > 0) {
    return;
  }
  shoot_time = shoot_frame;

  if (result_frame == 30) result_frame--;
  if (step == TITLE && result_frame <= 0) {
    if ((mx - width / 2) * (mx - width / 2) + (my - height / 2) * (my - height / 2) < 50 * 50) {
      step = GAME;
      init();
    }
    return;
  }

  if (step == GAME)
    shoot();
}
