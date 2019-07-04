const MIN_BALL_SIZE = 5;
const MAX_BALL_SIZE = 15;
const MIN_BALL_SPEED = 1;
const MAX_BALL_SPEED = 2;
const N_BALL = 50;
const WIDTH = window.innerWidth - 5;
const HEIGHT = window.innerHeight - 5;

function getRandom(min, max){
  return Math.random() * (max - min) + min;
}

function getRandomColor(){
  let r = getRandom(0, 255);
  let g = getRandom(0, 255);
  let b = getRandom(0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

class Vector{

  constructor(x, y) {
    this.x = x || 0; 
    this.y = y || 0;
  }

  mul (k) {
    this.x *= k;
    this.y *= k;

    return this;
  }

  reflect (n) {
    n = Vector.normalize(n);
    return Vector.sub(this, n.mul(2 * Vector.dot(this, n)));
  }

  length () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalized () {
    return Vector.normalize(this);
  }

  rotate (angle) {
    this.x = this.x * Math.cos(angle) + this.y * Math.sin(angle);
    this.y = -this.x * Math.sin(angle) + this.y * Math.cos(angle);

    return this;
  }

  static random (xRange, yRange) {
    return new Vector(getRandom(xRange.x, xRange.y), getRandom(yRange.x, yRange.y)); 
  }

  static distance (a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  static mul (a, k) {
    return new Vector(a.x *k, a.y * k);
  }

  static add (a, b){
    return new Vector(a.x + b.x, a.y + b.y);
  }

  static sub (a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
  }

  static dot (a, b) {
    return a.x * b.x + a.y * a.y;
  }

  static normalize (a) {
    let len = a.length();
    return new Vector(a.x / len, a.y / len);
  }

  static rotate (a, angle){
    let x = a.x * Math.cos(angle) + a.y * Math.sin(angle);
    let y = -a.x * Math.sin(angle) + a.y * Math.cos(angle);

    return new Vector(x, y);
  }

}

class Ball{

  constructor(pos, vel, size, mass) {
    this.pos = pos;
    this.vel = vel;
    this.size = size;
    this.mass = size;
    this.color = getRandomColor();
  }

  draw (ctx) {
    ctx.save();

    ctx.beginPath();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.arc(0, 0, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    
    ctx.restore();
  }

  update () {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  contains (point) {
    return Vector.distance(point, this.pos) <= this.size;
  }
}

class Simulation{

  constructor(el, nBalls, width, height, fps) {
    if(!el){
      throw new Error("el is required.");
    }
    this.el = el;
    this.width = width || 800;
    this.height = height || 600;
    this.fps = fps || 60;
    this.numBalls = nBalls || 2;

    this.init();
  }

  init () {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.el.appendChild(this.canvas);

    this.canvas.addEventListener("click", (e) => {
      this.mouseClick(e);
    });

    this.context = this.canvas.getContext('2d');

    this.genBalls();
  }

  getRandomPos () {
    return Vector.random(new Vector(MAX_BALL_SIZE, this.width - MAX_BALL_SIZE), new Vector(MAX_BALL_SIZE, this.height - MAX_BALL_SIZE))
  }

  getRandomSpeed () {
    return getRandom(MIN_BALL_SPEED, MAX_BALL_SPEED);
  }
  
  getRandomDir () {
    return Vector.random(new Vector(-1, 1), new Vector(-1, 1)).normalized();
  }

  genBalls () {
    this.balls = [];

    for (let i = 0; i < this.numBalls; i++) {
      let ball = new Ball(
        this.getRandomPos(),
        this.getRandomDir().mul(this.getRandomSpeed()),
        getRandom(MIN_BALL_SIZE, MAX_BALL_SIZE));

      do{
        ball.pos = this.getRandomPos();
      }while(this.willColliding(ball)); 

      this.balls.push(ball);  
    } 
  }

  willColliding (ball) {
    for (let j = 0; j < this.balls.length; j++) {
      if(Vector.distance(ball.pos, this.balls[j].pos) < ball.size + this.balls[j].size){
        return true;
      }
    }
    return false;
  }

  collideWithBoundary (ballA) {
    if(Math.ceil(ballA.pos.x - ballA.size) < 0){
      ballA.vel.x *= -1;
      ballA.pos.x = ballA.size;
    }else if(Math.ceil(ballA.pos.x + ballA.size) > this.width){
      ballA.vel.x *= -1;
      ballA.pos.x = this.width - ballA.size;
    }
    if(Math.ceil(ballA.pos.y - ballA.size) < 0){
      ballA.vel.y *= -1;
      ballA.pos.y = ballA.size;
    }else if(Math.ceil(ballA.pos.y + ballA.size) > this.height){
      ballA.vel.y *= -1;
      ballA.pos.y = this.height - ballA.size;
    }
  }

  collideWithBalls (ballA) {
    for (let j = 0; j < this.balls.length; j++) {
      const ballB = this.balls[j];
      if(ballA === ballB){
        continue;
      }

      if(Vector.distance(ballA.pos, ballB.pos) - (ballA.size + ballB.size) < 0) {
        this.resolve(ballA, ballB);
      }
    }
  }

  resolve (ballA, ballB) {
    const velDiff = Vector.sub(ballA.vel, ballB.vel);
    const posDiff = Vector.sub(ballB.pos, ballA.pos);
    
    if(velDiff.x * posDiff.x + velDiff.y * posDiff.y >= 0){
      const angle = -Math.atan2(ballB.pos.y - ballA.pos.y, ballB.pos.x - ballA.pos.x);
      
      const ma = ballA.mass;
      const mb = ballB.mass;

      const u1 = Vector.rotate(ballA.vel, angle);
      const u2 = Vector.rotate(ballB.vel, angle);

      const totalMass = ma + mb;
      const massDiff = ma - mb;

      const v1 = new Vector(u1.x * massDiff / totalMass + u2.x * 2 * mb / totalMass, u1.y).rotate(-angle);
      const v2 = new Vector(u2.x * (-massDiff) / totalMass + u1.x * 2 * mb / totalMass, u2.y).rotate(-angle);

      ballA.vel.x = v1.x;
      ballA.vel.y = v1.y;

      ballB.vel.x = v2.x;
      ballB.vel.y = v2.y;
    }
  }

  mouseClick (e){
    let x = e.x - this.canvas.offsetLeft;
    let y = e.y - this.canvas.offsetTop;
    let point = new Vector(x, y);
    this.balls.forEach((ball, index) => {
      if(ball.contains(point)){
        this.balls.splice(index, 1);
      }
    });
  }

  clear () {
    this.context.beginPath();
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.closePath();
  }

  render () {
    this.balls.forEach(ball => {
      ball.draw(this.context);
    });
  }

  update () {
    for (let i = 0; i < this.balls.length; i++) {
      const ballA = this.balls[i];
      ballA.update();

      this.collideWithBoundary(ballA);
      this.collideWithBalls(ballA);
      
    }
  }

  run () {
    this.clear();
    this.update();
    this.render();
  }

  start() {
    this.animator = setInterval(() => { this.run(); }, 1000 / this.fps);
  }

}

var container = document.getElementById("simulation-cont");

if(container){
  var simulation = new Simulation(container, N_BALL, WIDTH, HEIGHT);
  simulation.start();
}