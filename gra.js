
'use strict';

let GAME_LEVELS = [/*
`
b.....................
..#................#..
..##.............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................` ,*/
`
..................................................#......b..#
#...........................................................#
#...........................................................#
#...........................................................#
#............o.o............................................#
#..........#######..........................................#
#........................o..................................#
#.......................#####...............#..M.......#....#
#............................................##########.....#
#...o.............................o.........................#
#.#####.........................###......................?x##
#.........................................................?##
#...........................................................#
#.....................................................#@.?..#
#.................................#....._..#...._....########
#+++++++++++++++++++++++++++++++++#........#........##++++++#
#############################################################
`];

// konstruktor poziomu
class Level {
    constructor(plan) {
      let rows = plan.trim().split("\n").map(l => [...l]);
      this.height = rows.length;
      this.width = rows[0].length;
      this.startActors = [];
  
      this.rows = rows.map((row, y) => {
        return row.map((ch, x) => {
          let type = levelChars[ch];
          if (typeof type == "string") return type;
          this.startActors.push(
            type.create(new Vec(x, y), ch));
          return "empty";
        });
      });
    }
  }
// Konstruktor stanu gry (stan jest dpowiedzialny za ciagly update widoku)

class State {
constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
    }
  
    static start(level) {
      return new State(level, level.startActors, "playing");
    }
  
    get player() {
      return this.actors.find(a => a.type == "player" );
    }
}

  //vector z dodawaniem i mnozeniem przez faktor, uzywany jako pozycja i predkosc

class Vec {
    constructor(x, y) {
      this.x = x; this.y = y;
    }
    plus(other) {
      return new Vec(this.x + other.x, this.y + other.y);
    }
    times(factor) {
      return new Vec(this.x * factor, this.y * factor);
    }
}

// konstruktor playera

class Player {
    constructor(pos, speed) {
      this.pos = pos;
      this.speed = speed;
    }
  
    get type()  {return "player";}
  
    static create(pos) {
      return new Player(pos.plus(new Vec(0, -0.5)),
                        new Vec(0, 0));
    }
}
  
Player.prototype.size = new Vec(0.8, 1.5);

// Monster
class Monster {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }

  get type() { return "monster"; }

  static create(pos, ch) {
      return new Monster(pos, new Vec(5, 0));
   }
}
Monster.prototype.size = new Vec(1, 1);

// Pocisk
class Ball {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }

  get type() { return "ball"; }

  static create(pos,ch) {
      return new Ball(pos, new Vec(5, 0));
   }
}
Ball.prototype.size = new Vec(0.5, 0.5);

// konstruktor Lavy | lava pionowa, = lava pozioma, v lava kapiaca. Lava stojaca (+) nie jest uznawana za aktora 
// bo sie nie rusza

class Lava {
    constructor(pos, speed, reset) {
      this.pos = pos;
      this.speed = speed;
      this.reset = reset;
    }
  
    get type() { return "lava"; }
  
    static create(pos, ch) {
      if (ch == "=") {
        return new Lava(pos, new Vec(5, 0));
      } else if (ch == "|") {
        return new Lava(pos, new Vec(0, 2));
      } else if (ch == "v") {
        return new Lava(pos, new Vec(0, 3), pos);
      }
    }
}
  
Lava.prototype.size = new Vec(1, 1);

// moving wall

class MovingWall {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() { return "movingWall"; }

  static create(pos, ch) {
    if (ch == "_") return new MovingWall(pos, new Vec(5, 0));
  }
}

MovingWall.prototype.size = new Vec(2, 1);


// konstruktor coinsow. wobble = drganie
class Coin {
    constructor(pos, basePos, wobble) {
      this.pos = pos;
      this.basePos = basePos;
      this.wobble = wobble;
    }
  
    get type() {return "coin";}
  
    static create(pos) {
      let basePos = pos.plus(new Vec(0.2, 0.1));
      return new Coin(basePos, basePos,
                      Math.random() * Math.PI * 2);
    }
}
  
Coin.prototype.size = new Vec(0.6, 0.6);

