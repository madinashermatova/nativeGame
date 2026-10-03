import {clamp, overlap} from '../utils.js';

export const INDUSTRIAL = {
  width: 1856, height: 1376, particleLimit: 130,
  // Hazard cycles in seconds: off -> warning -> active.
  steam: {off: 2.5, warning: 1, on: 1.5},
  electric: {off: 1.8, warning: .4, on: 1.2},
  gas: {off: 3, warning: .5, on: 2}
};

// U-shaped world: left shaft up, machinery corridor across, right shaft down.
export function createIndustrialLayout() {
  const rows = Array.from({length: 86}, () => Array(116).fill('.'));
  for (const r of rows) r[0] = r[115] = '#';
  rows[0].fill('#');
  for (let y = 15; y < 86; y++) for (let x = 26; x < 83; x++) rows[y][x] = '#';
  rows[79][4] = 'P';
  return rows.map(r => r.join(''));
}

export function phase(h, time) {
  const c = INDUSTRIAL[h.type], cycle = c.off + c.warning + c.on;
  const t = ((time + h.offset) % cycle + cycle) % cycle;
  return t < c.off ? 'off' : t < c.off + c.warning ? 'warning' : 'active';
}

export function createIndustrial() {
  let id = 0;
  const s = (x, y, w, kind = 'static', extra = {}) =>
    ({id: id++, x, y, w, h: 8, baseX: x, baseY: y, kind, dx: 0, dy: 0, age: 0, collapsed: false, ...extra});
  const surfaces = [s(16, 1280, 220)];
  // Left shaft: zig-zag ascent.
  for (let i = 0; i < 22; i++) {
    const kind = i === 2 || i === 8 || i === 16 ? 'moving' : i === 5 || i === 11 ? 'collapse' : 'static';
    surfaces.push(s(i % 2 ? 128 : 256, 1232 - i * 48, i % 5 === 4 ? 136 : 112, kind, {ax: i === 8 ? 0 : 12, ay: i === 8 ? 6 : 0}));
  }
  // Upper machinery corridor.
  surfaces.push(s(368, 224, 168), s(560, 224, 120), s(704, 208, 120), s(848, 224, 88), s(976, 208, 104, 'moving', {ax: 10, ay: 0}),
    s(1112, 224, 168), s(1304, 224, 112), s(1440, 224, 152));
  // Right shaft: descent.
  for (let i = 0; i < 15; i++) {
    const kind = i === 2 || i === 12 ? 'collapse' : i === 5 ? 'moving' : 'static';
    surfaces.push(s(i % 2 ? 1456 : 1600, 272 + i * 64, 160, kind, {ax: 0, ay: 12}));
  }
  // Escape floor.
  surfaces.push(s(1360, 1240, 208), s(1592, 1240, 80, 'moving', {ax: 12, ay: 0}), s(1704, 1240, 136));

  const h = (type, x, y, w, hh, offset = 0) => ({type, x, y, w, h: hh, offset, mode: 'off', exposure: 0});
  return {
    time: 0, surfaces,
    hazards: [h('steam', 238, 1140, 18, 44), h('gas', 230, 1004, 32, 32, .8), h('steam', 238, 900, 18, 44, 1.4), h('gas', 230, 708, 32, 34, 2),
      h('electric', 1092, 180, 12, 44), h('electric', 1740, 332, 44, 12, 1), h('steam', 1598, 488, 18, 44, 2), h('electric', 1690, 804, 45, 12, .3),
      h('steam', 1574, 1218, 18, 22)],
    saws: [{x: 692, y: 220, r: 12, kind: 'gear'}, {x: 836, y: 202, r: 11, kind: 'static'}, {x: 956, y: 218, r: 12, kind: 'hanging'},
      {x: 1428, y: 222, r: 12, kind: 'rail', ax: 6}, {x: 1720, y: 584, r: 13, kind: 'vertical', ay: 22}, {x: 1718, y: 932, r: 14, kind: 'gear'}]
      .map(saw => ({...saw, baseX: saw.x, baseY: saw.y})),
    pools: [{x: 16, y: 1330, w: 400, h: 46}, {x: 1360, y: 1300, w: 480, h: 76}],
    checkpoints: [{x: 280, y: 1026}, {x: 280, y: 738}, {x: 390, y: 210}, {x: 1210, y: 210}, {x: 1530, y: 962}, {x: 1540, y: 1226}]
      .map(c => ({...c, active: false})),
    exit: {x: 1760, y: 1164, w: 62, h: 76},
    escape: {active: false, elapsed: 0, pressure: 1300},
    particles: [], events: [], shake: 0, emission: 0
  };
}

