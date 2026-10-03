import {clamp, overlap} from '../utils.js';
import {T} from '../config.js';
import {MAX_LIVES} from '../config.js';

// Level 9 — the mycelium caves. Toxic mushrooms are deadly to touch, for everyone: stalkers and
// floaters hunt the player from behind, and a chaser that runs into a mushroom is petrified.
// Lure them over the poison, jump (or duck) past it yourself, and keep running.
export const MYCO = {cols: 300, rows: 17, width: 4800, height: 272, floor: 224, ceiling: 32, particleLimit: 160};

export const MYCO_SECTIONS = [
  {x: 0, name: 'I · TUMANLI KIRISH'},
  {x: 47 * T, name: "II · BIRINCHI IZ"},
  {x: 101 * T, name: "III · SUZUVCHILAR"},
  {x: 160 * T, name: "IV · SPORA G'ORI"},
  {x: 217 * T, name: "V · QUVUV"}
];

const PITS = [[26, 30], [180, 187]];
// Notes for the mushroom chimes (pentatonic, Hz).
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];

export function createMycoLayout() {
  const rows = Array.from({length: MYCO.rows}, () => Array(MYCO.cols).fill('.'));
  const fill = (c0, r0, c1, r1) => { for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) rows[r][c] = '#'; };
  fill(0, 0, MYCO.cols, 2);
  fill(0, 14, MYCO.cols, 17);
  fill(0, 0, 1, 17);
  fill(MYCO.cols - 1, 0, MYCO.cols, 17);
  for (const [a, b] of PITS) for (let r = 14; r < 16; r++) for (let c = a; c < b; c++) rows[r][c] = '.';
  fill(163, 11, 168, 12);   // cavern ledges
  fill(169, 8, 174, 9);
  fill(193, 11, 198, 12);
  // Rock bumps hanging from the ceiling, kept clear of the hanging mushrooms.
  const hangingCols = [120, 141, 153, 242, 258, 272];
  for (let c = 4; c < MYCO.cols - 6; c += 5 + (c * 7) % 4) {
    if (hangingCols.some(h => Math.abs(h - c) < 5)) continue;
    fill(c, 2, c + 1 + (c % 3), 3 + (c % 2));
  }
  rows[13][3] = 'P';
  return rows.map(r => r.join(''));
}

export const phaseOf = (h, time) => {
  const c = h.cfg, cycle = c.off + c.warn + c.on + c.rest;
  const t = ((time + h.offset) % cycle + cycle) % cycle;
  return t < c.off ? 'off' : t < c.off + c.warn ? 'warning' : t < c.off + c.warn + c.on ? 'active' : 'cooldown';
};

export function createMyco() {
  const mushrooms = [];
  let note = 0;
  const ground = (col, n = 1) => {
    for (let i = 0; i < n; i++) {
      mushrooms.push({kind: 'ground', x: col * T + i * 15, y: MYCO.floor - 15, w: 14, h: 15, note: note++ % SCALE.length, glow: 0, cool: 0, seed: col + i});
    }
  };
  const hanging = col => mushrooms.push({kind: 'hanging', x: col * T, y: 152, w: 30, h: 40, note: note++ % SCALE.length, glow: 0, cool: 0, seed: col});
  for (const [c, n] of [[14, 1], [34, 2], [66, 2], [80, 1], [92, 2], [111, 1], [130, 1], [197, 1], [208, 2], [232, 2], [250, 1], [266, 2], [280, 1]]) ground(c, n);
  [120, 141, 153, 242, 258, 272].forEach(hanging);

  const stalker = (trigger, zone0, zone1) => ({
    kind: 'stalker', trigger: trigger * T, zone0: zone0 * T, zone1: zone1 * T, x: 0, y: MYCO.floor - 20, w: 18, h: 20,
    state: 'dormant', t: 0, speed: 105, anim: 0, alpha: 1, frozenT: 0, vy: 0
  });
  const floater = (trigger, zone0, zone1) => ({
    kind: 'floater', trigger: trigger * T, zone0: zone0 * T, zone1: zone1 * T, x: 0, y: 150, w: 18, h: 16,
    state: 'dormant', t: 0, speed: 78, anim: 0, alpha: 1, frozenT: 0, vy: 0
  });
  const cloud = (col, offset) => ({x: col * T, y: MYCO.floor - 44, w: 48, h: 44, offset, cfg: {off: 2.2, warn: .8, on: 1.2, rest: .6}, mode: 'off'});
  const pit = ([a, b]) => ({x: a * T, y: 236, w: (b - a) * T, h: 20});

  return {
    time: 0, mushrooms,
    chasers: [
      stalker(69, 47, 99), stalker(95, 47, 99),
      floater(124, 101, 159), floater(145, 101, 159), floater(157, 101, 159),
      stalker(235, 217, 289), floater(245, 217, 289), stalker(253, 217, 289), floater(261, 217, 289), stalker(269, 217, 289), floater(275, 217, 289)
    ],
    clouds: [cloud(38, 0), cloud(134, .9), cloud(191, .4), cloud(201, 1.7)],
    pools: PITS.map(pit),
    pads: [{x: 177 * T, y: MYCO.floor, w: 28, press: 0, note: 5}],
    checkpoints: [46, 100, 160, 190, 216].map(c => ({x: c * T, y: 208, active: false})),
    pickups: [{x: 169 * T + 30, y: 104}, {x: 195 * T, y: 152}].map(p => ({...p, got: false})),
    exit: {x: 292 * T, y: 176, w: 32, h: 48},
    particles: [], events: [], shake: 0, flash: 0, danger: 0, section: 0, sectionTime: 0, emission: 0, heart: 0
  };
}

