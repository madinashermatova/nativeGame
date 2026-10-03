import {T} from '../config.js';
import {solid} from '../world.js';
import {R, cached, makeCanvas, glow, softDot, drawParticles} from '../gfx.js';
import {drawBoy} from '../renderer.js';
import {MYCO, MYCO_SECTIONS} from './myco.js';

// Level 9 is drawn in code with a bioluminescent palette that reacts to the player: mushrooms
// flare when brushed, and the whole cave shifts from teal and violet towards red as a chaser closes in.
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const parse = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const [r1, g1, b1] = parse(a), [r2, g2, b2] = parse(b); return `rgb(${r1 + (r2 - r1) * t | 0},${g1 + (g2 - g1) * t | 0},${b1 + (b2 - b1) * t | 0})`; };
const hex = (a, b, t) => { // like mix, but returns #rrggbb so it can be re-mixed and used as a glow texture key
  const [r1, g1, b1] = parse(a), [r2, g2, b2] = parse(b), h = v => Math.round(v).toString(16).padStart(2, '0');
  return '#' + h(r1 + (r2 - r1) * t) + h(g1 + (g2 - g1) * t) + h(b1 + (b2 - b1) * t);
};
const TEAL = '#35ffd0', VIOLET = '#a060ff', RED = '#ff2850', ICE = '#b890ff';
// Quantised so the glow textures stay cached.
const tint = (base, danger) => hex(base, RED, Math.round(danger * 6) / 6);

// ---------- tiles ----------
function paintTile(g, kind, v) {
  const r = rng(v * 677 + kind.charCodeAt(0));
  g.fillStyle = '#0a1018'; g.fillRect(0, 0, T, T);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = ['#111b26', '#0e1721', '#152230'][Math.floor(r() * 3)];
    g.fillRect(Math.floor(r() * 10), Math.floor(r() * 10), 4 + Math.floor(r() * 6), 3 + Math.floor(r() * 5));
  }
  if (r() < .5) { g.fillStyle = 'rgba(53,255,208,.35)'; const x = 2 + Math.floor(r() * 11); g.fillRect(x, 2, 1, 4); g.fillRect(x + 1, 6, 1, 3); }
  if (kind === 'cap') {
    g.fillStyle = '#16402e'; g.fillRect(0, 0, T, 3);
    g.fillStyle = '#2a8a5a'; g.fillRect(0, 0, T, 1);
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(106,255,216,.8)'; g.fillRect(Math.floor(r() * 15), 1 + Math.floor(r() * 2), 1, 1); }
  } else if (kind === 'ceil') {
    g.fillStyle = '#06090e'; g.fillRect(0, T - 3, T, 3);
    if (r() < .4) { g.fillStyle = '#0a1018'; g.fillRect(Math.floor(r() * 12), T - 5, 3, 3); }
  }
}
const tileCanvas = (kind, v) => cached(`myco-${kind}-${v}`, T, T, g => paintTile(g, kind, v));

function drawTiles(ctx, vw, cx) {
  const c0 = Math.max(0, Math.floor(cx / T)), c1 = Math.min(MYCO.cols - 1, Math.ceil((cx + vw) / T));
  for (let r = 0; r < MYCO.rows; r++) for (let c = c0; c <= c1; c++) {
    if (!solid(c, r)) continue;
    const kind = !solid(c, r - 1) ? 'cap' : !solid(c, r + 1) ? 'ceil' : 'rock';
    const tile = tileCanvas(kind, hash(c, r) % 6), x = c * T - cx, y = r * T;
    if (tile) ctx.drawImage(tile, x, y); else R(ctx, x, y, T, T, '#111b26');
  }
}

