import {cached, glow} from './gfx.js';

// Procedural scenery shared by Level 1 (sunset meadow), Level 2 (moonlit pine forest) and the
// main menu. Static layers are painted once into small seamless strips and scrolled with parallax;
// only the stars, fireflies, birds, clouds and mist move every frame.
const S = 2; // strips are painted at 2x so the scaled-up canvas stays crisp
const layer = (key, w, h, paint) => cached(key, w * S, h * S, g => { g.scale(S, S); paint(g); });
const TAU = Math.PI * 2;
const hash = n => { let h = (n * 374761393) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// Draws a seamless strip across the screen, scrolled by `scroll` pixels.
function strip(ctx, canvas, w, h, scroll, y, vw) {
  if (!canvas) return;
  const x0 = -((scroll % w) + w) % w;
  for (let x = x0; x < vw; x += w) ctx.drawImage(canvas, Math.round(x), Math.round(y), w, h);
}

// Height of a periodic ridge: integer wave counts make the strip tile without a seam.
function ridge(x, W, base, waves) {
  let y = base;
  for (const [k, amp, phase] of waves) y += Math.sin(TAU * k * x / W + phase) * amp;
  return y;
}

function paintRidge(g, W, H, base, waves, color, step = 3, jag = 0) {
  g.fillStyle = color;
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += step) g.lineTo(x, ridge(x, W, base, waves) - (jag ? Math.abs(Math.sin(x * .9)) * jag : 0));
  g.lineTo(W, H); g.closePath(); g.fill();
}

// A layered pine: slim stacked triangles that widen towards the bottom, with a pale edge on one side.
function pine(g, x, base, h, color, tiers = 4) {
  const tierH = h * .42, step = (h * .9 - tierH) / (tiers - 1), maxW = h * .2;
  g.fillStyle = color;
  g.fillRect(x - Math.max(1, h * .02), base - h * .1, Math.max(2, h * .04), h * .1 + 2);
  for (let i = 0; i < tiers; i++) {
    const apex = base - h + i * step, w = maxW * (.5 + .5 * i / (tiers - 1));
    g.fillStyle = color;
    g.beginPath(); g.moveTo(x, apex); g.lineTo(x + w, apex + tierH); g.lineTo(x + w * .35, apex + tierH * .9); g.lineTo(x - w * .35, apex + tierH * .9); g.lineTo(x - w, apex + tierH); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.05)';
    g.beginPath(); g.moveTo(x, apex); g.lineTo(x - w, apex + tierH); g.lineTo(x - w * .35, apex + tierH * .9); g.closePath(); g.fill();
  }
}

// A row of pines laid out over [0, W) with wrap-around so the strip tiles.
function pineRow(g, W, base, minH, maxH, spacing, color, seed) {
  for (let x = 0, i = 0; x < W; x += spacing * (.6 + hash(seed + i) * .8), i++) {
    const h = minH + hash(seed + i * 7) * (maxH - minH);
    for (const dx of [0, -W, W]) pine(g, x + dx, base, h, color, 4 + (i % 3));
  }
}

function gradientStrip(key, h, stops) {
  return cached(key, 1, h, g => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    for (const [at, color] of stops) grad.addColorStop(at, color);
    g.fillStyle = grad; g.fillRect(0, 0, 1, h);
  });
}

