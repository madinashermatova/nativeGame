import {T} from '../config.js';
import {solid} from '../world.js';
import {R, cached, glow, drawParticles} from '../gfx.js';
import {drawBoy} from '../renderer.js';
import {GRAVITY, GRAVITY_SECTIONS} from './gravity.js';

// Level 8 is a neon laboratory drawn entirely in code: baked panel tiles, glowing portals,
// rail-mounted saws, laser walls and crawler bots.
const CYAN = '#38f0ff', MAGENTA = '#ff3ad8', RED = '#ff3a4a';
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// ---------- tiles ----------
function paintTile(g, kind, v) {
  const r = rng(v * 523 + kind.charCodeAt(0));
  g.fillStyle = '#0d1424'; g.fillRect(0, 0, T, T);
  g.fillStyle = '#16213a'; g.fillRect(1, 1, T - 2, T - 2);
  g.fillStyle = '#1d2c4b'; g.fillRect(1, 1, T - 2, 1);
  g.fillStyle = '#0a101d'; g.fillRect(1, T - 2, T - 2, 1);
  if (r() < .5) { // circuit trace
    g.fillStyle = 'rgba(56,240,255,.28)';
    const x = 3 + Math.floor(r() * 8);
    g.fillRect(x, 3, 1, 6); g.fillRect(x, 9, 4, 1);
    g.fillStyle = CYAN; g.fillRect(x + 4, 9, 1, 1);
  }
  g.fillStyle = '#2c3c60'; g.fillRect(2, 2, 1, 1); g.fillRect(T - 3, T - 3, 1, 1);
  if (kind === 'cap') { g.fillStyle = CYAN; g.fillRect(0, 0, T, 2); g.fillStyle = '#b8fbff'; g.fillRect(0, 0, T, 1); }
  else if (kind === 'ceil') { g.fillStyle = CYAN; g.fillRect(0, T - 2, T, 2); g.fillStyle = '#b8fbff'; g.fillRect(0, T - 1, T, 1); }
}

const tileCanvas = (kind, v) => cached(`grav-${kind}-${v}`, T, T, g => paintTile(g, kind, v));

function drawTiles(ctx, vw, cx) {
  const c0 = Math.max(0, Math.floor(cx / T)), c1 = Math.min(GRAVITY.cols - 1, Math.ceil((cx + vw) / T));
  for (let r = 0; r < GRAVITY.rows; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!solid(c, r)) continue;
      const kind = !solid(c, r - 1) ? 'cap' : !solid(c, r + 1) ? 'ceil' : 'panel';
      const tile = tileCanvas(kind, hash(c, r) % 5), x = c * T - cx, y = r * T;
      if (tile) ctx.drawImage(tile, x, y); else R(ctx, x, y, T, T, '#16213a');
    }
  }
}

