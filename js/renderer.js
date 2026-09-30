import { BASE_W, VH, T } from './config.js';
import { IMG, ready } from './assets.js';
import { solid, map, COLS, ROWS } from './level.js';
import { gameState } from './state.js';

export const R = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

// ──────────────────────────────────────────
// 1. FON (Background – zona bo'yicha)
// ──────────────────────────────────────────
export function drawBackground(ctx, VW, camX, anim) {
  const lvl = gameState.currentLevel;

  // DUNYO 1 (level 0-2): Osmon va tabiat
  if (lvl < 3) {
    // bg1.png — quyosh botishi rasmi
    if (ready(IMG.bg1)) {
      const imgW = IMG.bg1.width;
      const imgH = IMG.bg1.height;
      const scale = Math.max(VW / imgW, VH / imgH);
      const dw = imgW * scale, dh = imgH * scale;
      const offset = (camX * 0.08) % VW;
      ctx.drawImage(IMG.bg1, -offset, 0, dw + VW, dh);
      if (-offset + dw < VW) ctx.drawImage(IMG.bg1, -offset + dw, 0, dw + VW, dh);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, '#8ec5fc'); g.addColorStop(1, '#e0c3fc');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    }

    // original parallax cloud layers
    const k = Math.max(1, VW / BASE_W);
    const bgW = BASE_W * k, bgH = VH * k;
    const bgX = (VW - bgW) / 2, bgY = VH - bgH;

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
  // DUNYO 2 (level 3-6): O'rmon / shaxta
  else if (lvl < 7) {
    if (ready(IMG.bg2)) {
      const imgW = IMG.bg2.width;
      const imgH = IMG.bg2.height;
      const scale = Math.max(VW / imgW, VH / imgH);
      const dw = imgW * scale, dh = imgH * scale;
      const offset = ((camX * 0.12) % dw + dw) % dw;
      ctx.drawImage(IMG.bg2, -offset, 0, dw, dh);
      if (dw - offset < VW) ctx.drawImage(IMG.bg2, dw - offset, 0, dw, dh);
    } else {
      R(ctx, 0, 0, VW, VH, '#10141f');
    }
    // qorong'i overlay
    ctx.fillStyle = 'rgba(8, 6, 18, 0.45)';
    ctx.fillRect(0, 0, VW, VH);
    // to'sinlar
    ctx.fillStyle = 'rgba(30, 22, 10, 0.35)';
    const beamOff = ((camX * 0.2) % 140 + 140) % 140;
    for (let bx = -beamOff; bx < VW + 140; bx += 140) {
      ctx.fillRect(Math.round(bx), 0, 10, VH);
    }
  }
  // DUNYO 3 (level 7-9): Qonli fabrika
  else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, VH);
    bgGrad.addColorStop(0, '#22080f');
    bgGrad.addColorStop(0.6, '#140508');
    bgGrad.addColorStop(1, '#060102');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VW, VH);

    // zavod nurlanishi va qora to'sinlar
    const farOffset = ((camX * 0.1) % 120 + 120) % 120;
    ctx.fillStyle = 'rgba(60, 12, 22, 0.3)';
    for (let bx = -farOffset; bx < VW + 120; bx += 120) {
      ctx.fillRect(Math.round(bx), 0, 10, VH);
      ctx.beginPath();
      ctx.moveTo(bx + 10, 30);
      ctx.lineTo(bx + 120, 110);
      ctx.lineTo(bx + 120, 120);
      ctx.lineTo(bx + 10, 42);
      ctx.fill();
    }
    const mist = ctx.createLinearGradient(0, VH - 48, 0, VH);
    mist.addColorStop(0, 'rgba(60, 5, 15, 0)');
    mist.addColorStop(1, 'rgba(40, 2, 8, 0.7)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, VH - 48, VW, 48);
  }
}

// ──────────────────────────────────────────
// 2. BLOKLAR / TILLAR (Tiles)
// ──────────────────────────────────────────
// l1-bg3.png: 5 ustun × 2 qator = 10 tile, har tile ~289×543
// Biz faqat birinchi tile (top-left, ustida o't bor) va yon tile ni ishlatamiz
const TW = Math.round(1448 / 5);  // ~289
const TH = Math.round(1086 / 2);  // ~543

function drawTileSprite(ctx, sx, sy, srcCol, srcRow) {
  if (!ready(IMG.tiles1)) return false;
  const srcX = srcCol * TW;
  const srcY = srcRow * TH;
  ctx.drawImage(IMG.tiles1, srcX, srcY, TW, TH, Math.round(sx), Math.round(sy), T, T);
  return true;
}

