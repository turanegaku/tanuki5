var hiSCore = 0;
var SCore = 0;

var raccoon1;
var raccoon2;

var result_SCore;
var result_frame = 0;

var ant_x = 25;
var ant_y = 25;
var ant_r = 8;

var TITLE = 0;
var GAME = 1;

var step = TITLE;

var bars = [
  [135, 170],
  [100, 170],
  [70, 200],
  [20, 130],
  [70, 80],
  [70, 50],
  [80, 50],
  [80, 35],
  [50, 35],
  [50, 50],
  [0, 50],
  [0, 0],
  [50, 0],
  [50, 15],
  [100, 15],
  [100, 50],
  [120, 50],
  [120, 100],
  [70, 100],
  [40, 130],
  [70, 180],
  [85, 165],
  [85, 120],
  [120, 120],
  [120, 20],
  [135, 20],
  [135, 0],
  [230, 0],
  [230, 85],
  [280, 85],
  [280, 150],
  [245, 150],
  [280, 150],
  [280, 180],
  [245, 180],
  [280, 180],
  [280, 210],
  [245, 210],
  [280, 210],
  [280, 380],
  [170, 380],
  [175, 250],
  [135, 250],
  [135, 150],
  [170, 150],
  [135, 150],
  [135, 100],
  [135, 50],
  [135, 100],
  [225, 100],
  [225, 150],
  [190, 150],
  [225, 150],
  [225, 165],
  [265, 165],
  [225, 165],
  [225, 195],
  [265, 195],
  [225, 195],
  [225, 225],
  [265, 225],
  [265, 230],
  [230, 230],
  [230, 270],
  [265, 270],
  [265, 370],
  [190, 370],
  [185, 250],
  [225, 250],
  [225, 225],
];


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
      image(raccoon1, this.x, this.y, 85, 85);
    else
      image(raccoon2, this.x, this.y, 85, 85);
  };
}

function init() {
  SCore = 0;
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  raccoon1 = loadImage('./img/tanuki.png');
  raccoon2 = loadImage('./img/tanuki2.png');
  textAlign(CENTER);
  textSize(30);
  imageMode(CENTER);
  init();

  // hiSCore = int(document.cookie);
  // $(window).on("beforeunload", function(e) {
  //   document.cookie = hiSCore;
  // });
}

// call when game to title
function gameEnd() {
  step = TITLE;
  result_frame = 60;
  result_SCore = SCore;
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
    text(result_SCore, width / 2 + dd, height * 3 / 5);
  } else {
    textSize(30);
    fill(0);
    // text('Click to start', width / 2, height / 2);
  }
}

function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}


function draw() {
  background(0);

  if (step == GAME) {
    ant_x += map(mouseX, width / 2 - 100, width / 2 + 100, -1, 1);
    ant_y += map(mouseY, height / 2 - 100, height / 2 + 100, -1, 1);
  }
  var SC = 8;
  var DX = width / 2 - ant_x * SC;
  var DY = height / 2 - ant_y * SC;

  for (var i = 0; i < bars.length - 1; i++) {
    var x1 = bars[i + 1][0] - bars[i][0];
    var y1 = bars[i + 1][1] - bars[i][1];
    var x2 = ant_x - bars[i][0];
    var y2 = ant_y - bars[i][1];
    var cross = abs(x1 * y2 - x2 * y1);
    var s = sqrt(sq(x1) + sq(y1));
    var d = cross / s;
    if (d < ant_r) {
      var x3 = ant_x - bars[i + 1][0];
      var y3 = ant_y - bars[i + 1][1];
      if (dot(x2, y2, x1, y1) * dot(x3, y3, x1, y1) <= 0 || sq(x2) + sq(y2) < sq(ant_r) || sq(x3) + sq(y3) < sq(ant_r)) {
        strokeWeight(20);
        stroke(200, 200, 200);
        line(bars[i][0] * SC + DX, bars[i][1] * SC + DY, bars[i + 1][0] * SC + DX, bars[i + 1][1] * SC + DY);
      }
    }
  }



  var v = 1000000;
  var vi = 0;
  noFill();
  strokeWeight(5);
  stroke(255, 255, 100);
  beginShape();
  $.each(bars, function(i, p) {
    vertex(p[0] * SC + DX, p[1] * SC + DY);
    var vv = sq(mouseX - (p[0] * SC + DX)) + sq(mouseY - (p[1] * SC + DY));
    if (v > vv) {
      v = vv;
      vi = i;
    }
  });
  endShape();
  ellipse(ant_x * SC + DX, ant_y * SC + DY, ant_r * 2 * SC, ant_r * 2 * SC);

  noStroke();
  fill(255);
  textSize(20);
  strokeWeight(1);
  var p = bars[vi];
  text(int(p[0]) + '\n' + int(p[1]), p[0] * SC + DX, p[1] * SC + DY);

  if (step == GAME) {} else {
    title();
  }

  hiSCore = int(max(SCore, hiSCore));
  $('#SCore').text(int(SCore));
  $('#hiSCore').text(hiSCore);
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