// ---------- background ----------
export function drawMycoBackground(ctx, vw, cx, gs) {
  const f = gs.myco, time = f ? f.time : 0, danger = f ? f.danger : 0;
  const grad = ctx.createLinearGradient(0, 0, 0, 270);
  grad.addColorStop(0, mix('#04070d', '#1a0308', danger)); grad.addColorStop(1, mix('#0a1a24', '#2a0610', danger));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, vw, 270);
  const rim = tint(VIOLET, danger);
  // Giant far-away mushrooms, glowing at the rim.
  const step = 230, far = cx * .15;
  for (let i = -1; (i + 1) * step - (far % step) < vw + step; i++) {
    const idx = Math.floor(far / step) + i, h = hash(idx), x = i * step - (far % step) + 40 + h % 80, capW = 50 + h % 40, stemH = 90 + h % 60;
    ctx.fillStyle = '#080d16'; ctx.fillRect(x - 6, 250 - stemH, 12, stemH);
    ctx.beginPath(); ctx.ellipse(x, 250 - stemH, capW, 28 + h % 14, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = rim; ctx.globalAlpha = .35 + .15 * Math.sin(time * 1.4 + idx); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, 250 - stemH, capW, 28 + h % 14, 0, Math.PI, 0); ctx.stroke(); ctx.globalAlpha = 1;
    glow(ctx, x, 250 - stemH, capW * 1.4, rim, .09);
  }
  // Light shafts and drifting fog.
  ctx.fillStyle = `rgba(106,255,216,${.025 + danger * .02})`;
  for (let i = 0; i < 3; i++) {
    const x = ((i * 210 - cx * .3) % (vw + 200) + vw + 200) % (vw + 200) - 60;
    ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x + 24, 30); ctx.lineTo(x + 100, 270); ctx.lineTo(x - 40, 270); ctx.fill();
  }
  for (let i = 0; i < 6; i++) glow(ctx, ((i * 97 + time * 7 - cx * .5) % (vw + 160) + vw + 160) % (vw + 160) - 60, 240 - (i % 3) * 8, 70, tint(TEAL, danger), .05);
}

// ---------- mushrooms ----------
function drawGroundMushroom(ctx, m, cx, time, danger) {
  const x = m.x - cx, y = m.y, h = hash(m.seed), cap = tint(VIOLET, danger), dots = tint(TEAL, danger);
  const sway = Math.sin(time * 1.6 + m.seed) * .7;
  R(ctx, x + 5 + sway * .4, y + 8, 4, 8, '#cfc8e8'); R(ctx, x + 5, y + 8, 1, 8, '#fff');
  ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x + 7 + sway, y + 6, 8, 6 + (h % 2), 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#1a0c30'; ctx.fillRect(x - 1 + sway, y + 6, 16, 2);
  ctx.fillStyle = dots; for (const [dx, dy] of [[3, 3], [8, 2], [11, 4]]) ctx.fillRect(x + dx + sway, y + dy, 2, 2);
  glow(ctx, x + 7, y + 6, 18 + m.glow * 26, dots, .3 + m.glow * .55 + .08 * Math.sin(time * 3 + m.seed));
}

function drawHangingMushroom(ctx, m, cx, time, danger) {
  const x = m.x - cx + m.w / 2, top = m.y, sway = Math.sin(time * 1.2 + m.seed) * 2, cap = tint(VIOLET, danger), dots = tint(TEAL, danger);
  ctx.strokeStyle = '#4a3a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, MYCO.ceiling); ctx.quadraticCurveTo(x + sway * 2, top * .6, x + sway, top + 8); ctx.stroke();
  ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x + sway, top + 24, 16, 15, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#1a0c30'; ctx.fillRect(x - 16 + sway, top + 22, 32, 3);
  ctx.fillStyle = dots; for (const [dx, dy] of [[-9, 30], [-1, 34], [8, 29]]) ctx.fillRect(x + dx + sway, top + dy, 3, 3);
  glow(ctx, x + sway, top + 30, 28 + m.glow * 26, dots, .34 + m.glow * .5 + .08 * Math.sin(time * 3 + m.seed));
}

