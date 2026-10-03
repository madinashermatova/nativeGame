import {clamp, overlap} from '../utils.js';
import {T} from '../config.js';

// Level 8 — the anti-gravity laboratory. Portals flip the pull of gravity, so the player
// walks on the ceiling half of the time (jumping "down"). Traps: spikes on both surfaces,
// sawblades on vertical rails, timed laser walls and crawler bots on the floor and ceiling.
export const GRAVITY = {cols: 420, rows: 17, width: 6720, height: 272, floorY: 240, ceilY: 32, particleLimit: 120};

export const GRAVITY_SECTIONS = [
  {x: 0, name: 'I · TORTISH DARVOZALARI'},
  {x: 52 * T, name: 'II · TESKARI YO\'L'},
  {x: 130 * T, name: 'III · ARRALAR SHAFTI'},
  {x: 202 * T, name: 'IV · LAZER DEVORLARI'},
  {x: 268 * T, name: 'V · SURUNUVCHI BOTLAR'},
  {x: 342 * T, name: 'VI · TO\'LIQ INVERSIYA'}
];

const GATES = [20, 36, 56, 74, 92, 110, 168, 192, 234, 258, 308, 332, 350, 364, 378, 392];
const FLOOR_SPIKES = [10, 11, 84, 85, 120, 121, 374, 375];
const CEIL_SPIKES = [31, 32, 66, 67, 102, 103, 361, 362, 388, 389];
const CHECKPOINTS = [50, 128, 200, 266, 340];

export function createGravityLayout() {
  const rows = Array.from({length: GRAVITY.rows}, () => Array(GRAVITY.cols).fill('.'));
  const fill = (c0, r0, c1, r1, ch = '#') => { for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) rows[r][c] = ch; };
  fill(0, 0, GRAVITY.cols, 2);
  fill(0, 15, GRAVITY.cols, 17);
  fill(0, 0, 1, 17);
  fill(GRAVITY.cols - 1, 0, GRAVITY.cols, 17);
  for (const c of GATES) fill(c, 2, c + 1, 15, 'O');
  for (const c of FLOOR_SPIKES) rows[14][c] = '^';
  for (const c of CEIL_SPIKES) rows[2][c] = 'v';
  for (const c of CHECKPOINTS) rows[14][c] = 'K';
  rows[14][GRAVITY.cols - 10] = 'X';
  rows[14][3] = 'P';
  return rows.map(r => r.join(''));
}

export const phaseOf = (h, time) => {
  const c = h.cfg, cycle = c.off + c.warn + c.on + c.rest;
  const t = ((time + h.offset) % cycle + cycle) % cycle;
  return t < c.off ? 'off' : t < c.off + c.warn ? 'warning' : t < c.off + c.warn + c.on ? 'active' : 'cooldown';
};

const LASER = {off: 1.4, warn: .6, on: .8, rest: .5};
const sawY = s => s.mid + Math.sin(s.t * s.speed + s.phase) * s.amp;

export function createGravity(gs) {
  if (gs) gs.spawnGrav = 1;
  const layout = createGravityLayout();
  const spikes = [], gates = [];
  layout.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '^') spikes.push({x: c * T + 2, y: r * T + 6, w: 12, h: 10, up: true});
      else if (row[c] === 'v') spikes.push({x: c * T + 2, y: r * T, w: 12, h: 10, up: false});
      else if (row[c] === 'O' && !gates.includes(c)) gates.push(c);
    }
  });
  const saw = (col, phase, amp = 90) => ({x: col * T + 8, mid: 136, amp, speed: 2, phase, y: 136, r: 10, t: 0, angle: 0});
  const laser = (col, offset) => ({x: col * T + 6, w: 4, offset, cfg: LASER, mode: 'off'});
  const crawler = (c0, c1, floor) => ({
    x: c0 * T, x0: c0 * T, x1: c1 * T, w: 14, h: 10, floor, y: floor ? GRAVITY.floorY - 10 : GRAVITY.ceilY, dir: 1, speed: 40, anim: 0
  });
  return {
    time: 0, spikes, gates: gates.map(c => ({x: c * T, y: GRAVITY.ceilY, w: T, h: GRAVITY.floorY - GRAVITY.ceilY, flash: 0, armed: true})),
    saws: [138, 148, 158].map((c, i) => saw(c, i * 2.1)).concat([174, 180, 186].map((c, i) => saw(c, 3 + i * 2.1))),
    lasers: [210, 218, 226, 242, 250, 385].map((c, i) => laser(c, i * .9)),
    crawlers: [crawler(274, 286, true), crawler(292, 304, true), crawler(316, 328, false), crawler(398, 406, true)],
    checkpoints: CHECKPOINTS.map(c => ({x: c * T, y: GRAVITY.floorY - 14, active: false})),
    exit: {x: (GRAVITY.cols - 10) * T - 8, y: GRAVITY.floorY - 48, w: 32, h: 48},
    portalCool: 0, particles: [], events: [], shake: 0, flip: 0, section: 0, sectionTime: 0, emission: 0
  };
}

export function resetGravity(f) {
  f.portalCool = 0;
  f.particles.length = 0;
  f.shake = 0;
  f.flip = 0;
  for (const c of f.crawlers) { c.x = c.x0; c.dir = 1; }
}

