import {T, VH} from '../config.js';
import {R, cached} from '../gfx.js';
import {world, solid} from '../world.js';
import {drawBoy} from '../renderer.js';
import {drawForestScene, drawMeadowScene} from '../scenery.js';
import {fireActive} from './classic.js';

// Levels 1 and 2 are drawn entirely in code: sunset meadow and moonlit forest backdrops come from
// scenery.js; tiles, hazards and the exit gate are painted once into 4x canvases and blitted.
const CACHE_SCALE = 4;
function scaledCache(key, w, h, paint) {
  return cached(key, w * CACHE_SCALE, h * CACHE_SCALE, g => { g.scale(CACHE_SCALE, CACHE_SCALE); return paint(g); });
}

// ── Backgrounds ───────────────────────────────────────────
const BACKGROUNDS = {
  meadow: (ctx, vw, camX, time) => drawMeadowScene(ctx, vw, VH, camX, time),
  forest: (ctx, vw, camX, time) => drawForestScene(ctx, vw, VH, camX, time, 'forest')
};

export function drawClassicBackground(ctx, vw, gs, theme) {
  BACKGROUNDS[theme](ctx, vw, gs.camX, gs.anim / 60);
}

// ── Tiles ─────────────────────────────────────────────────
const TILE_PALETTE = {
  meadow: {dirt: '#7b4a2c', dark: '#5a3420', light: '#97613a', moss: '#5d7f2c', grass: '#74b238', grassLight: '#a8dc50', grassDark: '#4a8a2a'},
  forest: {dirt: '#54402f', dark: '#3b2a20', light: '#70564a', moss: '#2f6a4a', grass: '#3f9a62', grassLight: '#7ad69a', grassDark: '#2a6e46'}
};
const VARIANTS = 4;

// Small deterministic generator so each variant looks different but never changes between frames.
const tileRng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function paintTile(g, theme, top, variant, x, y) {
  const pal = TILE_PALETTE[theme] || TILE_PALETTE.meadow, rand = tileRng(variant * 97 + (top ? 7 : 3));
  R(g, x, y, T, T, pal.dirt);
  for (let i = 0; i < 9; i++) { // pebbles and soil flecks
    const px = x + Math.floor(rand() * 13), py = y + Math.floor(rand() * 13);
    R(g, px, py, 2 + (i % 2), 1 + Math.floor(rand() * 2), i % 3 === 0 ? pal.light : pal.dark);
  }
  for (let i = 0; i < 3; i++) R(g, x + Math.floor(rand() * 14), y + 4 + Math.floor(rand() * 10), 1, 1, pal.moss);
  R(g, x, y + T - 1, T, 1, pal.dark);
  if (!top) return;
  R(g, x, y, T, 3, pal.grass);
  R(g, x, y, T, 1, pal.grassLight);
  for (let i = 0; i < T; i += 2) { // ragged lower edge and blades on top
    R(g, x + i, y + 3, 1, 1 + Math.floor(rand() * 3), rand() < .5 ? pal.grassDark : pal.grass);
    if (rand() < .35) R(g, x + i, y - 1, 1, 1, pal.grassLight);
  }
}

function drawTile(ctx, theme, top, x, y, tx) {
  const variant = (tx * 7 + (top ? 1 : 3)) % VARIANTS;
  const c = scaledCache(`tile|${theme}|${top}|${variant}`, T, T, g => paintTile(g, theme, top, variant, 0, 0));
  if (c) ctx.drawImage(c, x, y, T, T);
  else paintTile(ctx, theme, top, variant, x, y);
}

// ── Exit gate ─────────────────────────────────────────────
const GATE = {
  meadow: {stone: '#8b7a92', stoneDark: '#5e5068', stoneLight: '#b4a4ba', moss: '#5d7f2c', glow: '#ffd36a', swirl: '#fff0b8'},
  forest: {stone: '#4f6a60', stoneDark: '#2f453f', stoneLight: '#7a9a8c', moss: '#3a9a5a', glow: '#6affd0', swirl: '#d6fff2'}
};
const GATE_W = 32, GATE_H = 46;

function paintGate(g, pal) {
  const arch = (cx, cy, r) => { g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); };
  R(g, 0, 14, 7, GATE_H - 14, pal.stone); R(g, GATE_W - 7, 14, 7, GATE_H - 14, pal.stone);
  g.fillStyle = pal.stone; arch(16, 16, 16); g.fill();
  g.fillStyle = pal.stoneDark; arch(16, 16, 10); g.lineTo(26, 16); g.fill(); // inner arch edge (the portal sits on top)
  for (let y = 18; y < GATE_H; y += 6) { R(g, 0, y, 7, 1, pal.stoneDark); R(g, GATE_W - 7, y, 7, 1, pal.stoneDark); }
  R(g, 0, 14, 1, GATE_H - 14, pal.stoneLight); R(g, GATE_W - 7, 14, 1, GATE_H - 14, pal.stoneLight);
  R(g, 13, 0, 6, 5, pal.stoneLight); R(g, 13, 4, 6, 1, pal.stoneDark); // keystone
  R(g, -2, GATE_H - 3, 11, 3, pal.stoneDark); R(g, GATE_W - 9, GATE_H - 3, 11, 3, pal.stoneDark);
  for (const [x, y] of [[1, 24], [4, 30], [GATE_W - 5, 21], [GATE_W - 3, 28], [6, 5], [25, 6]]) R(g, x, y, 2, 2, pal.moss);
}