function drawPads(ctx, f, cx, time, danger) {
  for (const pad of f.pads) {
    const x = pad.x - cx, squash = pad.press > 0 ? 5 : 0, c = tint('#38a8ff', danger);
    R(ctx, x + 10, pad.y - 7 + squash, 8, 7 - squash, '#cfe4ff');
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + 14, pad.y - 7 + squash, 16, 8 - squash * .6, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff'; for (const dx of [6, 13, 20]) ctx.fillRect(x + dx, pad.y - 12 + squash, 2, 2);
    glow(ctx, x + 14, pad.y - 8, 26 + (pad.press > 0 ? 20 : 0), c, .4 + .1 * Math.sin(time * 4));
  }
}

// ---------- environment ----------
function drawPools(ctx, f, cx, vw, time, danger) {
  for (const pool of f.pools) {
    const x = pool.x - cx;
    if (x > vw + 10 || x + pool.w < -10) continue;
    const col = tint(TEAL, danger);
    ctx.fillStyle = '#05261f'; ctx.fillRect(x, pool.y - 12, pool.w, 32);
    ctx.fillStyle = col; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(x, pool.y + 20);
    for (let k = 0; k <= pool.w; k += 6) ctx.lineTo(x + k, pool.y - 12 + Math.sin(k * .2 + time * 3) * 1.5);
    ctx.lineTo(x + pool.w, pool.y + 20); ctx.fill(); ctx.globalAlpha = 1;
    glow(ctx, x + pool.w / 2, pool.y - 12, pool.w * .7, col, .25);
    for (let k = 0; k < pool.w / 40; k++) { const t = (time * .6 + k * .37) % 1; R(ctx, x + 10 + k * 36, pool.y - 12 + 20 - t * 22, 2, 2, col); }
  }
}

function drawClouds(ctx, f, cx, time, danger) {
  for (const h of f.clouds) {
    const x = h.x - cx;
    if (h.mode === 'off' || h.mode === 'cooldown' && false) { R(ctx, x + 18, MYCO.floor - 3, 12, 3, '#2a1f40'); continue; }
    const a = h.mode === 'warning' ? .2 + .1 * Math.sin(time * 30) : h.mode === 'active' ? .55 : .15;
    R(ctx, x + 18, MYCO.floor - 3, 12, 3, '#2a1f40');
    ctx.globalAlpha = 1;
    for (let k = 0; k < 7; k++) {
      const bx = x + 6 + (k % 4) * 11, by = h.y + 30 - (k * 7) % 28 - Math.sin(time * 2 + k) * 3;
      glow(ctx, bx, by, 18 + (h.mode === 'active' ? 8 : 0), tint('#8aff4a', danger), a);
    }
  }
}

// ---------- creatures ----------
function crystal(ctx, x, y, w, h, t) {
  ctx.fillStyle = '#6a4cc0'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + 2, y + 4); ctx.lineTo(x + w * .4, y); ctx.lineTo(x + w - 3, y + 3); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.fillStyle = 'rgba(230,220,255,.55)'; ctx.beginPath(); ctx.moveTo(x + 3, y + h - 2); ctx.lineTo(x + 4, y + 6); ctx.lineTo(x + w * .4, y + 2); ctx.lineTo(x + w * .4 + 3, y + h - 6); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + w - 5, y + h - 4); ctx.stroke();
  // Little mushrooms sprout from the statue as it ages.
  for (let k = 0; k < Math.min(4, 1 + t * 1.2); k++) {
    const mx = x + 3 + k * (w / 4), my = y + 2 + (k % 2) * 4;
    R(ctx, mx, my, 1, 3, '#cfc8e8'); ctx.fillStyle = TEAL; ctx.beginPath(); ctx.arc(mx, my, 2, Math.PI, 0); ctx.fill();
  }
  const sheen = (Math.sin(t * 2) + 1) / 2;
  glow(ctx, x + w / 2, y + h / 2, 26, ICE, .22 + sheen * .2);
}

