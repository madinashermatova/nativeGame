import {solid} from './world.js';
import {T} from './config.js';
import {softDot} from './gfx.js';

// Blood behaves like a thick liquid. Airborne drops stretch along their motion and are tied to the
// previous drop of the same trail by a thin thread. A drop that lands flattens into a puddle that slowly
// spreads; one that hits a wall sticks and creeps downwards as a drip, leaving a streak, and pools
// when it reaches the floor. Everything fades away again after a second or two.
const GRAVITY = .12, DRAG = .985;

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

function settle(bp, floorY) { // turn a drop into a puddle sitting on the floor
  bp.kind = 'puddle';
  bp.y = floorY;
  bp.w = bp.r * 1.6;
  bp.maxW = bp.r * 3.2 + Math.min(6, Math.abs(bp.vy) * 1.6);
  bp.vx = bp.vy = 0;
 
  bp.life = bp.maxLife = Math.round(rand(70, 110)); // puddles dry up within ~1.5 s
}

export function updateBlood(blood) {
  if (!blood) return;
  for (let i = blood.length - 1; i >= 0; i--) {
    const bp = blood[i];
    bp.life--;
    if (bp.life <= 0) { blood.splice(i, 1); continue; }
    if (bp.kind === 'dust') {
      bp.x += bp.vx; bp.y += bp.vy;
      bp.vx *= .955; bp.vy = bp.vy * .97 + bp.rise;
      continue;
    }
    if (bp.kind === 'puddle') {
      bp.w += (bp.maxW - bp.w) * .05; // slow, thick spreading
      continue;
    }
    if (bp.kind === 'smear') {
      // Stuck to a wall: creep downward, faster as the blob gets heavier, until the wall ends or the floor is reached.
      if (!solid(Math.floor((bp.x + bp.side) / T), Math.floor(bp.y / T))) { bp.kind = 'drop'; bp.vx = 0; bp.vy = .3; continue; }
      bp.vy = Math.min(bp.vy + .004, .22);
      bp.y += bp.vy;
      if (solid(Math.floor(bp.x / T), Math.floor((bp.y + 1) / T))) { bp.y = Math.floor((bp.y + 1) / T) * T - .5; bp.y0 = Math.min(bp.y0, bp.y); settle(bp, bp.y); }
      continue;
    }
    // airborne drop; one that starts inside solid ground is simply dropped
    if (solid(Math.floor(bp.x / T), Math.floor(bp.y / T))) { blood.splice(i, 1); continue; }
    bp.vy += GRAVITY;
    bp.vx *= DRAG;
    const nx = bp.x + bp.vx, ny = bp.y + bp.vy;
    if (solid(Math.floor(nx / T), Math.floor(bp.y / T))) { // hit a wall: stick
      bp.kind = 'smear'; bp.side = Math.sign(bp.vx) || 1; bp.vx = 0; bp.vy = .02; bp.y0 = bp.y;
      bp.life = bp.maxLife = Math.round(rand(80, 120)); // drips on walls vanish quickly too
    } else if (solid(Math.floor(bp.x / T), Math.floor(ny / T))) {
      if (bp.vy > 0) settle(bp, Math.floor(ny / T) * T - .5); // hit the floor: splat
      else { bp.vy = .4; bp.y = ny + 1; } // bumped a ceiling: drips back down
    } else { bp.x = nx; bp.y = ny; }
  }
}

// ── Dust ────────────────────────────────────────────────────────────────────────
// Emits `count` puffs around (x, y). vx/vy is the base drift, `spread` the random scatter, r the starting
// radius, grow how much it swells over its life, a the peak opacity.
export function addDust(list, x, y, {count = 1, vx = 0, vy = -.2, spread = .3, r = 2, grow = 5, life = 36, a = .45, rise = -.004, color = '#d8ccb4'} = {}) {
  if (!list) return;
  let n = 0;
  for (const bp of list) if (bp.kind === 'dust') n++;
  for (let i = 0; i < count && n < 140; i++, n++) {
    const ttl = Math.round(life * rand(.8, 1.25));
    list.push({
      kind: 'dust', x: x + rand(-1.5, 1.5), y: y + rand(-1, 1),
      vx: vx + rand(-spread, spread), vy: vy + rand(-spread * .5, spread * .5),
      r0: r * rand(.8, 1.2), grow, a, rise, color, life: ttl, maxLife: ttl
    });
  }
}

