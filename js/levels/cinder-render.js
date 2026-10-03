import {T} from '../config.js';
import {solid} from '../world.js';
import {R, cached, glow, drawParticles} from '../gfx.js';
import {drawBoy} from '../renderer.js';
import {CINDER, CINDER_SECTIONS, barCircles} from './cinder.js';

// Level 7 is drawn entirely in code: baked scorched-brick tiles, animated traps and a lava
// field. World objects are drawn in world coordinates under a -camY translation.
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const flicker = (time, k = 0) => .75 + .25 * Math.sin(time * 14 + k * 2.3) * Math.sin(time * 5.1 + k);

// ---------- tiles ----------
const BRICKS = ['#3a2622', '#33211e', '#412a25', '#2d1c1a', '#3d2822'];

function paintTile(g, kind, v) {
  const r = rng(v * 811 + kind.charCodeAt(0) * 17);
  g.fillStyle = '#150b0a';
  g.fillRect(0, 0, T, T);
  for (let row = 0; row < 2; row++) {
    const off = (row + v) % 2 ? 4 : 0;
    for (let bx = -off; bx < T; bx += 8) {
      const x0 = Math.max(0, bx), x1 = Math.min(T, bx + 8);
      g.fillStyle = BRICKS[Math.floor(r() * BRICKS.length)];
      g.fillRect(x0 + 1, row * 8 + 1, x1 - x0 - 1, 6);
      g.fillStyle = 'rgba(255,140,60,.1)';
      g.fillRect(x0 + 1, row * 8 + 1, x1 - x0 - 1, 1);
    }
  }
  if (r() < .45) { // glowing fissure
    g.fillStyle = '#ff6a1c';
    const x = 2 + Math.floor(r() * 11);
    g.fillRect(x, 3, 1, 3); g.fillRect(x + 1, 6, 1, 3); g.fillRect(x, 9, 1, 2);
  }
  if (kind === 'cap') {
    g.fillStyle = '#5a3b32'; g.fillRect(0, 0, T, 3);
    g.fillStyle = '#7a5043'; g.fillRect(0, 0, T, 1);
    g.fillStyle = '#ff7a2a'; if (r() < .5) g.fillRect(Math.floor(r() * 12), 3, 3, 1);
  } else if (kind === 'ceil') {
    g.fillStyle = '#0c0605'; g.fillRect(0, T - 3, T, 3);
  }
}

const tileCanvas = (kind, v) => cached(`cinder-${kind}-${v}`, T, T, g => paintTile(g, kind, v));

function drawTiles(ctx, vw, cx, cy) {
  const c0 = Math.max(0, Math.floor(cx / T)), c1 = Math.min(CINDER.cols - 1, Math.ceil((cx + vw) / T));
  const r0 = Math.max(0, Math.floor(cy / T)), r1 = Math.min(CINDER.rows - 1, Math.ceil((cy + 270) / T));
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!solid(c, r)) continue;
      const kind = !solid(c, r - 1) ? 'cap' : !solid(c, r + 1) ? 'ceil' : 'brick';
      const tile = tileCanvas(kind, hash(c, r) % 6), x = c * T - cx, y = r * T;
      if (tile) ctx.drawImage(tile, x, y); else R(ctx, x, y, T, T, '#3a2622');
    }
  }
}

