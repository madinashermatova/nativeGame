import {clamp, overlap} from '../utils.js';
import {T} from '../config.js';
import {MAX_LIVES} from '../config.js';

// Level 6 — the haunted crypt. One long dark corridor with its own enemy set:
// buried skeletons, ceiling bats, ghosts that only move when unobserved, plus
// pop-up spikes, pendulum axes, falling stalactites, skull crushers, rotten bridges
// and a final chase by a wall of shadow.
export const CRYPT = {
  cols: 200, rows: 17, width: 3200, height: 270, floor: 224, ceiling: 32,
  particleLimit: 150, chaseX: 2432
};

// Spike pits as [firstColumn, endColumn).
export const PITS = [[14, 17], [58, 62], [73, 77], [86, 92], [119, 122], [156, 160], [172, 182], [188, 194]];

export const CRYPT_SECTIONS = [
  {x: 0, name: 'I · DAHMAZ DARVOZASI'},
  {x: 31 * T, name: "II · SUYAKLAR PO'LI"},
  {x: 64 * T, name: "III · KO'RSHAPALAKLAR UYASI"},
  {x: 100 * T, name: 'IV · ARVOHLAR ZALI'},
  {x: 134 * T, name: 'V · BOSUVCHI TOSHLAR'},
  {x: 152 * T, name: "VI · QORONG'ILIK QUVADI"}
];

export const BRAZIERS = [5, 12, 24, 33, 42, 56, 63, 67, 83, 94, 96, 103, 111, 125, 133, 150, 160, 165, 186, 196]
  .map(c => c * T + 8);

export function createCryptLayout() {
  const rows = Array.from({length: CRYPT.rows}, () => Array(CRYPT.cols).fill('.'));
  const fill = (c0, r0, c1, r1) => {
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) rows[r][c] = '#';
  };
  fill(0, 0, CRYPT.cols, 2);
  fill(0, 14, CRYPT.cols, 17);
  fill(0, 0, 1, 17);
  fill(CRYPT.cols - 1, 0, CRYPT.cols, 17);
  for (const [a, b] of PITS) for (let r = 14; r < 16; r++) for (let c = a; c < b; c++) rows[r][c] = '.';
  fill(26, 12, 29, 14);      // low step in the gate hall
  fill(44, 12, 47, 14);      // stair to the bone ledge
  fill(47, 11, 55, 12);      // bone ledge
  fill(79, 12, 82, 14);      // perch in the bat cave
  fill(113, 12, 115, 14);    // stair to the high slab
  fill(115, 10, 119, 11);    // high slab above the pit
  rows[13][3] = 'P';
  return rows.map(r => r.join(''));
}

const POP_SLOW = {off: 1.5, warn: .8, on: .6, rest: .7};
const POP_FAST = {off: 1, warn: .6, on: .6, rest: .8};

export function popPhase(h, time) {
  const c = h.cfg, cycle = c.off + c.warn + c.on + c.rest;
  const t = ((time + h.offset) % cycle + cycle) % cycle;
  return t < c.off ? 'off' : t < c.off + c.warn ? 'warning' : t < c.off + c.warn + c.on ? 'active' : 'cooldown';
}

// Bottom edge of a skull crusher: up -> shaking -> slam -> hold -> slow rise.
export function crusherState(c, time) {
  const t = ((time + c.offset) % c.period + c.period) % c.period;
  if (t < 2) return {mode: 'up', bottom: 64};
  if (t < 2.9) return {mode: 'warning', bottom: 64};
  if (t < 3.02) return {mode: 'slam', bottom: 64 + 160 * ((t - 2.9) / .12) ** 2};
  if (t < 3.57) return {mode: 'down', bottom: 224};
  return {mode: 'rise', bottom: 224 - 160 * ((t - 3.57) / (c.period - 3.57))};
}

export const pendulumAngle = (p, time) => p.amp * Math.sin(2 * Math.PI * (time + p.offset) / p.period);

