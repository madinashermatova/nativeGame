import { T } from './config.js';
import { solid } from './level.js';
import { gameState } from './state.js';

export function updateEnemies() {
  for (const e of gameState.enemies) {
    if (!e.alive) continue;
    if (e.dead) { e.dead--; if (!e.dead) e.alive = false; continue; }
    e.x += e.dir * 0.5;
    const ahead = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
    const wall = solid(Math.floor(ahead / T), Math.floor((e.y + e.h / 2) / T));
    const ledge = !solid(Math.floor(ahead / T), Math.floor((e.y + e.h + 1) / T));
    if (wall || ledge) e.dir *= -1;
  }
}