// ---------- background ----------
export function drawGravityBackground(ctx, vw, cx, gs) {
  const f = gs.gravity, time = f ? f.time : 0, flip = f ? f.flip : 0;
  const grad = ctx.createLinearGradient(0, 0, 0, 270);
  grad.addColorStop(0, '#050816'); grad.addColorStop(.5, '#0b1030'); grad.addColorStop(1, '#14082a');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, vw, 270);

  // Stars.
  for (let i = 0; i < 60; i++) {
    const h = hash(i), x = (((h % 1000) / 1000) * (vw + 300) - cx * .04) % (vw + 300), y = (h >>> 10) % 270;
    const px = x < 0 ? x + vw + 300 : x;
    ctx.globalAlpha = .3 + .5 * Math.abs(Math.sin(time * 1.5 + i));
    R(ctx, px, y, 1, 1, '#ffffff');
  }
  ctx.globalAlpha = 1;
  // Ringed planet.
  const px = ((600 - cx * .08) % (vw + 500) + vw + 500) % (vw + 500) - 150;
  ctx.fillStyle = '#1c1650'; ctx.beginPath(); ctx.arc(px, 90, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2278'; ctx.beginPath(); ctx.arc(px - 10, 80, 40, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,58,216,.45)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(px, 90, 86, 16, -.3, 0, Math.PI * 2); ctx.stroke();
  // Perspective grid drifting past.
  ctx.strokeStyle = `rgba(56,240,255,${.07 + flip * .2})`; ctx.lineWidth = 1;
  const gx = -((cx * .3) % 48);
  ctx.beginPath();
  for (let x = gx; x < vw + 48; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, 270); }
  for (let y = 0; y < 270; y += 36) { ctx.moveTo(0, y + ((time * 6) % 36)); ctx.lineTo(vw, y + ((time * 6) % 36)); }
  ctx.stroke();
  // Slowly turning hexagons.
  for (let i = 0; i < 5; i++) {
    const x = ((i * 190 - cx * .2) % (vw + 200) + vw + 200) % (vw + 200) - 80, y = 50 + (i * 53) % 170, r = 14 + (i % 3) * 6;
    ctx.strokeStyle = 'rgba(255,58,216,.16)'; ctx.beginPath();
    for (let k = 0; k < 6; k++) ctx.lineTo(x + Math.cos(time * .3 * (i % 2 ? 1 : -1) + k * 1.047) * r, y + Math.sin(time * .3 * (i % 2 ? 1 : -1) + k * 1.047) * r);
    ctx.closePath(); ctx.stroke();
  }
}

// ---------- objects ----------
function drawGates(ctx, f, cx, p, time) {
  const next = -(p?.gravDir ?? 1); // direction gravity will have after crossing
  for (const g of f.gates) {
    const x = g.x - cx;
    if (x < -30 || x > 520) continue;
    const a = .28 + .12 * Math.sin(time * 6 + g.x) + g.flash * .5;
    const grad = ctx.createLinearGradient(x, 0, x + g.w, 0);
    grad.addColorStop(0, `rgba(255,58,216,${a})`); grad.addColorStop(.5, `rgba(180,250,255,${a + .2})`); grad.addColorStop(1, `rgba(56,240,255,${a})`);
    ctx.fillStyle = grad; ctx.fillRect(x, g.y, g.w, g.h);
    // chevrons streaming towards the new gravity
    ctx.strokeStyle = `rgba(255,255,255,${.55 + g.flash * .4})`; ctx.lineWidth = 1.5;
    for (let y = -((time * 50 * next) % 30); y < g.h + 30; y += 30) {
      const yy = g.y + (next > 0 ? y : g.h - y);
      if (yy < g.y || yy > g.y + g.h) continue;
      ctx.beginPath(); ctx.moveTo(x + 3, yy - 3 * next); ctx.lineTo(x + 8, yy + 3 * next); ctx.lineTo(x + 13, yy - 3 * next); ctx.stroke();
    }
    R(ctx, x - 2, g.y, g.w + 4, 4, MAGENTA); R(ctx, x - 2, g.y + g.h - 4, g.w + 4, 4, CYAN);
    glow(ctx, x + g.w / 2, g.y + g.h / 2, 60, MAGENTA, .12 + g.flash * .3);
  }
}

function drawSpikes(ctx, f, cx, time) {
  ctx.fillStyle = RED;
  for (const s of f.spikes) {
    const x = s.x - cx;
    if (x < -20 || x > 500) continue;
    ctx.beginPath();
    if (s.up) { ctx.moveTo(x, s.y + s.h); ctx.lineTo(x + s.w / 2, s.y); ctx.lineTo(x + s.w, s.y + s.h); }
    else { ctx.moveTo(x, s.y); ctx.lineTo(x + s.w / 2, s.y + s.h); ctx.lineTo(x + s.w, s.y); }
    ctx.fill();
    glow(ctx, x + s.w / 2, s.up ? s.y + 5 : s.y + 5, 14, RED, .25 + .1 * Math.sin(time * 5 + s.x));
  }
}

