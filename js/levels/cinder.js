import {clamp, overlap} from '../utils.js';

// Level 7 — the cinder tower. A vertical climb from the cellar to the roof while lava rises
// behind the player. The side walls are red-hot, so wall-hugging is not a way up.
// Traps: spring pads, crumbling and moving slabs, wall flame jets, spinning fire bars,
// lava geysers, falling magma boulders and fireballs leaping out of the lava.
export const CINDER = {
  cols: 44, rows: 70, width: 704, height: 1120, floor: 1088, particleLimit: 140,
  springSpeed: 9.5, lavaStart: 1150
};

export const CINDER_SECTIONS = [
  {y: 1200, name: 'I · QAZNOQ'},
  {y: 740, name: "II · ISSIQ O'TLAR"},
  {y: 500, name: 'III · YONGAN AYLANMA'},
  {y: 330, name: "IV · MAGMA YOMG'IRI"},
  {y: 160, name: 'V · TEPA TOM'}
];

export function createCinderLayout() {
  const rows = Array.from({length: CINDER.rows}, () => Array(CINDER.cols).fill('.'));
  const fill = (c0, r0, c1, r1) => { for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) rows[r][c] = '#'; };
  fill(0, 0, CINDER.cols, 2);
  fill(0, 68, CINDER.cols, 70);
  fill(0, 0, 1, 70);
  fill(CINDER.cols - 1, 0, CINDER.cols, 70);
  rows[67][4] = 'P';
  return rows.map(r => r.join(''));
}

const XS = [120, 280, 440, 280];
const PLATFORM_COUNT = 23;
const platformTop = i => 1048 - 44 * i;
export const SPRING_FROM = 4;       // the pad on slab 4 throws the player up to slab 7
const SKIPPED = new Set([5, 6]);
const CRUMBLE = new Set([12, 16, 20]);
const MOVING = new Set([10, 14, 18]);
const CHECKPOINT_SLABS = [3, 8, 13, 17];

export function phaseOf(h, time) {
  const c = h.cfg, cycle = c.off + c.warn + c.on + c.rest;
  const t = ((time + h.offset) % cycle + cycle) % cycle;
  return t < c.off ? 'off' : t < c.off + c.warn ? 'warning' : t < c.off + c.warn + c.on ? 'active' : 'cooldown';
}

export function createCinder() {
  let id = 0;
  const surf = (x, y, w, kind = 'static', extra = {}) => ({
    id: id++, x, y, w, h: 8, baseX: x, baseY: y, kind, dx: 0, dy: 0, age: 0, collapsed: false,
    ax: 0, phase: 0, speed: 1.2, press: 0, ...extra
  });
  const surfaces = [];
  const slab = {};
  for (let i = 0; i < PLATFORM_COUNT; i++) {
    if (SKIPPED.has(i)) continue;
    const x = XS[i % 4], y = platformTop(i);
    const kind = CRUMBLE.has(i) ? 'crumble' : MOVING.has(i) ? 'moving' : 'static';
    if (i === SPRING_FROM) {
      slab[i] = surf(x, y, 68);
      surfaces.push(slab[i], surf(x + 68, y, 32, 'spring'));
    } else {
      slab[i] = surf(x, y, 100, kind, kind === 'moving' ? {ax: 30, phase: i} : {});
      surfaces.push(slab[i]);
    }
  }
  const jet = (side, i, len, offset) => ({
    side, y: platformTop(i) - 24, len, w: len, h: 14, offset, mode: 'off',
    x: side === 'L' ? 16 : CINDER.width - 16 - len, cfg: {off: 2, warn: .7, on: .9, rest: .6}
  });
  const geyser = (x, i, offset) => ({
    x, y: platformTop(i), w: 16, height: 84, offset, mode: 'off', cfg: {off: 2.2, warn: .8, on: .8, rest: .7}
  });
  const bolt = (x, offset) => ({x, w: 22, top: 150, bottom: 330, offset, period: 4.2, mode: 'idle', y: 150});
  const bar = (px, py, phase) => ({px, py, len: 46, omega: 1.7, phase, angle: phase});
  const checkpoints = CHECKPOINT_SLABS.map(i => ({x: XS[i % 4] + 40, y: platformTop(i) - 14, active: false}));

  return {
    time: 0, surfaces,
    jets: [jet('L', 11, 300, 0), jet('R', 15, 300, 1.1), jet('L', 19, 300, .5)],
    geysers: [geyser(330, 15, 0)],
    bars: [bar(360, platformTop(11) - 26, 0), bar(210, platformTop(16) - 30, 2)],
    boulders: [bolt(500, 0), bolt(240, 2.1)],
    fireballs: [], nextFire: 6, fireCount: 0,
    checkpoints,
    exit: {x: 470, y: 36, w: 32, h: 44},
    lava: {y: CINDER.lavaStart, active: false, t: 0},
    particles: [], events: [], shake: 0, emission: 0, section: 0, sectionTime: 0, camInit: false
  };
}

