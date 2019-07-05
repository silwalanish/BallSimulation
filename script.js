const MIN_BALL_SIZE = 5;      // Min ball size
const MAX_BALL_SIZE = 15;     // Max ball size
const MIN_BALL_SPEED = 1;     // Min ball speed
const MAX_BALL_SPEED = 2;     // Max ball speed
const N_BALL = 50;           // Number of balls
const WIDTH = window.innerWidth - 1;    // Width of the screen
const HEIGHT = window.innerHeight - 4;  // Height of the screen

/**
 * Generates a random number in the range[min, max)
 * 
 * @param {Number} min - minimum value
 * @param {Number} max - maximum value
 */
function getRandom(min, max){
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random rgb color
 */
function getRandomColor(){
  let r = getRandom(0, 255);
  let g = getRandom(0, 255);
  let b = getRandom(0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

class Vector{

  /**
   * A 2D Vector class
   * 
   * @param {Number} x - x component
   * @param {Number} y - y component
   */
  constructor(x, y) {
    this.x = x || 0; 
    this.y = y || 0;
  }

  /**
   * Multiply the vector inplace with scalar k
   * 
   * @param {Number} k - scalar multiplier
   */
  mul (k) {
    this.x *= k;
    this.y *= k;

    return this;
  }

  /**
   * Returns the length of the vector
   */
  length () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalizes the vector inplace
   */
  normalized () {
    return Vector.normalize(this);
  }

  /**
   * Rotates the vector inpalce
   * 
   * @param {Number} angle - angle in radians
   */
  rotate (angle) {
    this.x = this.x * Math.cos(angle) + this.y * Math.sin(angle);
    this.y = -this.x * Math.sin(angle) + this.y * Math.cos(angle);

    return this;
  }

  /**
   * Generates a random vector
   * 
   * @param {Vector} xRange - range of x-component
   * @param {Vector} yRange - range of y-component
   */
  static random (xRange, yRange) {
    return new Vector(getRandom(xRange.x, xRange.y), getRandom(yRange.x, yRange.y)); 
  }

  /**
   * Returns the distance between two vectors
   * 
   * @param {Vector} a - a vector
   * @param {Vector} b - another vector
   */
  static distance (a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  /**
   * Multiply the vector with scalar k
   * 
   * @param {Vector} a - a vector
   * @param {Number} k - scalar multiplier
   */
  static mul (a, k) {
    return new Vector(a.x *k, a.y * k);
  }

  /**
   * Adds two vector
   * 
   * @param {Vector} a - a vector
   * @param {Vector} b - another vector
   */
  static add (a, b){
    return new Vector(a.x + b.x, a.y + b.y);
  }

  /**
   * Subtracts two vector
   * 
   * @param {Vector} a - a vector
   * @param {Vector} b - another vector
   */
  static sub (a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
  }

  /**
   * Returns the dot product of a and b
   * 
   * @param {Vector} a - a vector
   * @param {Vector} b - another vector
   */
  static dot (a, b) {
    return a.x * b.x + a.y * a.y;
  }

  /**
   * Returns the normal vector of a
   * 
   * @param {Vector} a - a vector
   */
  static normalize (a) {
    let len = a.length();
    return new Vector(a.x / len, a.y / len);
  }

  /**
   * Rotates the vector a by angle and returns the result
   * 
   * @param {Vector} a - a vector
   * @param {Number} angle - angle
   */
  static rotate (a, angle){
    let x = a.x * Math.cos(angle) + a.y * Math.sin(angle);
    let y = -a.x * Math.sin(angle) + a.y * Math.cos(angle);

    return new Vector(x, y);
  }

}

class Ball{

  /**
   * Creates a ball object
   * 
   * @param {Vector} pos - position
   * @param {Vector} vel - velocity
   * @param {Number} size - radius
   * @param {Number} mass - mass
   */
  constructor(pos, vel, size, mass) {
    this.pos = pos;
    this.vel = vel;
    this.size = size;
    this.mass = size;
    this.color = getRandomColor();
  }

  /**
   * Draws a ball
   * 
   * @param {CanvasRenderingContext2D} ctx - context of a canvas
   */
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

  /**
   * Updates the ball's position
   */
  update () {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }


  /**
   * Checks if a point is inside the ball
   * 
   * @param {Vector} point - a 2D point
   */
  contains (point) {
    return Vector.distance(point, this.pos) <= this.size;
  }
}

class Simulation{

  /**
   * Creates a simulation
   * 
   * @param {HTMLElement} el - a container element
   * @param {Number} nBalls - number of balls
   * @param {Number} width - width of canvas
   * @param {Number} height - height of canvas
   * @param {Number} fps - frames per second
   */
  constructor(el, nBalls, width, height, fps) {
    if(!el){
      throw new Error("el is required.");
    }
    this.el = el;
    this.width = width || 800;
    this.height = height || 600;
    this.fps = fps || 60;
    this.numBalls = nBalls || 2;
    this.isPlaying = false;

    this.init();
  }

  /**
   * Initilizes the simulation
   */
  init () {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.el.appendChild(this.canvas);

    this.canvas.addEventListener("click", (e) => {
      this.mouseClick(e);
    });

    window.addEventListener("keydown", (e) => {
      this.keyPress(e);
    });

    this.context = this.canvas.getContext('2d');

    this.genBalls();
  }

  /**
   * Generates random position
   */
  getRandomPos () {
    return Vector.random(new Vector(MAX_BALL_SIZE, this.width - MAX_BALL_SIZE), new Vector(MAX_BALL_SIZE, this.height - MAX_BALL_SIZE))
  }

  /**
   * Generates random speed
   */
  getRandomSpeed () {
    return getRandom(MIN_BALL_SPEED, MAX_BALL_SPEED);
  }
  
  /**
   * Generates random direction
   */
  getRandomDir () {
    return Vector.random(new Vector(-1, 1), new Vector(-1, 1)).normalized();
  }

  /**
   * Generates balls
   */
  genBalls () {
    this.balls = [];

    for (let i = 0; i < this.numBalls; i++) {
      let ball = new Ball(
        this.getRandomPos(),
        this.getRandomDir(),
        getRandom(MIN_BALL_SIZE, MAX_BALL_SIZE));

      do{
        ball.pos = this.getRandomPos();
      }while(this.willColliding(ball)); 

      this.balls.push(ball);  
    } 
  }

  /**
   * Checks if the newly created ball will collide with exsisting balls
   * @param {Ball} ball - a ball
   */
  willColliding (ball) {
    for (let j = 0; j < this.balls.length; j++) {
      if(ball === this.balls[j]){
        continue;
      }
      if(Vector.distance(ball.pos, this.balls[j].pos) <= ball.size + this.balls[j].size){
        return true;
      }
    }
    return false;
  }

  /**
   * Collides a ball with the boundary
   * 
   * @param {Ball} ballA - a ball
   */
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

  /**
   * Collides the ball with other balls
   * 
   * @param {Ball} ballA - a ball
   */
  collideWithBalls (ballA) {
    for (let j = 0; j < this.balls.length; j++) {
      const ballB = this.balls[j];
      if(ballA === ballB){
        continue;
      }

      if(Vector.distance(Vector.add(ballA.pos, ballA.vel), Vector.add(ballB.pos, ballB.vel)) - (ballA.size + ballB.size) <= 0) {
        this.resolve(ballA, ballB);
      }
    }
  }

  /**
   * Resolves the collision between two balls using elastic collision
   * 
   * @param {Ball} ballA - a ball
   * @param {Ball} ballB - another ball
   */
  resolveElastic (ballA, ballB) {
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

      ballA.vel = v1;
      ballB.vel = v2;
    }
  }

  /**
   * Resolves the collision between two balls
   * 
   * @param {Ball} ballA - a ball
   * @param {Ball} ballB - another ball
   */
  resolve(ballA, ballB){
    let temp = ballA.vel;
    ballA.vel = ballB.vel;
    ballB.vel = temp;
  }

  /**
   * Listens for mouse event and removes a ball if it is clicked
   * 
   * @param {MouseEvent} e - a event
   */
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

  /**
   * Listens for key event and plays and pauses the simulation
   * 
   * @param {KeyBoardEvent} e - a event
   */
  keyPress (e) {
    if(e.keyCode == 80){
      if(this.isPlaying){
        this.pause();
      }else{
        this.play();
      }
    }
  }

  /**
   * Clears the canvas
   */
  clear () {
    this.context.beginPath();
    this.context.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.closePath();
  }

  /**
   * Renders the balls
   */
  render () {
    this.balls.forEach(ball => {
      ball.draw(this.context);
    });
  }

  /**
   * Update the simulation
   */
  update () {
    for (let i = 0; i < this.balls.length; i++) {
      const ballA = this.balls[i];
      ballA.update();

      this.collideWithBoundary(ballA);
      this.collideWithBalls(ballA);
      
    }
  }

  /**
   * Run the simulation
   */
  run () {
    if(this.isPlaying){
      this.clear();
      this.update();
      this.render();
    }
    requestAnimationFrame(() => {
      this.run();
    });
  }

  /**
   * Start the simulation
   */
  start () {
    //this.animator = setInterval(() => { this.run(); }, 1000 / this.fps);
    this.isPlaying = true;
    this.run();
  }

  /**
   * Play the simulation
   */
  play () {
    this.isPlaying = true;
  }

  /**
   * Pause the simulation
   */
  pause () {
    //clearInterval(this.animator);
    this.isPlaying = false;
  }

}


var container = document.getElementById("simulation-cont"); // Get a container

if(container){    // If container is found
  var simulation = new Simulation(container, N_BALL, WIDTH, HEIGHT);  // Create a simulation
  simulation.start(); // Play the simulation
}