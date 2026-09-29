import { BASE_W, VH, T } from './config.js';
import { IMG, ready } from './assets.js';
import { solid, map, COLS, ROWS } from './level.js';
import { gameState } from './state.js';

export const R = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

export function drawBackground(ctx, VW, camX, anim) {
  const k = Math.max(1, VW / BASE_W);
  const bgW = BASE_W * k, bgH = VH * k;
  const bgX = (VW - bgW) / 2, bgY = VH - bgH;

  if (ready(IMG.sky)) ctx.drawImage(IMG.sky, bgX, bgY, bgW, bgH);
  else R(ctx, 0, 0, VW, VH, '#2b1b6b');

  [[IMG.far, 0.04, 0.05], [IMG.near, 0.09, 0.1]].forEach(([img, speed, par]) => {
    if (!ready(img)) return;
    const off = (((anim * speed - camX * par) % bgW) + bgW) % bgW;
    ctx.drawImage(img, bgX + off - bgW, bgY, bgW, bgH);
    ctx.drawImage(img, bgX + off, bgY, bgW, bgH);
  });

  if (ready(IMG.land)) {
    const zoom = 1.25, dw = bgW * zoom, dh = bgH * zoom;
    const maxCam = COLS * T - VW;
    const dx = -(dw - VW) * (maxCam > 0 ? camX / maxCam : 0);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, VW, 232); ctx.clip();
    ctx.drawImage(IMG.land, dx, VH - dh, dw, dh);
    ctx.restore();
  }
  R(ctx, 0, 232, VW, VH - 232, '#150a3a');
}

export function drawTile(ctx, tx, ty, sx, sy) {
  R(ctx, sx, sy, T, T, '#8a4b2a');
  R(ctx, sx, sy + 7, T, 1, '#4a2416');
  R(ctx, sx, sy + 15, T, 1, '#4a2416');
  R(ctx, sx + 8, sy, 1, 7, '#4a2416');
  R(ctx, sx, sy + 8, 1, 7, '#4a2416');
  if (!solid(tx, ty - 1)) {
    R(ctx, sx, sy, T, 1, '#9cf06a');
    R(ctx, sx, sy + 1, T, 2, '#5fd04e');
    R(ctx, sx, sy + 3, T, 1, '#3fa845');
    R(ctx, sx + 2, sy + 4, 2, 2, '#2a7a3c');
    R(ctx, sx + 7, sy + 4, 2, 1, '#2a7a3c');
    R(ctx, sx + 12, sy + 4, 2, 2, '#2a7a3c');
  } else {
    R(ctx, sx, sy, T, 1, '#b5683a');
  }
}

export function drawCoin(ctx, c, cx, anim) {
  if (c.got) return;
  const x = c.tx * T - cx + 4;
  const y = c.ty * T + 4 + Math.sin(anim * 0.1) * 2;
  R(ctx, x, y, 8, 8, '#ffcc00');
  R(ctx, x + 2, y + 2, 4, 4, '#ffeeaa');
}

export function drawEnemy(ctx, e, cx, anim) {
  if (!e.alive) return;
  const x = Math.round(e.x) - cx;
  const y = Math.round(e.y) + (e.dead ? 6 : 0);
  const h = e.dead ? 6 : e.h;
  R(ctx, x, y, e.w, h, '#a83232');
  if (!e.dead) {
    R(ctx, e.dir > 0 ? x + 6 : x + 2, y + 3, 4, 2, '#000'); // eyes
  }
}

