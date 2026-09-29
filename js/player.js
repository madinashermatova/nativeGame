import { ACC, FRICTION, MAXV, JUMP, GRAV, MAXFALL, T } from './config.js';
import { keys } from './input.js';
import { sfx } from './audio.js';
import { moveX, moveY } from './physics.js';
import { clamp, overlap } from './utils.js';
import { gameState } from './state.js';

export function spawnPlayer() {
  return { 
    x: gameState.spawnX, 
    y: gameState.spawnY, 
    w: 10, 
    h: 14,
    vx: 0, 
    vy: 0, 
    onGround: false, 
    face: 1, 
    coyote: 0, 
    jumpBuf: 0, 
    inv: 0 
  };
}

export function die(callbacks) {
  sfx.die();
  gameState.lives--;

  if (gameState.lives <= 0) { gameState.state = 'over'; return; }
  gameState.p = spawnPlayer();
  gameState.p.inv = 120;
}

export function updatePlayer(callbacks) {
  const p = gameState.p;
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (dir) { p.vx += dir * ACC; p.face = dir; }
  else { p.vx *= FRICTION; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
  p.vx = clamp(p.vx, -MAXV, MAXV);

  p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
  if (p.jumpBuf > 0) p.jumpBuf--;
  if (p.jumpBuf > 0 && p.coyote > 0) { p.vy = -JUMP; p.jumpBuf = 0; p.coyote = 0; sfx.jump(); }
  if (!keys.jump && p.vy < -2.4) p.vy = -2.4;

  p.vy = Math.min(p.vy + GRAV, MAXFALL);
  moveX(p);
  moveY(p);
  if (p.inv > 0) p.inv--;

  // Emit trail afterimages when running on ground
  if (!p.trailTimer) p.trailTimer = 0;
  if (Math.abs(p.vx) > 0.4 && p.onGround) {
    if (p.trailTimer <= 0) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h - 4;
      const dirBias = -Math.sign(p.vx || p.face) * (0.2 + Math.random() * 0.4);
      gameState.trails.push({
        x: cx,
        y: cy,
        vx: dirBias + (Math.random() - 0.5) * 0.2,
        vy: -0.4 - Math.random() * 0.6,
        r: 2 + Math.random() * 3,
        age: 0,
        life: 30
      });
      p.trailTimer = 4; // frames between trail particles
    }
  }
  if (p.trailTimer > 0) p.trailTimer--;



  if (p.y > callbacks.getVH() + 30) { die(callbacks); return; }

  for (const c of gameState.coins) {
    if (c.got) continue;
    if (overlap(p, { x: c.tx * T + 4, y: c.ty * T + 4, w: 8, h: 8 })) {
      c.got = true; gameState.coinCount++; sfx.coin();
    }
  }

  for (const e of gameState.enemies) {
    if (!e.alive || e.dead || !overlap(p, e)) continue;
    if (p.vy > 0 && p.y + p.h - e.y < 10) { e.dead = 20; p.vy = -4.2; sfx.stomp(); }
    else if (p.inv === 0) { die(callbacks); return; }
  }

  if (p.x + p.w >= gameState.girlX && Math.abs(p.y - gameState.girlY) < 32) {
    if (callbacks.nextLevel) callbacks.nextLevel();
  }
}
