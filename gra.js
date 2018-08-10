'use strict';

var GAME_PLANS = [
`
....................................................................................................
.########################################??##########################?##############?##############.
.#................................................................................................#.
.#................................................................................................#.
.#................................................................................................#.
.#.........o............................AAA.....................................#....M..#.......P.#.
.#.......#?#?#.............#####........###..........................#..........#########......#??#.
.#................#.......##oo......................................#.............................#.
.#..@.#...........#..M...###..M.....#..........#...####....#.M.....#........oo....................#.
.###############################################...#..#....###########.....#################..#####.
...............................................#+++#..#++++#.........#+++++#...............#++#...b`,
`
#############?#?########################???##################
#...........................................................#
#...........................................................#
#.P........................................................x#
####.........o.o.........................A.................##
#...........#####.......................###.................#
#......##....#v#.........o..................................#
#.......................#####...............#..M.....#......#
#...........................................##########......#
#..oo.................................oo....................#
######...........................#.........................##
#...................A.......................................#
#..................###......................................#
#.........###...###......................................@..#
#A..........................#..M..#........#...........######
#o...........#.#............#######....M...#...._.....#######
##++###++++++#=#++++++++++++################++++++++++#######b`,
`
########################
#......................#
#......................#
#......................#
#......................#
#x.P...................#
#####.....#...#........#
#....................o.#
#...................####
#...................YYY#
#......................#
#........._............#
#......................#
#......................#
#......................#
####...................#
#YYY...................#
#......................#
#.............._....#..#
#+++++++++++++++++++#..#
######################.#
#......................#
#......................#
#......................#
#o....................##
#o.....................#
#o#.....#.....#........#
###.....#+++++#........#
#YY.....#YYYYY#......###
#....................YY#
#......................#
#...#_.................#
#......................#
#?.....................#
#......................#
#......................#
#......................#
#####+++++++#.#........#
#YY..#######.........#?#
#......................#
#o.....................#
####................####
#YYY.......A........YYY#
#......................#
#....o...........o.....#
#....##....@....###....#
#.........###..........#
#++++++++++++++++++++++#b
`
];

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
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
    //this.reset = reset;
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

class Ammo {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }

  get type() {return "ammo";}

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new Ammo(basePos, basePos,
                    Math.random() * Math.PI * 2);
  }
}

Ammo.prototype.size = new Vec(0.6, 0.6);

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

class Portal {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }

  get type() { return "portal"; }

  static create(pos, size) {
    return new Portal(pos.plus(new Vec(0, -0.5)), new Vec(1.05, 1.5));
  }
}


class Hidden {
  constructor(pos, touchedStatus) {
    this.pos = pos;
    this.touchedStatus = touchedStatus;
  }

  get type() { return "hidden"; }

  static create(pos, touchedStatus) {
    return new Hidden(pos, false);
  }
}

Hidden.prototype.size = new Vec(1, 1);

// typy blokow

const levelChars = {
    ".": "empty", "#": "wall", "+": "spike", "Y": "downSpike", "_": MovingWall,
    "@": Player, "o": Coin, "x": Bonus, "M": Monster, "b": Ball, "?": Hidden, "A": Ammo, "P": Portal,
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
      message("textArea", `Lives:  ${lives}`);
      message("ammoArea", `Ammunition:  ${ammunition}`);
      message("coinsArea", `Coins:  ${coins}`);
    }
    clear() { this.dom.remove(); }
}

const scale = 20;

// tworzy tabele, w ktorej komorkach przechowywane sa pola empty (tlo) lub wall (nie aktorzy)
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
      // zmiana animacji gracza
      if ((actor.type == "player" || actor.type == "playerL") && playerFacedRight){
        rect.className = "actor player";
      } else if ((actor.type == "player" || actor.type == "playerL") && !playerFacedRight) {
        rect.className = " actor playerL";
      }
      //zmiana znaku zapytania na wykorzystany
      if (actor.type == "hidden" && actor.touchedStatus) {
        rect.className = "actor hiddenTouched";
      }
      if (actor.type == "ball" && !movingBall) {
        rect.className = "";
      }
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
    // marginesy aby ekran caly czas sie nie przesuwal jak zwariowany
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