function drawExitGate(ctx, gs, cx, anim, theme) {
  if (!gs.exitX) return;
  const pal = GATE[theme] || GATE.meadow, x = Math.round(gs.exitX - cx - 8), base = gs.exitY + T, top = base - GATE_H;
  const t = anim / 60;
  // The portal fills the opening, then the stone frame is drawn over its edges.
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x + 7, base); ctx.lineTo(x + 7, top + 16); ctx.arc(x + 16, top + 16, 9, Math.PI, 0); ctx.lineTo(x + GATE_W - 7, base); ctx.closePath(); ctx.clip();
  const grad = ctx.createLinearGradient(0, top + 6, 0, base);
  grad.addColorStop(0, pal.swirl); grad.addColorStop(.5, pal.glow); grad.addColorStop(1, pal.stone);
  ctx.fillStyle = grad; ctx.globalAlpha = .75 + .15 * Math.sin(t * 3); ctx.fillRect(x, top, GATE_W, GATE_H);
  ctx.globalAlpha = 1; ctx.strokeStyle = pal.swirl; ctx.lineWidth = 1;
  for (let k = 0; k < 4; k++) { // swirling light
    ctx.beginPath();
    ctx.ellipse(x + 16, top + 24 + Math.sin(t * 2 + k) * 2, 3 + k * 2.2, 12 + k * 2, 0, t * 2.4 + k * 1.6, t * 2.4 + k * 1.6 + 2.4);
    ctx.stroke();
  }
  for (let k = 0; k < 6; k++) { // motes rising through the portal
    const m = (t * .5 + k / 6) % 1;
    R(ctx, x + 9 + ((k * 7) % 14), base - m * (GATE_H - 8), 1, 1, '#ffffff');
  }
  ctx.restore();
  const frame = scaledCache(`gate|${theme}`, GATE_W + 4, GATE_H, g => { g.translate(2, 0); paintGate(g, pal); });
  if (frame) ctx.drawImage(frame, x - 2, top, GATE_W + 4, GATE_H); else { ctx.save(); ctx.translate(x, top); paintGate(ctx, pal); ctx.restore(); }
  const pulse = .3 + .12 * Math.sin(t * 3);
  ctx.globalAlpha = pulse; ctx.fillStyle = pal.glow; ctx.beginPath(); ctx.ellipse(x + 16, base - 1, 22, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  // A bobbing arrow points the way in.
  const bob = Math.sin(t * 4) * 2;
  ctx.fillStyle = pal.swirl;
  ctx.beginPath(); ctx.moveTo(x + 11, top - 9 + bob); ctx.lineTo(x + 21, top - 9 + bob); ctx.lineTo(x + 16, top - 3 + bob); ctx.fill();
}

// ── Hazards and props ─────────────────────────────────────
function paintSpike(g, dir) {
  for (let i = 0; i < 3; i++) {
    const s = i * 5;
    const tri = (color, pts) => {
      g.fillStyle = color;
      g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]); g.fill();
    };
    if (dir === 'up') {
      tri('#9ca3af', [[s, T], [s + 2.5, 5], [s + 5, T]]);
      tri('#ef4444', [[s + 1, 8], [s + 2.5, 4], [s + 4, 8]]);
    } else {
      tri('#9ca3af', [[s, 0], [s + 2.5, T - 6], [s + 5, 0]]);
      tri('#ef4444', [[s + 1, T - 9], [s + 2.5, T - 5], [s + 4, T - 9]]);
    }
  }
}

function drawSpike(ctx, h, cx) {
  const x = Math.round(h.tx * T - cx), y = h.ty * T;
  const c = scaledCache('spike|' + h.dir, T, T, g => paintSpike(g, h.dir));
  if (c) { ctx.drawImage(c, x, y, T, T); return; }
  ctx.save(); ctx.translate(x, y); paintSpike(ctx, h.dir); ctx.restore();
}

function paintSaw(g, r) {
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    g.save(); g.rotate(i * Math.PI * 2 / teeth);
    g.fillStyle = '#9ca3af';
    g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.35, -r * 0.6); g.lineTo(-r * 0.15, -r * 0.6); g.fill();
    g.fillStyle = '#dc2626';
    g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.2, -r * 0.75); g.lineTo(-r * 0.1, -r * 0.75); g.fill();
    g.restore();
  }
  for (const [k, color] of [[0.7, '#4b5563'], [0.5, '#6b7280'], [0.2, '#111827']]) {
    g.fillStyle = color;
    g.beginPath(); g.arc(0, 0, r * k, 0, Math.PI * 2); g.fill();
  }
}

