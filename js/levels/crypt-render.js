import {T} from '../config.js';
import {solid} from '../world.js';
import {R, cached, makeCanvas, glow, softDot, drawParticles} from '../gfx.js';
import {drawBoy} from '../renderer.js';
import {CRYPT, BRAZIERS, CRYPT_SECTIONS} from './crypt.js';

// Everything in Level 6 is drawn in code: pixel-art tiles are baked once into small
// canvases, creatures and traps are animated from the level clock.
const BONE = '#d8d2bb';
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// ---------- tiles ----------
const STONES = ['#3b3650', '#34304a', '#403b57', '#2f2b42', '#383250'];

function paintTile(g, kind, v) {
  const r = rng(v * 977 + kind.charCodeAt(0) * 31);
  g.fillStyle = kind === 'deep' ? '#14101d' : '#1d1929';
  g.fillRect(0, 0, T, T);
  for (let row = 0; row < 2; row++) {
    const off = (row + v) % 2 ? 4 : 0;
    for (let bx = -off; bx < T; bx += 8) {
      g.fillStyle = kind === 'deep' ? '#262136' : STONES[Math.floor(r() * STONES.length)];
      g.fillRect(Math.max(0, bx) + 1, row * 8 + 1, Math.min(8, bx + 8) - Math.max(0, bx) - 1, 6);
      g.fillStyle = 'rgba(255,255,255,.08)';
      g.fillRect(Math.max(0, bx) + 1, row * 8 + 1, Math.min(8, bx + 8) - Math.max(0, bx) - 1, 1);
    }
  }
  if (r() < .3) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(3 + Math.floor(r() * 8), 2, 1, 5); g.fillRect(4 + Math.floor(r() * 8), 7, 1, 4); }
  if (kind === 'cap') {
    g.fillStyle = '#524b6c'; g.fillRect(0, 0, T, 3);
    g.fillStyle = '#6a6288'; g.fillRect(0, 0, T, 1);
    g.fillStyle = '#2c273d'; g.fillRect(0, 3, T, 1);
    if (r() < .6) { g.fillStyle = '#3e5a3a'; g.fillRect(Math.floor(r() * 10), 0, 3 + Math.floor(r() * 4), 2); }
    if (r() < .18) { g.fillStyle = BONE; g.fillRect(4 + Math.floor(r() * 6), 1, 4, 1); g.fillRect(5 + Math.floor(r() * 5), 0, 1, 1); }
  } else if (kind === 'ceil') {
    g.fillStyle = '#100d19'; g.fillRect(0, T - 3, T, 3);
    g.fillStyle = '#2a2540'; g.fillRect(0, T - 4, T, 1);
    if (r() < .5) { g.fillStyle = '#100d19'; g.fillRect(Math.floor(r() * 12), T - 5, 3, 2); }
  }
  if (v === 5 && kind === 'brick') {
    // A skull walled into the stone.
    g.fillStyle = '#0d0a14'; g.fillRect(3, 3, 10, 10);
    g.fillStyle = BONE; g.fillRect(4, 4, 8, 6); g.fillRect(5, 10, 6, 2);
    g.fillStyle = '#0d0a14'; g.fillRect(5, 6, 2, 2); g.fillRect(9, 6, 2, 2); g.fillRect(7, 9, 2, 1);
  }
}

function tileCanvas(kind, v) { return cached(`crypt-${kind}-${v}`, T, T, g => paintTile(g, kind, v)); }

function drawTiles(ctx, vw, cx) {
  const c0 = Math.max(0, Math.floor(cx / T)), c1 = Math.min(CRYPT.cols - 1, Math.ceil((cx + vw) / T));
  for (let r = 0; r < CRYPT.rows; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!solid(c, r)) continue;
      const kind = !solid(c, r - 1) ? 'cap' : !solid(c, r + 1) ? 'ceil' : r >= 15 || c === 0 || c === CRYPT.cols - 1 ? 'deep' : 'brick';
      const v = hash(c, r) % 6, x = c * T - Math.round(cx), y = r * T;
      const tile = tileCanvas(kind, v);
      if (tile) ctx.drawImage(tile, x, y);
      else R(ctx, x, y, T, T, kind === 'cap' ? '#524b6c' : '#34304a');
      if (!solid(c - 1, r) && c > 0) R(ctx, x, y, 1, T, 'rgba(0,0,0,.4)');
      if (!solid(c + 1, r) && c < CRYPT.cols - 1) R(ctx, x + T - 1, y, 1, T, 'rgba(0,0,0,.4)');
    }
  }
}