// metoda sparawdzajaca czy element zostal dotkniety

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
    
    if (this.level.touches(this.player.pos, this.player.size, "lava")|| this.level.touches(this.player.pos, this.player.size, "spike")
  || this.level.touches(this.player.pos, this.player.size, "downSpike")) {
     checkingLives();
      return new State(this.level, actors, "lost");
    }
   
    // sprawdzanie czy aktorzy (rozni) na siebie nachodza: player - lava  = lost, ale player - coin = zbieranie monet
    for (let actor of actors) {
      if (movingBall ==true && actor.type == "ball") {
      return actor.collideWithEnemy(newState);
      }
      if (actor.type == "hidden") {
        newState =  actor.collideFromBottom(newState);
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
function overlapX(pos, size, actor2) {
  return pos.x + size.x+0.2 > actor2.pos.x &&
         pos.x < actor2.pos.x + actor2.size.x+0.2 &&
         pos.y + size.y > actor2.pos.y &&
         pos.y < actor2.pos.y + actor2.size.y;
}

//funkcja pomocnicza. Overlap przyjmuje 2 aktorow, wiec zeby ja wykorzystac musialbym czasami tworzyc nowe instacje (np. playera)
// overlap2 przyjmuje pos i size zamiast obiektu, przez co latwiej cos do niej przekazac. np pos ktora ma byc skoku,a nie aktualna playera
function overlapY(pos, size, actor2) {
  // prawa
  return pos.x + size.x+0.1 >= actor2.pos.x &&
  //lewa
         pos.x < actor2.pos.x  + actor2.size.x+0.1  &&
         pos.y + size.y+0.1 >= actor2.pos.y &&
         pos.y <= actor2.pos.y + actor2.size.y+0.1;
}

// zmiana statusu jak aktorzy sie dotykaja. 1 lava-player, 2. coin-player

Lava.prototype.collide = function(state) {
 checkingLives();
    return new State(state.level, state.actors, "lost");
};

//cala logika kolidacji z movingwall jest w ruchu playera, bo po kolizji, to player zmienia swoje parametry
MovingWall.prototype.collide = function(state) {
    return state;
 };
  
Coin.prototype.collide = function(state) {
  checkingCoins();
    let filtered = state.actors.filter(a => a != this);
    return new State(state.level, filtered, state.status);
};

Ammo.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  ammunition = ammunition +2;
  checkingAmmunition();
  return new State(state.level, filtered, state.status);
};

Bonus.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  lives = lives +2;
  checkingLives();
  return new State(state.level, filtered, state.status);
};

Portal.prototype.collide = function(state) {
  return new State(state.level, state.actors, "won");
};

//jak przy moving wall
Hidden.prototype.collide = function(state) {
  return state;
};

Hidden.prototype.collideFromBottom = function(state) {
  let playerPosY = state.player.pos.y;
  let playerPosX = state.player.pos.x;
  if (playerPosY - 0.22 > this.pos.y + this.size.y/2 && playerPosY - 0.22 < this.pos.y + this.size.y &&
    ((playerPosX > this.pos.x - this.size.x/2 )&& (playerPosX < this.pos.x + this.size.x/2))) {
    state.player.pos.y = state.player.pos.y;
    if (this.touchedStatus === false) chance();
    this.touchedStatus = true;
    return new State(state.level, state.actors, state.status);
  }
  return state;
};

