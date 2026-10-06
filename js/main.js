import { stepToxic, toxicDamage, hurtToxic, toxicInteractions } from './toxic.js';
import { toxicSound } from './toxic-audio.js';
import { drawToxicComplete } from './toxic-renderer.js';
import { stepFoundry, foundryDamage, foundryInteractions } from './foundry.js';
import { foundrySound } from './foundry-audio.js';
import { drawFoundryComplete } from './foundry-renderer.js';
import { VH, START_LIVES, STEP, T } from './config.js';
import { loadLevel, COLS, ROWS, levels } from './level.js';
import { initAudio, sfx } from './audio.js';
import { setupInput } from './input.js';
import { spawnPlayer, updatePlayer, die } from './player.js';
import { updateEnemies } from './enemy.js';
import { drawBackground, drawWorld, drawOverlay, drawHUD, drawTransition } from './renderer.js';
import { gameState } from './state.js';
import { clamp } from './utils.js';
import { prepareStart } from './game-flow.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
let startBtn = null;

let VW = 480;
let SCALE = 2;

loadLevel(0);

function reset() {
  prepareStart(gameState, loadLevel, spawnPlayer, START_LIVES);
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
  initAudio();
  reset();
  gameState.state = 'playing';
  hideMenu();
  if (startBtn) startBtn.blur();
}

setupInput({
  getState: () => gameState.state,
  onEnter: (e) => {
    if (gameState.state === 'over' || gameState.state === 'won') {
      startGame();
      e.preventDefault();
    }
  },
  onEscape: (e) => {
    if (gameState.state === 'playing') {
      gameState.state = 'menu';
      showMenu();
    }
  },
  onJump: () => {
    if (gameState.p) gameState.p.jumpBuf = 8;
  }
});

function attachStartHandler() {
  startBtn = document.getElementById('start');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachStartHandler);
else attachStartHandler();

// Levellar orasidagi o'tish: eshik ovozi, iris animatsiyasi, keyingi level yuklanadi
function startTransition(next) {
  if (next >= levels.length) { sfx.win(); loadLevel(next); return; }
  const hasDoor = gameState.girlX > 0;
  gameState.transition = {
    next, t: 0, half: 0.7, total: 1.9, loaded: false,
    cx: hasDoor ? gameState.girlX - gameState.camX + 8 : VW / 2,
    cy: hasDoor ? gameState.girlY + 4 : VH / 2
  };
  gameState.state = 'transition';
  sfx.door();
}

