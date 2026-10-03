import {VH, STEP} from './config.js';
import {gameState as gs} from './state.js';
import {loadLevel} from './level.js';
import {LEVELS, SOUNDS, activeLevel} from './levels/index.js';
import {initAudio, sfx} from './audio.js';
import {setupInput} from './input.js';
import {spawnPlayer, updatePlayer, die} from './player.js';
import {updateBlood} from './blood.js';
import {drawHUD, drawOverlay} from './renderer.js';
import {startEnding, tickEnding, drawEnding} from './ending.js';
import './menu-art.js';
import {beginLevelTransition, stepLevelTransition, drawLevelTransition} from './transition.js';

const DT = STEP / 1000;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('start');

gs.levelNames = LEVELS.map(level => level.name);
let VW = 480;
let SCALE = 2;

function reset() {
  gs.transition = null;
  if (gs.state === 'won') { // a finished game starts over from level 1
    gs.deaths = 0;
    gs.coinCount = 0;
    loadLevel(0);
  } else {
    loadLevel(gs.currentLevel); // also after "game over": same level, full lives
  }
  gs.p = spawnPlayer();
}

function hideMenu() {
  menu.style.opacity = '0';
  menu.style.pointerEvents = 'none';
  setTimeout(() => { if (gs.state !== 'menu') menu.style.display = 'none'; }, 300);
}

function showMenu() {
  menu.style.display = '';
  requestAnimationFrame(() => { menu.style.opacity = '1'; menu.style.pointerEvents = 'auto'; });
}

function startGame() {
  initAudio();
  reset();
  gs.state = 'playing';
  hideMenu();
  startBtn.blur();
}

setupInput({
  getState: () => gs.state,
  onEnter: e => {
    if (gs.state !== 'over' && gs.state !== 'won') return;
    startGame();
    e.preventDefault();
  },
  onEscape: () => {
    if (gs.state !== 'playing') return;
    gs.state = 'menu';
    showMenu();
  },
  onJump: () => { if (gs.p) gs.p.jumpBuf = 8; }
});
startBtn.addEventListener('click', startGame);

function updateSound(level) {
  const playing = gs.state === 'playing';
  for (const sound of SOUNDS) if (!playing || sound !== level.sound) sound.setActive(false);
  if (playing && level.sound) level.sound.update(gs);
}

function update() {
  gs.anim++;
  if (gs.state === 'levelComplete' || gs.state === 'levelOpening') {
    updateSound(activeLevel(gs));
    if (stepLevelTransition(gs, DT) === 'load') {
      loadLevel(gs.currentLevel + 1);
      if (gs.state === 'won') { gs.transition = null; startEnding(gs); return; }
      gs.p = spawnPlayer();
      gs.p.inv = 20;
      activeLevel(gs).camera(gs, VW);
      gs.state = 'levelOpening';
    }
    return;
  }
  const level = activeLevel(gs);
  if (gs.state === 'won') tickEnding(gs);
  if (gs.state !== 'playing') { updateSound(level); return; }

  gs.levelTick++;
  level.step(gs, DT, VW);
  updatePlayer();
  if (gs.state !== 'playing') return;
  if (level.damage(gs, DT) === 'death') die();
  else if (level.interact(gs) && beginLevelTransition(gs, gs.currentLevel === LEVELS.length - 1)) sfx.win();
  updateSound(level);
  updateBlood(gs.bloodParticles);
  level.camera(gs, VW);
}

function render() {
  const level = activeLevel(gs);
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (gs.state === 'playing' && gs[level.key]) {
    const [shake, vertical] = level.shake(gs);
    if (shake) ctx.translate(Math.sin(gs.anim * 2.7) * shake, Math.cos(gs.anim * 3.3) * shake * vertical);
  }
  level.drawBackground(ctx, VW, gs);
  if (gs.p) level.drawWorld(ctx, VW, gs);
  ctx.restore();
  drawLevelTransition(ctx, VW, gs);
  if (gs.state === 'playing') drawHUD(ctx, VW, gs, LEVELS.length);
  if (gs.state === 'won') drawEnding(ctx, VW, VH, gs);
  else drawOverlay(ctx, VW, VH, gs);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  SCALE = canvas.height / VH;
  VW = canvas.width / SCALE;
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