function drawDust(ctx, list, cx, cy) {
  const alpha = ctx.globalAlpha;
  for (const bp of list) {
    if (bp.kind !== 'dust') continue;
    const x = bp.x - cx, y = bp.y - cy;
    if (x < -20 || x > 740 || y < -20 || y > 300) continue;
    const t = 1 - bp.life / bp.maxLife, fadeIn = Math.min(1, t * 8);
    ctx.globalAlpha = alpha * Math.min(.95, bp.a * 2.6) * (1 - t) * (1 - t) * fadeIn;
    softDot(ctx, x, y, (bp.r0 + bp.grow * Math.sqrt(t)) * 2, bp.color);
  }
  ctx.globalAlpha = alpha;
}

// ── Rendering: gooey metaballs ──────────────────────────────────────────────────
// All blood is drawn as plain shapes into a hidden buffer at 2x, blurred a little, then thresholded on
// alpha. Shapes that come close merge into one smooth mass (drops fuse with their thread, puddles run into
// each other). The threshold edge is shaded as a bevel (dark rim, glossy top-left highlight, brighter core),
// which makes it read as thick, wet liquid rather than flat shapes. Only the screen area that actually
// contains blood is processed.
const RES = 2, THRESHOLD = 118, BLUR = 1.5 * RES;
let draw = null, soft = null, out = null;

function buffers() {
  if (draw !== null) return draw !== false;
  if (typeof document === 'undefined') { draw = false; return false; }
  const make = () => { const c = document.createElement('canvas'); c.width = 760 * RES; c.height = 300 * RES; return c; };
  draw = make().getContext('2d');
  soft = make().getContext('2d', {willReadFrequently: true});
  out = make().getContext('2d');
  return true;
}

// 1 while healthy, shrinking to 0 as the blob dries up (shapes shrink instead of turning transparent).
function size(bp) {
  const k = bp.life / (bp.maxLife || 30);
  return k > .5 ? 1 : Math.max(0, k / .5);
}

function shapeDrop(g, bp, x, y, s) {
  const r = Math.max(1.3, (bp.r || 2) * .8) * s, sp = Math.hypot(bp.vx, bp.vy);
  g.beginPath();
  if (sp < .5) g.arc(x, y, r, 0, Math.PI * 2);
  else { // teardrop: round head leading, tail dragging behind
    const tail = Math.min(9, sp * 2.6 + 1.5) * s, angle = Math.atan2(bp.vy, bp.vx);
    g.save(); g.translate(x, y); g.rotate(angle);
    g.moveTo(-tail, 0);
    g.quadraticCurveTo(-tail * .35, -r * 1.05, 0, -r);
    g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    g.quadraticCurveTo(-tail * .35, r * 1.05, -tail, 0);
    g.restore();
  }
  g.fill();
}

function shapePuddle(g, bp, x, y, s) {
  const rx = Math.max(1.5, bp.w / 2) * s, ry = Math.max(.9, Math.min(2.4, bp.r * .55)) * Math.max(.5, s);
  g.beginPath(); g.ellipse(x, y - ry * .35, rx, ry, 0, 0, Math.PI * 2); g.fill();
  if (rx > 3) { g.beginPath(); g.ellipse(x - rx * .35, y - ry * .9, rx * .4, ry * .7, 0, 0, Math.PI * 2); g.fill(); } // a swollen lump, so puddles are not flat lenses
}