// ---------- background ----------
function archWindow(ctx, x, y, w, h, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2);
  ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}

export function drawCryptBackground(ctx, vw, cx, gs) {
  const f = gs.crypt, time = f ? f.time : 0, flash = f ? f.flash : 0;
  const grad = ctx.createLinearGradient(0, 0, 0, 270);
  grad.addColorStop(0, '#0a0713'); grad.addColorStop(1, '#1c1228');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, vw, 270);

  // Tall moonlit windows (slow parallax) with a pale shaft of light.
  const farStep = 190, far = cx * .12;
  for (let i = -1; i * farStep - (far % farStep) < vw + farStep; i++) {
    const x = i * farStep - (far % farStep) + 60;
    ctx.globalAlpha = 1;
    archWindow(ctx, x - 3, 22, 46, 150, '#0c0916');
    archWindow(ctx, x, 26, 40, 144, `rgba(${100 + flash * 120 | 0},${130 + flash * 110 | 0},${190 + flash * 60 | 0},${.2 + flash * .65})`);
    R(ctx, x + 19, 26, 2, 144, '#0c0916'); R(ctx, x, 80, 40, 2, '#0c0916'); R(ctx, x, 120, 40, 2, '#0c0916');
    ctx.fillStyle = `rgba(140,160,220,${.04 + flash * .12})`;
    ctx.beginPath(); ctx.moveTo(x + 4, 170); ctx.lineTo(x + 36, 170); ctx.lineTo(x + 80, 270); ctx.lineTo(x - 30, 270); ctx.closePath(); ctx.fill();
  }

  // Columns with blinking eyes in the dark gaps between them.
  const midStep = 150, mid = cx * .35, midIdx = Math.floor(mid / midStep);
  for (let i = -1; i * midStep - (mid % midStep) < vw + midStep; i++) {
    const x = i * midStep - (mid % midStep), idx = midIdx + i, h = hash(idx);
    R(ctx, x, 0, 22, 224, '#171122'); R(ctx, x + 2, 0, 3, 224, '#201a2e'); R(ctx, x - 4, 16, 30, 8, '#1d1729'); R(ctx, x - 4, 205, 30, 19, '#1d1729');
    if (h % 3 === 0) {
      const ex = x + 70 + h % 30, ey = 110 + h % 50, blink = (time + idx * 1.7) % 4.3 < .18;
      const look = Math.sign((gs.p ? gs.p.x - cx - ex : 0)) * 1;
      if (!blink) {
        R(ctx, ex, ey, 3, 2, h % 2 ? '#e0a020' : '#c01830'); R(ctx, ex + 7, ey, 3, 2, h % 2 ? '#e0a020' : '#c01830');
        R(ctx, ex + 1 + (look > 0 ? 1 : 0), ey, 1, 2, '#000'); R(ctx, ex + 8 + (look > 0 ? 1 : 0), ey, 1, 2, '#000');
        glow(ctx, ex + 5, ey + 1, 12, h % 2 ? '#e0a020' : '#c01830', .25);
      }
    }
    if (h % 4 === 1) { // cobweb
      ctx.strokeStyle = 'rgba(200,200,220,.18)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k < 4; k++) { ctx.moveTo(x + 22, 24); ctx.lineTo(x + 22 + 26 - k * 3, 24 + k * 9 + Math.sin(time + idx) * 1.5); }
      ctx.stroke();
    }
  }

  // Hanging chains swaying with a slow draught.
  const chainStep = 97, chain = cx * .7;
  for (let i = -1; i * chainStep - (chain % chainStep) < vw + chainStep; i++) {
    const x = i * chainStep - (chain % chainStep), idx = Math.floor(chain / chainStep) + i, len = 24 + hash(idx) % 40;
    ctx.strokeStyle = '#0c0914'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x, 32); ctx.quadraticCurveTo(x + Math.sin(time * .8 + idx) * 3, 32 + len / 2, x + Math.sin(time * .8 + idx) * 5, 32 + len); ctx.stroke();
  }

  // Low fog drifting along the floor.
  for (let i = 0; i < 7; i++) {
    const x = ((i * 97 - time * 9 - cx * .5) % (vw + 160) + vw + 160) % (vw + 160) - 80;
    glow(ctx, x, 232 - (i % 3) * 6, 70, '#5b4a80', .07);
  }
}

