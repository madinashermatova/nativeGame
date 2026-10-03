// Drawing shared by every level: the player, Bandage Girl, HUD and end screens.
import {R} from './gfx.js';
import {drawHero} from './hero-art.js';
import {drawBlood} from './blood.js';

export function drawBoy(ctx, p, cx, anim, gs) {
  if (!p) return;
  const cy = gs?.camY || 0;
  drawBlood(ctx, gs.bloodParticles, cx, cy);
  if (p.inv > 0 && Math.floor(anim / 4) % 2) return;

  const x = Math.round(p.x) - cx, y = Math.round(p.y) - cy;
  if (p.gravDir === -1) { // upside down: mirror around the hitbox centre
    ctx.save();
    ctx.translate(0, 2 * (y + p.h / 2));
    ctx.scale(1, -1);
    drawHero(ctx, p, x, y, anim);
    ctx.restore();
    return;
  }
  drawHero(ctx, p, x, y, anim);
}

// Bandage Girl: the hero's blob in pink and a bit smaller, looking back towards him.
// (gx, gy) keeps its old meaning: her feet are at gy + 17 and her centre at gx + 6.
export function drawGirl(ctx, gx, gy, cx, anim) {
  if (gx === 0) return;
  const x = Math.round(gx - cx), feet = Math.round(gy + 17);
  ctx.fillStyle = 'rgba(255, 166, 205, 0.16)';
  ctx.beginPath(); ctx.ellipse(x + 6, feet - 9, 16, 19, 0, 0, Math.PI * 2); ctx.fill();
  drawHero(ctx, {x, w: 12, h: 14, face: -1}, x, feet - 14, anim, {palette: 'pink', scale: .78, phase: 90});
  const heartY = feet - 28 + Math.sin(anim * 0.08) * 2;
  R(ctx, x + 3, heartY, 2, 2, '#ff719f'); R(ctx, x + 7, heartY, 2, 2, '#ff719f');
  R(ctx, x + 3, heartY + 2, 6, 1, '#ff719f'); R(ctx, x + 4, heartY + 3, 4, 1, '#ff719f'); R(ctx, x + 5, heartY + 4, 2, 1, '#ff719f');
}

export function drawHUD(ctx, VW, gs, levelCount) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 15, 0.78)';
  ctx.fillRect(0, 0, VW, 16);
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'left';
  ctx.fillText(`LVL ${gs.currentLevel + 1}/${levelCount}`, 10, 8);
  ctx.fillStyle = '#f5f5f5';
  ctx.textAlign = 'center';
  ctx.fillText(`OLIMLAR: ${gs.deaths}`, VW / 2, 8);
  ctx.fillStyle = gs.lives <= 3 ? '#ff4444' : gs.lives > 10 ? '#ffd23f' : '#ff8fa3';
  ctx.textAlign = 'right';
  ctx.fillText(`JON: ${gs.lives}`, VW - 10, 8);
  ctx.restore();
}

function text(ctx, str, x, y, size, color) {
  ctx.font = `${size}px "Press Start 2P", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(str, x + 1.5, y + 1.5);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function drawOverlay(ctx, VW, VH, gs) {
  if (gs.state !== 'over') return;
  ctx.save();
  R(ctx, 0, 0, VW, VH, 'rgba(8, 3, 12, 0.88)');
  const blink = Math.floor(gs.anim / 30) % 2 === 0;
  text(ctx, 'GAME OVER', VW / 2, 80, 20, '#ef4444');
  text(ctx, 'JONLAR TUGADI!', VW / 2, 112, 8, '#f5edd6');
  text(ctx, `LVL ${gs.currentLevel + 1} QAYTA BOSHLANADI`, VW / 2, 136, 7, '#fbbf24');
  if (blink) text(ctx, 'ENTER - LEVELNI QAYTA BOSHLASH', VW / 2, 190, 7, '#a5b4fc');
  ctx.restore();
}