function update() {
  gameState.anim++;
  if (gameState.state === 'transition') {
    const tr = gameState.transition;
    tr.t += STEP / 1000;
    if (!tr.loaded && tr.t >= tr.half) {
      loadLevel(tr.next);
      gameState.p = spawnPlayer();
      gameState.camX = 0;
      tr.loaded = true;
    }
    if (tr.t >= tr.total) {
      gameState.transition = null;
      gameState.state = 'playing';
      sfx.levelStart();
    }
    return;
  }
  if (gameState.state === 'levelComplete') {
    foundrySound.setActive(false);toxicSound.setActive(false);
    const runtime = gameState.currentLevel === 3 ? gameState.toxic : gameState.foundry;
    runtime.completeTimer -= STEP / 1000;
    if (runtime.completeTimer <= 0) {
      startTransition(gameState.currentLevel + 1);
    }
    return;
  }
  if (gameState.state !== 'playing') {foundrySound.setActive(false);toxicSound.setActive(false);return;}

  gameState.levelTime += STEP / 1000;
  gameState.levelTick++;
  if (gameState.currentLevel === 2) stepFoundry(gameState, STEP / 1000, VW);
  if (gameState.currentLevel === 3) stepToxic(gameState, STEP / 1000, VW);

  updatePlayer({ 
    getVH: () => VH,
    nextLevel: () => {
      if (gameState.currentLevel === 2) {
        gameState.state = 'levelComplete';
        gameState.foundry.completeTimer = 1.6;
        return;
      }
      startTransition(gameState.currentLevel + 1);
    }
  });

  if (gameState.state !== 'playing') return;
  updateEnemies({ getVH: () => VH });
  if (gameState.currentLevel === 2) {
    if (foundryDamage(gameState) === 'death') {
      foundrySound.cue('death', gameState.p.x, gameState.p.x);
      die({getVH: () => VH});
    } else if (foundryInteractions(gameState)) {
      sfx.win();gameState.state = 'levelComplete';gameState.foundry.completeTimer = 1.6;
    }
  }
  if (gameState.currentLevel === 3) {
    let damage = toxicDamage(gameState, STEP / 1000);
    if (damage === 'hurt') damage = hurtToxic(gameState);
    if (damage === 'death') {toxicSound.cue('death', gameState.p.x, gameState.p.x);die({getVH: () => VH});}
    else if (toxicInteractions(gameState)) {sfx.win();gameState.state = 'levelComplete';gameState.toxic.completeTimer = 1.6;}
  }
  foundrySound.update(gameState);
  toxicSound.update(gameState);
  
  // Chang zarrachalarini yangilash
  if (gameState.dust) {
    for (let i = gameState.dust.length - 1; i >= 0; i--) {
      const d = gameState.dust[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.97;
      d.vy *= 0.96;
      d.r += d.grow || 0;
      d.life--;
      if (d.life <= 0) gameState.dust.splice(i, 1);
    }
  }
  if (gameState.deathFlash > 0) gameState.deathFlash--;
  if (gameState.currentLevel === 5 && gameState.levelTick % 240 === 0) sfx.steam();

  // Qon zarrachalarini yangilash (Lightweight dynamic blood drops)
  if (gameState.bloodParticles) {
    for (let i = gameState.bloodParticles.length - 1; i >= 0; i--) {
      const bp = gameState.bloodParticles[i];
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.vy += 0.12;
      bp.life--;
      if (bp.life <= 0) gameState.bloodParticles.splice(i, 1);
    }
  }

  const p = gameState.p;
  if (p) {
    const target = clamp(p.x + p.w / 2 - (gameState.currentLevel === 3 ? VW * (p.face > 0 ? .38 : .62) : VW / 2) + p.face * (gameState.currentLevel === 3 ? 0 : gameState.currentLevel === 2 ? 48 : 20), 0, Math.max(0, COLS * T - VW));
    gameState.camX += (target - gameState.camX) * 0.1;
  }
}

function render() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (gameState.currentLevel === 2 && gameState.foundry && gameState.state === 'playing') {
    const shake = Math.min(2.4, gameState.foundry.shake);
    ctx.translate(Math.sin(gameState.anim * 2.7) * shake, Math.cos(gameState.anim * 3.3) * shake * .65);
  }
  if (gameState.currentLevel === 3 && gameState.toxic && gameState.state === 'playing') {
    const shake = Math.min(1.8, gameState.toxic.shake);
    ctx.translate(Math.sin(gameState.anim * 2.7) * shake, Math.cos(gameState.anim * 3.3) * shake * .55);
  }
  drawBackground(ctx, VW, gameState.camX, gameState.anim);
  if (gameState.p) drawWorld(ctx, VW, gameState.camX, gameState.p, gameState.anim, gameState);
  ctx.restore();
  if (gameState.state === 'levelComplete') {
    if (gameState.currentLevel === 3) drawToxicComplete(ctx, VW);
    else drawFoundryComplete(ctx, VW);
  }
  if (gameState.state === 'playing') drawHUD(ctx, VW, gameState);
  drawOverlay(ctx, gameState.state, VW, VH, gameState.coinCount, gameState.coins.length, gameState.anim, gameState);
  if (gameState.state === 'transition') drawTransition(ctx, VW, VH, gameState);
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
