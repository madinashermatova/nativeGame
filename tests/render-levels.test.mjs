// Har bir levelni (fon, dunyo, o'yinchi, HUD) chizish: xatosiz ishlashi va chizish chaqiruvlari bo'lishi kerak.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLevel, levels } from '../js/level.js';
import { gameState as gs } from '../js/state.js';
import { spawnPlayer } from '../js/player.js';
import { drawBackground, drawWorld, drawHUD, drawOverlay } from '../js/renderer.js';

// Kanvas o'rniga: har qanday chaqiruvni qabul qiladi va hisoblaydi
function fakeCtx() {
  const stats = { calls: 0 };
  const gradient = { addColorStop() {} };
  const target = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: () => ({ width: 10 }),
  };
  const ctx = new Proxy(target, {
    get(o, k) {
      if (k in o) return o[k];
      return (...args) => { stats.calls++; return undefined; };
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return { ctx, stats };
}

for (let i = 0; i < levels.length; i++) {
  test(`level ${i + 1} renders (fon, dunyo, o'yinchi, HUD)`, () => {
    loadLevel(i);
    gs.state = 'playing';
    gs.anim = 60;
    gs.p = spawnPlayer();
    gs.p.onGround = true;
    gs.p.vx = 1;
    const { ctx, stats } = fakeCtx();
    for (let f = 0; f < 3; f++) {
      gs.anim++;
      drawBackground(ctx, 480, 40 * f, gs.anim);
      drawWorld(ctx, 480, 40 * f, gs.p, gs.anim, gs);
      drawHUD(ctx, 480, gs);
    }
    drawOverlay(ctx, 'over', 480, 270, 0, 0, gs.anim, gs);
    assert.ok(stats.calls > 50, `juda kam chizilgan: ${stats.calls}`);
  });
}