// ---------- background ----------
export function drawCinderBackground(ctx, vw, cx, gs) {
  const f = gs.cinder, cy = gs.camY || 0, time = f ? f.time : 0;
  const grad = ctx.createLinearGradient(0, 0, 0, 270);
  grad.addColorStop(0, '#060309'); grad.addColorStop(1, '#241008');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, vw, 270);

  // Far chimneys and arches drifting slowly past as the camera climbs.
  const step = 210, shift = cy * .25;
  for (let i = -1; i < 3; i++) {
    const idx = Math.floor(shift / step) + i, y = i * step - (shift % step);
    const h = hash(idx);
    ctx.fillStyle = '#0d0608';
    ctx.fillRect(60 + h % 40 - cx * .1, y, 34, step);
    ctx.fillRect(vw - 120 - h % 50 - cx * .1, y + 40, 46, step);
    ctx.beginPath(); ctx.arc(vw / 2 + (h % 90) - 45, y + 150, 62, Math.PI, 0); ctx.lineTo(vw / 2 + (h % 90) + 17, y + 270); ctx.lineTo(vw / 2 + (h % 90) - 107, y + 270); ctx.fill();
  }
  // Smoke banks.
  for (let i = 0; i < 6; i++) {
    const x = ((i * 131 + time * 8) % (vw + 200)) - 100, y = ((i * 79 - cy * .4) % 340 + 340) % 340 - 40;
    glow(ctx, x, y, 90, '#3a2a30', .12);
  }
  // Heat from below: the closer the lava, the redder the whole screen.
  if (f && f.lava.active) {
    const reach = Math.max(0, 1 - (f.lava.y - (cy + 270)) / 500);
    const heat = ctx.createLinearGradient(0, 270, 0, 60);
    heat.addColorStop(0, `rgba(255,70,10,${.5 * reach})`); heat.addColorStop(1, 'rgba(255,70,10,0)');
    ctx.fillStyle = heat; ctx.fillRect(0, 0, vw, 270);
  }
}

// ---------- traps ----------
function flameShape(ctx, x, y, w, h, time, k, dir = -1) { // vertical flame, tip at y + dir*h
  const wob = Math.sin(time * 18 + k) * w * .25;
  for (const [color, s] of [['#ff5a10', 1], ['#ffb02e', .66], ['#fff2a0', .32]]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w * s, y);
    ctx.quadraticCurveTo(x - w * .7 * s, y + dir * h * .55, x + wob * s, y + dir * h * (s === 1 ? 1 : .8 * s + .2));
    ctx.quadraticCurveTo(x + w * .7 * s, y + dir * h * .55, x + w * s, y);
    ctx.closePath(); ctx.fill();
  }
}

function drawSurfaces(ctx, f, cx, time) {
  for (const s of f.surfaces) {
    if (s.collapsed) continue;
    const x = Math.round(s.x - cx + (s.age > 0 ? Math.sin(time * 80) * 1.2 : 0)), y = Math.round(s.y);
    if (s.kind === 'spring') {
      const squash = s.press > 0 ? 4 : 0;
      R(ctx, x, y, s.w, 8, '#2a2226'); R(ctx, x + 2, y - 2, s.w - 4, 2, '#d89030');
      ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 2; ctx.beginPath();
      const top = y - 12 + squash;
      ctx.moveTo(x + 6, y - 2); for (let k = 0; k < 4; k++) ctx.lineTo(x + (k % 2 ? 8 : s.w - 8), y - 2 - (k + 1) * (10 - squash) / 4);
      ctx.stroke();
      R(ctx, x + 2, top - 3, s.w - 4, 3, s.press > 0 ? '#fff0a0' : '#ff7a2a');
      continue;
    }
    if (s.kind === 'moving') {
      R(ctx, x, y, s.w, 8, '#3a3a46'); R(ctx, x, y, s.w, 2, '#6a6a7a'); R(ctx, x, y + 6, s.w, 2, '#1c1c24');
      for (let k = 0; k < s.w; k += 10) R(ctx, x + k, y + 3, 5, 2, k % 20 ? '#e8b020' : '#2a2a30');
      for (const fx of [x + 16, x + s.w - 16]) flameShape(ctx, fx, y + 8, 3, 8 * flicker(time, fx), time, fx, 1);
      continue;
    }
    const cr = s.kind === 'crumble';
    R(ctx, x, y, s.w, 8, cr ? '#5a4640' : '#4a3430'); R(ctx, x, y, s.w, 2, cr ? '#8a6c60' : '#7a5648'); R(ctx, x, y + 6, s.w, 2, '#241310');
    for (let k = 6; k < s.w - 4; k += 14) R(ctx, x + k, y + 3, 6, 1, `rgba(255,${100 + (hash(k, s.id) % 60)},30,${.5 * flicker(time, k)})`);
    if (cr) {
      ctx.strokeStyle = s.age > 0 ? '#ffb040' : '#1c0e0a'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x + s.w * .3, y); ctx.lineTo(x + s.w * .4, y + 4); ctx.lineTo(x + s.w * .33, y + 8);
      ctx.moveTo(x + s.w * .7, y); ctx.lineTo(x + s.w * .62, y + 5); ctx.stroke();
      if (s.age > 0) glow(ctx, x + s.w / 2, y + 4, 40, '#ff7a20', .35);
    }
  }
}

