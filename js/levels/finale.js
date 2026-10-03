import {clamp, overlap} from '../utils.js';
import {T} from '../config.js';

// Level 10 — the final rescue. A short gauntlet of old enemies' tricks leads into the boss arena:
// the Iron Overseer attacks with fireballs, laser beams and shockwaves. Three pressure plates
// (left to right) hurt it; after the third the cage opens and Bandage Girl can be freed.
export const FINALE = {
  cols: 130, rows: 17, width: 2080, height: 272, floor: 224, ceiling: 32, particleLimit: 160,
  arenaX: 74 * T, arenaEnd: 127 * T, bossX: 1608, girlX: 124 * T
};

export const FINALE_SECTIONS = [
  {x: 0, name: 'I · YAKUNIY SINOV'},
  {x: 70 * T, name: "II · TEMIR XO'JAYIN"}
];

const PITS = [[18, 21], [40, 44], [62, 65]];
const FLOOR_SPIKES = [10, 11, 31, 32, 56, 57];

export function createFinaleLayout() {
  const rows = Array.from({length: FINALE.rows}, () => Array(FINALE.cols).fill('.'));
  const fill = (c0, r0, c1, r1) => { for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) rows[r][c] = '#'; };
  fill(0, 0, FINALE.cols, 2);
  fill(0, 14, FINALE.cols, 17);
  fill(0, 0, 1, 17);
  fill(FINALE.cols - 1, 0, FINALE.cols, 17);
  for (const [a, b] of PITS) for (let r = 14; r < 16; r++) for (let c = a; c < b; c++) rows[r][c] = '.';
  fill(78, 11, 83, 12);     // arena ledges for dodging
  fill(94, 11, 99, 12);
  fill(110, 11, 115, 12);
  for (const c of FLOOR_SPIKES) rows[14][c] = '^';
  rows[13][3] = 'P';
  return rows.map(r => r.join(''));
}

export const phaseOf = (h, time) => {
  const c = h.cfg, cycle = c.off + c.warn + c.on + c.rest;
  const t = ((time + h.offset) % cycle + cycle) % cycle;
  return t < c.off ? 'off' : t < c.off + c.warn ? 'warning' : t < c.off + c.warn + c.on ? 'active' : 'cooldown';
};

const FALL_SPEED = 300;
export const VOLLEYS_PER_PLATE = 3; // attack waves to survive before a plate opens
const WARN = .9;

export function createFinale() {
  const spikes = [];
  for (const c of FLOOR_SPIKES) spikes.push({x: c * T + 2, y: FINALE.floor - 10, w: 12, h: 10});
  const vent = (col, offset) => ({x: col * T, y: FINALE.floor - 56, w: 20, h: 56, offset, cfg: {off: 1.5, warn: .7, on: .8, rest: .6}, mode: 'off'});
  const saw = (col, phase) => ({cx: col * T + 8, x: col * T + 8, y: 206, r: 10, range: 50, phase, angle: 0});
  const drop = col => ({x: col * T, state: 'hang', t: 0, y: FINALE.ceiling, vy: 0});
  const button = (col, index) => ({x: col * T, y: FINALE.floor - 6, w: 28, index, state: 'locked', press: 0});
  return {
    time: 0, spikes,
    pits: PITS.map(([a, b]) => ({x: a * T, y: 236, w: (b - a) * T, h: 20})),
    vents: [vent(27, 0), vent(46, .9)],
    saws: [saw(14, 0), saw(36, 1.7), saw(52, 3.1)],
    drops: [drop(24), drop(59)],
    checkpoints: [24, 50, 72, 92, 108].map(c => ({x: c * T, y: 208, active: false})),
    boss: {x: FINALE.bossX, y: 70, hp: 3, active: false, state: 'sleep', t: 0, stun: 0, dead: false, deadT: 0, look: 0, mouth: 0},
    buttons: [86, 102, 118].map(button),
    fireballs: [], waves: [], beams: [], blasts: [],
    rainTimer: 0, beamTimer: 0, waveTimer: 0, rainCount: 0, beamCount: 0, volleys: 0,
    girl: {x: FINALE.girlX, y: FINALE.floor - 32, freed: false, t: 0},
    particles: [], events: [], shake: 0, flash: 0, section: 0, sectionTime: 0, emission: 0
  };
}

