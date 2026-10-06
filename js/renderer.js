import { drawToxicBackground, drawToxicWorld } from './toxic-renderer.js';
import { drawFoundryBackground, drawFoundryWorld } from './foundry-renderer.js';
import { VH, T } from './config.js';
import { solid, map, COLS, ROWS, levels } from './level.js';
import { drawSunsetBackground, drawForestBackground, drawLabBackground, drawLabTile, drawBush, drawWater, drawFire, drawHeart, drawModernBackground, drawModernTile, drawRobot, drawModernSaw, drawExitDoor } from './scenery.js';
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
    drawSunsetBackground(ctx, VW, VH, camX, anim);
    return;
  }

  if (lvl === 1) {
    drawForestBackground(ctx, VW, VH, camX, anim);
    return;
  }

  if (lvl === 2) {drawFoundryBackground(ctx, VW, camX, gameState);return;}

  // 5-LEVEL: kimyo laboratoriyasi (4-leveldan farqli ko'k-oq palitra)
  if (lvl === 4) {drawLabBackground(ctx, VW, camX, anim);return;}
  if (lvl === 5) {drawModernBackground(ctx, VW, camX, anim);return;}

  // DUNYO 2 (level 6-7): shaxta
  if (lvl < 7) {
    R(ctx, 0, 0, VW, VH, '#10141f');
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
export function drawTile(ctx, tx, ty, sx, sy) {
  const lvl = gameState.currentLevel;
  const hasTopFace = !solid(tx, ty - 1);
  if (lvl <= 1) {
    // Tabiat: tuproq va o't qatlami
    R(ctx, sx, sy, T, T, '#774328');
    R(ctx, sx + 3, sy + 5, 2, 2, '#5a3019');
    R(ctx, sx + 10, sy + 9, 2, 2, '#5a3019');
    if (hasTopFace) {
      R(ctx, sx, sy, T, 3, '#5fd04e');
      R(ctx, sx, sy, T, 1, '#9cf06a');
      R(ctx, sx + 4, sy + 3, 2, 2, '#3fa845');
    }
    return;
  }

  if (lvl === 4) {drawLabTile(ctx, sx, sy, hasTopFace);return;}
  if (lvl === 5) {drawModernTile(ctx, sx, sy, hasTopFace);return;}

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
// 5. TIKANLAR (Spikes) — pixel art
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
export function drawSawblade(ctx, saw, cx) {
  const x = Math.round(saw.x - cx);
  const y = Math.round(saw.y);
  const r = saw.r;
  if (gameState.currentLevel === 5) {
    if (saw.moving) {
      ctx.strokeStyle = 'rgba(34, 227, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(saw.startX - cx), Math.round(saw.startY));
      ctx.lineTo(Math.round(saw.startX + saw.maxDist - cx), Math.round(saw.startY));
      ctx.stroke();
    }
    drawModernSaw(ctx, x, y, r, saw.angle);
    return;
  }

  if (saw.moving) {
    ctx.strokeStyle = '#2d151c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.round(saw.startX - cx), Math.round(saw.startY));
    ctx.lineTo(Math.round(saw.startX + saw.maxDist - cx), Math.round(saw.startY));
    ctx.stroke();
  }

  {
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
  if (gameState.currentLevel === 5 && !e.dead) {
    drawRobot(ctx, x, y, e.w, e.h, e.dir, anim, e.alive);
    return;
  }
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

  // Tutun (yugurganda orqadan) — qon zarrachalaridan oldin chiziladi
  if (gs && gs.dust && gs.dust.length) {
    ctx.save();
    for (const d of gs.dust) {
      ctx.globalAlpha = Math.max(0, d.life / d.maxLife) * 0.55;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x - cx, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Qahramon: dumaloq go'sht bo'lagi, katta ko'zlar. Katak: 20×22, hitbox markazda.
  const ox = x - 4, oy = y - 8;
  const cxp = ox + 10, cyp = oy + 12;
  const look = f >= 0 ? 1 : -1;               // ko'zlar harakat yo'nalishiga qaraydi
  const running = p.onGround && Math.abs(p.vx) > 0.4;
  const step = running ? (Math.floor(anim / 5) % 2) * 2 - 1 : 0;
  const blink = anim % 180 > 172;

  // Oyoqlar: yugurganda almashinadi, havoda yig'iladi
  ctx.fillStyle = '#3a0710';
  ctx.beginPath();
  if (p.onGround) {
    ctx.arc(cxp - 3 + step, oy + 20, 2.5, 0, Math.PI * 2);
    ctx.arc(cxp + 3 - step, oy + 20, 2.5, 0, Math.PI * 2);
  } else {
    ctx.arc(cxp - 3, oy + 19, 2.2, 0, Math.PI * 2);
    ctx.arc(cxp + 3, oy + 19, 2.2, 0, Math.PI * 2);
  }
  ctx.fill();

  // Kontur va tana (dumaloq)
  ctx.beginPath(); ctx.arc(cxp, cyp, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d41a36';
  ctx.beginPath(); ctx.arc(cxp, cyp, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7a8c';
  ctx.beginPath(); ctx.arc(cxp - 3.5, cyp - 4.5, 2.2, 0, Math.PI * 2); ctx.fill();

  // Katta ko'zlar
  for (const ex of [cxp - 3.6, cxp + 3.6]) {
    if (blink) {
      ctx.fillStyle = '#3a0710';
      ctx.fillRect(ex - 2.6, cyp - 0.5, 5.2, 1.2);
      continue;
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex, cyp - 1, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(ex + look * 1.3, cyp - 0.6, 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex + look * 1.3 - 0.7, cyp - 1.6, 0.6, 0, Math.PI * 2); ctx.fill();
  }

  // Og'iz (kulgan)
  ctx.strokeStyle = '#3a0710';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cxp + look * 0.8, cyp + 3, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
}

// ──────────────────────────────────────────
// 10. BANDAGE GIRL (Maqsad)
// ──────────────────────────────────────────

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

  // Jonlar: yurak ikonkalari. Kam qolganda tez miltillaydi.
  const lives = Math.max(0, gs.lives);
  const s = 1.2, step = 7 * s + 3;
  const x0 = VW - 10 - lives * step;
  const low = lives <= 3;
  const pulse = low && Math.floor(performance.now() / 250) % 2 === 0;
  ctx.textAlign = 'right';
  ctx.fillStyle = low ? '#ff4444' : '#ff8fa3';
  ctx.fillText('JON', x0 - 6, 8);
  for (let i = 0; i < lives; i++) {
    drawHeart(ctx, x0 + i * step, 4.5, s, pulse ? '#ffb3bd' : (low ? '#ff3b3b' : '#ff5c85'));
  }

  // O'lim effekti: qizil flash va "O'LDING" yozuvi
  if (gs.deathFlash > 0) {
    const k = gs.deathFlash / gs.deathFlashMax;
    ctx.fillStyle = `rgba(220, 20, 40, ${0.42 * k})`;
    ctx.fillRect(0, 0, VW, 270);
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 240, 240, ${Math.min(1, k * 1.5)})`;
    ctx.fillText("O'LDING", VW / 2, 130);
  }

  ctx.restore();
}

// ──────────────────────────────────────────
// 12. DUNYO (World render)
// ──────────────────────────────────────────
export function drawWorld(ctx, VW, camX, p, anim, gameState) {
  if (gameState.currentLevel === 3) {drawToxicWorld(ctx, VW, Math.round(camX), gameState, {drawBoy});return;}
  if (gameState.currentLevel === 2) {
    drawFoundryWorld(ctx, VW, Math.round(camX), gameState, {drawBoy});
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
    ctx.fillText('CHIQISH', gameState.girlX - cx - 12, gameState.girlY - 30);
    ctx.restore();
    for (const tx of [6, 23, 38, 55]) drawBush(ctx, tx * T - cx, 182);
  }
  if (gameState.currentLevel === 1) {
    ctx.save(); ctx.font = '6px monospace'; ctx.fillStyle = '#fff4d4';
    ctx.fillText('LVL 2: OLOV VA SUV', 32 - cx, 157);
    ctx.fillText('SUVGA TUSHMA! OLOVNI SAKRAB OT.', 32 - cx, 170);
    ctx.fillText('CHIQISH', gameState.girlX - cx - 12, gameState.girlY - 30);
    ctx.restore();
  }
  for (const e of gameState.elements || []) {
    const x = e.x - cx, y = e.y;
    if (x < -T || x > VW) continue;
    if (e.type === 'water') {
      drawWater(ctx, x, y, T, e.tx, anim);
    } else {
      const active = (gameState.levelTick + e.phase) % 150 < 95;
      drawFire(ctx, x, y, T, e.tx, anim, active);
    }
  }
  if (gameState.girlX > 0) drawExitDoor(ctx, gameState.girlX - cx, gameState.girlY, anim);
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
      text(ctx, 'ENTER - LEVELNI QAYTA BOSHLASH', VW / 2, 190, 7, '#a5b4fc');
    }
  }
}

// O'tish animatsiyasi: ekran qorayib (iris) yopiladi, keyingi level ochiladi
export function drawTransition(ctx, VW, VH, gs) {
  const tr = gs.transition;
  if (!tr) return;
  const maxR = Math.hypot(VW, VH);
  const r = tr.t < tr.half ? maxR * (1 - tr.t / tr.half) : maxR * (tr.t - tr.half) / (tr.total - tr.half);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, VW, VH);
  ctx.arc(tr.cx, tr.cy, Math.max(0, r), 0, Math.PI * 2, true);
  ctx.fillStyle = '#05030a';
  ctx.fill();
  if (r > 2) {
    ctx.strokeStyle = 'rgba(125, 255, 154, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tr.cx, tr.cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (tr.t >= tr.half) {
    ctx.globalAlpha = Math.min(1, (tr.t - tr.half) / 0.3);
    text(ctx, `LEVEL ${tr.next + 1}`, VW / 2, VH / 2, 14, '#7dff9a');
  }
  ctx.restore();
}
