import {T, MAX_LIVES} from '../config.js';
import {overlap, clamp} from '../utils.js';
import {world, crumbleKey} from '../world.js';
import {sfx} from '../audio.js';

// Fire alternates between embers and flames; art and damage share this clock.
export const fireActive = (e, tick) => (tick + e.phase) % 150 < 95;

export function createClassic(layout) {
  const c = {
    spikes: [],
    saws: [],
    elements: [],
    crumbles: [],
    pads: [],
    coins: []
  };

  const rows = layout.length;
  const cols = layout[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = layout[y][x];
      if (ch === '^' || ch === 'v') {
        c.spikes.push({
          x: x * T + 1,
          y: ch === '^' ? y * T + 6 : y * T,
          w: T - 2,
          h: T - 6,
          dir: ch === '^' ? 'up' : 'down',
          tx: x,
          ty: y
        });
      } else if (ch === 'W') {
        c.saws.push({
          x: x * T + T / 2,
          y: y * T + T / 2,
          r: 12,
          rotSpeed: 0.22,
          angle: 0,
          moving: false
        });
      } else if (ch === 'M') {
        c.saws.push({
          x: x * T + T / 2,
          y: y * T + T / 2,
          startX: x * T + T / 2,
          startY: y * T + T / 2,
          r: 12,
          rotSpeed: 0.28,
          angle: 0,
          moving: true,
          vx: 1.2,
          vy: 0,
          progress: 0,
          step: 1.2,
          maxDist: 64
        });
      } else if (ch === 'F' || ch === 'U') {
        c.elements.push({
          type: ch === 'F' ? 'fire' : 'water',
          x: x * T,
          y: y * T,
          w: T,
          h: T,
          tx: x,
          ty: y,
          phase: Math.floor(x / 8) * 17
        });
      } else if (ch === 'B') {
        const b = {
          x: x * T,
          y: y * T,
          w: T,
          h: T,
          tx: x,
          ty: y,
          timer: 0,
          collapsed: false,
          respawnTimer: 0
        };
        c.crumbles.push(b);
        world.crumbles.set(crumbleKey(x, y), b);
      } else if (ch === 'J') {
        c.pads.push({
          x: x * T + 2,
          y: y * T + 8,
          w: T - 4,
          h: 8,
          tx: x,
          ty: y,
          anim: 0
        });
      } else if (ch === 'C') {
        c.coins.push({
          tx: x,
          ty: y,
          got: false
        });
      }
    }
  }

  return c;
}

export function stepClassic(gs) {
  const c = gs.classic;
  if (!c) return;

  for (const saw of c.saws) {
    saw.angle += saw.rotSpeed;
    if (saw.moving) {
      saw.x += saw.vx;
      if (saw.x > saw.startX + saw.maxDist) {
        saw.x = saw.startX + saw.maxDist;
        saw.vx = -saw.vx;
      } else if (saw.x < saw.startX) {
        saw.x = saw.startX;
        saw.vx = -saw.vx;
      }
    }
  }

  for (const b of c.crumbles) {
    if (b.timer > 0) {
      if (--b.timer === 0) {
        b.collapsed = true;
        b.respawnTimer = 180;
      }
    } else if (b.collapsed && --b.respawnTimer === 0) {
      b.collapsed = false;
    }
  }

  for (const j of c.pads) {
    if (j.anim > 0) j.anim--;
  }
}

export function damageClassic(gs) {
  const p = gs.p, c = gs.classic;
  if (!p || p.inv > 0 || !c) return null;

  for (const h of c.spikes) {
    if (overlap(p, h)) return 'death';
  }

  for (const s of c.saws) {
    const nx = clamp(s.x, p.x, p.x + p.w);
    const ny = clamp(s.y, p.y, p.y + p.h);
    if (Math.hypot(s.x - nx, s.y - ny) < s.r) return 'death';
  }

  for (const e of c.elements) {
    if (e.type === 'water') {
      if (overlap(p, {x: e.x, y: e.y + 3, w: e.w, h: e.h - 3})) return 'death';
    } else if (e.type === 'fire' && fireActive(e, gs.levelTick)) {
      if (overlap(p, {x: e.x + 2, y: e.y - 12, w: e.w - 4, h: e.h + 12})) return 'death';
    }
  }

  return null;
}

export function interactClassic(gs) {
  const p = gs.p, c = gs.classic;
  if (!p || !c) return false;

  for (const pad of c.pads) {
    if (overlap(p, pad)) {
      p.vy = -8.6;
      p.onGround = false;
      pad.anim = 12;
      sfx.spring();
    }
  }

  for (const b of c.crumbles) {
    if (b.collapsed || b.timer || !p.onGround) continue;
    if (p.x + p.w > b.x && p.x < b.x + b.w && Math.abs(p.y + p.h - b.y) <= 2) {
      b.timer = 24;
      sfx.crumble();
    }
  }

  for (const coin of c.coins) {
    if (!coin.got && overlap(p, {x: coin.tx * T + 2, y: coin.ty * T + 2, w: 10, h: 10})) {
      coin.got = true;
      gs.coinCount++;
      gs.lives = Math.min(MAX_LIVES, gs.lives + 1); // each bandage is an extra life
      sfx.coin();
    }
  }

  return gs.exitX > 0 && p.x + p.w >= gs.exitX && p.x <= gs.exitX + 16 && Math.abs(p.y - gs.exitY) < 32;
}

export function cameraClassic(gs, vw) {
  const p = gs.p;
  if (!p) return;
  const target = clamp(p.x + p.w / 2 - vw / 2 + p.face * 20, 0, Math.max(0, world.width - vw));
  gs.camX += (target - gs.camX) * 0.1;
}

export const groundClassic = () => {};
export const onDeathClassic = () => {};
export const shakeClassic = () => [0, 0];