function shapeSmear(g, bp, x, y, cy, s) {
  const width = Math.max(1.3, (bp.r || 2) * .6) * s, top = bp.y0 - cy;
  g.fillRect(x - width / 2 + bp.side * .3, top, width, Math.max(0, y - top)); // the streak left on the wall
  g.beginPath(); g.arc(x + bp.side * .3, y, width * 1.15, 0, Math.PI * 2); g.fill(); // the heavy drip at its end
}


export function drawBlood(ctx, blood, cx = 0, cy = 0) {
  if (!blood || blood.length === 0) return;
  drawDust(ctx, blood, cx, cy);
  const visible = blood.filter(bp => bp.kind !== 'dust' && bp.x - cx > -30 && bp.x - cx < 730 && bp.y - cy > -30 && bp.y - cy < 290);
  if (visible.length === 0) return;
  if (!buffers()) { // no canvas (e.g. headless checks): plain dots
    ctx.fillStyle = '#b80018';
    for (const bp of visible) ctx.fillRect(bp.x - cx, bp.y - cy, bp.r || 2, bp.r || 2);
    return;
  }
  // Area to process, in logical pixels.
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const bp of visible) {
    const x = bp.x - cx, y = bp.y - cy, pad = 14 + (bp.w || 0) / 2;
    x0 = Math.min(x0, x - pad); x1 = Math.max(x1, x + pad); y0 = Math.min(y0, (bp.y0 !== undefined ? bp.y0 - cy : y) - 14); y1 = Math.max(y1, y + 14);
  }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(760, Math.ceil(x1)); y1 = Math.min(300, Math.ceil(y1));
  const w = (x1 - x0) * RES, h = (y1 - y0) * RES;
  if (w <= 0 || h <= 0) return;

  draw.setTransform(1, 0, 0, 1, 0, 0);
  draw.clearRect(0, 0, 760 * RES, 300 * RES);
  draw.setTransform(RES, 0, 0, RES, 0, 0);
  for (const bp of visible) {
    const x = bp.x - cx, y = bp.y - cy, s = size(bp);
    if (s <= 0) continue;
    draw.fillStyle = bp.color || '#b80018';
    if (bp.kind === 'puddle') shapePuddle(draw, bp, x, y, s);
    else if (bp.kind === 'smear') shapeSmear(draw, bp, x, y, cy, s);
    else shapeDrop(draw, bp, x, y, s);
  }

  soft.setTransform(1, 0, 0, 1, 0, 0);
  soft.clearRect(0, 0, 760 * RES, 300 * RES);
  soft.filter = `blur(${BLUR}px)`;
  soft.drawImage(draw.canvas, 0, 0);
  soft.filter = 'none';
  const src = soft.getImageData(x0 * RES, y0 * RES, w, h), px = src.data, dst = out.createImageData(w, h), od = dst.data;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : px[(y * w + x) * 4 + 3];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = px[i + 3];
      if (a < THRESHOLD) continue;
      const depth = Math.min(1, (a - THRESHOLD) / (255 - THRESHOLD)); // 0 at the edge, 1 deep inside
      const edge = 1 - Math.min(1, depth * 2.4);
      const light = (at(x - 1, y - 1) + at(x - 2, y - 2) - at(x + 1, y + 1) - at(x + 2, y + 2)) / 510; // + facing the top-left
      let mult = (1 - .5 * edge) * (.88 + .22 * depth);
      let r = px[i] * mult, g = px[i + 1] * mult, b = px[i + 2] * mult;
      if (light > 0) { const k = Math.min(1, light * 1.6); r += (255 - r) * k * .75; g += (150 - g) * k * .65; b += (165 - b) * k * .65; }
      else { const k = Math.min(1, -light * 1.4); r *= 1 - k * .45; g *= 1 - k * .45; b *= 1 - k * .45; }
      od[i] = r; od[i + 1] = g; od[i + 2] = b; od[i + 3] = 255;
    }
  }
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.clearRect(0, 0, 760 * RES, 300 * RES);
  out.putImageData(dst, x0 * RES, y0 * RES);
  ctx.drawImage(out.canvas, x0 * RES, y0 * RES, w, h, x0, y0, x1 - x0, y1 - y0);
}