export function resetFinale(f, spawnX = 0) {
  for (const d of f.drops) { d.state = 'hang'; d.y = FINALE.ceiling; d.vy = 0; d.t = 0; }
  f.fireballs.length = 0; f.waves.length = 0; f.beams.length = 0; f.blasts.length = 0; f.particles.length = 0;
  f.shake = 0; f.flash = 0;
  const b = f.boss;
  b.active = !b.dead && spawnX >= FINALE.arenaX;
  b.state = b.dead ? 'dead' : b.active ? 'stunned' : 'sleep';
  b.stun = b.active ? 2.2 : 0;
  f.volleys = 0;
  for (const btn of f.buttons) if (btn.state === 'ready') btn.state = 'locked';
  f.rainTimer = 1; f.beamTimer = 3; f.waveTimer = 2.5;
}

export function emitFinale(f, type, x, y, count = 1, color = null) {
  for (let i = 0; i < count && f.particles.length < FINALE.particleLimit; i++) {
    const life = .5 + Math.random() * .7;
    f.particles.push({type, x, y, life, max: life, color, r: 1 + Math.random() * 1.6,
      vx: (Math.random() - .5) * 120, vy: -30 - Math.random() * 90});
  }
}

// Which attacks are used depends on how many plates have been pressed.
export const bossPhase = f => 3 - f.boss.hp;