// Points along the swinging rod; the axe head is the last, largest circle.
export function pendulumCircles(p, angle = p.angle) {
  return [[.5, 4], [.75, 6], [1, 12]].map(([k, r]) =>
    ({x: p.x + Math.sin(angle) * p.len * k, y: p.y + Math.cos(angle) * p.len * k, r}));
}

const hit = (c, p) => Math.hypot(c.x - clamp(c.x, p.x, p.x + p.w), c.y - clamp(c.y, p.y, p.y + p.h)) < c.r;

export function createCrypt() {
  let id = 0;
  const surf = (x, kind, w, extra = {}) => ({
    id: id++, x, y: 224, w, h: 8, baseX: x, baseY: 224, kind, dx: 0, dy: 0, age: 0,
    collapsed: false, ax: 0, phase: 0, speed: 1.1, ...extra
  });
  const surfaces = [
    ...[1376, 1408, 1440, 3008, 3040, 3072].map(x => surf(x, 'collapse', 32)),
    surf(2778, 'moving', 48, {ax: 14}),
    surf(2864, 'moving', 48, {ax: 14, phase: Math.PI})
  ];
  const pop = (x, offset, cfg = POP_SLOW) => ({x, y: 224, w: 32, h: 14, offset, cfg, mode: 'off'});
  const skeleton = (c0, c1, buried, y = 224) => ({
    x: c0 * T, y: y - 18, w: 10, h: 18, x0: c0 * T, x1: c1 * T, startX: c0 * T, startY: y - 18,
    dir: 1, speed: 34, buried, state: buried ? 'buried' : 'walk', t: 0, anim: 0
  });
  const bat = x => ({
    px: x, py: 40, x, y: 40, state: 'sleep', t: 0, cool: 0, sx: 0, sy: 0, tx: 0, ty: 0, ex: 0, ey: 0, flap: 0
  });
  const ghost = (coffin, trigger, end, speed) => ({
    coffin, trigger, end, speed, state: 'dormant', x: coffin, y: 196, w: 12, h: 18, alpha: 0, t: 0, seen: false, anim: 0
  });
  const pendulum = (x, period, offset) => ({x, y: 34, len: 168, amp: .62, period, offset, angle: 0});
  const crusher = (x, offset) => ({x, w: 32, offset, period: 4.6, mode: 'up', bottom: 64});
  const stalactite = x => ({x, state: 'hang', t: 0, y: 32, vy: 0});

  return {
    time: 0, surfaces,
    pops: [pop(544, 0), pop(624, 1.3), pop(800, .7), pop(2592, 0, POP_FAST), pop(2656, 1.1, POP_FAST), pop(3104, .4, POP_FAST)],
    pendulums: [pendulum(1680, 2.8, 0), pendulum(2040, 2.4, .9)],
    crushers: [crusher(2176, 0), crusher(2272, 1.5), crusher(2368, 3)],
    stalactites: [1140, 1350, 1495].map(stalactite),
    skeletons: [skeleton(18, 25, true), skeleton(48, 54, false, 176), skeleton(101, 106, true)],
    bats: [1070, 1290, 1520].map(bat),
    ghosts: [ghost(1600, 1648, 2130, 62), ghost(2090, 2144, 2415, 70)],
    pits: PITS.map(([a, b]) => ({x: a * T + 1, y: 236, w: (b - a) * T - 2, h: 20})),
    checkpoints: [31, 64, 98, 112, 151, 169, 184].map(c => ({x: c * T, y: 208, active: false})),
    pickups: [{x: 1282, y: 168}, {x: 1866, y: 138}, {x: 810, y: 156}].map(s => ({...s, got: false})),
    dread: {active: false, x: 0, t: 0},
    exit: {x: 3152, y: 176, w: 32, h: 48},
    particles: [], events: [],
    shake: 0, flash: 0, nextBolt: 6, bolts: 0, thunderAt: -1, emission: 0, section: 0, sectionTime: 0
  };
}