export function drawTile(ctx, tx, ty, sx, sy) {
  const lvl = gameState.currentLevel;
  const hasTopFace = !solid(tx, ty - 1);

  if (lvl < 3) {
    // Tabiat tileset: ustida o't bor = col 0, row 0; yon/pastki = col 3, row 0
    if (hasTopFace) {
      if (!drawTileSprite(ctx, sx, sy, 0, 0)) {
        R(ctx, sx, sy, T, T, '#8a4b2a');
        R(ctx, sx, sy, T, 1, '#9cf06a');
        R(ctx, sx, sy + 1, T, 2, '#5fd04e');
        R(ctx, sx, sy + 3, T, 1, '#3fa845');
      }
    } else {
      if (!drawTileSprite(ctx, sx, sy, 3, 0)) {
        R(ctx, sx, sy, T, T, '#8a4b2a');
        R(ctx, sx, sy, T, 1, '#b5683a');
      }
    }
  }
  else if (lvl < 7) {
    // Shaxta metall blok
    R(ctx, sx, sy, T, T, '#363945');
    R(ctx, sx, sy + 7, T, 1, '#22252e');
    R(ctx, sx, sy + 15, T, 1, '#22252e');
    R(ctx, sx + 8, sy, 1, 7, '#22252e');
    R(ctx, sx, sy + 8, 1, 7, '#22252e');
    if (hasTopFace) {
      R(ctx, sx, sy, T, 1, '#7a8196');
      R(ctx, sx, sy + 1, T, 2, '#53586b');
    } else {
      R(ctx, sx, sy, T, 1, '#474c5c');
    }
  }
  else {
    // Do'zax qonli metall
    R(ctx, sx, sy, T, T, '#2b1419');
    R(ctx, sx, sy + 7, T, 1, '#190a0d');
    R(ctx, sx, sy + 15, T, 1, '#190a0d');
    R(ctx, sx + 8, sy, 1, 7, '#190a0d');
    R(ctx, sx, sy + 8, 1, 7, '#190a0d');
    if (hasTopFace) {
      R(ctx, sx, sy, T, 1, '#e61937');
      R(ctx, sx, sy + 1, T, 2, '#b30b24');
      R(ctx, sx, sy + 3, T, 1, '#7a0515');
    } else {
      R(ctx, sx, sy, T, 1, '#3b1c22');
    }
  }
}

// ──────────────────────────────────────────
// 3. QULOVCHI BLOK (Crumbling block)
// ──────────────────────────────────────────
export function drawCrumble(ctx, b, cx) {
  if (b.collapsed) return;
  const shake = b.timer > 0 ? (Math.random() - 0.5) * 2 : 0;
  const x = Math.round(b.x - cx + shake);
  const y = Math.round(b.y);
  R(ctx, x, y, T, T, '#7a5a3a');
  R(ctx, x + 1, y + 1, T - 2, T - 2, '#99734e');
  R(ctx, x + 3, y + 4, 3, 1, '#3d2511');
  R(ctx, x + 5, y + 5, 1, 4, '#3d2511');
  R(ctx, x + 9, y + 8, 4, 1, '#3d2511');
  R(ctx, x + 11, y + 9, 1, 3, '#3d2511');
  if (b.timer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    R(ctx, x + 1, y + 1, T - 2, T - 2, '#f97316');
    ctx.restore();
  }
}

// ──────────────────────────────────────────
// 4. TRAMPLIN (Jump pad)
// ──────────────────────────────────────────
export function drawJumpPad(ctx, j, cx) {
  const x = Math.round(j.x - cx);
  const y = Math.round(j.y);
  const bounce = j.anim > 0 ? Math.sin((j.anim / 12) * Math.PI) * 4 : 0;
  R(ctx, x, y + 4, j.w, 4, '#374151');
  R(ctx, x + 2, y + 3, j.w - 4, 2, '#4b5563');
  const padY = y - bounce;
  R(ctx, x + 1, padY, j.w - 2, 4, '#fbbf24');
  R(ctx, x + 2, padY + 1, j.w - 4, 2, '#fde68a');
  R(ctx, x + 4, padY + 1, j.w - 8, 1, '#ffffff');
  if (j.anim === 0) {
    R(ctx, x + 4, y + 2, 2, 2, '#6b7280');
    R(ctx, x + j.w - 6, y + 2, 2, 2, '#6b7280');
  }
}

