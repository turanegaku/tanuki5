var hiscore = 0;
var score = 0;
var raccoon;
var raccoon2;

var raccoonX = 50;
var raccoonY = 300;
var raccoonV = 12;
var SIZE = 100;

var raccoondy = 0;
var raccoonv = 0;
var raccoonjump = 0;

var time = -1000;

function Enemy(i, x) {
  this.i = i;
  this.x = x;
}

var foxY = [300, 120];
var fox = [];
var foxsx = [];


var TITLE = 0;
var GAME = 1;

var step = TITLE;

var trg = 1000;

function setup() {
  createCanvas(800, 450).parent('p5Canvas');
  fox.push(loadImage('./img/kitune.png'));
  fox.push(loadImage('./img/tori.png'));
  raccoon = loadImage('./img/tanuki.png');
  raccoon2 = loadImage('./img/tanuki2.png');
  textAlign(CENTER);
  textSize(50);

  hiscore = int(document.cookie);
  $(window).on("beforeunload", function(e) {
    document.cookie = hiscore;
  });
}

function draw() {
  background(255, 255, 255);
  var scored = 0.5 + sqrt(sqrt(score)) / 100;
  var scored2 = 5 + sqrt(score) / 20;

  if (raccoonjump > 0) {
    raccoondy += raccoonv;
    raccoonv -= 0.4;
    if (raccoondy < 0 && raccoonv < 0) {
      raccoondy = 0;
      raccoonjump = 0;
    }
    scored += 0.1 * raccoonjump;
  } else {
    raccoondy = 0;
  }
  var D = 60 * 60;

  if (step == GAME) {
    $.each(foxsx, function(i, foxx) {
      if ((raccoonY - raccoondy - foxY[foxx.i]) * (raccoonY - raccoondy - foxY[foxx.i]) + (raccoonX - foxx.x) * (raccoonX - foxx.x) < D) {
        step = TITLE;
        time = frameCount;
      }
    });
  }
  beginShape();
  for (var i = -100; i < 900; i += 10) {
    vertex(i, raccoonY + 120 + sin(radians(i + score * scored2)) * 10);
  }
  vertex();
  endShape();
  if (int((score / 10)) % 2 === 0 || raccoonjump > 0) {
    image(raccoon, raccoonX, raccoonY - raccoondy, SIZE, SIZE);
  } else {
    image(raccoon2, raccoonX, raccoonY - raccoondy, SIZE, SIZE);
  }
  $.each(foxsx, function(i, foxx) {
    image(fox[foxx.i], foxx.x, foxY[foxx.i], SIZE, SIZE);
  });

  if (step == GAME) {
    score += scored;
    if (trg < score) {
      trg += 1000;
      if (trg === 2000 || trg === 5000) {
        foxsx.push(new Enemy(1, 1000));
      } else {
        foxsx.push(new Enemy(0, 1000));
      }
    }

    $.each(foxsx, function(i, foxx) {
      foxsx[i].x -= scored2 * scored;
      if (foxsx[i].x < -200) {
        foxsx[i].x = 1200 + random(-100, 100 + scored) + foxx.i * random(100, 500);
      }
    });
  } else {
    text("Click Start !!!!!", width / 2, height / 2);
  }
  hiscore = int(max(score, hiscore));
  $('#score').text(int(score));
  $('#hiscore').text(hiscore);
}

function press() {
  if (frameCount - time > 30) {
    if (step == TITLE) {
      step = GAME;
      score = 0;
      foxsx = [new Enemy(0, 900), new Enemy(0, 1800)];
      trg = 1000;
    } else {
      if (raccoonjump < 2) {
        raccoonjump++;
        raccoonv = raccoonV;
      }
    }
  }
}

function keyPressed() {
  if (keyCode == ENTER) {
    press();
  }
}

function mousePressed() {
  press();
}
