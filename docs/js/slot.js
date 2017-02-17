var hiscore = 0;
var score = 0;

var raccoon1;
var raccoon2;
var sheepl;
var sheepr;
let apple;
let ari;
let tori;
let usagi;

let slot = [];

let effects = [];

var result_score;
var result_frame = 0;

var TITLE = 0;
var GAME = 1;

let rolling = false;


var DIST_SHEEP = 60;
var LINE_SHEEP = 6;
var SCALE_SHEEP = 80;

var limit;

class Effect {
  constructor(t, d, r, g, b) {
    this.t = t;
    this.d = d;
    this.r = r;
    this.g = g;
    this.b = b;
    this.y = height / 2;
    this.a = 255;
  }

  is_kill(){
    return this.y < height/2 - 30;
  }

  update() {
    this.y -= 1;
    this.a -= 10;
  }

  draw() {
    fill(this.r, this.g, this.b, this.a);
    text(this.t, width/2 + this.d, this.y);
    noFill();
  }
}

class Cell {
  constructor(g, ok) {
    this.g = g;
    this.ok = ok;
  }

  set(i) {
    this.i = i * 10;
  }

  is_center() {
    return ceil(this.i / 10.) === 27;
  }

  update() {
    if (rolling) {
      this.i+=2;
    } else if (this.i % 10 > 0) {
      this.i++;
    }
    if (this.i >= 500) {
      this.i = 0;
    }
  }

  draw() {
    let y = (this.i / 10 - 25) * 100;
    if (y > - 100 && y < height + 100) {
      image(this.g, width / 2, y, 80, 80);
      fill(0);
    }
  }
}

function shuffle(array) {
  var n = array.length, t, i;

  while (n) {
    i = Math.floor(Math.random() * n--);
    t = array[n];
    array[n] = array[i];
    array[i] = t;
  }

  return array;
}

function init() {
  score = 0;
  userl = -1;
  rolling = true;

  slot = shuffle(slot);
  for (var i = 0; i < slot.length; ++i) {
    slot[i].set(i);
  }
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
  sheepl = loadImage('./img/sheep_L.png');
  sheepr = loadImage('./img/sheep_R.png');
  // apple = loadImage('./img/apple.png');
  ari = loadImage('./img/ari.png');
  tori = loadImage('./img/tori.png');
  usagi = loadImage('./img/usagi1.png')
  seven = loadImage('./img/seven.png')

  for (let i = 0; i < 8; ++i) {
    slot.push(new Cell(raccoon1, 0));
    slot.push(new Cell(raccoon2, 0));
  }//16
  for (let i = 0; i < 7; ++i) {
    slot.push(new Cell(sheepl, 0));
    slot.push(new Cell(sheepr, 0));
  }//16+14 30
  for (let i = 0; i < 4; ++i) {
    // slot.push(new Cell(apple, 0));
    slot.push(new Cell(ari, 0));
    slot.push(new Cell(tori, 0));
    slot.push(new Cell(usagi, 0));
    slot.push(new Cell(seven, 1));
    slot.push(new Cell(seven, 1));
  //   slot.push(new Cell(seven, 1));
  //   slot.push(new Cell(seven, 1));
  //   slot.push(new Cell(seven, 1));
  //   slot.push(new Cell(seven, 1));
  }// 30 + 20 50

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
    console.log(localStorageManager.storage);
    localStorageManager.setValue(document.title, 'best', hiscore);
    localStorageManager.setValue(document.title, 'prize', prize);
    console.log(localStorageManager.storage);
    localStorageManager.close(document.title);
  });
}

// call when game to title
function gameEnd() {
  result_frame = 60;
  result_score = score;
  prizeupdate();
}

function draw() {
  background(255, 255, 255);

  stroke(255, 100, 100);
  strokeWeight(4);
  rect(width / 2 - 45, height / 2 - 45 - 25, 90, 90);
  noStroke();

  $.each(effects, (_, v) => {
    v.update();
  })
  for (var i = 0; i < effects.length; i++) {
    if (effects[i].is_kill()) {
      effects.splice(i--, 1);
    }
  }

  $.each(effects, (_, v) => {
    v.draw();
  })

  $.each(slot, (_, v) => {
    v.update();
  });

  $.each(slot, (_, v) => {
    v.draw();
  });

}

function mousePressed() {
  if (0 <= mouseX && mouseX < width && 0 <= mouseY && mouseY < height) {
    if (rolling) {
      rolling = false;
      for (var i = 0; i < slot.length; ++i) {
        if (slot[i].is_center()) {
          if (slot[i].ok) {
            score++;
            effects.push(new Effect('+1', 100, 100, 200, 100));

            if (hiscore < score) {
              effects.push(new Effect('hiscore!!!', -100, 100, 200, 100));
              hiscore = score;
            }
            $('#score').text(int(score));
            $('#hiscore').text(hiscore);
          } else {
            score=0;
            effects.push(new Effect('0', 100, 255, 0, 0));
            $('#score').text(int(score));
            $('#hiscore').text(hiscore);
          }
          break;
        }
      }
    } else {
      rolling = true;
    }
  }
}