export function resetMyco(f, spawnX = 0) {
  f.particles.length = 0;
  f.shake = 0; f.flash = 0; f.danger = 0;
  for (const c of f.chasers) {
    Object.assign(c, {state: spawnX >= c.zone1 || spawnX > c.trigger + 200 ? 'done' : 'dormant', t: 0, alpha: 1, frozenT: 0, vy: 0});
    if (c.state === 'done') c.alpha = 0;
  }
  for (const m of f.mushrooms) { m.glow = 0; m.cool = 1; }
}

export function emitMyco(f, type, x, y, count = 1, color = null) {
  for (let i = 0; i < count && f.particles.length < MYCO.particleLimit; i++) {
    const life = type === 'spore' ? 2.2 + Math.random() * 1.5 : .5 + Math.random() * .6;
    f.particles.push({
      type, x, y, life, max: life, color, r: type === 'spore' ? 1.2 : 1 + Math.random() * 1.5,
      vx: (Math.random() - .5) * (type === 'burst' ? 90 : 14),
      vy: type === 'spore' ? -6 - Math.random() * 8 : type === 'burst' ? -40 - Math.random() * 60 : -20
    });
  }
}

const GAP = 120;     // how far behind the player a chaser appears
const EMERGE = .6;   // roar before it starts moving

export const chaserBox = c => ({x: c.x + 2, y: c.y + 2, w: c.w - 4, h: c.h - 3});

export function stepMyco(gs, dt, vw = 480) {
  const f = gs.myco, p = gs.p;
  if (!f) return;
  f.time += dt;
  f.events.length = 0;
  f.shake = Math.max(0, f.shake - dt * 6);
  f.flash = Math.max(0, f.flash - dt * 2.5);
  const visible = x => x > gs.camX - 60 && x < gs.camX + vw + 60;

  if (p) {
    const idx = MYCO_SECTIONS.reduce((best, s, i) => p.x >= s.x ? i : best, 0);
    if (idx !== f.section) { f.section = idx; f.sectionTime = 0; }
    f.sectionTime += dt;
  }

  for (const h of f.clouds) {
    const old = h.mode;
    h.mode = phaseOf(h, f.time);
    if (old !== h.mode && visible(h.x) && (h.mode === 'warning' || h.mode === 'active')) f.events.push({type: 'cloud-' + h.mode, x: h.x + 24, y: h.y});
    if (h.mode !== 'off' && visible(h.x) && Math.random() < dt * 20) emitMyco(f, 'spore', h.x + Math.random() * h.w, h.y + h.h - Math.random() * h.h);
  }
  for (const pad of f.pads) pad.press = Math.max(0, pad.press - dt);

  // Mushrooms light up and chime when the player brushes past.
  for (const m of f.mushrooms) {
    m.glow = Math.max(0, m.glow - dt * 1.4);
    m.cool = Math.max(0, m.cool - dt);
    if (p && m.cool <= 0 && Math.abs(p.x + 6 - (m.x + m.w / 2)) < 34 && Math.abs(p.y + 7 - (m.y + m.h / 2)) < 60) {
      m.glow = 1; m.cool = 1.4;
      f.events.push({type: 'chime', x: m.x, y: m.y, note: m.note});
      emitMyco(f, 'spore', m.x + m.w / 2, m.y, 4);
    }
  }

  let danger = 0;
  for (const c of f.chasers) {
    c.anim += dt;
    if (c.state === 'dormant') {
      if (p && p.x > c.trigger && p.x < c.zone1) {
        c.state = 'emerge'; c.t = 0; c.alpha = 0;
        c.x = clamp(p.x - GAP, c.zone0, c.zone1);
        c.y = c.kind === 'stalker' ? MYCO.floor - c.h : clamp(p.y - 26, 140, 200);
        f.events.push({type: 'chaser-emerge', x: c.x, y: c.y, kind: c.kind});
        f.shake = Math.max(f.shake, 1.2);
        emitMyco(f, 'burst', c.x + 9, c.y + 10, 10);
      }
    } else if (c.state === 'emerge') {
      c.t += dt;
      c.alpha = Math.min(1, c.t / EMERGE);
      if (c.t >= EMERGE) { c.state = 'chase'; c.t = 0; }
    } else if (c.state === 'chase' && p) {
      c.t += dt;
      const speed = Math.min(c.speed * 1.12, c.speed + c.t * 1.5);
      const dx = p.x + p.w / 2 - (c.x + c.w / 2);
      c.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      c.x = clamp(c.x, c.zone0 - 40, c.zone1 + 40);
      if (c.kind === 'floater') {
        const targetY = clamp(p.y - 26, 140, 200) + Math.sin(c.anim * 3) * 4;
        c.y += clamp(targetY - c.y, -50 * dt, 50 * dt);
      }
      if (p.x > c.zone1 + 40) { c.state = 'fade'; c.t = 0; f.events.push({type: 'chaser-gone', x: c.x, y: c.y}); }
      // Anything that runs into a mushroom is petrified.
      for (const m of f.mushrooms) {
        if (overlap(chaserBox(c), m)) {
          c.state = 'frozen'; c.frozenT = 0; c.vy = 0;
          m.glow = 1;
          f.flash = 1; f.shake = Math.max(f.shake, 2);
          f.events.push({type: 'freeze', x: c.x, y: c.y, note: m.note, kind: c.kind});
          emitMyco(f, 'burst', c.x + c.w / 2, c.y + c.h / 2, 24, '#b890ff');
          break;
        }
      }
      if (c.state === 'chase') danger = Math.max(danger, clamp(1 - Math.abs(dx) / 300, 0, 1));
    } else if (c.state === 'frozen') {
      c.frozenT += dt;
      if (c.kind === 'floater' && c.y < MYCO.floor - c.h) { // petrified floaters drop to the ground
        c.vy += 600 * dt;
        c.y = Math.min(MYCO.floor - c.h, c.y + c.vy * dt);
        if (c.y >= MYCO.floor - c.h) { f.events.push({type: 'shatter', x: c.x, y: c.y}); emitMyco(f, 'burst', c.x + 9, c.y + 8, 12, '#b890ff'); }
      }
    } else if (c.state === 'fade') {
      c.t += dt; c.alpha = Math.max(0, 1 - c.t);
      if (c.t >= 1) c.state = 'done';
    }
  }
  f.danger += (danger - f.danger) * (1 - Math.exp(-dt * 4));

  f.emission += dt;
  if (f.emission > .12 && p) {
    f.emission = 0;
    emitMyco(f, 'spore', p.x + (Math.random() - .5) * 460, 40 + Math.random() * 190);
  }
  for (let i = f.particles.length - 1; i >= 0; i--) {
    const a = f.particles[i];
    a.life -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
    if (a.type === 'burst') a.vy += 200 * dt;
    if (a.life <= 0) f.particles.splice(i, 1);
  }
}

