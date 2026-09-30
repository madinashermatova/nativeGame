import { T } from './config.js';
import { solid } from './level.js';
import { gameState } from './state.js';
import { overlap } from './utils.js';

// die() ni circular import'dan saqlanish uchun flag orqali chaqiramiz
function killPlayer() {
  const p = gameState.p;
  if (!p || p.inv > 0) return;
  p.y = 9999; // player.js ichida y > VH bo'lganda die() chaqiriladi
}

export function updateEnemies(callbacks) {
  const p = gameState.p;

  // 1. Standart harakatlanuvchi dushmanlar
  for (const e of gameState.enemies) {
    if (!e.alive) continue;
    if (e.dead) {
      if (p && p.inv === 0) killPlayer();
      e.dead = 0;
      continue;
    }

    e.x += e.dir * 0.8;
    const ahead = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
    const wall = solid(Math.floor(ahead / T), Math.floor((e.y + e.h / 2) / T));
    const ledge = !solid(Math.floor(ahead / T), Math.floor((e.y + e.h + 1) / T));
    if (wall || ledge) e.dir *= -1;
  }

  // 2. Aylanuvchi arralar (Buzzsaws)
  if (gameState.saws) {
    for (const saw of gameState.saws) {
      saw.angle = (saw.angle || 0) + saw.rotSpeed;

      if (saw.moving) {
        saw.x += saw.vx;
        saw.y += saw.vy;

        saw.progress += saw.step;
        if (saw.progress >= saw.maxDist || saw.progress <= 0) {
          saw.vx *= -1;
          saw.vy *= -1;
          saw.step *= -1;
        }
      }

      if (p && p.inv === 0) {
        const pcx = p.x + p.w / 2;
        const pcy = p.y + p.h / 2;
        const dist = Math.hypot(pcx - saw.x, pcy - saw.y);
        if (dist < saw.r + Math.min(p.w, p.h) * 0.45) {
          killPlayer();
          return;
        }
      }
    }
  }

  // 3. Tikanlar (Spikes)
  if (gameState.hazards && p && p.inv === 0) {
    for (const h of gameState.hazards) {
      if (overlap(p, h)) {
        killPlayer();
        return;
      }
    }
  }

  // 4. Qulovchi bloklar (Crumbling blocks)
  if (gameState.crumbles) {
    for (const b of gameState.crumbles) {
      if (b.timer > 0) {
        b.timer--;
        if (b.timer === 0) {
          b.collapsed = true;
          b.respawnTimer = 180;
        }
      } else if (b.collapsed && b.respawnTimer > 0) {
        b.respawnTimer--;
        if (b.respawnTimer === 0) {
          b.collapsed = false;
          b.timer = 0;
        }
      }
    }
  }

  // 5. Tramplin animatsiyasi
  if (gameState.jumpPads) {
    for (const j of gameState.jumpPads) {
      if (j.anim > 0) j.anim--;
    }
  }
}