// ──────────────────────────────────────────
// 5. TIKANLAR (Spikes) — l1.3.png'dan yoki pixel art
// ──────────────────────────────────────────
export function drawSpike(ctx, h, cx) {
  const x = Math.round(h.tx * T - cx);
  const y = Math.round(h.ty * T);
  ctx.save();
  if (h.dir === 'up') {
    for (let i = 0; i < 3; i++) {
      const sx = x + i * 5;
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath(); ctx.moveTo(sx, y + T); ctx.lineTo(sx + 2.5, y + 5); ctx.lineTo(sx + 5, y + T); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(sx + 1, y + 8); ctx.lineTo(sx + 2.5, y + 4); ctx.lineTo(sx + 4, y + 8); ctx.fill();
    }
  } else if (h.dir === 'down') {
    for (let i = 0; i < 3; i++) {
      const sx = x + i * 5;
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + 2.5, y + T - 6); ctx.lineTo(sx + 5, y); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(sx + 1, y + T - 9); ctx.lineTo(sx + 2.5, y + T - 5); ctx.lineTo(sx + 4, y + T - 9); ctx.fill();
    }
  } else if (h.dir === 'left') {
    for (let i = 0; i < 3; i++) {
      const sy = y + i * 5;
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath(); ctx.moveTo(x + T, sy); ctx.lineTo(x + 6, sy + 2.5); ctx.lineTo(x + T, sy + 5); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(x + 9, sy + 1); ctx.lineTo(x + 5, sy + 2.5); ctx.lineTo(x + 9, sy + 4); ctx.fill();
    }
  } else if (h.dir === 'right') {
    for (let i = 0; i < 3; i++) {
      const sy = y + i * 5;
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + T - 6, sy + 2.5); ctx.lineTo(x, sy + 5); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(x + T - 9, sy + 1); ctx.lineTo(x + T - 5, sy + 2.5); ctx.lineTo(x + T - 9, sy + 4); ctx.fill();
    }
  }
  ctx.restore();
}

// ──────────────────────────────────────────
// 6. AYLANUVCHI ARRA (Buzzsaw)
// ──────────────────────────────────────────
// l1.3.png ichida yuqori o'ng burchakda arra bor: ~col 4, row 0 (1448/5*4 = 1158, 0)
// Arra o'lchami ~289x543px spritesheetda — biz muayyan qismini kesib olamiz
const SAW_SX = Math.round(1448 / 5 * 4); // ~1158
const SAW_SY = 0;
const SAW_SW = Math.round(1448 / 5);     // ~289
const SAW_SH = Math.round(1086 / 2);     // ~543

export function drawSawblade(ctx, saw, cx) {
  const x = Math.round(saw.x - cx);
  const y = Math.round(saw.y);
  const r = saw.r;

  if (saw.moving) {
    ctx.strokeStyle = '#2d151c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.round(saw.startX - cx), Math.round(saw.startY));
    ctx.lineTo(Math.round(saw.startX + saw.maxDist - cx), Math.round(saw.startY));
    ctx.stroke();
  }

  // Sprite yoki pixel art
  if (ready(IMG.hazards)) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(saw.angle);
    const d = r * 2 + 4;
    ctx.drawImage(IMG.hazards, SAW_SX, SAW_SY, SAW_SW, SAW_SH, -d / 2, -d / 2, d, d);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(saw.angle);
    const teeth = 8;
    const toothAngle = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      ctx.save(); ctx.rotate(i * toothAngle);
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.35, -r * 0.6); ctx.lineTo(-r * 0.15, -r * 0.6); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.2, -r * 0.75); ctx.lineTo(-r * 0.1, -r * 0.75); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#4b5563';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ──────────────────────────────────────────
// 7. BINTLAR (Collectible bandages)
// ──────────────────────────────────────────
export function drawCoin(ctx, c, cx, anim) {
  if (c.got) return;
  const x = c.tx * T - cx + 3;
  const y = c.ty * T + 3 + Math.sin(anim * 0.1) * 2;
  R(ctx, x + 1, y, 8, 8, '#f5edd6');
  R(ctx, x, y + 2, 10, 5, '#e8dcbe');
  R(ctx, x + 2, y + 2, 6, 4, '#ffffff');
  R(ctx, x + 4, y + 3, 2, 3, '#d62828');
  R(ctx, x + 3, y + 4, 4, 1, '#d62828');
}