function chance(){
let number = Math.random();
if (number < 0.2) {
  ammunition = ammunition + 2;
  checkingAmmunition();
} else {
  checkingCoins();
} return;
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

MovingWall.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  //dopoki nie dotknie innego sciany to robi update.
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new MovingWall(newPos, this.speed);  
    // jesli jest wall na drodze, to odbija sie i porusza sie z ujemna predkoscia
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

Ammo.prototype.update = function(time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Ammo(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};

Bonus.prototype.update = function() {
  return new Bonus(this.pos, this.size);
};

Portal.prototype.update = function() {
  return new Portal(this.pos, this.size);
};

Hidden.prototype.update = function() {
  return new Hidden(this.pos, this.touchedStatus);
};

// poruszanie sie monstera

Monster.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
    if (!state.level.touches(newPos, this.size, "wall")) {
      return new Monster(newPos, this.speed);
      // jesli jest wall na drodze, to monster odbija sie
    } else {
      return new Monster(this.pos, this.speed.times(-1));
    } 
}
var movingBall;
var directionBallRight;
var ballSpeed = 400;
var checkAmmo = false;
var shotAllowed = true;

//lecace pilki
Ball.prototype.update = function(time, state) {
  isSpacepressed(); 
  if (checkAmmo) { movingBall = checkingAmmunition();
    checkAmmo = false;
  } 
  //jesli flaga jest false. Ball "chodzi" za playerem
  if(!movingBall){
    return new Ball(state.player.pos.plus(new Vec(0, 0.5)), this.speed);
  // jesli falga zmieni sie na true (po nacisnieciu spacji) to kula zaczyna sie ruszac
  } else if(movingBall){ 
    let newPosWhenRun = this.pos.plus(this.speed.times(time));
    // inaczej kazde nacisniecie spacji powodowaloby zmiejszenie amunicji przy jedej lecacej pilce
    shotAllowed= false;
    // dopoki nie uderzy w sciane to aktualizuje pozycje i leci do przodu w prawo albo lewo
    if (!state.level.touches(newPosWhenRun, this.size, "wall")) {
      if(directionBallRight) {       
        return new Ball(newPosWhenRun, (new Vec (ballSpeed,0).times(time)));  
      } else if(!directionBallRight) {
        return new Ball(newPosWhenRun, (new Vec (ballSpeed,0).times(-time)));  
      }        
    // jak uderzy w sciane to znika i przyjmuje pozycje jak player. Flaga ruchu wraca na false  
    } else {
      movingBall = false;
      shotAllowed= true;
      let newPos = state.player.pos.plus(this.speed.times(time));
      return new Ball(newPos, this.speed);
      }
  }
}

function isSpacepressed() {
  document.addEventListener('keypress', function(event) {
    if (event.key == " " && shotAllowed) {
      event.preventDefault();
      if (playerFacedRight) {directionBallRight = true;}
      else if (!playerFacedRight) {directionBallRight = false;}
      movingBall = true;
      checkAmmo = true;
      return true;
    }
    // zwraca false jak zostanie nacisniete cos innego niz spacja
    return false;
  });
  return false;
}

// poruszanie sie playera

let playerXSpeed = 7;
let gravity = 30;
let jumpSpeed = 17;
let playerFacedRight = true;



Player.prototype.update = function(time, state, keys) {
  let movingWallActor;
  let hiddenActor;
  // sprawdzanie ruchu X na ruchomej platformie
  let fakeySpeed = this.speed.y + time * gravity;
  let fake = this.pos.plus(new Vec(0, fakeySpeed * time));
  let movingWallsActors = state.actors.filter(a => a.type == "movingWall");
  let hiddenActors = state.actors.filter(a => a.type == "hidden");
  if (!movingWallActor) { movingWallActor = new MovingWall(new Vec(0,0), new Vec (0,0));}
  if (!hiddenActor) { hiddenActor = new Hidden(new Vec(0,0), false);}

  for (let actor of hiddenActors) {
    if (overlapY(fake, this.size, actor)|| overlapX(fake, this.size, actor)) {
      hiddenActor = actor;
    }
  }

  for (let actor of movingWallsActors) {
    if (overlapY(fake, this.size, actor)) {
      movingWallActor = actor;
        if (movingWallActor.speed.x >0) {
        this.pos = this.pos.plus(new Vec(0.1, 0));
        }
      if (movingWallActor.speed.x <0) {
      this.pos = this.pos.plus(new Vec(-0.1, 0));
      }
    }
  }
  //spradzanie pozostalych ruchow playera, w tym skoki na ruchomym wallu
  let xSpeed = 0;
  if (keys.ArrowLeft) {
    xSpeed -= playerXSpeed;
    playerFacedRight = false;
  }  
  if (keys.ArrowRight) {
    xSpeed += playerXSpeed;
    playerFacedRight = true;
  } 
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!( (state.level.touches(movedX, this.size, "wall")) || (state.level.touches(movedX, this.size, movingWallActor.state)) 
  || (overlapX(movedX, this.size, hiddenActor)) ) )     { 
    pos = movedX;
  }
  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  // jeszcze przed wykonaniem skoku sprawdzamy czy player bedzie dotykac scian. jak nie to wykorzystujemy nowa pozycje
  if (!((state.level.touches(movedY, this.size, "wall")) || (overlapY(movedY, this.size, hiddenActor)) || (overlapY(movedY, this.size, movingWallActor)) )) { 
    pos =  movedY;
  // jesli jest wcisnieta strzalka i spda w dol Yspeed > 0 to ustawia speed na ujemny zeby nie mozna było skoczyc spadajac  
  }
  else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
    movedX = pos.x;
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
// wrzycam tutaj niektore petle, lepiej zeby ladaowaly sie z poziomem niz przy kazdym update

function runLevel(plan, Display) {
    let display = new Display(document.body, plan);
    let state = State.start(plan);
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
    for (let plan = 0; plan < plans.length;) {
        let status = await runLevel(new Level(plans[plan]),
                                    Display);
        if (status == "won") plan++;
      }
      confirm("You've won!");
      window.location.replace("./index.html");
}

function message(id, message){
  var element = document.getElementById(id);
  element.innerHTML = message;
}

function checkingLives() {
  --lives;
  message("textArea", `Lives:  ${lives}`);
  if(lives === 0) {
    confirm("game over");
    document.body.remove();
    window.location.replace("./index.html");
  }
}

function checkingAmmunition() {
  if (ammunition <= 0) {
  //message("ammoArea", `Ammunition:  ${ammunition}`);
    return false;
  } else {
    --ammunition;
    message("ammoArea", `Ammunition:  ${ammunition}`);
    return true;
  }
}

function checkingCoins() {
  ++coins;
    message("coinsArea", `Coins:  ${coins}`);
    if (coins >= 10){
      coins = 0;
      message("coinsArea", `Coins:  ${coins}`);
      lives = lives +2;
      checkingLives();
    }
    return true;
}

let lives = 3;
let ammunition = 3;
let coins = 0;

runGame(GAME_PLANS, DOMDisplay);
