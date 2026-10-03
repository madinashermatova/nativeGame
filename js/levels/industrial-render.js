import {background, ready} from '../assets.js';
import {cached, drawSprite, drawFiltered, glow, label, drawParticles} from '../gfx.js';
import {drawBoy} from '../renderer.js';
import {INDUSTRIAL} from './industrial.js';

const sprite = (ctx, key, x, y, w, angle = 0) => drawSprite(ctx, 'l5.' + key, x, y, w, angle);
const filtered = (ctx, key, filter, x, y, w, angle = 0) => drawFiltered(ctx, 'l5.' + key, filter, x, y, w, angle);

const DIM = 'brightness(.6) saturate(.55)';
const BG_FILTER = 'brightness(.55) saturate(.55) contrast(.78) blur(1px)';
const BG_TILE = 580;

// The blurred, dimmed backdrop is baked once instead of filtering every frame.
function backdrop() {
  return cached('l5-backdrop', 520, 520, g => {
    const bg = background('l5-bg');
    if (!ready(bg)) return false;
    g.filter = BG_FILTER;
    g.drawImage(bg, 0, 0);
  });
}

export function drawIndustrialBackground(ctx, vw, cx, gs) {
  const cy = gs.camY || 0, time = gs.industrial.time;
  ctx.fillStyle = '#090e10'; ctx.fillRect(0, 0, vw, 270);
  const bg = backdrop() || (ready(background('l5-bg')) ? background('l5-bg') : null);
  if (bg) {
    const ox = ((cx * .08) % BG_TILE + BG_TILE) % BG_TILE, oy = ((cy * .08) % BG_TILE + BG_TILE) % BG_TILE;
    for (let y = -oy; y < 270; y += BG_TILE) for (let x = -ox; x < vw; x += BG_TILE) ctx.drawImage(bg, x, y, BG_TILE, BG_TILE);
  }
  ctx.globalAlpha = .16;
  for (let x = -((cx * .18) % 410) - 140; x < vw; x += 410) filtered(ctx, 'reactor', DIM, x, 70 - (cy * .18) % 220, 180);
  ctx.globalAlpha = .23;
  for (let x = -((cx * .35) % 330) - 70; x < vw; x += 330) {
    filtered(ctx, 'support', DIM, x, -(cy * .35) % 160, 30);
    filtered(ctx, 'gear', DIM, x + 92, 150 - (cy * .35) % 180, 70, time * .12);
  }
  ctx.globalAlpha = 1;
  if (gs.p?.x > 1390 && gs.p.y < 330) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, vw, 270); }
}

// Draws the metal wall panels of a solid block, plus the support columns along its edges.
function wall(ctx, rect, cx, cy, vw) {
  if (rect.x + rect.w < cx || rect.x > cx + vw || rect.y + rect.h < cy || rect.y > cy + 270) return;
  ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  const size = 48;
  const startX = rect.x + Math.max(0, Math.floor((cx - rect.x) / size)) * size;
  const endX = Math.min(rect.x + rect.w, cx + vw + size);
  const startY = rect.y + Math.max(0, Math.floor((cy - rect.y) / size)) * size;
  const endY = Math.min(rect.y + rect.h, cy + 270 + size);
  for (let y = startY; y < endY; y += size) {
    for (let x = startX; x < endX; x += size) {
      const idx = (Math.floor(x / size) + Math.floor(y / size)) % 2;
      sprite(ctx, idx ? 'panelAlt' : 'panel', x, y, size);
    }
  }
  for (const x of [rect.x, rect.x + rect.w - 20]) {
    for (let y = rect.y + Math.max(0, Math.floor((cy - rect.y) / 75)) * 75; y < Math.min(rect.y + rect.h, cy + 330); y += 75) sprite(ctx, 'support', x, y, 20);
  }
  ctx.restore();
}

function gear(ctx, h, time) {
  ctx.save(); ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 2, 0, Math.PI * 2); ctx.clip();
  const width = (h.r + 2) * 2;
  filtered(ctx, 'gear', 'brightness(1.35) saturate(.7)', h.x - width / 2, h.y - width * 144 / 138 / 2, width, time * (h.kind === 'gear' ? 2 : 5));
  ctx.restore();
}