// ---------- props ----------
function brazier(ctx, x, time, idx) {
  R(ctx, x - 4, 220, 8, 4, '#2a2433'); R(ctx, x - 1, 208, 2, 12, '#2a2433'); R(ctx, x - 5, 205, 10, 4, '#3a3342'); R(ctx, x - 6, 203, 12, 2, '#4d4658');
}

function flame(ctx, x, y, time, idx, scale = 1) {
  const f1 = Math.sin(time * 13 + idx * 2.1), f2 = Math.sin(time * 9 + idx * 1.3);
  const layers = [['#ff6a14', 7, 12], ['#ffb02e', 5, 9], ['#fff1a0', 2.5, 5]];
  for (const [color, w, h] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w * scale, y);
    ctx.quadraticCurveTo(x - w * .6 * scale, y - h * .6 * scale, x + f1 * 1.5 * scale, y - (h + f2 * 2) * scale);
    ctx.quadraticCurveTo(x + w * .6 * scale, y - h * .6 * scale, x + w * scale, y);
    ctx.closePath(); ctx.fill();
  }
}

function coffin(ctx, x, open) {
  ctx.fillStyle = '#2b1d1a';
  ctx.beginPath(); ctx.moveTo(x - 10, 224); ctx.lineTo(x - 14, 208); ctx.lineTo(x - 8, 196); ctx.lineTo(x + 8, 196); ctx.lineTo(x + 14, 208); ctx.lineTo(x + 10, 224); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a3328'; ctx.fillRect(x - 6, 200, 12, 2); ctx.fillRect(x - 2, 198, 4, 20);
  if (open) { ctx.fillStyle = '#0a0610'; ctx.fillRect(x - 7, 198, 14, 22); ctx.fillStyle = '#4a3328'; ctx.fillRect(x + 11, 192, 4, 30); }
}

function sign(ctx, text, x, y, cx) {
  const w = text.length * 3.4 + 8;
  R(ctx, x - cx - 1, y - 1, w + 2, 14, '#17111f'); R(ctx, x - cx, y, w, 12, '#2b2338');
  ctx.font = '5px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#b8a8d8';
  ctx.fillText(text, x - cx + 4, y + 8);
  R(ctx, x - cx + w / 2 - 1, y + 12, 2, 224 - y - 12, '#1f1829');
}

// ---------- traps ----------
function spikeRow(ctx, x, y, w, h, color = '#b8b4c8') {
  const n = Math.max(1, Math.round(w / 8));
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < n; i++) { ctx.moveTo(x + i * w / n, y + h); ctx.lineTo(x + (i + .5) * w / n, y); ctx.lineTo(x + (i + 1) * w / n, y + h); }
  ctx.fill();
  ctx.fillStyle = 'rgba(160,0,24,.7)';
  for (let i = 0; i < n; i += 2) ctx.fillRect(x + (i + .5) * w / n - 1, y + 1, 2, Math.min(5, h));
}

function drawPits(ctx, f, cx) {
  for (const pit of f.pits) {
    if (pit.x + pit.w < cx || pit.x > cx + 520) continue;
    R(ctx, pit.x - cx, 224, pit.w, 32, '#0b0810');
    spikeRow(ctx, pit.x - cx, 234, pit.w, 20, '#9d98b0');
    for (let x = pit.x + 4; x < pit.x + pit.w - 6; x += 22) R(ctx, x - cx, 252, 5, 2, BONE);
  }
}