class Bonus {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }

  get type() { return "bonus"; }

  static create(pos, size) {
    return new Bonus(pos.plus(new Vec(0.2, 0.1)), new Vec(0.8, 0.8));
  }
}

//Bonus.prototype.size = new Vec(0.8, 0.8);

class Hidden {
  constructor(pos) {
    this.pos = pos;
  }

  get type() { return "hidden"; }

  static create(pos) {
    return new Hidden(pos);
  }
}

Hidden.prototype.size = new Vec(1, 1);

// typy blokow

const levelChars = {
    ".": "empty", "#": "wall", "+": "lava", "_": MovingWall,
    "@": Player, "o": Coin, "x": Bonus, "M": Monster, "b": Ball, "?": Hidden,
    "=": Lava, "|": Lava, "v": Lava
};

// ******************** Rysowanie ********************

// funkcja pomocnicza tworzy divy i elementy

function elt(name, attrs, ...children) {
    let dom = document.createElement(name);
    for (let attr of Object.keys(attrs)) {
      dom.setAttribute(attr, attrs[attr]);
    }
    for (let child of children) {
      dom.appendChild(child);
    }
    return dom;
}

// wyswietlanie

class DOMDisplay {
    constructor(parent, level) {
      this.dom = elt("div", {class: "game"}, drawGrid(level));
      this.actorLayer = null;
      parent.appendChild(this.dom);
	    createMessage();
      message(`Lives:  ${lives}`);
    }
  
    clear() { this.dom.remove(); }
}

const scale = 20;

function drawGrid(level) {
    return elt("table", {
      class: "background",
      style: `width: ${level.width * scale}px`
    }, ...level.rows.map(row =>
      elt("tr", {style: `height: ${scale}px`},
          ...row.map(type => elt("td", {class: type})))
    ));
}

// Rysowanie aktorow

function drawActors(actors) {
    return elt("div", {}, ...actors.map(actor => {
      let rect = elt("div", {class: `actor ${actor.type}`});
      rect.style.width = `${actor.size.x * scale}px`;
      rect.style.height = `${actor.size.y * scale}px`;
      rect.style.left = `${actor.pos.x * scale}px`;
      rect.style.top = `${actor.pos.y * scale}px`;
      return rect;
    }));
}

// wyswietlanie statusu

DOMDisplay.prototype.syncState = function(state) {
    if (this.actorLayer) this.actorLayer.remove();
    this.actorLayer = drawActors(state.actors);
    this.dom.appendChild(this.actorLayer);
    this.dom.className = `game ${state.status}`;
    this.scrollPlayerIntoView(state);
};

// przesuwanie obrazu tak aby player byl na srodku

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
    let width = this.dom.clientWidth;
    let height = this.dom.clientHeight;
    let margin = width / 3;
  
    // The viewport
    let left = this.dom.scrollLeft, right = left + width;
    let top = this.dom.scrollTop, bottom = top + height;
  
    let player = state.player;
    // centrum pozycji playera = jego pozycja  plus polowa jego wielkosci razy skala (zeby nie pokazalo w pikselach)
    let center = player.pos.plus(player.size.times(0.5))
                           .times(scale);
  
    if (center.x < left + margin) {
      this.dom.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
      this.dom.scrollLeft = center.x + margin - width;
    }
    if (center.y < top + margin) {
      this.dom.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
      this.dom.scrollTop = center.y + margin - height;
    }
};

// ************* RUCH I KOLIZJE  ***********************

// metoda sparawdzajaca czy element (z listy level = nie aktor = sciana  i lava stojaca) dotyka siatki elementow

Level.prototype.touches = function(pos, size, type) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);
  
    for (var y = yStart; y < yEnd; y++) {
      for (var x = xStart; x < xEnd; x++) {
        let isOutside = x < 0 || x >= this.width ||
                        y < 0 || y >= this.height;
        let here = isOutside ? "wall" : this.rows[y][x];
        if (here == type) return true;

      }
    }
    return false;
};

// update statusu gry. 1 wywoluje metode update na wszystkich aktorach, potem sprawdza playera