// ──────────────────────────────────────────
// 8. DUSHMAN (Patrol)
// ──────────────────────────────────────────
export function drawEnemy(ctx, e, cx, anim) {
  if (!e.alive) return;
  const x = Math.round(e.x) - cx;
  const y = Math.round(e.y) + (e.dead ? 6 : 0);
  const h = e.dead ? 6 : e.h;
  R(ctx, x, y, e.w, h, '#a83232');
  if (!e.dead) {
    R(ctx, e.dir > 0 ? x + 6 : x + 2, y + 3, 4, 2, '#000000');
  }
}

// ──────────────────────────────────────────
// 9. QAHRAMON + QON ZARRACHALARI
// ──────────────────────────────────────────
export function drawBoy(ctx, p, cx, anim, gs) {
  if (!p) return;
  if (p.inv > 0 && Math.floor(anim / 4) % 2) return;

  const x = Math.round(p.x) - cx;
  const y = Math.round(p.y);
  const f = p.face;

  // Yengil qon zarrachalari
  if (gs && gs.bloodParticles && gs.bloodParticles.length) {
    for (let i = 0; i < gs.bloodParticles.length; i++) {
      const bp = gs.bloodParticles[i];
      const alpha = Math.max(0, bp.life / bp.maxLife);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = bp.color || '#e61937';
      ctx.fillRect(Math.round(bp.x - cx), Math.round(bp.y), bp.r, bp.r);
      ctx.restore();
    }
  }

  // Player sprite: player.png 220x240 → T×T (16px) ga siqilgan
  // Canvas.T=16 juda kichik — biroz kattaroq chizamiz: 20×22
  const sprW = 20, sprH = 22;
  const drawX = Math.round(x + (p.w - sprW) / 2);
  const drawY = Math.round(y + p.h - sprH);

  if (ready(IMG.player)) {
    ctx.save();
    if (f < 0) {
      ctx.translate(drawX + sprW / 2, drawY + sprH / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(IMG.player, -sprW / 2, -sprH / 2, sprW, sprH);
    } else {
      ctx.drawImage(IMG.player, drawX, drawY, sprW, sprH);
    }
    ctx.restore();
  } else {
    // Fallback pixel art
    R(ctx, x, y, p.w, p.h, '#cc1129');
    R(ctx, x + 2, y + 2, 4, 4, '#ffffff');
    R(ctx, x + p.w - 6, y + 2, 4, 4, '#ffffff');
    R(ctx, x + (f > 0 ? 3 : 2), y + 3, 2, 2, '#000000');
    R(ctx, x + (f > 0 ? p.w - 5 : p.w - 6), y + 3, 2, 2, '#000000');
  }
}

// ──────────────────────────────────────────
// 10. BANDAGE GIRL (Maqsad)
// ──────────────────────────────────────────
export function drawGirl(ctx, gx, gy, cx, anim) {
  if (gx === 0) return;
  const x = gx - cx;
  const y = gy - 16 + Math.sin(anim * 0.06) * 2;
  R(ctx, x + 1, y - 2, 3, 3, '#ff3b82');
  R(ctx, x + 6, y - 2, 3, 3, '#ff3b82');
  R(ctx, x + 4, y - 1, 2, 2, '#ffffff');
  R(ctx, x + 1, y + 1, 9, 7, '#f7f0df');
  R(ctx, x + 2, y + 3, 7, 1, '#e3d5b8');
  R(ctx, x + 1, y + 5, 9, 1, '#e3d5b8');
  R(ctx, x + 2, y + 3, 2, 3, '#0d0b2e');
  R(ctx, x + 6, y + 3, 2, 3, '#0d0b2e');
  R(ctx, x + 2, y + 3, 1, 1, '#ffffff');
  R(ctx, x + 6, y + 3, 1, 1, '#ffffff');
  R(ctx, x + 1, y + 6, 2, 1, '#ff6b9d');
  R(ctx, x + 7, y + 6, 2, 1, '#ff6b9d');
  R(ctx, x + 1, y + 8, 8, 6, '#ede0c2');
  R(ctx, x + 3, y + 9, 4, 3, '#fcedc7');
  R(ctx, x + 2, y + 14, 2, 2, '#c4b595');
  R(ctx, x + 6, y + 14, 2, 2, '#c4b595');
  if (Math.sin(anim * 0.08) > 0.3) {
    R(ctx, x + 4, y - 6, 3, 2, '#ff3b82');
    R(ctx, x + 5, y - 4, 1, 1, '#ff3b82');
  }
}

// ──────────────────────────────────────────
// 11. HUD
// ──────────────────────────────────────────
export function drawHUD(ctx, VW, gs) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 15, 0.78)';
  ctx.fillRect(0, 0, VW, 16);
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'left';
  ctx.fillText(`LVL ${gs.currentLevel + 1}/10`, 10, 8);

  ctx.fillStyle = '#f5f5f5';
  ctx.textAlign = 'center';
  ctx.fillText(`OLIMLAR: ${gs.deaths}`, VW / 2, 8);

  ctx.fillStyle = gs.lives <= 3 ? '#ff4444' : '#ff8fa3';
  ctx.textAlign = 'right';
  ctx.fillText(`JON: ${gs.lives}`, VW - 10, 8);

  ctx.restore();
}