const hash = n => { let h = (n * 374761393) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function stepFinale(gs, dt, vw = 480) {
  const f = gs.finale, p = gs.p;
  if (!f) return;
  f.time += dt;
  f.events.length = 0;
  f.shake = Math.max(0, f.shake - dt * 5);
  f.flash = Math.max(0, f.flash - dt * 2);
  const visible = x => x > gs.camX - 60 && x < gs.camX + vw + 60;
  const b = f.boss;

  if (p) {
    const idx = p.x >= FINALE_SECTIONS[1].x ? 1 : 0;
    if (idx !== f.section) { f.section = idx; f.sectionTime = 0; }
    f.sectionTime += dt;
  }

  for (const h of f.vents) {
    const old = h.mode;
    h.mode = phaseOf(h, f.time);
    if (old !== h.mode && visible(h.x) && (h.mode === 'warning' || h.mode === 'active')) f.events.push({type: 'vent-' + h.mode, x: h.x, y: h.y});
    if (h.mode !== 'off' && visible(h.x) && Math.random() < dt * 25) emitFinale(f, 'ember', h.x + Math.random() * h.w, FINALE.floor - (h.mode === 'active' ? Math.random() * 56 : 4));
  }
  for (const s of f.saws) { s.x = s.cx + Math.sin(f.time * 1.6 + s.phase) * s.range; s.angle += dt * 12; }
  for (const d of f.drops) {
    if (d.state === 'hang') {
      if (p && Math.abs(p.x + 6 - d.x) < 70 && p.y > 100) { d.state = 'warn'; d.t = 0; f.events.push({type: 'drop-warning', x: d.x, y: 50}); }
    } else if (d.state === 'warn') {
      d.t += dt;
      if (d.t >= .5) { d.state = 'fall'; d.vy = 0; f.events.push({type: 'drop-fall', x: d.x, y: 60}); }
    } else if (d.state === 'fall') {
      d.vy += 1260 * dt; d.y += d.vy * dt;
      if (d.y + 20 >= FINALE.floor) { d.state = 'broken'; d.t = 0; emitFinale(f, 'rock', d.x, 220, 8); f.events.push({type: 'drop-shatter', x: d.x, y: 220}); }
    } else if (d.state === 'broken') { d.t += dt; if (d.t > 3.5) { d.state = 'hang'; d.y = FINALE.ceiling; } }
  }

  if (p && b.active && !b.dead) {
    const next = f.buttons.find(x => x.state !== 'pressed');
    if (next) {
      const limit = next.x + next.w + 8;
      if (p.x + p.w > limit) { p.x = limit - p.w; p.vx = 0; }
    }
    if (p.x < FINALE.arenaX - 16) { p.x = FINALE.arenaX - 16; p.vx = 0; }
  }
  // Boss wakes up when the player walks into the arena.
  if (p && !b.active && !b.dead && p.x > FINALE.arenaX) {
    b.active = true; b.state = 'intro'; b.t = 0;
    f.shake = 2.5; f.flash = .6;
    f.events.push({type: 'boss-roar', x: b.x, y: b.y});
  }
  if (b.active && !b.dead) {
    b.t += dt;
    if (p) b.look = clamp((p.x - b.x) / 300, -1, 1);
    if (b.state === 'intro' && b.t >= 1.6) { b.state = 'attack'; b.t = 0; f.rainTimer = .8; f.beamTimer = 3.2; f.waveTimer = 2.4; }
    else if (b.state === 'stunned') {
      b.stun -= dt;
      if (Math.random() < dt * 30) emitFinale(f, 'spark', b.x + (Math.random() - .5) * 60, b.y + (Math.random() - .5) * 30, 1, '#ffe070');
      if (b.stun <= 0) { b.state = 'attack'; b.t = 0; f.volleys = 0; f.rainTimer = 1.2; f.beamTimer = 3.5; f.waveTimer = 2.6; }
    } else if (b.state === 'attack' && p) {
      const phase = bossPhase(f);
      f.rainTimer -= dt;
      if (f.rainTimer <= 0) {
        const n = phase === 0 ? 3 : 2;
        f.rainTimer = phase === 0 ? 2.3 : phase === 1 ? 2.8 : 3.2;
        const base = f.rainCount++;
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * 62 + (hash(base * 7 + k) - .5) * 40;
          const x = clamp(p.x + p.w / 2 + off, FINALE.arenaX + 20, FINALE.arenaEnd - 20);
          f.fireballs.push({x, y: 0, state: 'warn', t: 0});
        }
        b.mouth = .6;
        f.events.push({type: 'boss-rain', x: b.x, y: b.y});
        // Surviving enough volleys leaves the Overseer exposed: the next plate lights up.
        if (++f.volleys >= VOLLEYS_PER_PLATE) {
          const plate = f.buttons.find(x => x.state !== 'pressed');
          if (plate && plate.state === 'locked') { plate.state = 'ready'; f.events.push({type: 'plate-ready', x: plate.x, y: FINALE.floor}); }
        }
      }
      if (phase >= 1) {
        f.beamTimer -= dt;
        if (f.beamTimer <= 0) {
          f.beamTimer = 4.2;
          const low = f.beamCount++ % 2 === 0;
          f.beams.push({y: low ? 206 : 156, h: 14, low, state: 'warn', t: 0});
          f.events.push({type: 'beam-warning', x: b.x, y: low ? 206 : 156});
        }
      }
      if (phase >= 2) {
        f.waveTimer -= dt;
        if (f.waveTimer <= 0) {
          f.waveTimer = 3.4;
          f.waves.push({x: b.x - 10, dir: -1}, {x: b.x + 10, dir: 1});
          f.shake = Math.max(f.shake, 1.6);
          f.events.push({type: 'boss-slam', x: b.x, y: FINALE.floor});
        }
      }
    }
    b.mouth = Math.max(0, b.mouth - dt);
  }
  if (b.dead) {
    b.deadT += dt;
    if (b.deadT < 3 && Math.random() < dt * 40) {
      emitFinale(f, 'burst', b.x + (Math.random() - .5) * 80, b.y + (Math.random() - .5) * 40, 3, ['#ffb040', '#ff4020', '#ffe070'][Math.floor(Math.random() * 3)]);
      if (Math.random() < .15) f.events.push({type: 'boss-blast', x: b.x, y: b.y});
    }
    f.girl.t += dt;
  }

  for (let i = f.fireballs.length - 1; i >= 0; i--) {
    const ball = f.fireballs[i];
    ball.t += dt;
    if (ball.state === 'warn') {
      if (ball.t >= WARN) { ball.state = 'fall'; ball.y = FINALE.ceiling; f.events.push({type: 'fireball-fall', x: ball.x, y: 60}); }
    } else {
      ball.y += FALL_SPEED * dt;
      if (ball.y >= FINALE.floor - 8) {
        f.blasts.push({x: ball.x, t: 0});
        emitFinale(f, 'burst', ball.x, FINALE.floor - 6, 8, '#ff8a30');
        f.events.push({type: 'fireball-hit', x: ball.x, y: FINALE.floor});
        f.shake = Math.max(f.shake, .6);
        f.fireballs.splice(i, 1);
      }
    }
  }
  for (let i = f.blasts.length - 1; i >= 0; i--) { f.blasts[i].t += dt; if (f.blasts[i].t > .3) f.blasts.splice(i, 1); }
  for (let i = f.waves.length - 1; i >= 0; i--) {
    const w = f.waves[i];
    w.x += w.dir * 135 * dt;
    if (w.x < FINALE.arenaX - 20 || w.x > FINALE.arenaEnd + 20) f.waves.splice(i, 1);
  }
  for (let i = f.beams.length - 1; i >= 0; i--) {
    const beam = f.beams[i];
    beam.t += dt;
    if (beam.state === 'warn' && beam.t >= WARN) { beam.state = 'fire'; beam.t = 0; f.events.push({type: 'beam-fire', x: b.x, y: beam.y}); f.shake = Math.max(f.shake, 1); }
    else if (beam.state === 'fire' && beam.t >= .6) f.beams.splice(i, 1);
  }

  for (const btn of f.buttons) btn.press = btn.state === 'pressed' ? Math.min(1, btn.press + dt * 6) : 0;

  f.emission += dt;
  if (f.emission > .1 && p) { f.emission = 0; emitFinale(f, 'ember', p.x + (Math.random() - .5) * 460, 230, 1); }
  for (let i = f.particles.length - 1; i >= 0; i--) {
    const a = f.particles[i];
    a.life -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
    if (a.type === 'burst' || a.type === 'rock') a.vy += 260 * dt;
    if (a.type === 'ember') { a.vy = -20; a.vx *= .99; }
    if (a.life <= 0) f.particles.splice(i, 1);
  }
}