export function resetIndustrial(f) {
  for (const s of f.surfaces) { s.age = 0; s.collapsed = false; }
  for (const h of f.hazards) { h.offset = -f.time; h.mode = 'off'; h.exposure = 0; }
  f.escape = {active: false, elapsed: 0, pressure: 1300};
  f.particles.length = 0;
  f.shake = 0;
}

export function emitIndustrial(f, x, y, type, count = 1) {
  for (let i = 0; i < count && f.particles.length < INDUSTRIAL.particleLimit; i++) {
    f.particles.push({
      x, y, type,
      vx: (Math.random() - .5) * 18 + (type === 'gas' ? 16 : 0),
      vy: type === 'spark' ? Math.random() * 40 - 30 : type === 'steam' ? -45 - Math.random() * 20 : -12 - Math.random() * 14,
      life: 1.1, max: 1.1,
      r: type === 'steam' || type === 'gas' ? 3 + Math.random() * 4 : 1
    });
  }
}

// The pool on the escape side rises once the alarm sounds.
const poolTop = (f, pool) => pool.x > 1000 ? f.escape.pressure : pool.y;

export function stepIndustrial(gs, dt, vw = 480) {
  const f = gs.industrial, p = gs.p;
  if (!f) return;
  f.time += dt;
  f.events.length = 0;
  f.shake = Math.max(0, f.shake - dt * 8);
  const camY = gs.camY || 0;
  const visible = o => o.x + (o.w || 40) > gs.camX - 60 && o.x < gs.camX + vw + 60 && o.y + (o.h || 40) > camY - 60 && o.y < camY + 330;

  for (const s of f.surfaces) {
    const x = s.x, y = s.y;
    if (s.kind === 'moving') {
      s.x = s.baseX + Math.sin(f.time) * (s.ax || 0);
      s.y = s.baseY + Math.sin(f.time) * (s.ay || 0);
    }
    s.dx = s.x - x;
    s.dy = s.y - y;
    if (p && p.onGround && p.industrialGround === s.id && !s.collapsed) {
      p.x += s.dx;
      p.y += s.dy;
    }
    if (s.age > 0) {
      s.age += dt;
      if (s.age > .85 && !s.collapsed) {
        s.collapsed = true;
        if (visible(s)) { emitIndustrial(f, s.x + s.w / 2, s.y, 'spark', 8); f.events.push({type: 'collapse', x: s.x, y: s.y}); }
      }
      if (s.age > 4.5) { s.age = 0; s.collapsed = false; }
    }
  }

  for (const h of f.hazards) {
    const old = h.mode;
    h.mode = phase(h, f.time);
    // Escape-floor vent follows the alarm clock instead of its own cycle.
    if (f.escape.active && h.type === 'steam' && h.y > 1100) {
      h.mode = f.escape.elapsed < 1.5 ? 'off' : f.escape.elapsed < 2.5 ? 'warning' : 'active';
    }
    if (old !== h.mode && visible(h)) f.events.push({type: h.type + '-' + h.mode, x: h.x, y: h.y});
  }

  for (const saw of f.saws) {
    saw.x = saw.baseX + Math.sin(f.time * 1.2) * (saw.ax || 0);
    saw.y = saw.baseY + Math.sin(f.time * 1.1) * (saw.ay || 0);
  }

  if (p && p.x > 1350 && p.y > 1180 && !f.escape.active) {
    f.escape.active = true;
    f.shake = 1.5;
    f.events.push({type: 'alarm', x: p.x, y: p.y});
    emitIndustrial(f, p.x + 60, p.y - 70, 'spark', 20);
  }
  if (f.escape.active) {
    f.escape.elapsed += dt;
    f.escape.pressure = Math.max(1264, 1300 - Math.max(0, f.escape.elapsed - 4) * 1.4);
  }

  f.emission += dt;
  if (f.emission > .1) {
    f.emission = 0;
    for (const h of f.hazards) {
      if (!visible(h) || h.mode === 'off') continue;
      const spread = h.type === 'gas' && h.mode === 'active';
      emitIndustrial(f, spread ? h.x + Math.random() * h.w : h.x + h.w / 2, spread ? h.y + Math.random() * h.h : h.y + h.h, h.type, h.mode === 'active' ? 3 : 1);
    }
    for (const pool of f.pools) {
      if (visible(pool)) emitIndustrial(f, Math.max(pool.x, gs.camX) + Math.random() * Math.min(pool.w, vw), pool.y, 'bubble');
    }
  }

  for (let i = f.particles.length - 1; i >= 0; i--) {
    const a = f.particles[i];
    a.life -= dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.type === 'spark') a.vy += 70 * dt; else a.r += dt * 3;
    if (a.life <= 0) f.particles.splice(i, 1);
  }
}