export function drawBoy(ctx, p, cx, anim, gs) {
  if (!p) return;
  if (p.inv > 0 && Math.floor(anim / 4) % 2) return;
  const x = Math.round(p.x) - cx, y = Math.round(p.y), f = p.face;

  const spriteW = p.w + 4;
  const spriteH = p.h + 4;

  // Draw trails as pink bubbles
  if (gs && gs.trails && gs.trails.length) {
    for (let i = 0; i < gs.trails.length; i++) {
      const t = gs.trails[i];
      const tx = (t.x - cx);
      const ty = (t.y);
      const alpha = Math.max(0, 1 - t.age / t.life);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      const grd = ctx.createRadialGradient(tx, ty, Math.max(1, t.r * 0.2), tx, ty, t.r);
      grd.addColorStop(0, 'rgba(255,182,193,0.95)');
      grd.addColorStop(0.5, 'rgba(255,105,180,0.8)');
      grd.addColorStop(1, 'rgba(255,105,180,0.05)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(tx, ty, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw main player (sprite if available, otherwise fallback pixel art)
  if (ready(IMG.player)) {
    ctx.save();
    if (f < 0) {
      ctx.translate(x + spriteW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(IMG.player, 0, y, spriteW, spriteH);
    } else {
      ctx.drawImage(IMG.player, x, y, spriteW, spriteH);
    }
    ctx.restore();
  } else {
    R(ctx, x + 1, y, 8, 3, '#ff3b3b'); // hat
    R(ctx, f > 0 ? x + 5 : x, y + 2, 5, 1, '#ff3b3b'); // brim
    R(ctx, x + 1, y + 3, 8, 4, '#ffcf9f'); // face
    R(ctx, f > 0 ? x + 6 : x + 3, y + 4, 1, 2, '#0d0b2e'); // eye
    R(ctx, x + 1, y + 7, 8, 4, '#3bd6ff'); // shirt
    R(ctx, f > 0 ? x : x + 8, y + 8, 2, 3, '#ffcf9f'); // hand
    if (!p.onGround) {
      R(ctx, x, y + 11, 3, 3, '#2b1b6b'); R(ctx, x + 7, y + 11, 3, 3, '#2b1b6b');
    } else if (Math.abs(p.vx) > 0.3 && Math.floor(anim / 6) % 2) {
      R(ctx, x + 1, y + 11, 3, 3, '#2b1b6b'); R(ctx, x + 6, y + 11, 3, 2, '#2b1b6b');
    } else if (Math.abs(p.vx) > 0.3) {
      R(ctx, x + 1, y + 11, 3, 2, '#2b1b6b'); R(ctx, x + 6, y + 11, 3, 3, '#2b1b6b');
    } else {
      R(ctx, x + 1, y + 11, 3, 3, '#2b1b6b'); R(ctx, x + 6, y + 11, 3, 3, '#2b1b6b');
    }
  }
}

export function drawGirl(ctx, gx, gy, cx, anim) {
  if (gx === 0) return; // not loaded
  const x = gx - cx, y = gy - 16 + Math.sin(anim * 0.05) * 2;
  R(ctx, x + 1, y, 10, 4, '#ffb8e0'); // hair
  R(ctx, x + 1, y + 4, 8, 4, '#ffcf9f'); // face
  R(ctx, x + 2, y + 5, 1, 2, '#0d0b2e'); R(ctx, x + 7, y + 5, 1, 2, '#0d0b2e'); // eyes
  R(ctx, x, y + 8, 10, 6, '#e03b8c'); // dress
  R(ctx, x + 2, y + 14, 2, 2, '#2b1b6b'); R(ctx, x + 6, y + 14, 2, 2, '#2b1b6b'); // shoes
}

export function drawWorld(ctx, VW, camX, p, anim, gameState) {
  const c0 = Math.floor(camX / T), c1 = c0 + VW / T + 1;
  const cx = Math.round(camX);
  
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = c0; tx <= c1 && tx < COLS; tx++) {
      if (map[ty][tx] === '#') {
        drawTile(ctx, tx, ty, tx * T - cx, ty * T);
      }
    }
  }

  if (gameState.coins) gameState.coins.forEach(c => drawCoin(ctx, c, cx, anim));
  if (gameState.enemies) gameState.enemies.forEach(e => drawEnemy(ctx, e, cx, anim));
  drawGirl(ctx, gameState.girlX, gameState.girlY, cx, anim);
  drawBoy(ctx, p, cx, anim, gameState);
}



export function text(ctx, str, x, y, size, color) {
  ctx.font = `${size}px "Press Start 2P", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function drawOverlay(ctx, state, VW, VH, coinCount, totalCoins, anim) {
  if (state !== 'over' && state !== 'won') return;
  R(ctx, 0, 0, VW, VH, 'rgba(13,11,46,0.78)');
  if (state === 'won') {
    text(ctx, 'G\'ALABA!', VW / 2, 100, 20, '#ffd23f');
    text(ctx, `TANGA ${coinCount}/${totalCoins}`, VW / 2, 140, 10, '#ffffff');
  } else {
    text(ctx, 'O\'YIN TUGADI', VW / 2, 100, 18, '#ff3b3b');
    text(ctx, `TANGA ${coinCount}/${totalCoins}`, VW / 2, 140, 10, '#ffffff');
  }
  if (Math.floor(anim / 30) % 2 === 0) text(ctx, 'ENTER - QAYTA BOSHLASH', VW / 2, 190, 8, '#cfd0ff');
}