function drawStalker(ctx, c, cx, p, time, danger) {
  const x = Math.round(c.x - cx), y = Math.round(c.y);
  if (c.state === 'frozen') { crystal(ctx, x - 1, y - 2, c.w + 2, c.h + 2, c.frozenT); return; }
  const dir = p && p.x + 6 < c.x + c.w / 2 ? -1 : 1, run = Math.sin(c.anim * 14);
  ctx.save(); ctx.globalAlpha = c.alpha; ctx.translate(x + c.w / 2, y); ctx.scale(dir, 1);
  if (c.state === 'emerge') ctx.translate(Math.sin(time * 90) * 1.2, (1 - c.alpha) * 14);
  ctx.fillStyle = '#0c0814';
  ctx.beginPath(); ctx.moveTo(-8, 20); ctx.lineTo(-9, 9); ctx.lineTo(-5, 2); ctx.lineTo(3, 0); ctx.lineTo(9, 6); ctx.lineTo(8, 20); ctx.fill();
  ctx.fillStyle = '#0c0814'; // legs
  ctx.fillRect(-7 + run * 2, 16, 4, 5); ctx.fillRect(3 - run * 2, 16, 4, 5);
  ctx.strokeStyle = '#0c0814'; ctx.lineWidth = 3; // long arms
  ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(12 + run * 2, 14); ctx.lineTo(15 + run * 2, 20); ctx.stroke();
  const spines = tint(TEAL, danger);
  for (let k = 0; k < 4; k++) { const sx = -6 + k * 3, sy = 2 + (k % 2) * 3; R(ctx, sx, sy - 3, 1, 3, '#cfc8e8'); ctx.fillStyle = spines; ctx.beginPath(); ctx.arc(sx, sy - 3, 2, Math.PI, 0); ctx.fill(); }
  const roar = c.state === 'emerge' ? 1 : Math.max(0, danger);
  R(ctx, 2, 5, 5, 3, '#ff3050'); R(ctx, 3, 5, 2, 2, '#fff');
  ctx.fillStyle = '#ff3050'; ctx.fillRect(2, 11, 7, 2 + roar * 3); // jagged mouth
  ctx.fillStyle = '#fff'; for (let k = 0; k < 4; k++) ctx.fillRect(2 + k * 2, 11, 1, 2);
  ctx.restore();
  glow(ctx, x + c.w / 2, y + 7, 24, RED, .3 * c.alpha);
}

function drawFloater(ctx, c, cx, time, danger) {
  const x = Math.round(c.x - cx), y = Math.round(c.y);
  if (c.state === 'frozen') { crystal(ctx, x - 1, y - 2, c.w + 2, c.h + 2, c.frozenT); return; }
  ctx.save(); ctx.globalAlpha = c.alpha * .9; ctx.translate(x + c.w / 2, y + 5);
  if (c.state === 'emerge') ctx.translate(Math.sin(time * 90) * 1.2, 0);
  const body = tint('#ff40c8', danger);
  ctx.strokeStyle = body; ctx.lineWidth = 1.5; // tentacles
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 2.4, 4); for (let s = 1; s <= 4; s++) ctx.lineTo(k * 2.4 + Math.sin(time * 6 + k + s) * 2.5, 4 + s * 3.5); ctx.stroke(); }
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 3, 10, 8 + Math.sin(time * 5) * .8, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-3, -1, 4, 2, -.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; for (const ex of [-4, 0, 4]) ctx.fillRect(ex - 1, 1, 2, 2);
  ctx.fillStyle = '#07040c'; for (const ex of [-4, 0, 4]) ctx.fillRect(ex, 2, 1, 1);
  ctx.restore();
  glow(ctx, x + c.w / 2, y + 8, 30, body, .4 * c.alpha);
}

