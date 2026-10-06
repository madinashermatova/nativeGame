import { resolveToxicGround, resetToxic } from './toxic.js';
import { resolveFoundryGround, resetFoundryBodies } from './foundry.js';
import { ACC, FRICTION, MAXV, JUMP, GRAV, MAXFALL, T, MAX_JUMPS } from './config.js';
import { keys } from './input.js';
import { sfx } from './audio.js';
import { moveX, moveY, checkWallContact } from './physics.js';
import { clamp, overlap } from './utils.js';
import { gameState } from './state.js';

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
    jumps: 0,
    jumpBuf: 0,
    inv: 0 
  };
}

// Yugurganda orqadan chiqadigan tutun: kichik, asta kengayadigan va so'nadigan bulutcha
export function emitDust(p) {
  if (gameState.dust.length > 120) return;
  const life = 34 + Math.floor(Math.random() * 14);
  gameState.dust.push({
    x: p.face > 0 ? p.x + 2 : p.x + p.w - 2,
    y: p.y + p.h - 3 + Math.random() * 2,
    vx: -p.face * (0.12 + Math.random() * 0.18),
    vy: -(0.08 + Math.random() * 0.12),
    r: 1.5 + Math.random(),
    grow: 0.07 + Math.random() * 0.04,
    life,
    maxLife: life,
    color: Math.random() < 0.5 ? '#d9d9e0' : '#b4b4c0'
  });
}

export function emitBlood(x, y, count = 1, vxSpread = 0.5, vySpread = 0.5) {
  for (let i = 0; i < count; i++) {
    gameState.bloodParticles.push({
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      vx: (Math.random() - 0.5) * vxSpread,
      vy: (Math.random() - 0.5) * vySpread - (Math.random() * 0.4),
      r: Math.random() < 0.6 ? 2 : 1,
      life: 18 + Math.floor(Math.random() * 12),
      maxLife: 30,
      color: Math.random() < 0.5 ? '#b80018' : '#e61937'
    });
  }
}

export function die(callbacks) {
  sfx.die();
  if (gameState.p) {
    emitBlood(gameState.p.x + gameState.p.w / 2, gameState.p.y + gameState.p.h / 2, 26, 3.2, 3.2);
    emitBlood(gameState.p.x + gameState.p.w / 2, gameState.p.y + gameState.p.h / 2, 10, 1.6, 1.6);
  }
  gameState.deaths++;
  gameState.lives--;
  // Ekran qizil flash + "O'LDING" yozuvi (drawHUD da)
  gameState.deathFlash = 28;
  gameState.deathFlashMax = 28;

  if (gameState.lives <= 0) {
    gameState.state = 'over';
    return;
  }
  if (gameState.currentLevel === 2 && gameState.foundry) resetFoundryBodies(gameState.foundry);
  if (gameState.currentLevel === 3 && gameState.toxic) resetToxic(gameState.toxic);
  gameState.p = spawnPlayer();
  gameState.p.inv = 60;
}

export function updatePlayer(callbacks) {
  const p = gameState.p;
  if (!p) return;

  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (dir) {
    p.vx += dir * ACC;
    p.face = dir;
  } else {
    p.vx *= FRICTION;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
  }
  p.vx = clamp(p.vx, -MAXV, MAXV);

  // Check wall contact for free wall-contact jump
  const wall = checkWallContact(p);
  const touchingWall = (wall.left || wall.right) && !p.onGround;
  p.touchWall = touchingWall;

  if (p.onGround) {
    p.coyote = 6;
  } else if (touchingWall) {
    p.coyote = 6; // Erkin kontaktli sakrash
  } else if (p.coyote > 0) {
    p.coyote--;
  }

  // Sakrashlar yerga tegilganda tiklanadi; havoda ham MAX_JUMPS dan oshmaydi
  if (p.onGround) p.jumps = 0;
  if (p.jumpBuf > 0) p.jumpBuf--;
  if (p.jumpBuf > 0 && p.jumps < MAX_JUMPS) {
    p.vy = -JUMP;
    p.jumpBuf = 0;
    p.coyote = 0;
    p.jumps++;
    sfx.jump();
    emitBlood(p.x + p.w / 2, p.y + p.h, 3, 1.0, 0.6);
  }
  if (!keys.jump && p.vy < -2.4) p.vy = -2.4;

  if (touchingWall && p.vy > 0) {
    p.vy = Math.min(p.vy + GRAV * 0.65, 2.8); // slight slide resistance
    if (Math.random() < 0.2) {
      const dropX = wall.left ? p.x : p.x + p.w;
      emitBlood(dropX, p.y + p.h / 2, 1, 0.4, 0.4);
    }
  } else {
    p.vy = Math.min(p.vy + GRAV, MAXFALL);
  }

  moveX(p);
  const previousBottom = p.y + p.h;
  moveY(p);
  if (gameState.currentLevel === 2) resolveFoundryGround(gameState, p, previousBottom);
  if (gameState.currentLevel === 3) resolveToxicGround(gameState, p, previousBottom);
  if (p.inv > 0) p.inv--;
  // Yugurganda orqadan chang
  if (p.onGround && Math.abs(p.vx) > 0.4 && Math.random() < 0.5) emitDust(p);

  // Jump pads (Trampolines)
  if (gameState.jumpPads) {
    for (const j of gameState.jumpPads) {
      if (overlap(p, j)) {
        p.vy = -8.6; // High leap!
        p.onGround = false;
        j.anim = 12;
        sfx.spring();
        emitBlood(p.x + p.w / 2, p.y + p.h, 6, 1.4, 0.8);
      }
    }
  }

  // Crumbling blocks
  if (gameState.crumbles) {
    for (const b of gameState.crumbles) {
      if (b.collapsed) continue;
      if (p.onGround && p.x + p.w > b.x && p.x < b.x + b.w && Math.abs(p.y + p.h - b.y) <= 2) {
        if (b.timer === 0) {
          b.timer = 24; // start crumbling countdown
          sfx.crumble();
        }
      }
    }
  }

  if (p.y > callbacks.getVH() + 30) {
    die(callbacks);
    return;
  }

  for (const c of gameState.checkpoints || []) {
    if (!c.active && overlap(p, {x: c.x, y: c.y - 24, w: 16, h: 40})) {
      c.active = true;
      gameState.spawnX = c.x;
      gameState.spawnY = c.y;
      gameState.checkpoint++;
      sfx.coin();
    }
  }

  // Coins / Bandages
  for (const c of gameState.coins) {
    if (c.got) continue;
    if (overlap(p, { x: c.tx * T + 3, y: c.ty * T + 3, w: 10, h: 10 })) {
      c.got = true;
      gameState.coinCount++;
      sfx.coin();
    }
  }

  // Enemies
  for (const e of gameState.enemies) {
    if (!e.alive || e.dead || !overlap(p, e)) continue;
    if (p.vy > 0 && p.y + p.h - e.y < 10) {
      e.dead = 20;
      p.vy = -4.5;
      sfx.stomp();
      emitBlood(e.x + e.w / 2, e.y + e.h / 2, 8, 1.5, 1.5);
    } else if (p.inv === 0) {
      die(callbacks);
      return;
    }
  }

  // Bandage Girl / Goal reach
  if (gameState.currentLevel !== 2 && gameState.currentLevel !== 3 && gameState.girlX > 0) {
    const reached = (p.x + p.w >= gameState.girlX && p.x <= gameState.girlX + 16 && Math.abs(p.y - gameState.girlY) < 32);
    if (reached) {
      if (callbacks.nextLevel) callbacks.nextLevel();
    }
  }
}