function drawJets(ctx, f, cx, time) {
  for (const j of f.jets) {
    const left = j.side === 'L', nx = (left ? 16 : CINDER.width - 16) - cx, dir = left ? 1 : -1;
    R(ctx, left ? nx : nx - 12, j.y - 2, 12, j.h + 4, '#2c2630'); R(ctx, left ? nx + 10 : nx - 14, j.y, 4, j.h, '#15111a');
    if (j.mode === 'warning') {
      const blink = Math.floor(time * 12) % 2;
      R(ctx, left ? nx + 2 : nx - 10, j.y + 5, 8, 3, blink ? '#ff3020' : '#701008');
      flameShape(ctx, nx + dir * 14, j.y + 7, 3, 6 + Math.sin(time * 30) * 2, time, j.y);
      glow(ctx, nx + dir * 20, j.y + 7, 30, '#ff4020', .35 * flicker(time));
    } else if (j.mode === 'active') {
      ctx.save(); ctx.translate(nx + dir * 12, j.y + 7); ctx.scale(dir, 1);
      for (const [color, k] of [['#ff5a10', 1], ['#ffb02e', .6], ['#fff2a0', .3]]) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -7 * k);
        const len = j.len * (k === 1 ? 1 : .8 * k + .2);
        ctx.quadraticCurveTo(len * .5, -8 * k + Math.sin(time * 20) * 2, len, Math.sin(time * 17 + k) * 3);
        ctx.quadraticCurveTo(len * .5, 8 * k + Math.sin(time * 22) * 2, 0, 7 * k); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      glow(ctx, nx + dir * j.len / 2, j.y + 7, j.len * .6, '#ff6a20', .3 * flicker(time));
    }
  }
}