export function resolveIndustrialGround(gs, p, previousBottom) {
  const f = gs.industrial;
  if (!f) return;
  p.industrialGround = null;
  if (p.vy >= 0) {
    for (const s of f.surfaces) {
      if (s.collapsed || p.x + p.w <= s.x || p.x >= s.x + s.w) continue;
      if (previousBottom <= s.y + Math.max(2, s.dy) && p.y + p.h >= s.y) {
        p.y = s.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.industrialGround = s.id;
        if (s.kind === 'collapse' && !s.age) s.age = .001;
        break;
      }
    }
  }
}

export function industrialCamera(gs, vw) {
  const p = gs.p;
  if (!p) return;
  const targetX = clamp(p.x + p.w / 2 - vw * 0.47, 0, INDUSTRIAL.width - vw);
  gs.camX += (targetX - gs.camX) * 0.1;

  const camY = gs.camY ?? 0;
  const deadzone = p.x > 1328 ? 46 : 86;
  const offset = p.x > 1328 ? 20 : 0;
  const centerY = camY + 135 - offset;
  if (Math.abs(p.y - centerY) > deadzone) {
    const targetY = clamp(p.y - 135 + offset, 0, INDUSTRIAL.height - 270);
    gs.camY = camY + (targetY - camY) * 0.1;
  }
}

// Saw hit test against the closest point of the player box; the hanging blade is an ellipse.
function sawHits(saw, p) {
  const dx = saw.x - clamp(saw.x, p.x, p.x + p.w), dy = saw.y - clamp(saw.y, p.y, p.y + p.h);
  return saw.kind === 'hanging' ? Math.hypot(dx / 20, dy / 6.5) < 1 : Math.hypot(dx, dy) < saw.r;
}

// Returns true when the player dies this frame.
export function industrialDamage(gs, dt) {
  const f = gs.industrial, p = gs.p;
  if (!f || !p) return false;
  // Toxic liquid kills even during respawn immunity.
  if (f.pools.some(pool => { const y = poolTop(f, pool); return overlap(p, {...pool, y, h: INDUSTRIAL.height - y}); })) return true;
  for (const h of f.hazards) {
    const inside = h.mode === 'active' && overlap(p, h);
    if (h.type === 'gas') {
      h.exposure = inside ? h.exposure + dt : Math.max(0, h.exposure - dt * 2);
      if (h.exposure > .65 && p.inv === 0) return true;
    } else if (inside && p.inv === 0) return true;
  }
  return p.inv === 0 && f.saws.some(saw => sawHits(saw, p));
}

// Checkpoints; returns true when the player reaches the exit door.
export function industrialInteractions(gs) {
  const f = gs.industrial, p = gs.p;
  for (const c of f.checkpoints) {
    if (c.active || !overlap(p, {x: c.x - 8, y: c.y - 18, w: 28, h: 32})) continue;
    c.active = true;
    gs.spawnX = c.x;
    gs.spawnY = c.y;
    gs.checkpoint++;
    f.events.push({type: 'checkpoint', x: c.x, y: c.y});
  }
  return overlap(p, f.exit);
}