State.prototype.update = function(time, keys) {
    let actors = this.actors
      .map(actor => actor.update(time, this, keys));
    let newState = new State(this.level, actors, this.status);
    let player = newState.player;
    // jesli nie ma co dalej robic  wygrana
    if (newState.status != "playing") return newState;
    
    
    // player dotyka lavy stojacej (+) - przegrywa
    
    if (this.level.touches(this.player.pos, this.player.size, "lava")) {
     checkingLives();
      return new State(this.level, actors, "lost");
    }
   
    // sprawdzanie czy aktorzy (rozni) na siebie nachodza: player - lava  = lost, ale player - coin = zbieranie monet
    for (let actor of actors) {
      if (movingBall ==true && actor.type == "ball") {
      return actor.collideWithEnemy(newState);
      }
      if (actor != player && overlap(actor, player)) {
        newState = actor.collide(newState);
      }
    }
    return newState;
  };

// funkcja sprawdza czy dwaj aktorzy sie dotykaja. jesli tak, to zwraca true

function overlap(actor1, actor2) {
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&
           actor1.pos.x < actor2.pos.x + actor2.size.x &&
           actor1.pos.y + actor1.size.y >= actor2.pos.y &&
           actor1.pos.y <= actor2.pos.y + actor2.size.y;
}

//funkcja pomocnicza. Overlap przyjmuje 2 aktorow, wiec zeby ja wykorzystac musialbym czasami tworzyc nowe instacje
// overlap2 przyjmuje pos i size zamiast obiektu, przez co latwiej cos do niej przekazac.
function overlap2(pos, size, actor2) {
  return pos.x + size.x > actor2.pos.x &&
         pos.x < actor2.pos.x + actor2.size.x &&
         pos.y + size.y >= actor2.pos.y &&
         pos.y <= actor2.pos.y + actor2.size.y;
}


// zmiana statusu jak aktorzy sie dotykaja. 1 lava-player, 2. coin-player

Lava.prototype.collide = function(state) {
 checkingLives();
    return new State(state.level, state.actors, "lost");
};

//cala logika kolidacji z movingwall jest w ruchu playera
MovingWall.prototype.collide = function(state) {
    return state;
 };
  
Coin.prototype.collide = function(state) {
    let filtered = state.actors.filter(a => a != this);
    let status = state.status;
    // jesli nie znajdze wsrod aktorow coina to znaczy ze ich wiecej nie ma i status zmienia na won
    if (!filtered.some(a => a.type == "coin")) status = "won";
    return new State(state.level, filtered, status);
  return state;
};

Bonus.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  lives = lives +2;
  checkingLives();
  return new State(state.level, filtered, state.status);
};

Hidden.prototype.collide = function(state) {
  let playerPosY = state.player.pos.y;
  let playerPosX = state.player.pos.x;
  if (playerPosY > this.pos.y && ((playerPosX > this.pos.x + 0.01)||(playerPosX < this.pos.x - 0.01))) {
    let filtered = state.actors.filter(a => a != this);
    return new State(state.level, filtered, state.status);
  } else if (playerPosY < this.pos.y) {
    state.player.pos.y = this.pos.y - state.player.size.y;
    return state;
  }     
  else {
    return state;
  }
};

Monster.prototype.collide = function(state) {
  // trza dodac 0.51, bo player.y zaczyna sie 0.5 nad ziemia
  let playerPos = state.player.pos.y + 0.51;
  if (playerPos < this.pos.y) {
    let filtered = state.actors.filter(a => a != this);
    return new State(state.level, filtered, state.status);
  } else {
    checkingLives();
    return new State(state.level, state.actors, "lost");
  }
};
// kolizja balla z playerem
Ball.prototype.collide = function(state) {
  return state;
};

// kolizja balla z przeciwnikiem
Ball.prototype.collideWithEnemy = function (state) {
  let enemies = state.actors.filter(a => a.type == "monster");
  for(let enemy of enemies) {
    if (overlap(this, enemy)) {
      //znika przeciwnik
      let filtered = state.actors.filter(a =>  a != enemy);
      // znika kula
      movingBall = false;
      return new State(state.level, filtered, state.status);
    }
   }
   return state;    
}