function drawSaws(ctx, f, cx) {
  for (const s of f.saws) {
    const x = s.x - cx;
    if (x < -30 || x > 510) continue;
    R(ctx, x - .5, s.mid - s.amp, 1, s.amp * 2, 'rgba(255,58,216,.35)');
    R(ctx, x - 3, s.mid - s.amp - 3, 6, 3, '#4a5a80'); R(ctx, x - 3, s.mid + s.amp, 6, 3, '#4a5a80');
    ctx.save(); ctx.translate(x, s.y); ctx.rotate(s.angle);
    ctx.fillStyle = '#c8d4f0'; ctx.beginPath();
    for (let k = 0; k < 16; k++) { const r = k % 2 ? s.r - 2.5 : s.r + 1.5, a = k * Math.PI / 8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = MAGENTA; ctx.beginPath(); ctx.arc(0, 0, s.r * .55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a101d'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    glow(ctx, x, s.y, 26, MAGENTA, .3);
  }
}

function drawLasers(ctx, f, cx, time) {
  for (const l of f.lasers) {
    const x = l.x - cx;
    if (x < -30 || x > 510) continue;
    R(ctx, x - 4, GRAVITY.ceilY, l.w + 8, 6, '#4a5a80'); R(ctx, x - 4, GRAVITY.floorY - 6, l.w + 8, 6, '#4a5a80');
    R(ctx, x, GRAVITY.ceilY + 6, l.w, 2, l.mode === 'off' ? '#223' : RED); R(ctx, x, GRAVITY.floorY - 8, l.w, 2, l.mode === 'off' ? '#223' : RED);
    if (l.mode === 'warning') {
      ctx.fillStyle = Math.floor(time * 16) % 2 ? 'rgba(255,58,74,.8)' : 'rgba(255,58,74,.2)';
      for (let y = GRAVITY.ceilY + 8; y < GRAVITY.floorY - 8; y += 8) ctx.fillRect(x + 1.5, y, 1, 4);
    } else if (l.mode === 'active') {
      ctx.fillStyle = 'rgba(255,58,74,.35)'; ctx.fillRect(x - 3, GRAVITY.ceilY + 8, l.w + 6, GRAVITY.floorY - GRAVITY.ceilY - 16);
      ctx.fillStyle = '#ffd0d0'; ctx.fillRect(x + 1, GRAVITY.ceilY + 8, l.w - 2, GRAVITY.floorY - GRAVITY.ceilY - 16);
      glow(ctx, x + 2, 136, 80, RED, .3);
    }
  }
}

function drawCrawlers(ctx, f, cx) {
  for (const c of f.crawlers) {
    const x = c.x - cx;
    if (x < -30 || x > 510) continue;
    const s = c.floor ? 1 : -1, baseY = c.floor ? c.y + c.h : c.y; // surface line
    ctx.strokeStyle = '#8ea0d0'; ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) for (const side of [-1, 1]) {
      const lx = x + c.w / 2 + side * (3 + k * 2), step = Math.sin(c.anim * 10 + k * 2 + (side > 0 ? 1.5 : 0)) * 2;
      ctx.beginPath(); ctx.moveTo(lx, baseY - s * 4); ctx.lineTo(lx + side * 3 + step, baseY - s * 7); ctx.lineTo(lx + side * 4 + step, baseY); ctx.stroke();
    }
    ctx.fillStyle = '#2a3658'; ctx.fillRect(x + 1, c.floor ? c.y : c.y + 2, c.w - 2, c.h - 2);
    ctx.fillStyle = '#4a5a8a'; ctx.fillRect(x + 1, c.floor ? c.y : c.y + c.h - 4, c.w - 2, 2);
    R(ctx, x + (c.dir > 0 ? c.w - 5 : 2), c.floor ? c.y + 2 : c.y + c.h - 5, 3, 3, RED);
    glow(ctx, x + (c.dir > 0 ? c.w - 3 : 3), c.floor ? c.y + 3 : c.y + c.h - 4, 10, RED, .5);
  }
}

function drawCheckpoints(ctx, f, cx, time) {
  for (const c of f.checkpoints) {
    const x = c.x + 6 - cx, y = c.y + 14;
    R(ctx, x - 5, y - 4, 10, 4, '#2c3c60'); R(ctx, x - 1, y - 16, 2, 12, '#2c3c60');
    ctx.strokeStyle = c.active ? CYAN : '#3a4a70'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y - 14, 5, 2 + Math.sin(time * 4) * 1.2, 0, 0, Math.PI * 2); ctx.stroke();
    if (c.active) glow(ctx, x, y - 14, 30, CYAN, .45);
  }
}

