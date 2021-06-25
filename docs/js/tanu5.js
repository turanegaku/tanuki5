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

var result_score;
var result_frame = 0;

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

// new animal score
var trg = 1000;

// allow w jump
var wj = false;

var ismobile = navigator.userAgent.match(/iPhone|Android.+Mobile/);

function init() {
  wj = !$('#wj').prop('checked');
  score = 0;
  foxsx = [new Enemy(0, 900), new Enemy(0, 1800)];
  trg = 1000;
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
  fox.push(loadImage('./img/kitune.png'));
  fox.push(loadImage('./img/tori.png'));
  raccoon = loadImage('./img/tanuki.png');
  raccoon2 = loadImage('./img/tanuki2.png');
  textAlign(CENTER);
  textSize(50);
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
    localStorageManager.setValue(document.title, 'prize', prize);
    localStorageManager.close(document.title);
  });

}

// call when game to title
function gameEnd() {
  step = TITLE;
  result_score = int(score);
  result_frame = 60;
  prizeupdate();
}

// draw title & result
function title() {
  if (result_frame > 0) {
    if (result_frame != 30)
      result_frame--;
    var dd = map(result_frame, 60, 0, sqrt(width), -sqrt(width));
    dd = dd * dd;
    fill(0);
    text('RESULT', width / 2 + dd, height / 5);
    text(result_score, width / 2 + dd, height * 3 / 5);
  } else {
    fill(0);
    noStroke();
    text("Click Start!!", width / 2, height / 2);
  }
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

  if (step == GAME) {
    var D = 60 * 60;
    $.each(foxsx, function(i, foxx) {
      if ((raccoonY - raccoondy - foxY[foxx.i]) * (raccoonY - raccoondy - foxY[foxx.i]) + (raccoonX - foxx.x) * (raccoonX - foxx.x) < D) {
        gameEnd();
      }
    });
  }

  // draw ground
  beginShape();
  for (var i = -100; i < 900; i += 10) {
    vertex(i, raccoonY + 120 + sin(radians(i + score * scored2)) * 10);
  }
  vertex();
  endShape();
  // draw animals
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
    // new fox
    if (trg < score) {
      trg += 1000;
      if (trg === 2000 || trg === 5000) {
        foxsx.push(new Enemy(1, 1000));
      } else {
        foxsx.push(new Enemy(0, 1000));
      }
    }

    // fox move
    $.each(foxsx, function(i, foxx) {
      foxsx[i].x -= scored2 * scored;
      if (foxsx[i].x < -200) {
        foxsx[i].x = 1200 + random(-100, 100 + scored) + foxx.i * random(100, 500);
      }
    });
  } else {
    title();
  }

  hiscore = int(max(score, hiscore));
  $('#score').text(int(score));
  $('#hiscore').text(hiscore);
}

function press() {
  switch (step) {
    case TITLE:
      if (result_frame == 30) result_frame--;
      if (result_frame <= 0) {
        step = GAME;
        init();
      }
      break;
    case GAME:
      if (raccoonjump < 1 || (raccoonjump < 2 && wj)) {
        raccoonjump++;
        raccoonv = raccoonV;
      }
      break;
  }
}

function keyPressed() {
  if (keyCode == ENTER) {
    press();
  }
}

function mousePressed() {
  if (!ismobile || event.type == 'touchstart') {
    press();
  }
}
