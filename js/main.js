const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = new Set();
const pressedQueue = new Set();

const jumpCodes = new Set(["Space", "KeyW", "ArrowUp"]);
const watchedCodes = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Space",
  "KeyA",
  "KeyD",
  "KeyW",
]);

addEventListener("keydown", (e) => {
  if (watchedCodes.has(e.code)) e.preventDefault();
  if (!e.repeat && !keys.has(e.code)) pressedQueue.add(e.code);
  keys.add(e.code);
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => {
  keys.clear();
  pressedQueue.clear();
});

function pollActions() {
  const left = keys.has("KeyA") || keys.has("ArrowLeft");
  const right = keys.has("KeyD") || keys.has("ArrowRight");
  const jumpPressed = [...jumpCodes].some((code) => pressedQueue.has(code));
  pressedQueue.clear(); // shu tickda ishlatildi — endi tozalaymiz
  return {
    moveX: Number(right) - Number(left),
    jumpHeld: [...jumpCodes].some((code) => keys.has(code)),
    jumpPressed,
  };
}

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const MAX_STEPS = 5;
let previous = null;
let accumulator = 0;

const tune = {
  maxRun: 300,
  groundAccel: 2400,
  groundFriction: 2000,
  airAccel: 1300,
  airFriction: 400,
  gravity: 1900,
  maxFall: 800,
  jumpSpeed: 600,
};

function approach(value, target, maxChange) {
  return value < target
    ? Math.min(value + maxChange, target)
    : Math.max(value - maxChange, target);
}

const playerImage = new Image();
playerImage.src = "./assets/images/player.png";
let playerImageReady = false;
playerImage.onload = () => {
  playerImageReady = true;
};

const player = {
  x: 100,
  y: 100,
  w: 26,
  h: 30,
  vx: 0,
  vy: 0,
  grounded: false,
};

function update(dt, actions) {
  const p = player;

  //gorizontal harakat
  const hasInput = Math.abs(actions.moveX) > 0.01;
  const rate = hasInput
    ? p.grounded
      ? tune.groundAccel
      : tune.airAccel
    : p.grounded
      ? tune.groundFriction
      : tune.airFriction;
  p.vx = approach(p.vx, hasInput ? actions.moveX * tune.maxRun : 0, rate * dt);

  //sakrash 
  if (actions.jumpPressed && p.grounded) {
    p.vy = -tune.jumpSpeed;
    p.grounded = false;
  }

  //gravity
  p.vy += tune.gravity * dt;
  p.vy = Math.min(p.vy, tune.maxFall);

  //pozitsiyani yangilash
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  //VAQTINCHALIK
  const floorY = canvas.height - p.h;
  if (p.y >= floorY) {
    p.y = floorY;
    p.vy = 0;
    p.grounded = true;
  } else {
    p.grounded = false;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (playerImageReady) {
    ctx.save();
    if (player.vx < 0) {
      // chapga yursa aylantirish
      ctx.translate(player.x + player.w, player.y);
      ctx.scale(-1, 1);
      ctx.drawImage(playerImage, 0, 0, player.w, player.h);
    } else {
      ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = "#ff5d73";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

function frame(timestampMs) {
  if (previous === null) previous = timestampMs;
  const frameSeconds = Math.min((timestampMs - previous) / 1000, MAX_FRAME);
  previous = timestampMs;

  const actions = pollActions();

  accumulator += frameSeconds;
  let steps = 0;
  while (accumulator >= STEP && steps < MAX_STEPS) {
    update(STEP, actions);
    accumulator -= STEP;
    steps++;
  }
  if (steps === MAX_STEPS) accumulator = 0;

  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
