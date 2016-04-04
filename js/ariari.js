var hiscore = moment(1800000);
var score = moment(0);
var start_time = moment();

var raccoon1;
var raccoon2;
var ant;
var cong;

var result_score;
var result_frame = 0;

var START_X = 25;
var START_Y = 25;
var ant_x = START_X;
var ant_y = START_Y;
var ant_r = 3;
var ant_save = 0;
var ant_WAIT = 40;

var ant_nomove = 0;
var ant_hitbar = [];
var tanukihit = false;
var hit_tanuki;

var TITLE = 0;
var GAME = 1;

var step = TITLE;

var hard = false;

var raccoons = [];

var saves = [
  [25, 25],
  [95, 75],
  [110, 145],
  [250, 110],
  [255, 255],
  [180, 375],
];

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
  [280, 280],
  [279, 290],
  [277, 300],
  [274, 310],
  [270, 320],
  [265, 330],
  [259, 340],
  [251, 350],
  [241, 360],
  [229, 370],
  [215, 380],
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
  [225, 135],
  [265, 135],
  [225, 135],
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
  [230, 280],
  [265, 280],
  [264, 290],
  [262, 300],
  [259, 310],
  [255, 320],
  [249, 330],
  [241, 340],
  [231, 350],
  [220, 360],
  [200, 370],
  [190, 370],
  [185, 250],
  [225, 250],
  [225, 225],
];

var ROLL_X = 180;
var ROLL_Y = 50;
var ROLL_R = 50;
var bars2 = [
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
  [ROLL_X, ROLL_Y],
];


function Raccoon(x, y, dx, dy) {
  this.y = y;
  this.x = x;
  this.dx = dx;
  this.dy = dy;
  this.ddy = 0.005;

  this.update = function() {
    this.x += this.dx;
    this.y += this.dy;
    this.dy += this.ddy;
  };

  this.draw = function(DX, DY, SC) {
    if (this.dy < -1)
      image(raccoon1, this.x * SC + DX, this.y * SC + DY, 60, 60);
    else
      image(raccoon2, this.x * SC + DX, this.y * SC + DY, 60, 60);
  };
}

function init() {
  ant_x = START_X;
  ant_y = START_Y;
  ant_save = 0;
  raccoons = [];
  tanukihit = false;
  ant_nomove = 0;

  hard = $('.hard').prop('checked');
}

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  raccoon1 = loadImage('./img/tanuki.png');
  raccoon2 = loadImage('./img/tanuki2.png');
  ant = loadImage('./img/ari.png');
  cong = loadImage('./img/cong.png');
  textAlign(CENTER);
  textSize(30);
  imageMode(CENTER);
  init();

  // hiscore = int(document.cookie);
  // $(window).on("beforeunload", function(e) {
  //   document.cookie = hiscore;
  // });
}

// call when game to title
function gameEnd() {
  step = TITLE;
  result_frame = 60;
  if (hiscore > score)
    hiscore = score;
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
    fill(255);
    text('RESULT', width / 2 + dd, height / 5);
    text(result_score.format('mm:ss.SS'), width / 2 + dd, height * 3 / 5);
    if (hard) {
      image(cong, width / 2 + dd, height * 2 / 5, 100, 100);
    }
  } else {
    textSize(30);
    fill(255);
    text('Click to start', width / 2, height / 2);
  }
}

function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}