function drawPops(ctx, f, cx) {
  for (const h of f.pops) {
    const x = h.x - cx;
    R(ctx, x, 222, h.w, 2, '#15101c');
    for (let i = 0; i < 4; i++) R(ctx, x + 3 + i * 8, 222, 2, 2, '#050308');
    const up = h.mode === 'active' ? 14 : h.mode === 'warning' ? 3 + Math.sin(f.time * 50) * 1.4 : h.mode === 'cooldown' ? 5 : 0;
    if (up > 0) spikeRow(ctx, x + 1, 223 - up, h.w - 2, up);
    if (h.mode === 'warning') glow(ctx, x + 16, 220, 24, '#ff2030', .2 + .15 * Math.sin(f.time * 30));
  }
}

function drawPendulums(ctx, f, cx) {
  for (const d of f.pendulums) {
    if (Math.abs(d.x - cx - 240) > 340) continue;
    const px = d.x - cx;
    ctx.save();
    ctx.translate(px, d.y); ctx.rotate(-d.angle);
    ctx.strokeStyle = '#5a5568'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, d.len - 10); ctx.stroke(); ctx.setLineDash([]);
    ctx.translate(0, d.len); ctx.rotate(f.time * 0.5);
    ctx.fillStyle = '#8f8aa3';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#17111f';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c4d8';
    for (let i = 0; i < 6; i++) { // blade teeth
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(0, -17); ctx.lineTo(3, -12); ctx.fill();
    }
    ctx.restore();
    R(ctx, px - 5, 30, 10, 6, '#3a3342');
    if (Math.abs(Math.sin(d.angle)) < .08) glow(ctx, px + Math.sin(d.angle) * d.len, d.y + d.len, 20, '#ffffff', .15);
  }
}

function drawCrushers(ctx, f, cx) {
  for (const c of f.crushers) {
    if (Math.abs(c.x - cx - 240) > 300) continue;
    const jitter = c.mode === 'warning' ? Math.sin(f.time * 70) * 1 : 0, x = c.x - cx + jitter, top = 32, h = c.bottom - top;
    ctx.strokeStyle = '#2a2433'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 6, 32); ctx.lineTo(x + 6, c.bottom); ctx.moveTo(x + 26, 32); ctx.lineTo(x + 26, c.bottom); ctx.stroke();
    R(ctx, x, top, c.w, h, '#4a4458'); R(ctx, x, top, c.w, 2, '#675f80'); R(ctx, x + c.w - 2, top, 2, h, '#2c2738');
    // face carved into the bottom of the block
    const fy = c.bottom - 22;
    R(ctx, x + 6, fy, 20, 14, BONE); R(ctx, x + 9, fy + 4, 5, 5, '#0d0a14'); R(ctx, x + 18, fy + 4, 5, 5, '#0d0a14'); R(ctx, x + 14, fy + 10, 4, 3, '#0d0a14');
    ctx.fillStyle = '#2a2433';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 8, c.bottom); ctx.lineTo(x + i * 8 + 4, c.bottom + 6); ctx.lineTo(x + i * 8 + 8, c.bottom); ctx.fill(); }
    if (c.mode === 'warning') {
      glow(ctx, x + 16, c.bottom - 10, 28, '#ff1830', .3 + .2 * Math.sin(f.time * 25));
      ctx.fillStyle = `rgba(255,30,40,${.12 + .1 * Math.sin(f.time * 25)})`; ctx.fillRect(x, 218, c.w, 6);
    }
  }
}