export function resetCrypt(f, spawnX = 0) {
  for (const s of f.surfaces) { s.age = 0; s.collapsed = false; }
  for (const s of f.stalactites) { s.state = 'hang'; s.t = 0; s.y = 32; s.vy = 0; }
  for (const b of f.bats) { Object.assign(b, {x: b.px, y: b.py, state: 'sleep', t: 0, cool: 1.5}); }
  for (const s of f.skeletons) {
    Object.assign(s, {x: s.startX, y: s.startY, dir: 1, state: s.buried ? 'buried' : 'walk', t: 0});
  }
  for (const g of f.ghosts) {
    Object.assign(g, {state: spawnX >= g.end ? 'gone' : 'dormant', x: g.coffin, y: 196, alpha: 0, t: 0, seen: false});
  }
  f.dread.active = spawnX >= CRYPT.chaseX;
  f.dread.x = spawnX - 260;
  f.dread.t = 0;
  f.particles.length = 0;
  f.shake = 0;
}

export function emitCrypt(f, type, x, y, count = 1) {
  for (let i = 0; i < count && f.particles.length < CRYPT.particleLimit; i++) {
    const life = type === 'ember' ? .9 + Math.random() * .6 : type === 'wisp' ? 2 : .7 + Math.random() * .5;
    f.particles.push({
      type, x, y, life, max: life,
      vx: (Math.random() - .5) * (type === 'ember' ? 8 : 26),
      vy: type === 'ember' ? -14 - Math.random() * 12 : type === 'wisp' ? -10 - Math.random() * 8 : -20 - Math.random() * 30,
      r: type === 'wisp' ? 6 + Math.random() * 4 : type === 'ember' ? 1 : 1 + Math.random() * 1.5
    });
  }
}

const BOLT_GAPS = [11, 15, 9, 17, 13];

