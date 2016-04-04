var hiscore = 0;
var score = 0;

var raccoon1;
var raccoon2;

var sheepl;
var sheepr;

var animals = [];
var l_number = 0;
var r_number = 0;

var userl;

var select_frame;

var result_score;
var result_frame = 0;

var TITLE = 0;
var GAME = 1;

var step = TITLE;


var DIST_SHEEP = 60;
var LINE_SHEEP = 6;
var SCALE_SHEEP = 80;

var limit;

function Sheep(dx) {
  this.y = random(height / 3, height * 2 / 3);
  this.x = width / 2;
  this.dx = dx * random(4, 6);
  this.dy = random(-6, 1);
  this.ddy = 0.1;
  this.delay = random(15);

  this.update = function() {
    if (--this.delay > 0) return;
    this.x += this.dx;
    this.y += this.dy;
    this.dy += this.ddy;
  };

  this.draw = function() {
    if (this.delay > 0) return;
    if (this.dx < 0)
      image(sheepl, this.x, this.y, 80, 80);
    else
      image(sheepr, this.x, this.y, 80, 80);
  };
}

function Raccoon() {
  this.y = random(height / 3, height * 2 / 3);
  this.x = width / 2;
  this.dx = (int(random(2)) * 2 - 1) * random(1, 5);
  this.dy = random(-3, 1);
  this.ddy = 0.1;
  this.delay = random(15);

  this.update = function() {
    if (--this.delay > 0) return;
    this.x += this.dx;
    this.y += this.dy;
    this.dy += this.ddy;
  };

  this.draw = function() {
    if (this.delay > 0) return;
    if (this.dy > -1)
      image(raccoon1, this.x, this.y, 80, 80);
    else
      image(raccoon2, this.x, this.y, 80, 80);
  };
}

function init() {
  score = 0;
  userl = -1;
}

function prizeupdate() {
  if (hiscore >= $('#q_score').text()) {
    $('#queen').css('color', '#dd5');
    if (hiscore >= $('#k_score').text()) {
      $('#king').css('color', '#dd5');
    }
  }
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  raccoon1 = loadImage('./img/tanuki.png');
  raccoon2 = loadImage('./img/tanuki2.png');
  sheepl = loadImage('./img/sheep_L.png');
  sheepr = loadImage('./img/sheep_R.png');
  textAlign(CENTER);
  textSize(50);
  imageMode(CENTER);
  init();

  var localStorageManager = new LocalStorageManager();
  localStorageManager.open(document.title);
  var best = localStorageManager.getValue(document.title, 'best');
  if (best) {
    hiscore = int(best);
    prizeupdate();
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
  prizeupdate();
}

// draw title & result
function title() {
  if (result_frame > 0) {
    if (result_frame != 30)
      result_frame--;
    var dd = map(result_frame, 60, 0, sqrt(width), -sqrt(width));
    dd = dd * dd;

    // user select
    if (userl !== -1) {
      noStroke();
      fill(0, 0, 255, 100);
      rect(width / 2 * userl, 0, width / 2, height);
    }

    var i;
    // draw result sheep
    for (i = 0; i < l_number; i++) {
      image(sheepl, width / 2 - int(i % LINE_SHEEP + 1) * DIST_SHEEP, 100 + int(i / LINE_SHEEP) * DIST_SHEEP + dd, SCALE_SHEEP, SCALE_SHEEP);
    }
    for (i = 0; i < r_number; i++) {
      image(sheepr, width / 2 + int(i % LINE_SHEEP + 1) * DIST_SHEEP, 100 + int(i / LINE_SHEEP) * DIST_SHEEP + dd, SCALE_SHEEP, SCALE_SHEEP);
    }

    textSize(50);
    fill(255);
    text('RESULT', width / 2 + dd + 4, height / 5 + 2);
    text(result_score, width / 2 + dd + 4, height * 3 / 5 + 2);
    fill(0);
    text('RESULT', width / 2 + dd, height / 5);
    text(result_score, width / 2 + dd, height * 3 / 5);
  } else {
    textSize(30);
    fill(0);
    text('Click to start', width / 2, height / 2);
  }
}

function nextSheep() {
  select_frame = 30;
  limit = moment().add(3.5, 's');

  var i;
  animals = [];
  var dif = map(min(score, 30), 0, 30, 10, 1) + random(0, 10);
  var num = map(min(score, 30), 0, 30, 3, 20) + random(-5, 5);
  while (num < 0) num += random(4);
  var lorr = int(random(2));
  if (lorr === 0) {
    l_number = int(num);
    r_number = int(num + dif);
  } else {
    r_number = int(num);
    l_number = int(num + dif);
  }
  for (i = 0; i < l_number; i++) {
    animals.push(new Sheep(-1));
  }
  for (i = 0; i < r_number; i++) {
    animals.push(new Sheep(1));
  }
  if (score >= 10) {
    var raccoonn = random(-3, map(min(score, 20), 10, 30, 5, 20));
    for (i = 0; i < raccoonn; i++) {
      animals.push(new Raccoon());
    }
  }
}


function draw() {
  background(255, 255, 255);

  $.each(animals, function(_, v) {
    v.update();
  });

  if (step == GAME) {
    if (select_frame > 0) {
      select_frame--;
    }
  }

  strokeWeight(10);
  stroke(100, 100, 200);
  line(width / 2, 0, width / 2, height);
  noStroke();
  if (step == GAME) {
    userl = int(mouseX / (width / 2));
    $.each(animals, function(_, v) {
      v.draw();
    });
    if (select_frame === 0) {
      noStroke();
      fill(0, 0, 255, 100);
      rect(width / 2 * userl, 0, width / 2, height);

      fill(200, 200, 255);
      text('which is many', width / 2, height / 3);
      fill(255);
      text('which is many', width / 2 - 2, height / 3 - 2);

      var now = moment();
      if (limit.isBefore(now)) {
        userl = -1;
        gameEnd();
      }
      var dt = int(limit.diff(now) / 1000) + 1;
      fill(255, 100, 100, 100);
      var dr = map(limit.diff(now) % 1000, 0, 1000, 150, 300);
      ellipse(width / 2, 0, dr, dr);
      fill(255, 255, 255);
      text(dt, width / 2, 50);
    }
  } else {
    title();
  }

  hiscore = int(max(score, hiscore));
  $('#score').text(int(score));
  $('#hiscore').text(hiscore);
}

function mouseReleased() {
  if (0 <= mouseX && mouseX < width && 0 <= mouseY && mouseY < height) {
    if (step == TITLE) {
      if (result_frame == 30) result_frame--;
      if (result_frame <= 0) {
        init();
        nextSheep();
        step = GAME;
      }
    } else if (step == GAME && select_frame === 0) {
      if ((l_number - r_number) * (userl * 2 - 1) < 0) {
        score++;
        nextSheep();
      } else {
        gameEnd();
      }
    }
  }
}