// *************************** UPDATE Aktorow*******************************

// update lawy

Lava.prototype.update = function(time, state) {
    let newPos = this.pos.plus(this.speed.times(time));
    //dopoki lava nie dotknie walla to tworzy nowa lave w newPos. Reset to pozycja po zresetowaniu, docelowo = newPos
    if (!state.level.touches(newPos, this.size, "wall")) {
      return new Lava(newPos, this.speed, this.reset);
      // jesli jest wall na drodze, i jesli jest reset(konstruktor dopuszcza lawe bez tego param) 
      //to lava wraca do poczatku => reset = pos - to dla lavy kapiacej
    } else if (this.reset) {
      return new Lava(this.reset, this.speed, this.reset);
      // to przypadek dla lawy 'odbijajacej sie', zmieniamy jej predkosc na ujemna czyli zaczyna sie cofac az znowu uderzy w wall
    } else {
      return new Lava(this.pos, this.speed.times(-1));
    }
};

let movingWallRight = false;
MovingWall.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  if (this.speed.x > 0) movingWallRight = true;
  if (this.speed.x < 0) movingWallRight = false;
  //dopoki wall nie dotknie innego walla to tworzy nowy wall w newPos. Reset to pozycja po zresetowaniu, docelowo = newPos
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new MovingWall(newPos, this.speed, this.reset);  
    // jesli jest wall na drodze, to lava wraca do poczatku => reset = pos - to dla lavy kapiacej
  } else {
    return new MovingWall(newPos, this.speed.times(-1));
    
  }
};

// poruszanie sie coinsow - podskakiwanie
const wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.update = function(time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};

Bonus.prototype.update = function(time) {
  // TODO zwiekszajacy sie rozmiar = bijace serce
  return new Bonus(this.pos, this.size);
};

Hidden.prototype.update = function(time) {
  return new Hidden(this.pos);
};

// poruszanie sie monstera

Monster.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
    if (!state.level.touches(newPos, this.size, "wall")) {
      return new Monster(newPos, this.speed);
      // jesli jest wall na drodze, to monstera odbija sie
    } else {
      return new Monster(this.pos, this.speed.times(-1));
    } 
}
var movingBall;
var directionBallRight;
let ballSpeed = 400;

Ball.prototype.update = function(time, state) {
  if (isSpacepressed()) movingBall = true;
  //jesli flaga jest false. Ball "chodzi" za playerem
  
  if(!movingBall){
    let newPos = state.player.pos.plus(this.speed.times(time));   
    return new Ball(newPos.plus(new Vec(0, 0.5)), this.speed.times(time));
  // jesli falga zmieni sie na true (po nacisnieciu spacji) to kula zaczyna sie ruszac
  } else if(movingBall){
    let newPosWhenRun = this.pos.plus(this.speed.times(time));
    // dopoki nie uderzy w sciane to aktualizuje pozycje i leci do przodu w prawo albolewo
    if (!state.level.touches(newPosWhenRun, this.size, "wall")) {
      if(directionBallRight) {       
        return new Ball(newPosWhenRun, (new Vec (ballSpeed,0).times(time)));  
      } else if(!directionBallRight) {
        return new Ball(newPosWhenRun, (new Vec (ballSpeed,0).times(-time)));  
      }        
    // jak uderzy w sciane to znika i przyjmuje pozycje jak player. Flaga ruchu wraca na false  
    } else {
      movingBall = false;
      let newPos = state.player.pos.plus(this.speed.times(time));
      return new Ball(newPos, this.speed.times(time));
      }
  }
}

function isSpacepressed() {
  document.addEventListener('keyup', function(event) {
    if (event.key == " ") {
      event.preventDefault();
      if (playerFacedRight) {directionBallRight = true;}
      else if (!playerFacedRight) {directionBallRight = false;}
      movingBall = true;
      return true;
    }
    return false
  });
}

// poruszanie sie playera

let playerXSpeed = 7;
let gravity = 30;
let jumpSpeed = 17;
let playerFacedRight = true;

