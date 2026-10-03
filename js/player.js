import {ACC, FRICTION, MAXV, JUMP, GRAV, MAXFALL, VH} from './config.js';
import {keys} from './input.js';
import {sfx} from './audio.js';
import {moveX, moveY, checkWallContact} from './physics.js';
import {clamp} from './utils.js';
import {gameState} from './state.js';
import {addDust} from './blood.js';
import {activeLevel} from './levels/index.js';

const BLOOD_PALETTE = ['#5e000c', '#8a0013', '#b80018', '#cc001f', '#e61937', '#ff2e4d'];

export function spawnPlayer() {
  return {
    x: gameState.spawnX,
    y: gameState.spawnY,
    w: 12,
    h: 14,
    vx: 0,
    vy: 0,
    onGround: false,
    touchWall: false,
    face: 1,
    coyote: 0,
    jumpBuf: 0,
    airJumps: 1,
    inv: 0,
    gravDir: gameState.spawnGrav ?? 1 // -1 = pulled towards the ceiling (Level 8)
  };
}

export function emitBlood(x, y, count = 1, vxSpread = 0.5, vySpread = 0.5, opts = {}) {
  if (!gameState.bloodParticles) gameState.bloodParticles = [];
  if (gameState.bloodParticles.length > 380) {
    gameState.bloodParticles.splice(0, count);
  }

  for (let i = 0; i < count; i++) {
    const angle = opts.ring ? (i / count) * Math.PI * 2 : 0;
    const speed = opts.ring ? 0.8 + Math.random() * 0.8 : 1;
    const vx = opts.vx !== undefined ? opts.vx + (Math.random() - 0.5) * vxSpread
      : opts.ring ? Math.cos(angle) * vxSpread * speed
      : (Math.random() - 0.5) * vxSpread * 2;
    const vy = opts.ring ? Math.sin(angle) * vySpread * speed
      : (Math.random() - 0.5) * vySpread * 2 - Math.random() * 0.4;

    const size = opts.size || (Math.random() < 0.65 ? 2 : Math.random() < 0.5 ? 3 : 1);
    const life = opts.life || (24 + Math.floor(Math.random() * 20));
    const color = opts.color || BLOOD_PALETTE[Math.floor(Math.random() * BLOOD_PALETTE.length)];

    const drop = {
      kind: 'drop',
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      vx,
      vy,
      r: size,
      life: life + 60, // drops live until they land; puddles and drips fade later
      maxLife: life + 60,
      color
    };
    gameState.bloodParticles.push(drop);
  }
}

export function die() {
  sfx.die();
  if (gameState.p) {
    emitBlood(gameState.p.x + gameState.p.w / 2, gameState.p.y + gameState.p.h / 2, 28, 2.6, 2.6);
  }
  gameState.deaths++;
  gameState.lives--;

  if (gameState.lives <= 0) {
    gameState.state = 'over';
    return;
  }
  const level = activeLevel(gameState);
  if (level?.onDeath) level.onDeath(gameState);
  gameState.p = spawnPlayer();
  gameState.p.inv = 60;
}