// ──────────────────────────────────────────
// 12. DUNYO (World render)
// ──────────────────────────────────────────
export function drawWorld(ctx, VW, camX, p, anim, gameState) {
  const c0 = Math.floor(camX / T), c1 = c0 + Math.ceil(VW / T) + 1;
  const cx = Math.round(camX);

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = c0; tx <= c1 && tx < COLS; tx++) {
      if (map[ty][tx] === '#') {
        drawTile(ctx, tx, ty, tx * T - cx, ty * T);
      }
    }
  }

  if (gameState.crumbles) {
    gameState.crumbles.forEach(b => {
      if (b.tx >= c0 - 1 && b.tx <= c1) drawCrumble(ctx, b, cx);
    });
  }

  if (gameState.jumpPads) {
    gameState.jumpPads.forEach(j => {
      if (j.tx >= c0 - 1 && j.tx <= c1) drawJumpPad(ctx, j, cx);
    });
  }

  if (gameState.hazards) {
    for (const h of gameState.hazards) {
      if (h.tx >= c0 - 1 && h.tx <= c1) drawSpike(ctx, h, cx);
    }
  }

  if (gameState.saws) {
    for (const saw of gameState.saws) drawSawblade(ctx, saw, cx);
  }

  if (gameState.coins) gameState.coins.forEach(c => drawCoin(ctx, c, cx, anim));
  if (gameState.enemies) gameState.enemies.forEach(e => drawEnemy(ctx, e, cx, anim));
  drawGirl(ctx, gameState.girlX, gameState.girlY, cx, anim);
  drawBoy(ctx, p, cx, anim, gameState);
}

// ──────────────────────────────────────────
// 13. TEXT util
// ──────────────────────────────────────────
export function text(ctx, str, x, y, size, color) {
  ctx.font = `${size}px "Press Start 2P", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(str, x + 1.5, y + 1.5);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ──────────────────────────────────────────
// 14. OVERLAY (O'yin tugashi / G'alaba)
// ──────────────────────────────────────────
export function drawOverlay(ctx, state, VW, VH, coinCount, totalCoins, anim, gs) {
  if (state !== 'over' && state !== 'won') return;
  R(ctx, 0, 0, VW, VH, 'rgba(8, 3, 12, 0.88)');

  if (state === 'won') {
    text(ctx, 'G\'ALABA!', VW / 2, 75, 20, '#ffd23f');
    text(ctx, 'BANDAGE GIRL QUTQARILDI!', VW / 2, 108, 8, '#f0fff4');
    text(ctx, `JAMI OLIMLAR: ${gs ? gs.deaths : 0}`, VW / 2, 132, 8, '#ef4444');
    text(ctx, `BINTLAR: ${coinCount}`, VW / 2, 150, 8, '#34d399');
    if (Math.floor(anim / 30) % 2 === 0) {
      text(ctx, 'ENTER - QAYTA BOSHLASH', VW / 2, 192, 7, '#ffd23f');
    }
  } else {
    text(ctx, 'GAME OVER', VW / 2, 80, 20, '#ef4444');
    text(ctx, 'BARCHA 10 JON TUGADI!', VW / 2, 112, 8, '#f5edd6');
    text(ctx, `LVL ${gs ? gs.currentLevel + 1 : 1} DA TOXTATDINGIZ`, VW / 2, 136, 7, '#fbbf24');
    if (Math.floor(anim / 30) % 2 === 0) {
      text(ctx, 'ENTER - BOSHIDAN BOSHLASH', VW / 2, 190, 7, '#a5b4fc');
    }
  }
}