Player.prototype.update = function(time, state, keys) {
  // TO DO jestproblem, bo biore pod uwqage tylko jeden moving wall - pierwszy, a nie wszystkie
  let movingWallActor;
  for (var actor of state.actors) {
    if (actor.type == "movingWall") {
      movingWallActor = actor;
    }
  }
  let fakeySpeed = this.speed.y + time * gravity;
  let fake = this.pos.plus(new Vec(0, fakeySpeed * time));
  if(overlap2(fake, this.size, movingWallActor)) {
    if (movingWallRight) {
      this.pos = this.pos.plus(new Vec(0.1, 0));

    }
    if (!movingWallRight) {
      this.pos = this.pos.plus(new Vec(-0.1, 0));
    }
  }
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    let xSpeed = 0;
  if (keys.ArrowLeft) {
    xSpeed -= playerXSpeed;
    playerFacedRight = false;
    //state.style.backgroundImage = "url('./player.jpg')";
  }  
  if (keys.ArrowRight) {
    xSpeed += playerXSpeed;
    playerFacedRight = true;
   // this.style.backgroundImage = "url('./playerL.jpg')";
  } 
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!(state.level.touches(movedX, this.size, "wall")) || ((overlap(this, movingWallActor)))) { //new Player(pos.plus(new Vec(xSpeed * time, 0)), this.speed)
    pos = movedX;
  }
  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  let playerPos = this.pos;
  // jeszcze przed wykonaniem skoku sprawdzamy czy player bedzie dotykac scian. jak nie to wykorzystujemy nowa pozycje
  if (!((state.level.touches(movedY, this.size, "wall")) || (overlap2(movedY, this.size, movingWallActor)))) { //(overlap(new Player(this.pos.plus(new Vec(0, ySpeed * time)), this.speed), movingWallActor))))
    pos =  movedY; 
  // jesli jest wcisnieta strzalka i spda w dol Yspeed > 0 to ustawia speed na ujemny zeby nie mozna było skoczyc spadajac  
  }else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
    // w cos uderzyl i speed rowne zero
  } 
  else {  
    ySpeed = 0;
  } 
  return new Player(pos, new Vec(xSpeed, ySpeed));
};

// sledzenie nacisniecia klawiszy = ciagle poruszanie z wcisnietym

function trackKeys(keys) {
    let down = Object.create(null);
    function track(event) {
      if (keys.includes(event.key)) {
        down[event.key] = event.type == "keydown";
        event.preventDefault();
      }
    }
    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    return down;
}

  
const arrowKeys =
    trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

// funkcja odswiezajaca widok co 100 ms. Jesli okno jest nieaktywne funkcja sie zatrzymuje

function runAnimation(frameFunc) {
    let lastTime = null;
    function frame(time) {
      if (lastTime != null) {
        let timeStep = Math.min(time - lastTime, 100) / 1000;
        if (frameFunc(timeStep) === false) return;
      }
      lastTime = time;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

// funkcja uruchamiajaca level

function runLevel(level, Display) {
    let display = new Display(document.body, level);
    let state = State.start(level);
    let ending = 1;
    return new Promise(resolve => {
      runAnimation(time => {
        state = state.update(time, arrowKeys);
        display.syncState(state);
        if (state.status == "playing") {
          return true;
        } else if (ending > 0) {
          ending -= time;
          return true;
        } else {
          display.clear();
          resolve(state.status);
          return false;
        }
      });
    });
}

async function runGame(plans, Display) {
    for (let level = 0; level < plans.length;) {
        let status = await runLevel(new Level(plans[level]),
                                    Display);
        if (status == "won") level++;
      }
      confirm("You've won!");
      window.location.replace("./index.html");
}
function createMessage(){
  var div = document.createElement("div");
  div.id = "textArea";
}

function message(a){
  var g = document.getElementById("textArea");
  g.innerHTML = a;
}

function checkingLives() {
  --lives;
  message(`Lives:  ${lives}`);
  if(lives === 0) {
    confirm("game over");
    document.body.remove();
    window.location.replace("./index.html");
  }
}
let lives = 3;

runGame(GAME_LEVELS, DOMDisplay);