function drawGeysers(ctx, f, cx, time) {
  for (const g of f.geysers) {
    const x = g.x - cx;
    R(ctx, x - 1, g.y, g.w + 2, 3, '#1a1012'); for (let k = 0; k < 4; k++) R(ctx, x + 1 + k * 4, g.y, 2, 3, '#ff6a1c');
    if (g.mode === 'warning') {
      for (let k = 0; k < 3; k++) { const t = (time * 2 + k * .33) % 1; R(ctx, x + 3 + k * 4, g.y - 2 - t * 10, 2, 2, '#ffb040'); }
      glow(ctx, x + 8, g.y - 2, 22, '#ff5a10', .4);
    } else if (g.mode === 'active') {
      const grad = ctx.createLinearGradient(0, g.y, 0, g.y - g.height);
      grad.addColorStop(0, '#fff0a0'); grad.addColorStop(.35, '#ff8a20'); grad.addColorStop(1, 'rgba(255,60,10,.1)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(x, g.y);
      for (let k = 0; k <= 6; k++) ctx.lineTo(x + Math.sin(time * 20 + k) * 1.5, g.y - (g.height * k) / 6);
      ctx.lineTo(x + g.w, g.y - g.height);
      for (let k = 6; k >= 0; k--) ctx.lineTo(x + g.w + Math.sin(time * 18 + k * 2) * 1.5, g.y - (g.height * k) / 6);
      ctx.fill();
      glow(ctx, x + 8, g.y - g.height / 2, 50, '#ff7a20', .35);
    }
  }
}

function drawBars(ctx, f, cx) {
  for (const b of f.bars) {
    const px = b.px - cx, ex = px + Math.cos(b.angle) * b.len, ey = b.py + Math.sin(b.angle) * b.len;
    ctx.strokeStyle = 'rgba(255,120,40,.25)'; ctx.lineWidth = 8; ctx.beginPath(); // motion trail
    ctx.arc(px, b.py, b.len, b.angle - .7, b.angle - .1); ctx.stroke();
    ctx.strokeStyle = '#4a4450'; ctx.lineWidth = 3; ctx.setLineDash([4, 2]);
    ctx.beginPath(); ctx.moveTo(px, b.py); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
    R(ctx, px - 5, b.py - 5, 10, 10, '#2c2630'); R(ctx, px - 2, b.py - 2, 4, 4, '#ff7a2a');
    for (const c of barCircles(b)) {
      glow(ctx, c.x - cx, c.y, c.r * 4, '#ff6a20', .5);
      ctx.fillStyle = '#ff8a20'; ctx.beginPath(); ctx.arc(c.x - cx, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(c.x - cx, c.y, c.r * .45, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawBoulders(ctx, f, cx, cy, time) {
  for (const b of f.boulders) {
    const x = b.x - cx;
    if (b.mode === 'warning') {
      const a = .12 + .12 * Math.sin(time * 24);
      ctx.fillStyle = `rgba(255,40,20,${a})`; ctx.fillRect(x - 2, cy, b.w + 4, 270);
      ctx.fillStyle = Math.floor(time * 10) % 2 ? '#ff4030' : '#a01810';
      ctx.beginPath(); ctx.moveTo(x + 11, cy + 22); ctx.lineTo(x - 1, cy + 4); ctx.lineTo(x + 23, cy + 4); ctx.fill();
      R(ctx, x + 10, cy + 8, 2, 7, '#fff');
    } else if (b.mode === 'fall') {
      const y = b.y + 11;
      for (let k = 1; k < 5; k++) { ctx.globalAlpha = .35 - k * .07; R(ctx, x + 6, y - 11 - k * 9, 10, 8, '#ff7a20'); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a2824'; ctx.beginPath(); ctx.arc(x + 11, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ff7a20'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, y - 3); ctx.lineTo(x + 10, y + 1); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 14, y - 8); ctx.lineTo(x + 16, y); ctx.stroke();
      glow(ctx, x + 11, y, 28, '#ff6a20', .5);
    }
  }
}

function drawLava(ctx, f, cx, cy, vw, time) {
  const y = f.lava.y;
  if (y > cy + 280) return;
  const grad = ctx.createLinearGradient(0, y, 0, y + 90);
  grad.addColorStop(0, '#ffb02e'); grad.addColorStop(.12, '#ff6a14'); grad.addColorStop(1, '#8a1004');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(0, cy + 290);
  for (let x = 0; x <= vw + 8; x += 8) ctx.lineTo(x, y + Math.sin((x + cx) * .06 + time * 2.2) * 2 + Math.sin((x + cx) * .13 - time * 3) * 1);
  ctx.lineTo(vw + 8, cy + 290); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,150,.5)';
  for (let x = 0; x < vw; x += 24) ctx.fillRect(x + (hash(Math.floor((x + cx) / 24)) % 12), y + 3 + Math.sin(time * 2 + x) * 1, 10, 1);
  glow(ctx, vw / 2, y - 6, 260, '#ff5a10', .22);
}

function drawFireballs(ctx, f, cx, time) {
  for (const b of f.fireballs) {
    const x = b.x - cx;
    if (b.state === 'warning') {
      const r = 4 + (b.t / .7) * 8;
      ctx.strokeStyle = `rgba(255,200,80,${1 - b.t / .7})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, b.y, r, Math.PI, 0); ctx.stroke();
      glow(ctx, x, b.y - 3, 22, '#ff7a20', .5);
      continue;
    }
    for (let k = 1; k < 5; k++) { ctx.globalAlpha = .4 - k * .08; ctx.fillStyle = '#ff7a20'; ctx.beginPath(); ctx.arc(x, b.y - b.vy * .012 * k, 5 - k, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff8a20'; ctx.beginPath(); ctx.arc(x, b.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(x, b.y, 2.5, 0, Math.PI * 2); ctx.fill();
    glow(ctx, x, b.y, 24, '#ff6a20', .6 * flicker(time));
  }
}

function drawCheckpoints(ctx, f, cx, time) {
  f.checkpoints.forEach((c, i) => {
    const x = c.x + 6 - cx, y = c.y + 14;
    R(ctx, x - 6, y - 3, 12, 3, '#2c2630'); R(ctx, x - 1, y - 10, 2, 7, '#2c2630'); R(ctx, x - 6, y - 12, 12, 3, '#4a4450');
    if (c.active) { flameShape(ctx, x, y - 12, 4, 11 * flicker(time, i), time, i); glow(ctx, x, y - 16, 40, '#ff8a28', .4); }
  });
}

function drawExit(ctx, e, cx, time) {
  const x = e.x - cx, y = e.y;
  R(ctx, x - 4, y - 4, e.w + 8, e.h + 4, '#3a2c34');
  ctx.fillStyle = '#0a0608'; ctx.beginPath(); ctx.moveTo(x, y + e.h); ctx.lineTo(x, y + 10); ctx.arc(x + e.w / 2, y + 10, e.w / 2, Math.PI, 0); ctx.lineTo(x + e.w, y + e.h); ctx.fill();
  const pulse = .6 + .25 * Math.sin(time * 2);
  ctx.fillStyle = `rgba(200,255,210,${pulse * .55})`; ctx.fillRect(x + 6, y + 10, e.w - 12, e.h - 10);
  glow(ctx, x + e.w / 2, y + e.h / 2, 70, '#c8ffd0', .5 * pulse);
}

function drawHotWalls(ctx, vw, cx, cy, time) {
  for (const [x, dir] of [[16 - cx, -1], [CINDER.width - 16 - cx, 1]]) {
    const grad = ctx.createLinearGradient(x, 0, x - dir * 14, 0);
    grad.addColorStop(0, `rgba(255,110,30,${.55 * flicker(time)})`); grad.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.fillStyle = grad; ctx.fillRect(dir > 0 ? x - 14 : x, cy, 14, 270);
    R(ctx, dir > 0 ? x - 1 : x, cy, 1, 270, 'rgba(255,200,100,.7)');
  }
}

function hud(ctx, vw, f, p) {
  const top = 24, bottom = 250, x = vw - 7;
  R(ctx, x, top, 3, bottom - top, 'rgba(255,255,255,.15)');
  const pos = y => top + (bottom - top) * (y / CINDER.height);
  R(ctx, x - 1, pos(f.lava.y), 5, bottom - pos(f.lava.y), 'rgba(255,90,20,.8)');
  R(ctx, x - 2, pos(p.y) - 1, 7, 3, '#ffffff');
  R(ctx, x - 2, top - 2, 7, 2, '#c8ffd0');
}

export function drawCinderWorld(ctx, vw, cx, gs) {
  const f = gs.cinder;
  if (!f) return;
  const time = f.time, cy = Math.round(gs.camY || 0), rcx = Math.round(cx);
  ctx.save();
  ctx.translate(0, -cy);
  drawTiles(ctx, vw, rcx, cy);
  drawHotWalls(ctx, vw, rcx, cy, time);
  drawSurfaces(ctx, f, rcx, time);
  drawJets(ctx, f, rcx, time);
  drawGeysers(ctx, f, rcx, time);
  drawCheckpoints(ctx, f, rcx, time);
  drawExit(ctx, f.exit, rcx, time);
  drawBars(ctx, f, rcx);
  drawBoulders(ctx, f, rcx, cy, time);
  ctx.save(); ctx.translate(0, cy); drawBoy(ctx, gs.p, rcx, gs.anim, gs); ctx.restore();
  drawFireballs(ctx, f, rcx, time);
  drawLava(ctx, f, rcx, cy, vw, time);
  drawParticles(ctx, f.particles, {
    cx: rcx, visible: a => a.y > cy - 20 && a.y < cy + 290,
    isSoft: a => a.type === 'smoke', maxAlpha: (a, soft) => soft ? .25 : .9,
    color: a => a.type === 'ember' ? '#ff9a2e' : a.type === 'spark' ? '#ffd060' : a.type === 'rock' ? '#5a3b32' : '#3a2a30'
  });
  ctx.restore();

  // Screen-space overlays.
  const p = gs.p, gap = f.lava.y - (p.y + p.h);
  if (f.lava.active && gap < 180) {
    const a = (1 - gap / 180) * (.18 + .1 * Math.sin(time * 14));
    ctx.fillStyle = `rgba(255,40,10,${Math.max(0, a)})`; ctx.fillRect(0, 0, vw, 270);
  }
  hud(ctx, vw, f, p);
  if (f.sectionTime < 3.2) {
    const a = Math.min(1, f.sectionTime * 2, (3.2 - f.sectionTime) * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(CINDER_SECTIONS[f.section].name, vw / 2 + 1, 41);
    ctx.fillStyle = '#ffc890'; ctx.fillText(CINDER_SECTIONS[f.section].name, vw / 2, 40);
    ctx.restore();
  }
}