export function updatePlayer() {
  const p = gameState.p;
  if (!p) return;

  const level = activeLevel(gameState);
  const g = p.gravDir ?? 1;
  const wasGround = p.onGround, color = level?.dust || '#d8ccb4';
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (dir) {
    p.vx += dir * ACC;
    p.face = dir;
  } else {
    p.vx *= FRICTION;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
  }
  p.vx = clamp(p.vx, -MAXV, MAXV);

  // Check wall contact for wall jump
  const wall = checkWallContact(p);
  const touchingWall = (wall.left || wall.right) && !p.onGround;
  p.touchWall = touchingWall;

  if (p.onGround || touchingWall) {
    p.coyote = 6;
    p.airJumps = 1; // Yerdan yoki devordan so'ng faqat 1 marta havo sakrashi mumkin (jami 2 marta)
  } else if (p.coyote > 0) {
    p.coyote--;
  }

  if (p.jumpBuf > 0) p.jumpBuf--;

  // Sakrash: bir urinishda ko'pi bilan 2 marta (yer/devor + 1 marta havoda)
  if (p.jumpBuf > 0) {
    if (p.coyote > 0) {
      // 1-sakrash (yer yoki devor)
      p.vy = -JUMP * g;
      p.jumpBuf = 0;
      p.coyote = 0;
      sfx.jump();
      addDust(gameState.bloodParticles, p.x + p.w / 2, g === 1 ? p.y + p.h : p.y, {count: 4, vy: -g * .2, spread: .8, r: 2, grow: 5, life: 30, a: .45, color});
    } else if (p.airJumps > 0 && (level?.airJump ?? true)) {
      // 2-sakrash (havoda - Double Jump)
      p.vy = -JUMP * 0.95 * g;
      p.jumpBuf = 0;
      p.airJumps--; // Boshqa havoda sakrab bo'lmaydi
      sfx.jump();
      for (let i = 0; i < 8; i++) { // a ring of dust pushed out by the second jump
        const a = (i / 8) * Math.PI * 2;
        addDust(gameState.bloodParticles, p.x + p.w / 2, p.y + p.h / 2, {vx: Math.cos(a) * 1.2, vy: Math.sin(a) * .9, spread: .1, r: 1.8, grow: 4, life: 26, a: .4, color});
      }
    }
  }
  // Launch pads set p.launched so releasing the jump key does not cut their boost short.
  if (p.vy * g >= 0) p.launched = false;
  if (!keys.jump && p.vy * g < -2.4 && !p.launched) p.vy = -2.4 * g;

  if (touchingWall && p.vy * g > 0) {
    p.vy = g * Math.min(p.vy * g + GRAV * 0.65, 2.8);
    if (Math.random() < 0.3) {
      addDust(gameState.bloodParticles, wall.left ? p.x : p.x + p.w, p.y + p.h * .6, {vx: wall.left ? .25 : -.25, vy: -.12, spread: .1, r: 1.6, grow: 3, life: 26, a: .36, color});
    }
  } else {
    p.vy = g * Math.min(p.vy * g + GRAV, MAXFALL);
  }

  moveX(p);
  const previousBottom = p.y + p.h;
  const fallSpeed = p.vy * g;
  moveY(p);
  if (level?.ground) level.ground(gameState, p, previousBottom);

  if (p.inv > 0) p.inv--;

  // Dust and smoke follow the hero: puffs from the feet while running, a skid cloud when turning round,
  // a burst on landing and thin smoke trailing behind a fast fall. Dust rises away from the surface it
  // is standing on, so it also works on the ceiling.
  {
    const list = gameState.bloodParticles, feetY = g === 1 ? p.y + p.h : p.y, cxm = p.x + p.w / 2;
    if (!wasGround && p.onGround && fallSpeed > 2.2) {
      const power = Math.min(1, fallSpeed / 6);
      addDust(list, cxm, feetY, {count: 5 + Math.round(power * 6), vy: -g * .25, spread: .9 + power, r: 2.2, grow: 6, life: 36, a: .5, color});
    }
    if (p.onGround && Math.abs(p.vx) > 0.9) {
      if (gameState.anim % 4 === 0) addDust(list, cxm - p.face * 5, feetY - g, {vx: -p.face * .35, vy: -g * .12, spread: .12, r: 1.8, grow: 4, life: 30, a: .42, color});
      if (dir && Math.sign(dir) !== Math.sign(p.vx) && Math.abs(p.vx) > 1.3) {
        addDust(list, cxm, feetY - g, {count: 2, vx: p.vx * .45, vy: -g * .2, spread: .35, r: 2.2, grow: 5, life: 32, a: .5, color});
      }
    }
    if (!p.onGround && Math.abs(p.vy) > 2.5 && gameState.anim % 5 === 0) {
      addDust(list, cxm, p.y + p.h / 2, {vx: -p.vx * .2, vy: -p.vy * .1, spread: .1, r: 1.4, grow: 5, life: 34, a: .28, color});
    }
  }

  const worldH = level?.worldHeight || VH;
  if (p.y > worldH + 30 || p.y < -60) {
    die();
  }
}