export function emitGravity(f, type, x, y, count = 1, vy = 0) {
  for (let i = 0; i < count && f.particles.length < GRAVITY.particleLimit; i++) {
    const life = .4 + Math.random() * .5;
    f.particles.push({type, x, y, life, max: life, r: 1 + Math.random() * 1.5,
      vx: (Math.random() - .5) * 60, vy: vy + (Math.random() - .5) * 40});
  }
}

export function stepGravity(gs, dt, vw = 480) {
  const f = gs.gravity, p = gs.p;
  if (!f) return;
  f.time += dt;
  f.events.length = 0;
  f.shake = Math.max(0, f.shake - dt * 6);
  f.flip = Math.max(0, f.flip - dt * 2);
  f.portalCool = Math.max(0, f.portalCool - dt);
  const visible = o => o.x > gs.camX - 60 && o.x < gs.camX + vw + 60;

  if (p) {
    const idx = GRAVITY_SECTIONS.reduce((best, s, i) => p.x >= s.x ? i : best, 0);
    if (idx !== f.section) { f.section = idx; f.sectionTime = 0; }
    f.sectionTime += dt;
    // Crossing a portal flips gravity; the cooldown stops it re-triggering while inside.
    for (const g of f.gates) {
      g.flash = Math.max(0, g.flash - dt * 3);
      const cx = p.x + p.w / 2;
      const inside = cx >= g.x && cx <= g.x + g.w;
      // One flip per crossing: the gate re-arms only after the player has left it.
      if (!inside) g.armed = true;
      else if (g.armed && f.portalCool <= 0) {
        g.armed = false;
        p.gravDir = -(p.gravDir ?? 1);
        p.vy *= .3;
        p.onGround = false;
        p.coyote = 0;
        f.portalCool = .4;
        f.flip = 1;
        g.flash = 1;
        f.events.push({type: 'portal', x: g.x, y: p.y, dir: p.gravDir});
        emitGravity(f, 'spark', g.x + 8, p.y + 7, 14, 0);
      }
    }
  }

  for (const s of f.saws) {
    s.t += dt;
    s.y = sawY(s);
    s.angle += dt * 12;
  }
  for (const l of f.lasers) {
    const old = l.mode;
    l.mode = phaseOf(l, f.time);
    if (old !== l.mode && visible(l) && (l.mode === 'warning' || l.mode === 'active')) f.events.push({type: 'laser-' + l.mode, x: l.x, y: 136});
  }
  for (const c of f.crawlers) {
    c.x += c.dir * c.speed * dt;
    c.anim += dt;
    if (c.x + c.w >= c.x1) { c.x = c.x1 - c.w; c.dir = -1; }
    if (c.x <= c.x0) { c.x = c.x0; c.dir = 1; }
  }

  f.emission += dt;
  if (f.emission > .06 && p && Math.abs(p.vy) > 4.5) { // streaks while falling between surfaces
    f.emission = 0;
    emitGravity(f, 'streak', p.x + p.w / 2, p.y + (p.gravDir === -1 ? p.h : 0), 1, -p.vy * 4);
  }
  for (let i = f.particles.length - 1; i >= 0; i--) {
    const a = f.particles[i];
    a.life -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
    if (a.life <= 0) f.particles.splice(i, 1);
  }
}

export function gravityCamera(gs, vw) {
  const p = gs.p;
  if (!p) return;
  const target = clamp(p.x + p.w / 2 - vw * (p.face > 0 ? .38 : .62), 0, Math.max(0, GRAVITY.width - vw));
  gs.camX += (target - gs.camX) * .1;
}

const hitCircle = (c, p) => Math.hypot(c.x - clamp(c.x, p.x, p.x + p.w), c.y - clamp(c.y, p.y, p.y + p.h)) < c.r;

// Returns true when the player dies this frame.
export function gravityDamage(gs) {
  const f = gs.gravity, p = gs.p;
  if (!f || !p) return false;
  if (p.inv > 0) return false;
  if (f.spikes.some(s => overlap(p, s))) return true;
  if (f.saws.some(s => hitCircle(s, p))) return true;
  if (f.lasers.some(l => l.mode === 'active' && overlap(p, {x: l.x, y: GRAVITY.ceilY, w: l.w, h: GRAVITY.floorY - GRAVITY.ceilY}))) return true;
  return f.crawlers.some(c => overlap(p, {x: c.x + 1, y: c.y, w: c.w - 2, h: c.h}));
}

export function gravityInteractions(gs) {
  const f = gs.gravity, p = gs.p;
  if (!f || !p) return false;
  for (const c of f.checkpoints) {
    if (c.active || !overlap(p, {x: c.x - 4, y: c.y - 8, w: 24, h: 30})) continue;
    c.active = true;
    gs.spawnX = c.x;
    gs.spawnY = c.y;
    gs.spawnGrav = p.gravDir ?? 1;
    gs.checkpoint++;
    f.events.push({type: 'checkpoint', x: c.x, y: c.y});
    emitGravity(f, 'spark', c.x + 6, c.y + 8, 10, -40);
  }
  return overlap(p, f.exit);
}