// Terminals are sprites; only the animated discharge is procedural.
function electric(ctx, h, time) {
  const horizontal = h.w > h.h;
  const startX = horizontal ? h.x : h.x + h.w / 2, startY = horizontal ? h.y + h.h / 2 : h.y;
  const endX = horizontal ? h.x + h.w : h.x + h.w / 2, endY = horizontal ? h.y + h.h / 2 : h.y + h.h;
  for (const [x, y] of [[startX, startY], [endX, endY]]) {
    sprite(ctx, 'electric', x - 7, y - 7, 14);
    if (h.mode !== 'off') glow(ctx, x, y, 16, '#a3e8ff', h.mode === 'active' ? .3 : .12);
  }
  if (h.mode === 'off') return;
  ctx.save();
  ctx.globalAlpha = h.mode === 'active' ? 1 : .22 + .13 * Math.sin(time * 35);
  ctx.strokeStyle = '#bfefff'; ctx.lineWidth = h.mode === 'active' ? 2 : 1;
  ctx.shadowColor = '#38bfff'; ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.moveTo(startX, startY);
  for (let i = 1; i < 8; i++) {
    const a = i / 8, jitter = Math.sin(time * 38 + i * 2) * 2;
    ctx.lineTo(startX + (endX - startX) * a + (horizontal ? 0 : jitter), startY + (endY - startY) * a + (horizontal ? jitter : 0));
  }
  ctx.lineTo(endX, endY); ctx.stroke();
  ctx.restore();
}

// Ceiling chains hang from the top wall down to `bottom`.
function chain(ctx, x, cy, bottom) {
  for (let y = Math.max(16, 16 + Math.floor((cy - 16) / 37) * 37); y < bottom; y += 37) sprite(ctx, 'chain', x, y, 4);
}

const LAMPS = [[38, 1200], [392, 1100], [392, 812], [400, 326], [544, 158], [1060, 151], [1520, 148], [1810, 456], [1810, 900]];
const PARTICLE_COLORS = {gas: '#b6e956', electric: '#c4f4ff', bubble: '#d5ff83', spark: '#ffd298', steam: '#effaff'};
const WARNING_TEXT = {electric: 'SPARK!', gas: 'GAS!', steam: 'HISS!'};