function drawCheckpoints(ctx, f, cx, time) {
  for (const c of f.checkpoints) {
    const x = c.x + 6 - cx, y = c.y + 14;
    R(ctx, x - 1, y - 8, 2, 8, '#4a3a6a');
    ctx.fillStyle = c.active ? TEAL : '#3a2f58'; ctx.beginPath(); ctx.arc(x, y - 10, 4, 0, Math.PI * 2); ctx.fill();
    if (c.active) glow(ctx, x, y - 10, 34, TEAL, .5 + .1 * Math.sin(time * 4));
  }
}

function drawExit(ctx, e, cx, time) {
  const x = e.x - cx, pulse = .6 + .25 * Math.sin(time * 2.5);
  ctx.fillStyle = '#05080e'; ctx.beginPath(); ctx.moveTo(x, e.y + e.h); ctx.lineTo(x, e.y + 14); ctx.arc(x + e.w / 2, e.y + 14, e.w / 2, Math.PI, 0); ctx.lineTo(x + e.w, e.y + e.h); ctx.fill();
  ctx.fillStyle = `rgba(210,255,240,${pulse * .6})`; ctx.fillRect(x + 6, e.y + 14, e.w - 12, e.h - 14);
  glow(ctx, x + e.w / 2, e.y + e.h / 2, 70, '#b8ffe8', .5 * pulse);
}

function sign(ctx, text, wx, y, cx) {
  const w = text.length * 3.4 + 8, x = wx - cx;
  R(ctx, x - 1, y - 1, w + 2, 12, '#35ffd0'); R(ctx, x, y, w, 10, '#071018');
  ctx.font = '5px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#b8ffe8'; ctx.fillText(text, x + 4, y + 7);
}

// ---------- darkness ----------
let darkLayer = null;
function drawDarkness(ctx, vw, cx, gs, f) {
  if (typeof document === 'undefined') return;
  const p = gs.p;
  if (!darkLayer || darkLayer.width !== Math.ceil(vw)) darkLayer = makeCanvas(vw, 270);
  const g = darkLayer.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.clearRect(0, 0, darkLayer.width, 270);
  g.fillStyle = `rgba(2,4,10,${.74 - f.flash * .4})`;
  g.fillRect(0, 0, darkLayer.width, 270);
  g.globalCompositeOperation = 'destination-out';
  const light = (x, y, r, a) => { if (x < -r || x > vw + r) return; g.globalAlpha = a; softDot(g, x, y, r, '#ffffff'); };
  light(p.x + 6 - cx, p.y + 6, 62, .95);
  for (const m of f.mushrooms) light(m.x + m.w / 2 - cx, m.y + m.h / 2, 46 + m.glow * 34, .85);
  for (const pad of f.pads) light(pad.x + 14 - cx, pad.y - 8, 50, .8);
  for (const c of f.checkpoints) if (c.active) light(c.x + 6 - cx, c.y, 56, .8);
  for (const s of f.pickups) if (!s.got) light(s.x + 6 - cx, s.y + 6, 36, .7);
  for (const c of f.chasers) if (c.state !== 'dormant' && c.state !== 'done') light(c.x + 9 - cx, c.y + 9, c.state === 'frozen' ? 34 : 44, .7 * (c.alpha || 1));
  for (const pool of f.pools) light(pool.x + pool.w / 2 - cx, pool.y - 6, pool.w * .6, .7);
  light(f.exit.x + 16 - cx, f.exit.y + 24, 90, 1);
  g.globalAlpha = 1;
  ctx.drawImage(darkLayer, 0, 0);
}

