import { VH, START_LIVES, STEP, T } from './config.js';
import { loadLevel, COLS, ROWS } from './level.js';
import { initAudio } from './audio.js';
import { setupInput } from './input.js';
import { spawnPlayer, updatePlayer } from './player.js';
import { updateEnemies } from './enemy.js';
import { drawBackground, drawWorld, drawOverlay } from './renderer.js';
import { gameState } from './state.js';
import { clamp } from './utils.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
let startBtn = null;


let VW = 480;
let SCALE = 2;

loadLevel(0);


function reset() {
  gameState.camX = 0;
  
  if (gameState.state === 'won') {
    loadLevel(0);
  } else if (gameState.lives <= 0) {
    gameState.lives = START_LIVES;
    gameState.coinCount = 0;
    loadLevel(0);
  } else {
    loadLevel(gameState.currentLevel);
  }
  
  gameState.p = spawnPlayer();

}

function hideMenu() {
  menu.style.opacity = '0';
  menu.style.pointerEvents = 'none';
  setTimeout(() => { if (gameState.state !== 'menu') menu.style.display = 'none'; }, 300);
}

function showMenu() {
  menu.style.display = '';
  requestAnimationFrame(() => { menu.style.opacity = '1'; menu.style.pointerEvents = 'auto'; });
}

function startGame() {
  console.log('startGame called — current state:', gameState.state, 'currentLevel:', gameState.currentLevel);
  initAudio();
  reset();
  gameState.state = 'playing';
  hideMenu();
  if (startBtn) startBtn.blur();
}

setupInput({
  getState: () => gameState.state,
  onEnter: (e) => {
    if (gameState.state === 'over' || gameState.state === 'won') { startGame(); e.preventDefault(); }
  },
  onEscape: (e) => {
    if (gameState.state === 'playing') { gameState.state = 'menu'; showMenu(); }
  },
  onJump: () => {
    if (gameState.p) gameState.p.jumpBuf = 8;
  }
});

function attachStartHandler() {
  startBtn = document.getElementById('start');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  } else {
    console.warn('Start button not found when attaching handler');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachStartHandler);
else attachStartHandler();

function update() {
  gameState.anim++;
  if (gameState.state !== 'playing') return;
  updatePlayer({ 
    getVH: () => VH,
    nextLevel: () => {
      sfx.win();
      loadLevel(gameState.currentLevel + 1);
      if (gameState.state !== 'won') {
        gameState.p = spawnPlayer();
        gameState.camX = 0;
      }
    }
  });
  if (gameState.state !== 'playing') return;
  updateEnemies();
  
  for (let i = gameState.trails.length - 1; i >= 0; i--) {
    const t = gameState.trails[i];
    t.x += t.vx;
    t.y += t.vy;
    t.vy -= 0.02;
    t.age++;
    if (t.age >= t.life) gameState.trails.splice(i, 1);
  }
  const p = gameState.p;
  const target = clamp(p.x + p.w / 2 - VW / 2 + p.face * 20, 0, COLS * T - VW);
  gameState.camX += (target - gameState.camX) * 0.1;
}

function render() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  drawBackground(ctx, VW, gameState.camX, gameState.anim);
  if (gameState.p) drawWorld(ctx, VW, gameState.camX, gameState.p, gameState.anim, gameState);
  drawOverlay(ctx, gameState.state, VW, VH, gameState.coinCount, gameState.coins.length, gameState.anim);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  canvas.width = w;
  canvas.height = h;
  SCALE = h / VH;
  VW = w / SCALE;
}

window.addEventListener('resize', resize);
resize();
reset();

let last = 0, acc = 0;
function frame(ts) {
  acc += Math.min(ts - last, 100);
  last = ts;
  while (acc >= STEP) { update(); acc -= STEP; }
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(t => { last = t; frame(t); });