export function stepCrypt(gs, dt, vw = 480) {
  const f = gs.crypt, p = gs.p;
  if (!f) return;
  f.time += dt;
  f.events.length = 0;
  f.shake = Math.max(0, f.shake - dt * 6);
  f.flash = Math.max(0, f.flash - dt * 2.2);
  const visible = o => o.x > gs.camX - 60 && o.x < gs.camX + vw + 60;

  if (f.time >= f.nextBolt) {
    f.flash = 1;
    f.thunderAt = f.time + .6 + (f.bolts % 3) * .3;
    f.nextBolt = f.time + BOLT_GAPS[f.bolts++ % BOLT_GAPS.length];
  }
  if (f.thunderAt > 0 && f.time >= f.thunderAt) { f.thunderAt = -1; f.events.push({type: 'thunder', x: gs.camX + vw / 2, y: 100}); }

  if (p) {
    const idx = CRYPT_SECTIONS.reduce((best, s, i) => p.x >= s.x ? i : best, 0);
    if (idx !== f.section) { f.section = idx; f.sectionTime = 0; }
    f.sectionTime += dt;
  }

  for (const s of f.surfaces) {
    const x = s.x, y = s.y;
    if (s.kind === 'moving') s.x = s.baseX + Math.sin(f.time * s.speed + s.phase) * s.ax;
    s.dx = s.x - x;
    s.dy = s.y - y;
    if (p && p.onGround && p.cryptGround === s.id && !s.collapsed) { p.x += s.dx; p.y += s.dy; }
    if (s.age > 0) {
      s.age += dt;
      if (s.age > .45 && !s.collapsed) {
        s.collapsed = true;
        if (visible(s)) { emitCrypt(f, 'rock', s.x + s.w / 2, s.y, 6); f.events.push({type: 'collapse', x: s.x, y: s.y}); }
      }
      if (s.age > 4.5) { s.age = 0; s.collapsed = false; }
    }
  }

  for (const h of f.pops) {
    const old = h.mode;
    h.mode = popPhase(h, f.time);
    if (old !== h.mode && visible(h) && (h.mode === 'warning' || h.mode === 'active')) f.events.push({type: 'spikes-' + h.mode, x: h.x, y: h.y});
  }

  for (const d of f.pendulums) {
    const prev = d.angle;
    d.angle = pendulumAngle(d, f.time);
    if (prev * d.angle < 0 && visible(d)) f.events.push({type: 'swish', x: d.x, y: d.y + d.len});
  }

  for (const c of f.crushers) {
    const old = c.mode, s = crusherState(c, f.time);
    c.mode = s.mode;
    c.bottom = s.bottom;
    if (old !== c.mode && visible(c)) {
      if (c.mode === 'warning') f.events.push({type: 'crusher-warning', x: c.x, y: 100});
      if (c.mode === 'slam') { f.events.push({type: 'crusher-slam', x: c.x, y: 200}); f.shake = Math.max(f.shake, 1.4); emitCrypt(f, 'dust', c.x + 16, 222, 8); }
    }
    if (c.mode === 'warning' && visible(c) && Math.random() < dt * 10) emitCrypt(f, 'dust', c.x + Math.random() * c.w, c.bottom);
  }

  for (const s of f.stalactites) {
    if (s.state === 'hang') {
      if (p && Math.abs(p.x + p.w / 2 - s.x) < 70 && p.y > 100) { s.state = 'warn'; s.t = 0; f.events.push({type: 'stalactite-warning', x: s.x, y: 40}); }
    } else if (s.state === 'warn') {
      s.t += dt;
      if (Math.random() < dt * 14) emitCrypt(f, 'dust', s.x, 40);
      if (s.t >= .5) { s.state = 'fall'; s.vy = 0; s.y = 32; f.events.push({type: 'stalactite-fall', x: s.x, y: 60}); }
    } else if (s.state === 'fall') {
      s.vy += 1260 * dt;
      s.y += s.vy * dt;
      if (s.y + 20 >= CRYPT.floor) {
        s.state = 'shatter'; s.t = 0;
        emitCrypt(f, 'rock', s.x, 220, 8);
        f.events.push({type: 'stalactite-shatter', x: s.x, y: 220});
      }
    } else if (s.state === 'shatter') {
      s.t += dt;
      if (s.t > 3.5) { s.state = 'hang'; s.y = 32; }
    }
  }

  for (const s of f.skeletons) {
    if (s.state === 'buried') {
      if (p && Math.abs(p.x - s.x) < 90 && Math.abs(p.y - s.y) < 60) {
        s.state = 'rise'; s.t = 0;
        f.events.push({type: 'skeleton-rise', x: s.x, y: s.y});
        emitCrypt(f, 'dust', s.x + 5, s.y + 18, 6);
      }
    } else if (s.state === 'rise') {
      s.t += dt;
      if (Math.random() < dt * 20) emitCrypt(f, 'rock', s.x + 5, s.y + 18);
      if (s.t >= .8) s.state = 'walk';
    } else {
      s.x += s.dir * s.speed * dt;
      s.anim += dt;
      if (s.x + s.w >= s.x1) { s.x = s.x1 - s.w; s.dir = -1; }
      if (s.x <= s.x0) { s.x = s.x0; s.dir = 1; }
    }
  }

  for (const b of f.bats) {
    b.flap += dt;
    b.cool = Math.max(0, b.cool - dt);
    if (b.state === 'sleep') {
      if (p && b.cool <= 0 && Math.abs(p.x - b.x) < 120) { b.state = 'alert'; b.t = 0; f.events.push({type: 'bat-alert', x: b.x, y: b.y}); }
    } else if (b.state === 'alert') {
      b.t += dt;
      if (b.t >= .65) {
        b.state = 'swoop'; b.t = 0;
        b.sx = b.x; b.sy = b.y;
        b.tx = p ? clamp(p.x + p.w / 2 + p.vx * 8, 24, CRYPT.width - 24) : b.x;
        b.ty = p ? Math.min(p.y + p.h / 2, 208) : 160;
        b.ex = clamp(2 * b.tx - b.sx, 24, CRYPT.width - 24);
        b.ey = b.sy;
        f.events.push({type: 'bat-swoop', x: b.x, y: b.y});
      }
    } else if (b.state === 'swoop') {
      b.t += dt;
      const u = Math.min(1, b.t / 1);
      b.x = b.sx + (b.ex - b.sx) * u;
      b.y = b.sy + (b.ty - b.sy) * 4 * u * (1 - u);
      if (u >= 1) { b.state = 'return'; b.t = 0; b.sx = b.x; b.sy = b.y; }
    } else if (b.state === 'return') {
      b.t += dt;
      const u = Math.min(1, b.t / 1.2);
      b.x = b.sx + (b.px - b.sx) * u;
      b.y = b.sy + (b.py - b.sy) * u;
      if (u >= 1) { b.state = 'sleep'; b.cool = 3; }
    }
  }

  for (const g of f.ghosts) {
    g.anim += dt;
    if (g.state === 'dormant') {
      if (p && p.x > g.trigger && p.x < g.end) {
        g.state = 'rising'; g.t = 0; g.x = g.coffin; g.y = 196;
        f.events.push({type: 'ghost-rise', x: g.x, y: g.y});
      }
    } else if (g.state === 'rising') {
      g.t += dt;
      g.alpha = Math.min(1, g.t / 1.3);
      g.y = 196 - 8 * g.alpha;
      if (g.t >= 1.3) g.state = 'hunt';
    } else if (g.state === 'hunt' && p) {
      const dx = p.x + p.w / 2 - (g.x + g.w / 2);
      // A ghost stands still while the player looks at it.
      const seen = dx * p.face < 0 && Math.abs(dx) < 400 && g.x > gs.camX - 40 && g.x < gs.camX + vw + 40;
      if (seen !== g.seen) f.events.push({type: seen ? 'ghost-freeze' : 'ghost-thaw', x: g.x, y: g.y});
      g.seen = seen;
      if (!seen) {
        g.x += Math.sign(dx) * Math.min(Math.abs(dx), g.speed * dt);
        g.y += clamp(p.y - 2 - g.y, -1, 1) * 30 * dt;
      }
      g.y += Math.sin(g.anim * 2.4) * .12;
      if (p.x > g.end) { g.state = 'fade'; g.t = 0; f.events.push({type: 'ghost-gone', x: g.x, y: g.y}); }
    } else if (g.state === 'fade') {
      g.t += dt;
      g.alpha = Math.max(0, 1 - g.t);
      if (g.t >= 1) g.state = 'gone';
    }
  }

  const d = f.dread;
  if (p && !d.active && p.x > CRYPT.chaseX) {
    d.active = true; d.x = p.x - 260; d.t = 0;
    f.shake = 2;
    f.events.push({type: 'dread-start', x: p.x, y: p.y});
  }
  if (d.active) {
    d.t += dt;
    d.x += Math.min(96, 66 + d.t * 4) * dt;
  }

  f.emission += dt;
  if (f.emission > .12) {
    f.emission = 0;
    for (const x of BRAZIERS) if (visible({x}) && Math.random() < .6) emitCrypt(f, 'ember', x + (Math.random() - .5) * 4, 196);
    for (const pit of f.pits) if (visible(pit) && Math.random() < .3) emitCrypt(f, 'wisp', pit.x + Math.random() * pit.w, 244);
    if (d.active && visible({x: d.x})) emitCrypt(f, 'dust', d.x - Math.random() * 20, 20 + Math.random() * 200);
  }
  for (let i = f.particles.length - 1; i >= 0; i--) {
    const a = f.particles[i];
    a.life -= dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.type === 'rock' || a.type === 'dust') a.vy += 120 * dt;
    if (a.type === 'wisp') a.r += dt * 2;
    if (a.life <= 0) f.particles.splice(i, 1);
  }
}