export function resetCinder(f, spawnY = 1088) {
  for (const s of f.surfaces) { s.age = 0; s.collapsed = false; s.press = 0; }
  f.fireballs.length = 0;
  f.nextFire = f.time + 3;
  f.lava.active = spawnY < 1000;
  f.lava.y = f.lava.active ? spawnY + 300 : CINDER.lavaStart;
  f.lava.t = 0;
  f.particles.length = 0;
  f.shake = 0;
}

export function emitCinder(f, type, x, y, count = 1) {
  for (let i = 0; i < count && f.particles.length < CINDER.particleLimit; i++) {
    const life = type === 'ember' ? 1.4 + Math.random() : .5 + Math.random() * .5;
    f.particles.push({
      type, x, y, life, max: life, r: type === 'smoke' ? 4 : 1 + Math.random(),
      vx: (Math.random() - .5) * (type === 'rock' ? 60 : 24),
      vy: type === 'ember' ? -14 - Math.random() * 14 : type === 'rock' ? -50 - Math.random() * 30 : type === 'smoke' ? -10 : -30 - Math.random() * 30
    });
  }
}

export const barCircles = b =>
  [[.35, 4], [.65, 5], [1, 6]].map(([k, r]) => ({x: b.px + Math.cos(b.angle) * b.len * k, y: b.py + Math.sin(b.angle) * b.len * k, r}));
const hitCircle = (c, p) => Math.hypot(c.x - clamp(c.x, p.x, p.x + p.w), c.y - clamp(c.y, p.y, p.y + p.h)) < c.r;

const FALL_ACCEL = 900;
export const boulderFallTime = b => Math.sqrt(2 * (b.bottom - b.top) / FALL_ACCEL);

