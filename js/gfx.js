import {spriteSource} from './assets.js';
import {SPRITES} from './atlas-data.js';

export const R = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

// Offscreen canvases are unavailable under node tests; callers fall back to direct drawing.
export function makeCanvas(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

const caches = new Map();
// paint(ctx) returns false when its inputs are not ready yet; nothing is cached then.
export function cached(key, w, h, paint) {
  if (caches.has(key)) return caches.get(key);
  const c = makeCanvas(w, h);
  if (!c || paint(c.getContext('2d'), c) === false) return null;
  caches.set(key, c);
  return c;
}

function blit(ctx, img, sx, sy, sw, sh, x, y, w, h, angle, flip) {
  if (!angle && !flip) { ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h); return; }
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (angle) ctx.rotate(angle);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  ctx.restore();
}

// Draws an atlas sprite at width w, keeping its aspect ratio. Returns the drawn height.
export function drawSprite(ctx, name, x, y, w, angle = 0, flip = false) {
  const src = spriteSource(name);
  if (!src) return 0;
  const [sx, sy, sw, sh] = src.rect, h = w * sh / sw;
  blit(ctx, src.img, sx, sy, sw, sh, x, y, w, h, angle, flip);
  return h;
}

// Canvas `filter` is re-evaluated on every draw call, so filtered variants are baked once.
export function filteredSprite(name, filter) {
  const def = SPRITES[name];
  return cached(name + '|' + filter, def[3], def[4], g => {
    const src = spriteSource(name);
    if (!src) return false;
    g.filter = filter;
    g.drawImage(src.img, ...src.rect, 0, 0, def[3], def[4]);
  });
}

export function drawFiltered(ctx, name, filter, x, y, w, angle = 0) {
  const c = filteredSprite(name, filter);
  if (!c) return drawSprite(ctx, name, x, y, w, angle);
  const h = w * c.height / c.width;
  blit(ctx, c, 0, 0, c.width, c.height, x, y, w, h, angle, false);
  return h;
}

// Radial "light" textures: one per colour, reused for glows and soft particles.
const GLOW = 64;
function glowTexture(color) {
  return cached('glow|' + color, GLOW, GLOW, g => {
    const grad = g.createRadialGradient(GLOW / 2, GLOW / 2, 0, GLOW / 2, GLOW / 2, GLOW / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, GLOW, GLOW);
  });
}

// Soft radial dot drawn with the current alpha and composite mode.
export function softDot(ctx, x, y, r, color) {
  const tex = glowTexture(color);
  if (tex) { ctx.drawImage(tex, x - r, y - r, r * 2, r * 2); return; }
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function glow(ctx, x, y, r, color, alpha = .25) {
  const a = ctx.globalAlpha, op = ctx.globalCompositeOperation;
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'screen';
  softDot(ctx, x, y, r, color);
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = op;
}

export function label(ctx, value, x, y, color, size = 6) {
  ctx.font = size + 'px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

// Particles fade with life; soft types (steam, gas, smoke) use the cached radial texture.
export function drawParticles(ctx, particles, {cx = 0, visible, isSoft, maxAlpha, color = a => a.color}) {
  const a0 = ctx.globalAlpha;
  for (const a of particles) {
    if (!visible(a)) continue;
    const x = a.x - cx, y = a.y, soft = isSoft(a);
    ctx.globalAlpha = Math.min(maxAlpha(a, soft), a.life / a.max);
    if (soft) softDot(ctx, x, y, a.r, color(a));
    else {
      ctx.fillStyle = color(a);
      ctx.beginPath(); ctx.arc(x, y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = a0;
}