export function drawIndustrialWorld(ctx, vw, cx, gs) {
  const f = gs.industrial, cy = gs.camY || 0, time = f.time, p = gs.p;
  const visible = o => o.x + (o.w || 60) > cx - 70 && o.x < cx + vw + 70 && o.y + (o.h || 90) > cy - 90 && o.y < cy + 350;
  ctx.save(); ctx.translate(-cx, -cy);
  wall(ctx, {x: 0, y: 0, w: 16, h: INDUSTRIAL.height}, cx, cy, vw);
  wall(ctx, {x: 1840, y: 0, w: 16, h: INDUSTRIAL.height}, cx, cy, vw);
  wall(ctx, {x: 16, y: 0, w: 1824, h: 16}, cx, cy, vw);
  wall(ctx, {x: 416, y: 240, w: 912, h: 1136}, cx, cy, vw);
  // Reactor recesses stay wholly inside the closed central machinery wall.
  const REACTOR = 'brightness(.6) saturate(.6)';
  ctx.globalAlpha = .38;
  for (const y of [360, 720, 1080]) if (visible({x: 610, y, w: 420, h: 280})) filtered(ctx, 'reactor', REACTOR, 610, y, 300);
  ctx.globalAlpha = .2;
  if (cx > 900 && cy > 650) filtered(ctx, 'reactor', REACTOR, 1370, 900, 370);
  ctx.globalAlpha = 1;

  for (const pool of f.pools) {
    const y = pool.x > 1000 ? f.escape.pressure : pool.y;
    if (!visible({...pool, y})) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(pool.x, y, pool.w, INDUSTRIAL.height - y); ctx.clip();
    for (let dy = y + 9; dy < INDUSTRIAL.height; dy += 38) for (let x = pool.x; x < pool.x + pool.w; x += 64) sprite(ctx, 'liquidBody', x, dy, 64);
    for (let x = pool.x; x < pool.x + pool.w; x += 64) sprite(ctx, 'liquid', x, y + Math.sin(time * 2 + x) * .8, 64);
    ctx.restore();
    for (let x = pool.x; x < pool.x + pool.w; x += 96) glow(ctx, x, y, 25, '#a8f93f', .13);
  }

  for (const s of f.surfaces) {
    if (!visible(s) || s.collapsed) continue;
    const shake = s.age > .3 ? Math.sin(time * 45) * .7 : 0;
    sprite(ctx, s.kind === 'moving' ? 'moving' : s.kind === 'collapse' ? 'broken' : 'platform', s.x + shake, s.y, s.w);
    // Static supports sit under the far edge, clear of the jumping space.
    if (s.kind === 'static' && s.id !== 0 && s.y > 270) {
      ctx.globalAlpha = .6;
      sprite(ctx, 'support', s.x < 416 ? s.x + s.w - 9 : s.x + 3, s.y + s.w * 70 / 378, 8);
      ctx.globalAlpha = 1;
    }
    if (s.kind === 'moving') chain(ctx, s.x + s.w / 2 - 2, cy, s.y);
    if (s.age > .1) label(ctx, 'CRACK!', s.x + 5, s.y - 6, '#ffd094', 5);
  }

  for (const h of f.hazards) {
    if (!visible(h)) continue;
    if (h.type === 'electric') electric(ctx, h, time);
    else {
      sprite(ctx, 'pipe', h.x - 19, h.y + h.h - 11, 20);
      if (h.type === 'gas') glow(ctx, h.x + 8, h.y + h.h - 4, 18, '#b5ea42', h.mode === 'off' ? .07 : .2);
      if (h.mode === 'warning') glow(ctx, h.x + 8, h.y + h.h - 6, 19, '#ff9864', .15 + .08 * Math.sin(time * 24));
    }
    if (h.mode === 'warning') label(ctx, WARNING_TEXT[h.type], h.x - 9, h.y - 7, h.type === 'electric' ? '#c8edff' : '#ffd094', 6);
  }

  for (const h of f.saws) {
    if (!visible({x: h.x - 30, y: h.y - 110, w: 60, h: 140})) continue;
    if (h.kind === 'hanging') {
      chain(ctx, h.x - 2, cy, h.y - 25);
      sprite(ctx, 'sawMount', h.x - 7, h.y - 25, 14);
      sprite(ctx, 'blade', h.x - 22, h.y - 7, 44);
      continue;
    }
    if (h.kind === 'rail') sprite(ctx, 'platform', h.baseX - 18, h.y + 19, 36);
    else if (h.kind === 'vertical') sprite(ctx, 'support', h.x - 4, h.baseY - 53, 8);
    gear(ctx, h, time);
  }

  for (const q of f.checkpoints) {
    if (!visible(q)) continue;
    sprite(ctx, 'lamp', q.x - 3, q.y - 25, 9);
    glow(ctx, q.x + 2, q.y - 18, 18, q.active ? '#caffb0' : '#ffd28c', .22);
    label(ctx, q.active ? 'SAVED' : 'CHECKPOINT', q.x - 21, q.y - 30, q.active ? '#caffbc' : '#ffe1a5', 5);
  }
  for (const [x, y] of LAMPS) {
    if (!visible({x, y})) continue;
    sprite(ctx, 'lamp', x, y, 10);
    glow(ctx, x + 5, y + 7, 28, '#ff6336', f.escape.active ? .1 + .22 * (Math.sin(time * 9) > 0) : .17);
  }
  const exit = f.exit;
  if (visible(exit)) {
    sprite(ctx, 'door', exit.x, exit.y, exit.w);
    sprite(ctx, 'lamp', exit.x - 13, exit.y + 16, 10);
    sprite(ctx, 'lamp', exit.x + exit.w + 2, exit.y + 16, 10);
    glow(ctx, exit.x + exit.w / 2, exit.y + 44, 33, '#ffc773', .2);
    label(ctx, 'EXIT >', exit.x + 8, exit.y - 10, '#fff0bf', 9);
  }
  drawParticles(ctx, f.particles, {visible,
    isSoft: a => a.type === 'steam' || a.type === 'gas', maxAlpha: (a, soft) => soft ? .38 : .75,
    color: a => PARTICLE_COLORS[a.type] || PARTICLE_COLORS.steam});
  ctx.restore();

  ctx.save(); ctx.translate(0, -cy);
  glow(ctx, p.x + 6 - cx, p.y + 7, 13, '#ffb8c6', .12);
  ctx.restore();

  if (gs.p) drawBoy(ctx, gs.p, cx, gs.anim, gs);
  drawIndustrialFront(ctx, vw, cx, gs);
}

// Labels in front of the player.
export function drawIndustrialFront(ctx, vw, cx, gs) {
  const f = gs.industrial, p = gs.p;
  const section = p.y > 1180 ? (p.x < 500 ? 'START / ASCEND ↑' : 'ESCAPE / EXIT →')
    : p.x < 416 ? 'LEFT SHAFT ↑' : p.y < 300 ? (p.x > 1390 ? 'DARK CORRIDOR →' : 'UPPER MACHINERY →') : 'RIGHT SHAFT ↓';
  label(ctx, 'LEVEL 5 / ' + section, 12, 29, '#e9ddbb', 7);
  if (f.escape.active) label(ctx, 'PRESSURE RISING / EXIT →', vw / 2 - 86, 43, '#ffc08b', 8);
}