function drawExit(ctx, e, cx, time) {
  const x = e.x - cx, cxm = x + e.w / 2;
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(56,240,255,${.7 - k * .2})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cxm, e.y + e.h - 4 - ((time * 20 + k * 16) % 44), 14 - k * 2, 4, 0, 0, Math.PI * 2); ctx.stroke();
  }
  R(ctx, x, e.y + e.h - 3, e.w, 3, CYAN);
  glow(ctx, cxm, e.y + e.h / 2, 60, '#b8fbff', .45 + .15 * Math.sin(time * 3));
}

function sign(ctx, text, wx, y, cx) {
  const w = text.length * 3.4 + 8, x = wx - cx;
  R(ctx, x - 1, y - 1, w + 2, 12, CYAN); R(ctx, x, y, w, 10, '#0b1030');
  ctx.font = '5px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#b8fbff'; ctx.fillText(text, x + 4, y + 7);
}

export function drawGravityWorld(ctx, vw, cx, gs) {
  const f = gs.gravity;
  if (!f) return;
  const time = f.time, rcx = Math.round(cx), p = gs.p;
  drawTiles(ctx, vw, rcx);
  // Pulsing neon glow along both surfaces.
  const pulse = .5 + .3 * Math.sin(time * 3);
  for (const [y, dir] of [[GRAVITY.ceilY, 1], [GRAVITY.floorY, -1]]) {
    const grad = ctx.createLinearGradient(0, y, 0, y + dir * 14);
    grad.addColorStop(0, `rgba(56,240,255,${.35 * pulse})`); grad.addColorStop(1, 'rgba(56,240,255,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, dir > 0 ? y : y - 14, vw, 14);
  }
  sign(ctx, 'O - TORTISH DARVOZASI', 230, 120, rcx);
  sign(ctx, 'SHIFTDA HAM YURA OLASAN', 345, 200, rcx);
  drawGates(ctx, f, rcx, p, time);
  drawSpikes(ctx, f, rcx, time);
  drawCheckpoints(ctx, f, rcx, time);
  drawExit(ctx, f.exit, rcx, time);
  drawSaws(ctx, f, rcx);
  drawLasers(ctx, f, rcx, time);
  drawCrawlers(ctx, f, rcx);
  drawBoy(ctx, p, rcx, gs.anim, gs);
  drawParticles(ctx, f.particles, {
    cx: rcx, visible: a => a.x > rcx - 20 && a.x < rcx + vw + 20,
    isSoft: () => false, maxAlpha: () => .9, color: a => a.type === 'streak' ? '#b8fbff' : (a.x * 7 | 0) % 2 ? CYAN : MAGENTA
  });
  if (f.flip > 0) { ctx.fillStyle = `rgba(184,251,255,${f.flip * .22})`; ctx.fillRect(0, 0, vw, 270); }

  // Gravity indicator under the HUD bar.
  const down = (p?.gravDir ?? 1) === 1;
  ctx.fillStyle = CYAN; ctx.beginPath();
  if (down) { ctx.moveTo(vw / 2 - 5, 21); ctx.lineTo(vw / 2 + 5, 21); ctx.lineTo(vw / 2, 28); }
  else { ctx.moveTo(vw / 2 - 5, 28); ctx.lineTo(vw / 2 + 5, 28); ctx.lineTo(vw / 2, 21); }
  ctx.fill();
  if (f.sectionTime < 3.2) {
    const a = Math.min(1, f.sectionTime * 2, (3.2 - f.sectionTime) * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(GRAVITY_SECTIONS[f.section].name, vw / 2 + 1, 51);
    ctx.fillStyle = '#b8fbff'; ctx.fillText(GRAVITY_SECTIONS[f.section].name, vw / 2, 50);
    ctx.restore();
  }
}