function draw() {
  background(0);
  var i = 0;
  var ant_to = ant_save;
  if (hard) ant_to = 0;

  if (step == TITLE) {
    if (result_frame >= 30) {
      ant_x = (ant_x * 19 + 180) / 20;
      ant_y = (ant_y * 19 + 125) / 20;
    } else if (result_frame > 0) {
      ant_x = map(result_frame, 30, 0, ant_x, START_X);
      ant_y = map(result_frame, 30, 0, ant_y, START_Y);
      ant_save = ant_to;
    }

  }
  var a = TWO_PI / 5;
  for (i = 0; i < bars2.length; i += 2) {
    bars2[i][0] = ROLL_X + cos(radians(frameCount / 2) + a * i / 2) * ROLL_R;
    bars2[i][1] = ROLL_Y + sin(radians(frameCount / 2) + a * i / 2) * ROLL_R;
  }
  if (ant_save >= 5) {
    if (frameCount % 60 === 0) {
      raccoons.push(new Raccoon(135, random(150, 250), random(0.2, 0.5), random(-0.8, -0.1)));
    } else if (frameCount % 60 === 30) {
      raccoons.push(new Raccoon(225, random(150, 250), -random(0.2, 0.5), random(-0.8, -0.1)));
    }
  }
  if (step == GAME) {
    if (ant_nomove > 0) {
      ant_nomove--;
      if (ant_nomove < ant_WAIT / 2) {
        ant_x = map(ant_nomove, ant_WAIT / 2, 0, ant_x, saves[ant_to][0]);
        ant_y = map(ant_nomove, ant_WAIT / 2, 0, ant_y, saves[ant_to][1]);
      }
      if (ant_nomove <= 0) {
        ant_x = saves[ant_to][0];
        ant_y = saves[ant_to][1];
        tanukihit = false;
      }
    } else {
      ant_x += map(mouseX, width / 2 - 100, width / 2 + 100, -1, 1);
      ant_y += map(mouseY, height / 2 - 100, height / 2 + 100, -1, 1);

      for (i = ant_save; i < saves.length; i++) {
        if (sq(ant_x - saves[i][0]) + sq(ant_y - saves[i][1]) < sq(20)) {
          if (ant_save + 1 == i)
            ant_save = i;
        }
      }

      if (135 + 10 < ant_x && ant_x < 225 - 10 && 100 + 10 < ant_y && ant_y < 150 - 10) {
        if (ant_save >= 5) {
          gameEnd();
        }
      }
    }
  }
  var SC = 8;
  var DX = width / 2 - ant_x * SC;
  var DY = height / 2 - ant_y * SC;

  if (step == GAME) {

    if (ant_nomove === 0) {
      ant_hitbar = [];
      // check hit bar
      var x1, y1, x2, y2, cross, s, d, x3, y3;
      for (i = 0; i < bars.length - 1; i++) {
        x1 = bars[i + 1][0] - bars[i][0];
        y1 = bars[i + 1][1] - bars[i][1];
        x2 = ant_x - bars[i][0];
        y2 = ant_y - bars[i][1];
        cross = abs(x1 * y2 - x2 * y1);
        s = sqrt(sq(x1) + sq(y1));
        d = cross / s;
        if (d < ant_r) {
          x3 = ant_x - bars[i + 1][0];
          y3 = ant_y - bars[i + 1][1];
          if (dot(x2, y2, x1, y1) * dot(x3, y3, x1, y1) <= 0 || sq(x2) + sq(y2) < sq(ant_r) || sq(x3) + sq(y3) < sq(ant_r)) {
            ant_nomove = ant_WAIT;
            ant_hitbar.push(i);
          }
        }
      }
      for (i = 0; i < bars2.length - 1; i++) {
        x1 = bars2[i + 1][0] - bars2[i][0];
        y1 = bars2[i + 1][1] - bars2[i][1];
        x2 = ant_x - bars2[i][0];
        y2 = ant_y - bars2[i][1];
        cross = abs(x1 * y2 - x2 * y1);
        s = sqrt(sq(x1) + sq(y1));
        d = cross / s;
        if (d < ant_r) {
          x3 = ant_x - bars2[i + 1][0];
          y3 = ant_y - bars2[i + 1][1];
          if (dot(x2, y2, x1, y1) * dot(x3, y3, x1, y1) <= 0 || sq(x2) + sq(y2) < sq(ant_r) || sq(x3) + sq(y3) < sq(ant_r)) {
            ant_nomove = ant_WAIT;
            ant_hitbar.push(-i);
          }
        }
      }
    } else if (!tanukihit) {
      // draw hit bar
      $.each(ant_hitbar, function(_, i) {
        strokeWeight(50);
        stroke(255, 100, 100);
        if (i >= 0)
          line(bars[i][0] * SC + DX, bars[i][1] * SC + DY, bars[i + 1][0] * SC + DX, bars[i + 1][1] * SC + DY);
        else
          line(bars2[-i][0] * SC + DX, bars2[-i][1] * SC + DY, bars2[-i + 1][0] * SC + DX, bars2[-i + 1][1] * SC + DY);
      });
    }

    // hit tanuki
    if (!tanukihit)
      $.each(raccoons, function(_, v) {
        if (sq(ant_x - v.x) + sq(ant_y - v.y) < sq(8)) {
          tanukihit = true;
          hit_tanuki = v;
          ant_nomove = ant_WAIT;
        }
      });
  }
  // update tanuki
  $.each(raccoons, function(_, v) {
    v.update();
  });
  raccoons = raccoons.filter(function(v) {
    return 135 < v.x && v.x < 225 && 150 < v.y && v.y < 250;
  });

  if (tanukihit) {
    noStroke();
    fill(255, 100, 100);
    ellipse(hit_tanuki.x * SC + DX, hit_tanuki.y * SC + DY, 50, 50);
  }
  // draw tanuki
  $.each(raccoons, function(_, v) {
    v.draw(DX, DY, SC);
  });

  // draw save
  fill(150, 150, 255, 150);
  noStroke();
  for (i = 0; i < ant_to + 1; i++) {
    var sr = (sin(radians(frameCount + i * 45)) * 10 + 50) * SC;
    var sr2 = (sin(radians(frameCount * 1.1 + (i + 3) * 45)) * 10 + 40) * SC;
    ellipse(saves[i][0] * SC + DX, saves[i][1] * SC + DY, sr, sr);
    ellipse(saves[i][0] * SC + DX, saves[i][1] * SC + DY, sr2, sr2);
  }

  // draw bars
  var v = 1000000;
  var vi = 0;
  noFill();
  strokeWeight(random(10, 12));
  var yc = random(220, 255);
  stroke(yc, yc, yc / 2);
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
  beginShape();
  $.each(bars2, function(i, p) {
    vertex(p[0] * SC + DX, p[1] * SC + DY);
    var vv = sq(mouseX - (p[0] * SC + DX)) + sq(mouseY - (p[1] * SC + DY));
    if (v > vv) {
      v = vv;
      vi = i;
    }
  });
  endShape();
  stroke(200, 200, 100, 100);
  strokeWeight(5);
  ellipse(ant_x * SC + DX, ant_y * SC + DY, ant_r * 2 * SC, ant_r * 2 * SC);
  image(ant, ant_x * SC + DX, ant_y * SC + DY, ant_r * 2 * SC, ant_r * 2 * SC);

  noStroke();
  fill(255);
  textSize(20);
  strokeWeight(1);
  var p = bars[vi];
  // text(int(p[0]) + '\n' + int(p[1]), p[0] * SC + DX, p[1] * SC + DY);

  if (step == GAME) {
    score = moment(moment() - start_time);
  } else {
    title();
  }

  $('#score').text(score.format('mm:ss.SS'));
  $('#hiscore').text(hiscore.format('mm:ss.SS'));
}

function mousePressed() {
  if (0 <= mouseX && mouseX < width && 0 <= mouseY && mouseY < height) {
    if (step == TITLE) {
      if (result_frame == 30) result_frame--;
      if (result_frame <= 0) {
        frameCount = 0;
        start_time = moment();
        step = GAME;
        init();
      }
    }
  }
}