function drawStalactites(ctx, f, cx) {
  for (const s of f.stalactites) {
    if (Math.abs(s.x - cx - 240) > 300) continue;
    const shake = s.state === 'warn' ? Math.sin(f.time * 60) * 1.2 : 0, x = s.x - cx + shake;
    if (s.state === 'shatter') { // broken stump on the ceiling plus rubble on the floor
      R(ctx, x - 6, 32, 12, 4, '#3a3550');
      for (let i = 0; i < 5; i++) R(ctx, x - 12 + i * 5, 220 - (i % 2) * 2, 4, 4, '#4a4560');
      continue;
    }
    const y = s.state === 'fall' ? s.y : 32;
    ctx.fillStyle = '#4a4560'; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x, y + 22); ctx.lineTo(x + 7, y); ctx.fill();
    ctx.fillStyle = '#6a6488'; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y + 20); ctx.lineTo(x + 1, y); ctx.fill();
    if (s.state === 'hang') { // slow drip
      const t = (f.time * .5 + s.x * .013) % 1;
      if (t > .6) R(ctx, x, 54 + (t - .6) * 140, 1, 2, '#7ab0d8');
    }
    if (s.state === 'warn') glow(ctx, x, 54, 16, '#ff3040', .35);
  }
}

function drawSurfaces(ctx, f, cx) {
  for (const s of f.surfaces) {
    if (s.collapsed || s.x + s.w < cx - 10 || s.x > cx + 500) continue;
    const x = s.x - cx + (s.age > 0 ? Math.sin(f.time * 70) : 0), y = s.y;
    if (s.kind === 'moving') {
      ctx.strokeStyle = '#2a2433'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 4, 32); ctx.lineTo(x + 4, y); ctx.moveTo(x + s.w - 4, 32); ctx.lineTo(x + s.w - 4, y); ctx.stroke();
      R(ctx, x, y, s.w, 8, '#4a4458'); R(ctx, x, y, s.w, 2, '#6a6288'); R(ctx, x, y + 6, s.w, 2, '#241f31');
      R(ctx, x + s.w / 2 - 2, y + 3, 4, 3, BONE);
    } else {
      R(ctx, x, y, s.w, 8, '#5a4330'); R(ctx, x, y, s.w, 2, '#7a5a40'); R(ctx, x, y + 6, s.w, 2, '#33261a');
      R(ctx, x + 2, y + 3, 2, 2, '#1a1008'); R(ctx, x + s.w - 4, y + 3, 2, 2, '#1a1008');
      if (s.age > 0) R(ctx, x + 6 + (s.age * 20) % 12, y, 1, 8, '#120a05');
    }
  }
}

// ---------- creatures ----------
function drawSkeleton(ctx, s, cx) {
  const x = s.x + s.w / 2 - cx;
  ctx.save();
  if (s.state === 'buried' || s.state === 'rise') {
    const rise = s.state === 'rise' ? Math.min(1, s.t / .8) : 0;
    if (s.state === 'buried') { // a bony hand twitching out of the floor
      R(ctx, x - 1, 223, 2, 2, BONE); R(ctx, x + 3, 222, 1, 3, BONE); R(ctx, x - 4, 224, 5, 1, '#0d0a14');
      ctx.restore(); return;
    }
    ctx.beginPath(); ctx.rect(x - 20, 0, 40, 224); ctx.clip();
    ctx.translate(0, (1 - rise) * 20 + Math.sin(s.t * 40) * .6);
  }
  const phase = s.anim * 8, swing = Math.sin(phase) * 3;
  ctx.translate(x, s.y); ctx.scale(s.dir, 1);
  R(ctx, -3, 15, 2, 3, BONE); R(ctx, 1, 15, 2, 3, BONE);
  R(ctx, -2 + swing, 14, 2, 4, BONE); R(ctx, 0 - swing, 14, 2, 4, BONE);
  R(ctx, -1, 8, 2, 7, BONE);
  for (const ry of [9, 11, 13]) R(ctx, -4, ry, 8, 1, BONE);
  R(ctx, 3, 8, 2, 5, BONE); R(ctx, 5 + Math.sin(phase) * 1.5, 7, 1, 10, '#8a7a70'); // rusty blade
  R(ctx, -4, 0, 8, 7, BONE); R(ctx, -3, 7, 6, 2, '#b8b29a');
  R(ctx, -3, 2, 2, 2, '#100812'); R(ctx, 1, 2, 2, 2, '#100812');
  R(ctx, -3, 2, 1, 1, '#ff2030'); R(ctx, 1, 2, 1, 1, '#ff2030');
  ctx.restore();
}