function vignette(ctx, vw, f, time) {
  const v = cached('myco-vignette', 480, 270, g => {
    const gr = g.createRadialGradient(240, 135, 80, 240, 135, 300);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 0, 480, 270);
  });
  if (!v) return;
  const beat = f.danger > .05 ? .5 + .5 * Math.sin(time * (4 + f.danger * 8)) : 0;
  ctx.save();
  ctx.globalAlpha = .55 + .25 * f.danger * beat;
  // Tint the vignette: black normally, blood red when hunted.
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(v, 0, 0, vw, 270);
  ctx.restore();
  if (f.danger > .05) {
    ctx.fillStyle = `rgba(255,20,50,${f.danger * (.06 + .1 * beat)})`;
    ctx.fillRect(0, 0, vw, 270);
  }
}

export function drawMycoWorld(ctx, vw, cx, gs) {
  const f = gs.myco;
  if (!f) return;
  const time = f.time, rcx = Math.round(cx), p = gs.p, danger = f.danger;
  drawTiles(ctx, vw, rcx);
  drawPools(ctx, f, rcx, vw, time, danger);
  sign(ctx, "ZAHARLI! USTIDAN SAKRA", 200, 168, rcx);
  sign(ctx, "ULARNI QO'ZIQORIN ORQALI ADASHTIR", 780, 168, rcx);
  sign(ctx, "SUZUVCHILAR: OSTIDAN O'T", 1620, 120, rcx);
  drawClouds(ctx, f, rcx, time, danger);
  for (const m of f.mushrooms) {
    if (m.x - rcx < -40 || m.x - rcx > vw + 40) continue;
    if (m.kind === 'hanging') drawHangingMushroom(ctx, m, rcx, time, danger); else drawGroundMushroom(ctx, m, rcx, time, danger);
  }
  drawPads(ctx, f, rcx, time, danger);
  drawCheckpoints(ctx, f, rcx, time);
  drawExit(ctx, f.exit, rcx, time);
  for (const c of f.chasers) {
    if (c.state === 'dormant' || c.state === 'done' || c.x - rcx < -40 || c.x - rcx > vw + 40) continue;
    if (c.kind === 'stalker') drawStalker(ctx, c, rcx, p, time, danger); else drawFloater(ctx, c, rcx, time, danger);
  }
  drawBoy(ctx, p, rcx, gs.anim, gs);
  for (const s of f.pickups) if (!s.got) {
    const y = s.y + 6 + Math.sin(time * 3 + s.x) * 3;
    ctx.fillStyle = '#e8fff8'; ctx.beginPath(); ctx.arc(s.x + 6 - rcx, y, 4, 0, Math.PI * 2); ctx.fill();
    glow(ctx, s.x + 6 - rcx, y, 24, TEAL, .6);
  }
  drawDarkness(ctx, vw, rcx, gs, f);
  drawParticles(ctx, f.particles, {
    cx: rcx, visible: a => a.x > rcx - 20 && a.x < rcx + vw + 20,
    isSoft: a => a.type === 'spore', maxAlpha: (a, soft) => soft ? .5 : .9,
    color: a => a.color || tint(TEAL, danger)
  });
  vignette(ctx, vw, f, time);

  // Chromatic split when something is right behind you.
  if (danger > .45 && ctx.canvas && typeof ctx.canvas.width === 'number') {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = (danger - .4) * .35;
    ctx.drawImage(ctx.canvas, Math.round(3 * danger), 0);
    ctx.restore();
  }
  if (f.flash > .3) {
    ctx.save(); ctx.globalAlpha = f.flash; ctx.textAlign = 'center'; ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText('QOTIB QOLDI!', vw / 2 + 1, 71); ctx.fillStyle = ICE; ctx.fillText('QOTIB QOLDI!', vw / 2, 70); ctx.restore();
  }
  if (f.sectionTime < 3.2) {
    const a = Math.min(1, f.sectionTime * 2, (3.2 - f.sectionTime) * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(MYCO_SECTIONS[f.section].name, vw / 2 + 1, 41);
    ctx.fillStyle = '#b8ffe8'; ctx.fillText(MYCO_SECTIONS[f.section].name, vw / 2, 40);
    ctx.restore();
  }
}
