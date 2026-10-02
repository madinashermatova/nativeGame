import { drawToxicBackground, drawToxicWorld } from './toxic-renderer.js';
import { drawFoundryBackground, drawFoundryWorld } from './foundry-renderer.js';
import { BASE_W, VH, T } from './config.js';
import { IMG, ready } from './assets.js';
import { solid, map, COLS, ROWS, levels } from './level.js';
import { gameState } from './state.js';

export const R = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

// ──────────────────────────────────────────
// 1. FON (Background – zona bo'yicha)
// ──────────────────────────────────────────
export function drawBackground(ctx, VW, camX, anim) {
  if (gameState.currentLevel === 3) {drawToxicBackground(ctx, VW, camX, gameState);return;}
  const lvl = gameState.currentLevel;
  if (lvl === 0) {
    R(ctx, 0, 0, VW, VH, '#dbab78');
    if (ready(IMG.bg1)) {
      const scale = Math.max((VW + 64) / IMG.bg1.width, VH / IMG.bg1.height);
      const dw = IMG.bg1.width * scale, dh = IMG.bg1.height * scale;
      const progress = camX / Math.max(1, COLS * T - VW);
      ctx.drawImage(IMG.bg1, -(dw - VW) * progress, (VH - dh) / 2, dw, dh);
    }
    return;
  }

  if (lvl === 1) {
    R(ctx, 0, 0, VW, VH, '#172b2d');
    if (ready(IMG.bg2)) {
      const scale = Math.max((VW + 80) / IMG.bg2.width, VH / IMG.bg2.height);
      const dw = IMG.bg2.width * scale, dh = IMG.bg2.height * scale;
      ctx.drawImage(IMG.bg2, -(dw - VW) * camX / Math.max(1, COLS * T - VW), VH - dh, dw, dh);
    }
    R(ctx, 0, 0, VW, VH, 'rgba(8, 22, 28, 0.22)');
    return;
  }

  if (lvl === 2) {drawFoundryBackground(ctx, VW, camX, gameState);return;}

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
  if (lvl <= 1) {
    R(ctx, sx, sy, T, T, '#774328');
    if (ready(IMG.tiles1)) {
      const crop = hasTopFace ? [330, 255, 230, 225] : [905, 245, 225, 230];
      ctx.drawImage(IMG.tiles1, ...crop, Math.round(sx), Math.round(sy), T, T);
    }
    if (hasTopFace) R(ctx, sx, sy, T, 2, '#8caf3d');
    return;
  }

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
  if (gameState.currentLevel === 2 && ready(IMG.factorySpike) && h.dir === 'up') {
    ctx.drawImage(IMG.factorySpike, 325, 224, 112, 70, h.tx * T - cx, h.ty * T + 5, T, 11);
    return;
  }
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

  if (gameState.currentLevel === 2) {
    const img = saw.moving ? IMG.gearMoving : IMG.gear;
    if (ready(img)) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(saw.angle);
      const crop = saw.moving ? [590, 300, 360, 350] : [400, 260, 510, 500];
      ctx.drawImage(img, ...crop, -r, -r, r * 2, r * 2);
      ctx.restore(); return;
    }
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
  const x = Math.round(gx - cx - 4), y = Math.round(gy + 16 - 29 + Math.sin(anim * 0.06));
  ctx.save();
  ctx.fillStyle = 'rgba(255, 166, 205, 0.16)';
  ctx.beginPath(); ctx.ellipse(x + 11, y + 16, 22, 25, 0, 0, Math.PI * 2); ctx.fill();
  R(ctx, x + 3, y + 3, 16, 13, '#62384b');
  R(ctx, x + 5, y + 5, 12, 11, '#ffe1c4');
  R(ctx, x + 3, y + 2, 16, 5, '#804752');
  R(ctx, x + 3, y + 5, 3, 12, '#62384b');
  R(ctx, x + 16, y + 5, 3, 12, '#62384b');
  R(ctx, x + 13, y, 4, 4, '#ff5c9b'); R(ctx, x + 18, y, 4, 4, '#ff5c9b');
  R(ctx, x + 17, y + 1, 2, 2, '#fff3df');
  const blink = anim % 180 > 172;
  R(ctx, x + 7, y + 8, 2, blink ? 1 : 3, '#302443');
  R(ctx, x + 13, y + 8, 2, blink ? 1 : 3, '#302443');
  if (!blink) {R(ctx, x + 7, y + 8, 1, 1, '#fff');R(ctx, x + 13, y + 8, 1, 1, '#fff');}
  R(ctx, x + 6, y + 12, 3, 1, '#f798a7');R(ctx, x + 14, y + 12, 3, 1, '#f798a7');
  R(ctx, x + 10, y + 13, 3, 1, '#b8586b');
  R(ctx, x + 6, y + 16, 11, 4, '#fff0df');
  R(ctx, x + 5, y + 20, 13, 5, '#ed74a0');R(ctx, x + 3, y + 24, 17, 2, '#ffd0df');
  R(ctx, x + 3, y + 17, 3, 5, '#ffe1c4');R(ctx, x + 17, y + 16, 3, 5, '#ffe1c4');
  R(ctx, x + 8, y + 26, 3, 3, '#ffe1c4');R(ctx, x + 13, y + 26, 3, 3, '#ffe1c4');
  R(ctx, x + 7, y + 28, 4, 2, '#8d4661');R(ctx, x + 13, y + 28, 4, 2, '#8d4661');
  const heartY = y - 9 + Math.sin(anim * 0.08) * 2;
  R(ctx, x + 9, heartY, 3, 3, '#ff719f');R(ctx, x + 13, heartY, 3, 3, '#ff719f');
  R(ctx, x + 10, heartY + 3, 5, 2, '#ff719f');R(ctx, x + 12, heartY + 5, 1, 1, '#ff719f');
  ctx.restore();
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
  ctx.fillText(gs.currentLevel === 0 ? 'LVL 1' : `LVL ${gs.currentLevel + 1}/${levels.length}`, 10, 8);

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
  if (gameState.currentLevel === 3) {drawToxicWorld(ctx, VW, Math.round(camX), gameState, {drawGirl, drawBoy});return;}
  if (gameState.currentLevel === 2) {
    drawFoundryWorld(ctx, VW, Math.round(camX), gameState, {drawGirl, drawBoy});
    return;
  }
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
  if (gameState.currentLevel === 0) {
    ctx.save();
    ctx.font = '6px monospace'; ctx.fillStyle = '#fff4d4';
    ctx.fillText('SPACE / W / UP: HAVODA HAM SAKRASH', 32 - cx, 176);
    ctx.fillText('FINISH', gameState.girlX - cx - 12, gameState.girlY - 30);
    ctx.restore();
    if (ready(IMG.props)) {
      for (const tx of [6, 23, 38, 55]) ctx.drawImage(IMG.props, 35, 320, 155, 150, tx * T - cx, 182, 26, 26);
    }
  }
  if (gameState.currentLevel === 1) {
    ctx.save(); ctx.font = '6px monospace'; ctx.fillStyle = '#fff4d4';
    ctx.fillText('LVL 2: OLOV VA SUV', 32 - cx, 157);
    ctx.fillText('SUVGA TUSHMA! OLOVNI SAKRAB OT.', 32 - cx, 170);
    ctx.fillText('FINISH', gameState.girlX - cx - 12, gameState.girlY - 30);
    ctx.restore();
  }
  for (const e of gameState.elements || []) {
    const x = e.x - cx, y = e.y;
    if (x < -T || x > VW) continue;
    if (e.type === 'water') {
      R(ctx, x, y + 3, T, T - 3, '#13618b');
      R(ctx, x, y + 8, T, 8, '#0d426c');
      const wave = Math.sin(anim * 0.12 + e.tx) * 1.5;
      R(ctx, x, y + 3 + wave, T, 2, '#68dcf4');
      R(ctx, x + (anim / 3 + e.tx * 3) % 12, y + 10, 3, 1, '#3d9fc3');
    } else {
      const active = (gameState.levelTick + e.phase) % 150 < 95;
      R(ctx, x, y + 4, T, T - 4, '#482620');
      R(ctx, x + 2, y + 7, 12, 3, active ? '#ff632a' : '#984331');
      if (active) {
        for (let i = 0; i < 3; i++) {
          const height = 12 + Math.sin(anim * 0.23 + e.tx + i * 2) * 4;
          R(ctx, x + 2 + i * 4, y - height, 4, height + 8, '#f45a20');
          R(ctx, x + 3 + i * 4, y - height + 5, 2, height + 1, '#ffd65a');
        }
      } else R(ctx, x + 5, y + 3, 3, 2, '#d86c38');
    }
  }
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