export function finaleCamera(gs, vw) {
  const p = gs.p;
  if (!p) return;
  const target = clamp(p.x + p.w / 2 - vw * (p.face > 0 ? .4 : .6), 0, Math.max(0, FINALE.width - vw));
  gs.camX += (target - gs.camX) * .1;
}

const hitCirc = (c, p) => Math.hypot(c.x - clamp(c.x, p.x, p.x + p.w), c.y - clamp(c.y, p.y, p.y + p.h)) < c.r;

// Returns true when the player dies this frame.
export function finaleDamage(gs) {
  const f = gs.finale, p = gs.p;
  if (!f || !p) return false;
  if (f.pits.some(pit => overlap(p, pit))) return true;
  if (p.inv > 0) return false;
  if (f.spikes.some(s => overlap(p, s))) return true;
  if (f.vents.some(v => v.mode === 'active' && overlap(p, v))) return true;
  if (f.saws.some(s => hitCirc(s, p))) return true;
  if (f.drops.some(d => d.state === 'fall' && overlap(p, {x: d.x - 4, y: d.y, w: 8, h: 20}))) return true;
  if (f.fireballs.some(b => b.state === 'fall' && overlap(p, {x: b.x - 7, y: b.y - 7, w: 14, h: 14}))) return true;
  if (f.blasts.some(b => overlap(p, {x: b.x - 18, y: FINALE.floor - 14, w: 36, h: 14}))) return true;
  if (f.waves.some(w => overlap(p, {x: w.x - 8, y: FINALE.floor - 14, w: 16, h: 14}))) return true;
  return f.beams.some(b => b.state === 'fire' && overlap(p, {x: FINALE.arenaX, y: b.y, w: FINALE.arenaEnd - FINALE.arenaX, h: b.h}));
}

// Plates, checkpoints and the rescue; returns true when Bandage Girl is freed and reached.
export function finaleInteractions(gs) {
  const f = gs.finale, p = gs.p;
  if (!f || !p) return false;
  for (const c of f.checkpoints) {
    if (c.active || !overlap(p, {x: c.x - 8, y: c.y - 18, w: 28, h: 40})) continue;
    c.active = true;
    gs.spawnX = c.x; gs.spawnY = c.y; gs.checkpoint++;
    f.events.push({type: 'checkpoint', x: c.x, y: c.y});
    emitFinale(f, 'burst', c.x + 6, c.y + 6, 10, '#ffd060');
  }
  const b = f.boss;
  if (b.active && !b.dead) {
    for (const btn of f.buttons) {
      // A pressure field above the plate: running over it or jumping across it both trigger it.
      if (btn.state !== 'ready' || !overlap(p, {x: btn.x, y: FINALE.floor - 56, w: btn.w, h: 56})) continue;
      btn.state = 'pressed';
      b.hp--;
      f.flash = 1; f.shake = 3;
      f.fireballs.length = 0; f.waves.length = 0; f.beams.length = 0;
      emitFinale(f, 'burst', b.x, b.y, 30, '#ffe070');
      if (b.hp <= 0) {
        b.dead = true; b.state = 'dead'; b.deadT = 0; f.girl.freed = true;
        f.events.push({type: 'boss-dead', x: b.x, y: b.y});
      } else {
        b.state = 'stunned'; b.stun = 3;
        f.volleys = 0;
        f.events.push({type: 'boss-hit', x: b.x, y: b.y, hp: b.hp});
      }
      break;
    }
  }
  return f.girl.freed && overlap(p, {x: f.girl.x - 8, y: f.girl.y - 6, w: 36, h: 44});
}