export function resolveMycoGround(gs, p, previousBottom) {
  const f = gs.myco;
  if (!f) return;
  if (p.vy < 0) return;
  for (const pad of f.pads) {
    if (p.x + p.w <= pad.x || p.x >= pad.x + pad.w) continue;
    if (previousBottom <= pad.y + 2 && p.y + p.h >= pad.y) {
      p.y = pad.y - p.h;
      p.vy = -9.6;
      p.launched = true;
      p.onGround = false;
      pad.press = .3;
      f.events.push({type: 'bounce', x: pad.x, y: pad.y, note: pad.note});
      return;
    }
  }
}

export function mycoCamera(gs, vw) {
  const p = gs.p, f = gs.myco;
  if (!p) return;
  const chase = f?.chasers.some(c => c.state === 'chase' || c.state === 'emerge');
  const anchor = p.face > 0 ? (chase ? .3 : .38) : .62;
  const target = clamp(p.x + p.w / 2 - vw * anchor, 0, Math.max(0, MYCO.width - vw));
  gs.camX += (target - gs.camX) * .1;
}

// Returns true when the player dies this frame.
export function mycoDamage(gs) {
  const f = gs.myco, p = gs.p;
  if (!f || !p) return false;
  if (f.pools.some(pool => overlap(p, pool))) return true;
  if (p.inv > 0) return false;
  const hit = {x: p.x + 1, y: p.y + 1, w: p.w - 2, h: p.h - 2};
  if (f.mushrooms.some(m => overlap(hit, m))) return true;
  if (f.clouds.some(h => h.mode === 'active' && overlap(p, h))) return true;
  return f.chasers.some(c => c.state === 'chase' && overlap(p, chaserBox(c)));
}

export function mycoInteractions(gs) {
  const f = gs.myco, p = gs.p;
  if (!f || !p) return false;
  for (const c of f.checkpoints) {
    if (c.active || !overlap(p, {x: c.x - 8, y: c.y - 18, w: 28, h: 40})) continue;
    c.active = true;
    gs.spawnX = c.x; gs.spawnY = c.y; gs.checkpoint++;
    f.events.push({type: 'checkpoint', x: c.x, y: c.y});
    emitMyco(f, 'burst', c.x + 6, c.y + 6, 12, '#6affd8');
  }
  for (const s of f.pickups) {
    if (s.got || !overlap(p, {x: s.x, y: s.y, w: 12, h: 12})) continue;
    s.got = true; gs.coinCount++; gs.lives = Math.min(MAX_LIVES, gs.lives + 1);
    f.events.push({type: 'pickup', x: s.x, y: s.y});
  }
  return overlap(p, f.exit);
}

export const MYCO_SCALE = SCALE;