function drawSaw(ctx, saw, cx) {
  const x = Math.round(saw.x - cx), y = Math.round(saw.y), r = saw.r;
  if (saw.moving) {
    ctx.strokeStyle = '#2d151c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.round(saw.startX - cx), y);
    ctx.lineTo(Math.round(saw.startX + saw.maxDist - cx), y);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(saw.angle);
  const c = scaledCache('saw|' + r, r * 2, r * 2, g => { g.translate(r, r); paintSaw(g, r); });
  if (c) ctx.drawImage(c, -r, -r, r * 2, r * 2); else paintSaw(ctx, r);
  ctx.restore();
}

function drawCrumble(ctx, b, cx) {
  if (b.collapsed) return;
  const x = Math.round(b.x - cx + (b.timer > 0 ? (Math.random() - 0.5) * 2 : 0)), y = b.y;
  R(ctx, x, y, T, T, '#7a5a3a');
  R(ctx, x + 1, y + 1, T - 2, T - 2, b.timer > 0 ? '#bf7338' : '#99734e');
  R(ctx, x + 3, y + 4, 3, 1, '#3d2511');
  R(ctx, x + 5, y + 5, 1, 4, '#3d2511');
  R(ctx, x + 9, y + 8, 4, 1, '#3d2511');
  R(ctx, x + 11, y + 9, 1, 3, '#3d2511');
}

function drawJumpPad(ctx, j, cx) {
  const x = Math.round(j.x - cx), y = j.y;
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

function drawCoin(ctx, c, cx, anim) {
  const x = c.tx * T - cx + 3, y = c.ty * T + 3 + Math.sin(anim * 0.1) * 2;
  R(ctx, x + 1, y, 8, 8, '#f5edd6');
  R(ctx, x, y + 2, 10, 5, '#e8dcbe');
  R(ctx, x + 2, y + 2, 6, 4, '#ffffff');
  R(ctx, x + 4, y + 3, 2, 3, '#d62828');
  R(ctx, x + 3, y + 4, 4, 1, '#d62828');
}

function drawElement(ctx, e, x, anim, tick) {
  const y = e.y;
  if (e.type === 'water') {
    R(ctx, x, y + 3, T, T - 3, '#13618b');
    R(ctx, x, y + 8, T, 8, '#0d426c');
    R(ctx, x, y + 3 + Math.sin(anim * 0.12 + e.tx) * 1.5, T, 2, '#68dcf4');
    R(ctx, x + (anim / 3 + e.tx * 3) % 12, y + 10, 3, 1, '#3d9fc3');
    return;
  }
  const active = fireActive(e, tick);
  R(ctx, x, y + 4, T, T - 4, '#482620');
  R(ctx, x + 2, y + 7, 12, 3, active ? '#ff632a' : '#984331');
  if (!active) { R(ctx, x + 5, y + 3, 3, 2, '#d86c38'); return; }
  for (let i = 0; i < 3; i++) {
    const height = 12 + Math.sin(anim * 0.23 + e.tx + i * 2) * 4;
    R(ctx, x + 2 + i * 4, y - height, 4, height + 8, '#f45a20');
    R(ctx, x + 3 + i * 4, y - height + 5, 2, height + 1, '#ffd65a');
  }
}

export function drawClassicWorld(ctx, vw, gs, theme, hints) {
  const c = gs.classic, anim = gs.anim, cx = Math.round(gs.camX);
  const c0 = Math.floor(gs.camX / T), c1 = Math.min(world.cols - 1, c0 + Math.ceil(vw / T) + 1);
  const inView = tx => tx >= c0 - 1 && tx <= c1;

  for (let ty = 0; ty < world.rows; ty++) {
    const row = world.grid[ty];
    for (let tx = Math.max(0, c0); tx <= c1; tx++) {
      if (row[tx] === '#') drawTile(ctx, theme, !solid(tx, ty - 1), tx * T - cx, ty * T, tx);
    }
  }
  for (const b of c.crumbles) if (inView(b.tx)) drawCrumble(ctx, b, cx);
  for (const j of c.pads) if (inView(j.tx)) drawJumpPad(ctx, j, cx);
  for (const h of c.spikes) if (inView(h.tx)) drawSpike(ctx, h, cx);
  for (const saw of c.saws) drawSaw(ctx, saw, cx);
  for (const coin of c.coins) if (!coin.got) drawCoin(ctx, coin, cx, anim);

  if (hints) {
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff4d4';
    for (const [str, x, y] of hints) ctx.fillText(str, x - cx, y);
  }
  for (const e of c.elements) {
    const x = e.x - cx;
    if (x >= -T && x <= vw) drawElement(ctx, e, x, anim, gs.levelTick);
  }
  drawExitGate(ctx, gs, cx, anim, theme);
  drawBoy(ctx, gs.p, cx, anim, gs);
}
