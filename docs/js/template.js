var hiscore = 0;
var score = 0;

var raccoon1;
var raccoon2;

var result_score;
var result_frame = 0;

var TITLE = 0;
var GAME = 1;

var step = TITLE;

function Raccoon(x, y) {
  this.y = y;
  this.x = x;
  this.dx = 0;
  this.dy = 0;
  this.ddy = 0.1;

  this.update = function() {
    this.x += this.dx;
    this.y += this.dy;
    this.dy += this.ddy;
  };

  this.draw = function() {
    if (this.dy < -1)
      image(raccoon1, this.x, this.y, 80, 80);
    else
      image(raccoon2, this.x, this.y, 80, 80);
  };
}

function init() {
  score = 0;
}

var prize = 0;

function prizeupdate() {
  if (hiscore >= $('#q_score').text()) {
    $('#queen').css('color', '#dd5');
    prize = max(prize, 1);
    if (hiscore >= $('#k_score').text()) {
      $('#king').css('color', '#dd5');
      prize = max(prize, 2);
    }
  }
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  raccoon1 = loadImage('./img/tanuki.png');
  raccoon2 = loadImage('./img/tanuki2.png');
  textAlign(CENTER);
  textSize(30);
  imageMode(CENTER);
  init();

  var localStorageManager = new LocalStorageManager();
  localStorageManager.open(document.title);
  var best = localStorageManager.getValue(document.title, 'best');
  if (best) {
    // hiscore = moment(best, 'mmssSS');
    hiscore = int(best);
    prizeupdate();
  }
  $(window).on("beforeunload", function(e) {
    // localStorageManager.setValue(document.title, 'best', hiscore.format('mmssSS'));
    localStorageManager.setValue(document.title, 'best', hiscore);
    localStorageManager.close(document.title);
  });
}

// call when game to title
function gameEnd() {
  step = TITLE;
  result_frame = 60;
  result_score = score;
  prizeupdate();
}

// draw title & result
function title() {
  if (result_frame > 0) {
    if (result_frame != 30)
      result_frame--;
    var dd = map(result_frame, 60, 0, sqrt(width), -sqrt(width));
    dd = dd * dd;
    textSize(50);
    fill(0);
    text('RESULT', width / 2 + dd, height / 5);
    text(result_score, width / 2 + dd, height * 3 / 5);
  } else {
    textSize(30);
    fill(0);
    text('Click to start', width / 2, height / 2);
  }
}

function draw() {
  background(255, 255, 255);

  if (step == GAME) {
    if (frameCount % 300) {
      gameEnd();
    }
  }

  if (step == GAME) {} else {
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
  }
}