export function stepCinder(gs, dt) {
  const f = gs.cinder, p = gs.p;
  if (!f) return;
  f.time += dt;
  f.events.length = 0;
  f.shake = Math.max(0, f.shake - dt * 6);
  const near = o => !p || Math.abs((o.y ?? p.y) - p.y) < 220;

  if (p) {
    const idx = CINDER_SECTIONS.reduce((best, s, i) => p.y <= s.y ? i : best, 0);
    if (idx !== f.section) { f.section = idx; f.sectionTime = 0; }
    f.sectionTime += dt;
    if (!f.lava.active && p.y < 1000) f.lava.active = true;
  }
  if (f.lava.active) {
    f.lava.t += dt;
    f.lava.y -= Math.min(28, 12 + f.lava.t * .15) * dt;
  }

  for (const s of f.surfaces) {
    const x = s.x, y = s.y;
    if (s.kind === 'moving') s.x = s.baseX + Math.sin(f.time * s.speed + s.phase) * s.ax;
    s.dx = s.x - x;
    s.dy = s.y - y;
    s.press = Math.max(0, s.press - dt);
    if (p && p.onGround && p.cinderGround === s.id && !s.collapsed) { p.x += s.dx; p.y += s.dy; }
    if (s.age > 0) {
      s.age += dt;
      if (s.age > .55 && !s.collapsed) {
        s.collapsed = true;
        if (near(s)) { emitCinder(f, 'rock', s.x + s.w / 2, s.y, 8); f.events.push({type: 'collapse', x: s.x, y: s.y}); }
      }
      if (s.age > 4) { s.age = 0; s.collapsed = false; }
    }
  }

  for (const h of [...f.jets, ...f.geysers]) {
    const old = h.mode;
    h.mode = phaseOf(h, f.time);
    if (old !== h.mode && (h.mode === 'warning' || h.mode === 'active')) {
      f.events.push({type: (h.side ? 'jet-' : 'geyser-') + h.mode, x: h.x, y: h.y});
    }
    if (h.mode !== 'off' && h.mode !== 'cooldown' && near(h) && Math.random() < dt * 30) {
      if (h.side) emitCinder(f, 'spark', h.side === 'L' ? h.x + Math.random() * h.len * (h.mode === 'active' ? 1 : .2) : h.x + h.len - Math.random() * h.len * (h.mode === 'active' ? 1 : .2), h.y + 7);
      else emitCinder(f, 'spark', h.x + 8, h.y - (h.mode === 'active' ? Math.random() * h.height : 2));
    }
  }

  for (const b of f.bars) b.angle = b.phase + f.time * b.omega;

  for (const b of f.boulders) {
    const old = b.mode, t = ((f.time + b.offset) % b.period + b.period) % b.period;
    const warnAt = 2.4, fallAt = 3.3, fallFor = boulderFallTime(b);
    if (t < warnAt) b.mode = 'idle';
    else if (t < fallAt) b.mode = 'warning';
    else if (t < fallAt + fallFor) { b.mode = 'fall'; b.y = b.top + .5 * FALL_ACCEL * (t - fallAt) ** 2; }
    else b.mode = 'idle';
    if (old !== b.mode) {
      if (b.mode === 'warning') f.events.push({type: 'boulder-warning', x: b.x, y: b.top});
      else if (b.mode === 'fall') f.events.push({type: 'boulder-fall', x: b.x, y: b.top});
      else if (old === 'fall') { f.events.push({type: 'boulder-land', x: b.x, y: b.bottom}); emitCinder(f, 'rock', b.x + 11, b.bottom, 8); f.shake = Math.max(f.shake, .8); }
    }
  }

  if (f.lava.active && p && f.time >= f.nextFire && f.lava.y - p.y < 330) {
    const n = f.fireCount++;
    const x = clamp(p.x + ((n * 97) % 200) - 100, 40, CINDER.width - 40);
    f.fireballs.push({x, y: f.lava.y, vy: 0, state: 'warning', t: 0, height: 120 + (n * 37) % 70});
    f.nextFire = f.time + 2.2 - Math.min(.8, f.lava.t / 80);
    f.events.push({type: 'fireball-warning', x, y: f.lava.y});
  }
  for (let i = f.fireballs.length - 1; i >= 0; i--) {
    const b = f.fireballs[i];
    if (b.state === 'warning') {
      b.t += dt;
      b.y = f.lava.y;
      emitCinder(f, 'spark', b.x, f.lava.y, 1);
      if (b.t >= .7) { b.state = 'fly'; b.vy = -Math.sqrt(2 * 420 * b.height); f.events.push({type: 'fireball-launch', x: b.x, y: b.y}); }
    } else {
      b.vy += 420 * dt;
      b.y += b.vy * dt;
      if (Math.random() < dt * 30) emitCinder(f, 'smoke', b.x, b.y);
      if (b.vy > 0 && b.y >= f.lava.y) f.fireballs.splice(i, 1);
    }
  }

  f.emission += dt;
  if (f.emission > .1 && p) {
    f.emission = 0;
    emitCinder(f, 'ember', 16 + Math.random() * (CINDER.width - 32), p.y + 120 + Math.random() * 60);
    if (f.lava.active) emitCinder(f, 'ember', 16 + Math.random() * (CINDER.width - 32), f.lava.y);
  }
  for (let i = f.particles.length - 1; i >= 0; i--) {
    const a = f.particles[i];
    a.life -= dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.type === 'rock' || a.type === 'spark') a.vy += 260 * dt;
    if (a.type === 'smoke') a.r += dt * 4;
    if (a.life <= 0) f.particles.splice(i, 1);
  }
}