export function resolveCryptGround(gs, p, previousBottom) {
  const f = gs.crypt;
  if (!f) return;
  p.cryptGround = null;
  if (p.vy < 0) return;
  for (const s of f.surfaces) {
    if (s.collapsed || p.x + p.w <= s.x || p.x >= s.x + s.w) continue;
    if (previousBottom <= s.y + Math.max(2, s.dy) && p.y + p.h >= s.y) {
      p.y = s.y - p.h;
      p.vy = 0;
      p.onGround = true;
      p.cryptGround = s.id;
      if (s.kind === 'collapse' && !s.age) {
        s.age = .001;
        gs.crypt.events.push({type: 'creak', x: s.x, y: s.y});
      }
      break;
    }
  }
}

export function cryptCamera(gs, vw) {
  const p = gs.p;
  if (!p) return;
  const chase = gs.crypt?.dread.active;
  const target = clamp(p.x + p.w / 2 - vw * (p.face > 0 ? (chase ? .3 : .38) : .62), 0, Math.max(0, CRYPT.width - vw));
  gs.camX += (target - gs.camX) * .1;
}

const batBox = b => ({x: b.x, y: b.y, r: 6});

// Returns true when the player dies this frame.
export function cryptDamage(gs) {
  const f = gs.crypt, p = gs.p;
  if (!f || !p) return false;
  // Spike pits and the wall of shadow kill even during respawn immunity.
  if (f.pits.some(pit => overlap(p, pit))) return true;
  if (f.dread.active && p.x < f.dread.x + 4) return true;
  if (p.inv > 0) return false;
  if (f.pops.some(h => h.mode === 'active' && overlap(p, {x: h.x + 2, y: h.y - h.h, w: h.w - 4, h: h.h}))) return true;
  for (const d of f.pendulums) if (pendulumCircles(d).some(c => hit(c, p))) return true;
  if (f.crushers.some(c => c.bottom > 80 && overlap(p, {x: c.x + 1, y: 32, w: c.w - 2, h: c.bottom - 32}))) return true;
  if (f.stalactites.some(s => s.state === 'fall' && overlap(p, {x: s.x - 4, y: s.y, w: 8, h: 20}))) return true;
  if (f.skeletons.some(s => s.state === 'walk' && overlap(p, {x: s.x + 1, y: s.y + 1, w: s.w - 2, h: s.h - 1}))) return true;
  if (f.bats.some(b => b.state === 'swoop' && hit(batBox(b), p))) return true;
  return f.ghosts.some(g => g.state === 'hunt' && overlap(p, {x: g.x + 1, y: g.y + 2, w: g.w - 2, h: g.h - 3}));
}

// Checkpoints and soul pickups; returns true when the player reaches the exit door.
export function cryptInteractions(gs) {
  const f = gs.crypt, p = gs.p;
  if (!f || !p) return false;
  for (const c of f.checkpoints) {
    if (c.active || !overlap(p, {x: c.x - 8, y: c.y - 18, w: 28, h: 40})) continue;
    c.active = true;
    gs.spawnX = c.x;
    gs.spawnY = c.y;
    gs.checkpoint++;
    f.events.push({type: 'checkpoint', x: c.x, y: c.y});
    emitCrypt(f, 'ember', c.x + 4, c.y + 10, 8);
  }
  for (const s of f.pickups) {
    if (s.got || !overlap(p, {x: s.x, y: s.y, w: 12, h: 12})) continue;
    s.got = true;
    gs.coinCount++;
    gs.lives = Math.min(MAX_LIVES, gs.lives + 1);
    f.events.push({type: 'pickup', x: s.x, y: s.y});
  }
  return overlap(p, f.exit);
}