function drawBat(ctx, b, cx, time) {
  const x = b.x - cx, y = b.y;
  if (x < -30 || x > 540) return;
  ctx.save(); ctx.translate(x, y);
  if (b.state === 'sleep') {
    ctx.fillStyle = '#2a1f3a'; ctx.beginPath(); ctx.ellipse(0, 6, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
    R(ctx, -3, 11, 2, 2, '#2a1f3a'); R(ctx, 1, 11, 2, 2, '#2a1f3a');
    if (Math.sin(time * 1.5 + b.px) > .96) R(ctx, -2, 9, 4, 1, '#c01830'); // eyes open for a moment
  } else {
    if (b.state === 'alert') ctx.translate(Math.sin(time * 80) * 1.2, 0);
    const flap = b.state === 'alert' ? Math.sin(b.t * 40) * 3 : Math.sin(b.flap * 22) * 6;
    ctx.fillStyle = '#2a1f3a';
    for (const m of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(m * 2, -1); ctx.lineTo(m * 9, -4 + flap); ctx.lineTo(m * 14, 1 + flap); ctx.lineTo(m * 10, 1 + flap * .6); ctx.lineTo(m * 7, 3); ctx.lineTo(m * 4, 2); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(0, 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    R(ctx, -3, -4, 2, 2, '#2a1f3a'); R(ctx, 1, -4, 2, 2, '#2a1f3a');
    R(ctx, -2, -1, 1, 1, '#ff2030'); R(ctx, 1, -1, 1, 1, '#ff2030');
  }
  ctx.restore();
}

function drawGhost(ctx, g, cx, time) {
  if (g.state === 'dormant' || g.state === 'gone') return;
  const x = g.x + g.w / 2 - cx, y = g.y, frozen = g.state === 'hunt' && g.seen;
  ctx.save();
  ctx.globalAlpha = g.alpha * (frozen ? .95 : .62 + .12 * Math.sin(time * 5));
  const body = frozen ? '#b9bccb' : '#cfe4ff';
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y + 7, 8, Math.PI, 0);
  ctx.lineTo(x + 8, y + 22);
  const waves = 4, w = 16 / waves;
  for (let i = 0; i < waves; i++) {
    const ax = x + 8 - i * w;
    ctx.quadraticCurveTo(ax - w / 2, y + 22 + (frozen ? 0 : Math.sin(time * 6 + i) * 3) + 3, ax - w, y + 22);
  }
  ctx.closePath(); ctx.fill();
  if (frozen) { // stone cracks while it is being watched
    ctx.strokeStyle = 'rgba(20,20,40,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 2, y + 2); ctx.lineTo(x + 1, y + 9); ctx.lineTo(x - 3, y + 15); ctx.stroke();
  } else {
    ctx.fillStyle = body;
    ctx.fillRect(x - 12, y + 10 + Math.sin(time * 5) * 2, 6, 2); ctx.fillRect(x + 6, y + 10 - Math.sin(time * 5) * 2, 6, 2);
  }
  ctx.fillStyle = '#07040c';
  ctx.beginPath(); ctx.ellipse(x - 3, y + 6, 2, 3, 0, 0, Math.PI * 2); ctx.ellipse(x + 3, y + 6, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + 13, 2, frozen ? 1 : 3 + Math.sin(time * 8), 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  glow(ctx, x, y + 10, 26, frozen ? '#ff4050' : '#80c0ff', frozen ? .18 : .28 * g.alpha);
}

function drawDread(ctx, d, cx, time) {
  if (!d.active) return;
  const front = d.x - cx;
  if (front < -140) return;
  const grad = ctx.createLinearGradient(front - 150, 0, front + 12, 0);
  grad.addColorStop(0, 'rgba(2,0,6,0)'); grad.addColorStop(.55, 'rgba(2,0,6,.9)'); grad.addColorStop(1, 'rgba(2,0,6,1)');
  ctx.fillStyle = grad; ctx.fillRect(front - 150, 0, 162, 270);
  R(ctx, -10, 0, Math.max(0, front - 150 + 10), 270, 'rgba(2,0,6,.97)');
  ctx.fillStyle = '#020006';
  for (let y = 20; y < 270; y += 34) { // reaching claws
    const reach = 14 + Math.sin(time * 4 + y) * 8;
    ctx.beginPath(); ctx.moveTo(front, y);
    for (let k = 0; k < 3; k++) { ctx.lineTo(front + reach - k * 2, y + k * 5 - 4); ctx.lineTo(front + 2, y + k * 5 - 1); }
    ctx.lineTo(front, y + 12); ctx.fill();
  }
  for (const ey of [70, 130, 190]) {
    const ex = front - 28 - (ey % 3) * 10;
    R(ctx, ex, ey, 5, 3, '#ff1830'); R(ctx, ex + 9, ey, 5, 3, '#ff1830');
    glow(ctx, ex + 7, ey + 1, 24, '#ff1830', .35);
  }
}

// ---------- pickups, checkpoints, exit ----------
function drawSoul(ctx, s, cx, time) {
  const x = s.x + 6 - cx, y = s.y + 6 + Math.sin(time * 3 + s.x) * 3;
  for (let i = 1; i < 5; i++) { ctx.globalAlpha = .4 - i * .07; R(ctx, x - 1 - i * 2, y + i * 2 + Math.sin(time * 5 + i) * 1.5, 3, 3, '#a8e8ff'); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  glow(ctx, x, y, 22, '#7fd8ff', .5);
}

function drawCheckpoint(ctx, c, cx, time, idx) {
  const x = c.x + 6 - cx, y = c.y + 14;
  R(ctx, x - 5, y - 4, 10, 4, '#4a4458'); R(ctx, x - 3, y - 10, 6, 6, BONE);
  R(ctx, x - 2, y - 8, 1, 2, '#100812'); R(ctx, x + 1, y - 8, 1, 2, '#100812');
  R(ctx, x - 1, y - 14, 2, 4, '#e8dcc0');
  if (c.active) flame(ctx, x, y - 14, time, idx, .6);
  else R(ctx, x, y - 15, 1, 1, '#6a5a78');
}

function drawExit(ctx, e, cx, time) {
  const x = e.x - cx, y = e.y;
  R(ctx, x - 4, y - 6, e.w + 8, e.h + 6, '#2a2433');
  archWindow(ctx, x, y - 4, e.w, e.h + 4, '#0a0610');
  const pulse = .55 + .25 * Math.sin(time * 2);
  ctx.fillStyle = `rgba(190,255,200,${pulse * .5})`;
  ctx.fillRect(x + 6, y + 6, e.w - 12, e.h - 6);
  for (let i = 0; i < 5; i++) { ctx.globalAlpha = .25; R(ctx, x + 4 + i * 5, y + 4 + Math.sin(time * 2 + i) * 4, 1, e.h - 8, '#e8ffe0'); }
  ctx.globalAlpha = 1;
  glow(ctx, x + e.w / 2, y + e.h / 2, 60, '#b8ffc0', .5 * pulse);
}

// ---------- darkness ----------
let darkLayer = null;

function lantern(gs, time) {
  const flicker = .94 + .06 * Math.sin(time * 17) + .03 * Math.sin(time * 7.3);
  return 118 * flicker;
}

function drawDarkness(ctx, vw, cx, gs, f) {
  const p = gs.p;
  if (typeof document === 'undefined') return;
  if (!darkLayer || darkLayer.width !== Math.ceil(vw)) darkLayer = makeCanvas(vw, 270);
  const g = darkLayer.getContext('2d');
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.clearRect(0, 0, darkLayer.width, 270);
  g.fillStyle = `rgba(4,2,10,${Math.max(.2, .8 - f.flash * .5)})`;
  g.fillRect(0, 0, darkLayer.width, 270);
  g.globalCompositeOperation = 'destination-out';
  const light = (x, y, r, a) => { g.globalAlpha = a; softDot(g, x, y, r, '#ffffff'); };
  light(p.x + p.w / 2 - cx, p.y + 6, lantern(gs, f.time), 1);
  for (const bx of BRAZIERS) {
    if (bx - cx < -100 || bx - cx > vw + 100) continue;
    light(bx - cx, 196, 78 + Math.sin(f.time * 11 + bx) * 4, .9);
  }
  for (const c of f.checkpoints) if (c.active) light(c.x + 6 - cx, c.y + 2, 58, .85);
  for (const s of f.pickups) if (!s.got) light(s.x + 6 - cx, s.y + 6, 42, .7);
  light(f.exit.x + f.exit.w / 2 - cx, f.exit.y + f.exit.h / 2, 90, 1);
  for (const gh of f.ghosts) if (gh.state === 'hunt') light(gh.x + 6 - cx, gh.y + 10, 40, .5);
  g.globalAlpha = 1;
  ctx.drawImage(darkLayer, 0, 0);
}

function vignette(ctx, vw) {
  const v = cached('crypt-vignette', 480, 270, g => {
    const gr = g.createRadialGradient(240, 135, 90, 240, 135, 300);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = gr; g.fillRect(0, 0, 480, 270);
  });
  if (v) ctx.drawImage(v, 0, 0, vw, 270);
}

export function drawCryptWorld(ctx, vw, cx, gs) {
  const f = gs.crypt;
  if (!f) return;
  const time = f.time, rcx = Math.round(cx);
  drawTiles(ctx, vw, rcx);
  drawPits(ctx, f, rcx);
  // props
  BRAZIERS.forEach(x => { if (x - rcx > -20 && x - rcx < vw + 20) brazier(ctx, x - rcx, time); });
  for (const g of f.ghosts) coffin(ctx, g.coffin - rcx, g.state !== 'dormant');
  for (const x of [1672, 2056, 2200]) coffin(ctx, x - rcx, false);
  sign(ctx, 'TIKANLARNI ESHIT', 560 - 28, 190, rcx);
  sign(ctx, 'ARVOHGA QARA!', 1608, 168, rcx);
  drawSurfaces(ctx, f, rcx);
  drawPops(ctx, f, rcx);
  drawStalactites(ctx, f, rcx);
  drawCrushers(ctx, f, rcx);
  drawPendulums(ctx, f, rcx);
  f.checkpoints.forEach((c, i) => drawCheckpoint(ctx, c, rcx, time, i));
  drawExit(ctx, f.exit, rcx, time);
  for (const s of f.skeletons) drawSkeleton(ctx, s, rcx);
  for (const b of f.bats) drawBat(ctx, b, rcx, time);
  drawBoy(ctx, gs.p, rcx, gs.anim, gs);
  drawDarkness(ctx, vw, rcx, gs, f);

  // Emissive layer: drawn after the darkness so it stays visible.
  BRAZIERS.forEach((x, i) => {
    if (x - rcx < -20 || x - rcx > vw + 20) return;
    flame(ctx, x - rcx, 203, time, i);
    glow(ctx, x - rcx, 196, 36, '#ff8a28', .3 + .06 * Math.sin(time * 12 + i));
  });
  for (const g of f.ghosts) drawGhost(ctx, g, rcx, time);
  f.pickups.forEach(s => { if (!s.got) drawSoul(ctx, s, rcx, time); });
  drawParticles(ctx, f.particles, {
    cx: rcx, visible: a => a.x > rcx - 20 && a.x < rcx + vw + 20,
    isSoft: a => a.type === 'wisp', maxAlpha: (a, soft) => soft ? .25 : .9,
    color: a => a.type === 'ember' ? '#ff9a2e' : a.type === 'wisp' ? '#6fe0b0' : a.type === 'rock' ? '#4a4560' : '#9a90a8'
  });
  drawDread(ctx, f.dread, rcx, time);
  if (f.flash > 0) { ctx.fillStyle = `rgba(210,225,255,${f.flash * .35})`; ctx.fillRect(0, 0, vw, 270); }
  vignette(ctx, vw);

  if (f.sectionTime < 3.2) { // chapter banner
    const a = Math.min(1, f.sectionTime * 2, (3.2 - f.sectionTime) * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(CRYPT_SECTIONS[f.section].name, vw / 2 + 1, 41);
    ctx.fillStyle = '#d8b8ff'; ctx.fillText(CRYPT_SECTIONS[f.section].name, vw / 2, 40);
    ctx.restore();
  }
}