export function resolveCinderGround(gs, p, previousBottom) {
  const f = gs.cinder;
  if (!f) return;
  p.cinderGround = null;
  if (p.vy < 0) return;
  for (const s of f.surfaces) {
    if (s.collapsed || p.x + p.w <= s.x || p.x >= s.x + s.w) continue;
    if (previousBottom <= s.y + Math.max(2, s.dy) && p.y + p.h >= s.y) {
      p.y = s.y - p.h;
      if (s.kind === 'spring') {
        p.vy = -CINDER.springSpeed;
        p.launched = true;
        s.press = .25;
        f.events.push({type: 'spring', x: s.x, y: s.y});
        break;
      }
      p.vy = 0;
      p.onGround = true;
      p.cinderGround = s.id;
      if (s.kind === 'crumble' && !s.age) { s.age = .001; f.events.push({type: 'creak', x: s.x, y: s.y}); }
      break;
    }
  }
}

export function cinderCamera(gs, vw) {
  const p = gs.p, f = gs.cinder;
  if (!p || !f) return;
  // Wider screens show the whole tower; narrower ones follow the player sideways.
  const targetX = vw >= CINDER.width ? (CINDER.width - vw) / 2 : clamp(p.x + p.w / 2 - vw / 2, 0, CINDER.width - vw);
  gs.camX = f.camInit ? gs.camX + (targetX - gs.camX) * .12 : targetX;
  const target = clamp(p.y - 150, 0, CINDER.height - 270);
  if (!f.camInit) { gs.camY = target; f.camInit = true; }
  else gs.camY += (target - gs.camY) * .12;
}

// The two side walls glow; touching one is deadly, which closes the wall-jump shortcut.
const HOT_WALLS = [{x: 16, w: 2}, {x: CINDER.width - 18, w: 2}];

// Returns true when the player dies this frame.
export function cinderDamage(gs) {
  const f = gs.cinder, p = gs.p;
  if (!f || !p) return false;
  if (p.y + p.h > f.lava.y + 4) return true;
  if (p.inv > 0) return false;
  if (HOT_WALLS.some(w => overlap(p, {x: w.x, y: 0, w: w.w, h: CINDER.height}))) return true;
  if (f.jets.some(j => j.mode === 'active' && overlap(p, j))) return true;
  if (f.geysers.some(g => g.mode === 'active' && overlap(p, {x: g.x, y: g.y - g.height, w: g.w, h: g.height}))) return true;
  if (f.bars.some(b => barCircles(b).some(c => hitCircle(c, p)))) return true;
  if (f.boulders.some(b => b.mode === 'fall' && overlap(p, {x: b.x, y: b.y, w: b.w, h: 22}))) return true;
  return f.fireballs.some(b => b.state === 'fly' && hitCircle({x: b.x, y: b.y, r: 5}, p));
}

export function cinderInteractions(gs) {
  const f = gs.cinder, p = gs.p;
  if (!f || !p) return false;
  for (const c of f.checkpoints) {
    if (c.active || !overlap(p, {x: c.x - 8, y: c.y - 18, w: 28, h: 40})) continue;
    c.active = true;
    gs.spawnX = c.x;
    gs.spawnY = c.y;
    gs.checkpoint++;
    f.events.push({type: 'checkpoint', x: c.x, y: c.y});
    emitCinder(f, 'spark', c.x + 4, c.y + 10, 10);
  }
  return overlap(p, f.exit);
}