function stars(ctx, vw, vh, time, count, scroll, limit = .55) {
  for (let i = 0; i < count; i++) {
    const x = ((hash(i) * (vw + 80) - scroll) % (vw + 80) + vw + 80) % (vw + 80) - 40, y = hash(i + 500) * vh * limit;
    ctx.globalAlpha = .25 + .75 * Math.abs(Math.sin(time * (.6 + hash(i + 9)) + i));
    ctx.fillStyle = i % 7 === 0 ? '#bfe0ff' : '#ffffff';
    ctx.fillRect(Math.round(x), Math.round(y), i % 11 === 0 ? 2 : 1, i % 11 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}

function fireflies(ctx, vw, vh, time, scroll, count, color, bandTop) {
  for (let i = 0; i < count; i++) {
    const bx = hash(i + 40) * (vw + 100), by = bandTop + hash(i + 80) * (vh - bandTop - 20);
    const x = ((bx - scroll + Math.sin(time * .5 + i) * 14) % (vw + 100) + vw + 100) % (vw + 100) - 50;
    const y = by + Math.sin(time * .7 + i * 1.7) * 9;
    const a = Math.max(0, Math.sin(time * 1.4 + i * 2.3)) ** 2;
    if (a < .05) continue;
    glow(ctx, x, y, 7, color, .5 * a);
    ctx.globalAlpha = a; ctx.fillStyle = '#f6ffc8'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.globalAlpha = 1;
  }
}

// ── Moonlit forest (Level 2) and dusk forest (menu) ────────────────────────────
const PALETTES = {
  forest: {
    sky: [[0, '#040b16'], [.45, '#0b2434'], [.8, '#1d4a54'], [1, '#2f6a68']],
    mountain: '#10323d', far: '#0e2d36', mid: '#0a2229', near: '#06161b', mist: [120, 200, 200, .12],
    moon: {x: .78, y: .2, r: 15, color: '#e6f8ff', halo: '#7fe0ff'}, stars: 70, fireflies: {n: 26, color: '#d6ff7a'}, rays: true
  },
  dusk: {
    sky: [[0, '#0b0524'], [.4, '#3a1a6e'], [.72, '#d4587c'], [1, '#ffb070']],
    mountain: '#4a2a7c', far: '#3a2070', mid: '#291456', near: '#12082a', mist: [255, 170, 160, .1],
    sun: {x: .5, y: .78, r: 26, color: '#ffe0a0', halo: '#ff9a60'}, stars: 90, fireflies: {n: 16, color: '#ffe070'}, rays: false
  }
};

function forestLayers(name, pal) {
  const mountains = layer(`scn-${name}-mtn`, 480, 230, g => paintRidge(g, 480, 230, 120, [[2, 22, 1], [5, 11, 2], [9, 5, 0]], pal.mountain, 3, 3));
  const far = layer(`scn-${name}-far`, 360, 210, g => { paintRidge(g, 360, 210, 128, [[3, 8, 0], [7, 3, 1]], pal.far, 3); pineRow(g, 360, 144, 22, 40, 11, pal.far, 11); });
  const mid = layer(`scn-${name}-mid`, 320, 230, g => { paintRidge(g, 320, 230, 168, [[2, 6, 2], [5, 3, 0]], pal.mid, 3); pineRow(g, 320, 180, 44, 78, 20, pal.mid, 31); });
  const near = layer(`scn-${name}-near`, 420, 270, g => { pineRow(g, 420, 268, 96, 170, 105, pal.near, 51); g.fillStyle = pal.near; g.fillRect(0, 256, 420, 14); });
  return {mountains, far, mid, near};
}

export function drawForestScene(ctx, vw, vh, camX, time, name = 'forest', opts = {}) {
  const pal = PALETTES[name], L = forestLayers(name, pal);
  const sky = gradientStrip(`scn-${name}-sky`, vh, pal.sky);
  if (sky) ctx.drawImage(sky, 0, 0, vw, vh); else { ctx.fillStyle = pal.sky[1][1]; ctx.fillRect(0, 0, vw, vh); }
  stars(ctx, vw, vh, time, pal.stars, camX * .02);
  if (pal.moon) {
    const m = pal.moon, mx = vw * m.x - camX * .015, my = vh * m.y;
    glow(ctx, mx, my, m.r * 4.5, m.halo, .28);
    ctx.fillStyle = m.color; ctx.beginPath(); ctx.arc(mx, my, m.r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,150,170,.35)';
    for (const [dx, dy, r] of [[-5, -3, 4], [4, 4, 3], [2, -7, 2]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, TAU); ctx.fill(); }
  }
  if (pal.sun) {
    const s = pal.sun, sx = vw * s.x, sy = vh * s.y;
    glow(ctx, sx, sy, s.r * 6, s.halo, .5);
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(sx, sy, s.r, Math.PI, 0); ctx.fill();
  }
  if (pal.rays) { // faint shafts of moonlight through the trees
    ctx.fillStyle = 'rgba(160,230,255,.035)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 190 + time * 3 - camX * .3) % (vw + 200) + vw + 200) % (vw + 200) - 60;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 26, 0); ctx.lineTo(x + 120, vh); ctx.lineTo(x - 30, vh); ctx.fill();
    }
  }
  strip(ctx, L.mountains, 480, 230, camX * .08, vh - 220, vw);
  strip(ctx, L.far, 360, 210, camX * .16, vh - 209, vw);
  mistBand(ctx, vw, vh * .62, time, pal.mist, 1);
  strip(ctx, L.mid, 320, 230, camX * .3, vh - 228, vw);
  mistBand(ctx, vw, vh * .78, time, pal.mist, 1.6);
  if (opts.fireflies !== false && pal.fireflies) fireflies(ctx, vw, vh, time, camX * .5, pal.fireflies.n, pal.fireflies.color, vh * .45);
  if (opts.near !== false) strip(ctx, L.near, 420, 270, camX * .55, vh - 270, vw);
}

// A soft horizontal fog band; [r, g, b, alpha].
function mistBand(ctx, vw, y, time, [r, g, b, alpha], speed) {
  const top = y + Math.sin(time * .3 * speed) * 4;
  const grad = ctx.createLinearGradient(0, top, 0, top + 48);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(.5, `rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, top, vw, 48);
}

// ── Sunset meadow (Level 1) ────────────────────────────────────────────────────
const CLOUD_SHAPES = [
  [[0, 0, 15], [16, -5, 19], [34, -1, 16], [48, 4, 11], [-13, 5, 11]],
  [[0, 0, 12], [14, -6, 16], [30, -2, 13], [-12, 4, 9]],
  [[0, 0, 18], [20, -8, 22], [42, -3, 18], [60, 3, 13], [-16, 6, 12], [28, 6, 14]]
];

function cloudSprite(i) {
  return layer(`scn-cloud-${i}`, 120, 56, g => {
    g.translate(30, 34);
    for (const [x, y, r] of CLOUD_SHAPES[i]) {
      const grad = g.createLinearGradient(0, y - r, 0, y + r);
      grad.addColorStop(0, '#fff3dc'); grad.addColorStop(.55, '#ffd2a0'); grad.addColorStop(1, '#f08a72');
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  });
}

function drawCloud(ctx, i, x, y, scale, alpha) {
  const c = cloudSprite(i);
  if (!c) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, Math.round(x - 30 * scale), Math.round(y - 34 * scale), 120 * scale, 56 * scale);
  ctx.globalAlpha = 1;
}

function round(g, x, y, r, color) { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }

export function drawMeadowScene(ctx, vw, vh, camX, time) {
  const sky = gradientStrip('scn-meadow-sky', vh, [[0, '#41659f'], [.35, '#8a7fb0'], [.62, '#f2a070'], [.82, '#ffd08a'], [1, '#ffe4a8']]);
  if (sky) ctx.drawImage(sky, 0, 0, vw, vh); else { ctx.fillStyle = '#f2a070'; ctx.fillRect(0, 0, vw, vh); }
  // Low sun with soft god-rays.
  const sx = vw * .2 - camX * .01, sy = vh * .64;
  glow(ctx, sx, sy, 150, '#ffb060', .45);
  ctx.fillStyle = 'rgba(255,230,170,.05)';
  for (let i = 0; i < 7; i++) {
    const a = -1.1 + i * .3 + Math.sin(time * .2 + i) * .02;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * 520 - 20, sy + Math.sin(a) * 520); ctx.lineTo(sx + Math.cos(a) * 520 + 20, sy + Math.sin(a) * 520); ctx.fill();
  }
  ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(sx, sy, 24, 0, TAU); ctx.fill();
  glow(ctx, sx, sy, 40, '#ffffff', .6);
  // Three cloud layers drifting at different speeds.
  const wrap = (v, w) => ((v % w) + w) % w;
  const LAYERS = [[.05, .5, 8, .75, 0], [.12, .8, 14, .9, 3], [.22, 1.1, 20, 1, 7]];
  LAYERS.forEach(([par, scale, speed, alpha, seed], li) => {
    for (let i = 0; i < 4; i++) {
      const span = vw + 260, x = wrap(hash(seed + i) * span + time * speed - camX * par, span) - 130;
      const y = 24 + li * 38 + hash(seed + i + 30) * 40;
      drawCloud(ctx, (i + li) % 3, x, y, scale, alpha);
    }
  });
  // Birds crossing the sky.
  ctx.strokeStyle = 'rgba(60,40,70,.7)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * 150 + time * 14 - camX * .08, vw + 120) - 60, y = 40 + (i * 29) % 70 + Math.sin(time * 1.2 + i) * 4, flap = Math.sin(time * 9 + i * 2) * 2.5;
    ctx.beginPath(); ctx.moveTo(x - 5, y + flap); ctx.lineTo(x, y); ctx.lineTo(x + 5, y + flap); ctx.stroke();
  }
  // Hills, far to near.
  const far = layer('scn-meadow-far', 480, 190, g => { paintRidge(g, 480, 190, 100, [[2, 14, 0], [5, 6, 1]], '#8a6a98', 3); });
  const mid = layer('scn-meadow-mid', 400, 170, g => {
    paintRidge(g, 400, 170, 112, [[2, 10, 2], [6, 4, 0]], '#6d7f58', 3);
    for (let i = 0; i < 12; i++) { const x = hash(i + 70) * 400, y = ridge(x, 400, 112, [[2, 10, 2], [6, 4, 0]]); for (const dx of [0, -400, 400]) { g.fillStyle = '#4e5f40'; g.fillRect(x + dx - .5, y - 3, 1, 4); round(g, x + dx, y - 6, 4 + hash(i) * 2, '#4a6a3c'); } }
  });
  const near = layer('scn-meadow-near', 360, 120, g => {
    paintRidge(g, 360, 120, 60, [[2, 12, 1], [5, 5, 3]], "#4a7a3c", 3);
    for (let i = 0; i < 30; i++) { // little flowers
      const x = hash(i + 200) * 360, y = ridge(x, 360, 60, [[2, 12, 1], [5, 5, 3]]) + 6 + hash(i + 300) * 30;
      g.fillStyle = ['#ffd24a', '#ff8aa8', '#ffffff'][i % 3]; g.fillRect(x, y, 1.5, 1.5);
    }
  });
  strip(ctx, far, 480, 190, camX * .1, vh - 190, vw);
  strip(ctx, mid, 400, 170, camX * .22, vh - 170, vw);
  strip(ctx, near, 360, 120, camX * .4, vh - 120, vw);
}
