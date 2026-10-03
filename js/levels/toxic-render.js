import {background, ready} from '../assets.js';
import {drawSprite, glow, label, drawParticles} from '../gfx.js';
import {drawBoy} from '../renderer.js';
import {TOXIC_SECTIONS} from './toxic.js';

const sprite = (ctx, key, x, y, width, angle = 0, flip = false) => drawSprite(ctx, 'l4.' + key, x, y, width, angle, flip);
const visible = (x, w, cx, vw) => x + w > cx - 40 && x < cx + vw + 40;

function tileSpan(ctx, key, x, y, width, size = 48) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, 270 - y); ctx.clip();
  for (let dx = 0; dx < width; dx += size) sprite(ctx, key, x + dx, y, size);
  ctx.restore();
}

export function drawToxicBackground(ctx, vw, cx, gs) {
  const time = gs.toxic.time, bg = background('l4-bg');
  if (ready(bg)) {
    const w = 270 * bg.width / bg.height, off = (cx * .15) % w;
    for (let x = -off; x < vw; x += w) ctx.drawImage(bg, x, 0, w, 270);
  }
  ctx.fillStyle = 'rgba(4,13,10,.46)'; ctx.fillRect(0, 0, vw, 270);
  ctx.globalAlpha = .18;
  const farOff = (cx * .08) % 340;
  for (let x = -farOff - 100; x < vw; x += 340) sprite(ctx, 'tank', x, 18, 120);
  const pipeOff = (cx * .3) % 320;
  for (let x = -pipeOff - 100; x < vw; x += 320) {
    ctx.globalAlpha = .32; sprite(ctx, 'pipe', x, 64, 140); sprite(ctx, 'pipeLeg', x + 91, 95, 28);
    ctx.globalAlpha = 1; sprite(ctx, 'lamp', x + 40, 112, 12);
    glow(ctx, x + 46, 115, 35, '#fba247', .12 + .035 * Math.sin(time * 4 + x));
  }
  const machineOff = (cx * .45) % 410;
  for (let x = -machineOff - 90; x < vw; x += 410) {
    ctx.globalAlpha = .35; sprite(ctx, 'barrelAssembly', x, 132, 135); ctx.globalAlpha = 1;
    glow(ctx, x + 80, 164, 42, '#a4df37', .12);
  }
}

// Liquid geometry comes exclusively from the toxic pool sprite, repeated at native ratio.
const LIQUID_TILE_H = 48 * 205 / 240;
function pool(ctx, pool, cx, time, vw) {
  if (!visible(pool.x, pool.w, cx, vw)) return;
  const l = Math.max(pool.x - cx, -50), r = Math.min(pool.x + pool.w - cx, vw + 50), y = pool.y;
  ctx.save(); ctx.beginPath(); ctx.moveTo(l, 270); ctx.lineTo(l, y);
  for (let x = l; x < r; x += 6) ctx.lineTo(x, y + Math.sin((x + cx) * .09 + time * 2.4) * 1.3);
  ctx.lineTo(r, y); ctx.lineTo(r, 270); ctx.closePath(); ctx.clip();
  for (let py = y - 3; py < 270; py += LIQUID_TILE_H) {
    for (let px = Math.floor((l + cx) / 48) * 48 - cx; px < r; px += 48) sprite(ctx, 'liquid', px, py, 48);
  }
  ctx.restore();
  for (let x = l; x < r; x += 80) glow(ctx, x + 40, y, 47, '#b4ff43', .18 + .025 * Math.sin(time * 3));
}

function platform(ctx, s, cx, vw, time) {
  if (!visible(s.x, s.w, cx, vw)) return;
  const age = s.age, x = s.x - cx;
  const shake = age > .2 && !s.collapsed ? Math.sin(time * 43) * Math.min(1.3, age * 2) : 0;
  if (s.collapsed) {
    if (age < 1.3) {
      ctx.globalAlpha = Math.max(0, 1 - (age - .8) * 2);
      sprite(ctx, 'bridge', x, s.y + (age - .8) * 130, s.w, (age - .8) * .2);
      ctx.globalAlpha = 1;
    }
    return;
  }
  if (s.kind === 'collapse' && age > .4) {
    ctx.save(); ctx.beginPath(); ctx.rect(x - 3, s.y, s.w / 2 + 2, 80); ctx.clip(); sprite(ctx, 'bridge', x - 1 + shake, s.y, s.w); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x + s.w / 2, s.y, s.w / 2 + 4, 80); ctx.clip(); sprite(ctx, 'bridge', x + 2 + shake, s.y + 1, s.w); ctx.restore();
  } else if (s.kind === 'static') tileSpan(ctx, 'tile', x, s.y, s.w);
  else sprite(ctx, 'bridge', x + shake, s.y, s.w);
  // The yellow warning band marks every non-static platform face.
  if (s.kind !== 'static') sprite(ctx, 'stripe', x + s.w / 2 - 14, s.y + 12, 28);
  if (s.kind === 'moving') {
    ctx.globalAlpha = .42;
    for (let y = 24; y < s.y; y += 31) sprite(ctx, 'support', x + s.w / 2 - 4, y, 8);
    ctx.globalAlpha = 1;
  }
  if (s.kind === 'collapse' && age > .2) { glow(ctx, x + s.w / 2, s.y, 24, '#ed9e35', .25); label(ctx, 'YEMIRILMOQDA!', x, s.y - 7, '#ffc580', 5); }
}

function fan(ctx, fan, cx, time) {
  const x = fan.x - cx, y = fan.y;
  ctx.globalAlpha = .85; sprite(ctx, 'fan', x, y, 88); ctx.globalAlpha = 1;
  const centerX = x + 39, centerY = y + 44;
  ctx.save(); ctx.beginPath(); ctx.ellipse(centerX, centerY, 18, 24, 0, 0, Math.PI * 2); ctx.clip();
  sprite(ctx, 'rotor', centerX - 20, centerY - 23.4, 40, time * (fan.on ? 4 : .14));
  ctx.restore();
  glow(ctx, centerX, centerY, 32, fan.on ? '#b7e984' : '#6c8b40', .16);
  label(ctx, fan.on ? 'VENT ON' : 'VENT OFF', x + 5, y - 5, fan.on ? '#b5ffc2' : '#f5be74', 5);
}

export function drawToxicWorld(ctx, vw, cx, gs) {
  const f = gs.toxic, time = f.time;
  for (const p of f.pools) pool(ctx, p, cx, time, vw);
  // Before rupture, the final bath is low and clearly visible below the platforms.
  pool(ctx, {x: 5504, y: f.chase.active ? f.chase.toxicY : 254, w: 896}, cx, time, vw);
  for (const x of [80, 1680, 4030, 4500, 5524]) {
    if (!visible(x, 180, cx, vw)) continue;
    const tank = x === 5524;
    ctx.globalAlpha = tank ? 1 : .75; sprite(ctx, tank ? 'poolTank' : 'barrelAssembly', x - cx, 74, tank ? 190 : 170); ctx.globalAlpha = 1;
    glow(ctx, x + 90 - cx, 129, 45, '#b5ef38', .18);
  }
  for (const s of f.surfaces) platform(ctx, s, cx, vw, time);
  for (const r of f.ramps) if (visible(r.x, r.w, cx, vw)) sprite(ctx, 'stairs', r.x - cx, r.y, r.w, 0, true);
  for (const h of f.drips) {
    if (!visible(h.x - 60, 100, cx, vw)) continue;
    sprite(ctx, 'pipe', h.x - 55 - cx, h.y - 20, 80); sprite(ctx, 'pipeLeg', h.x + 4 - cx, h.y, 16);
    if (h.warning) { glow(ctx, h.x - cx, h.y, 26, '#edc949', .35); label(ctx, 'ACID!', h.x - cx - 9, h.y - 25, '#ffd98a', 5); }
  }
  for (const h of f.sprays) {
    if (!visible(h.x - 60, h.w + 60, cx, vw)) continue;
    sprite(ctx, 'pipe', h.x - 56 - cx, h.y - 20, 80);
    if (h.mode === 'warning') { glow(ctx, h.x - cx, h.y + 7, 30, '#ffa533', .4); label(ctx, 'BOSIM!', h.x - cx, h.y - 24, '#ffcf80', 5); }
    if (h.mode === 'active') {
      ctx.save(); ctx.translate(h.x - cx, h.y + 15); ctx.rotate(-Math.PI / 2);
      sprite(ctx, 'stream', 0, 0, h.w * 126 / 620); ctx.restore();
      glow(ctx, h.x + h.w / 2 - cx, h.y, 42, '#bfff45', .24);
    }
  }
  for (const b of f.barrels) {
    if (!visible(b.x, 40, cx, vw)) continue;
    sprite(ctx, 'barrel', b.x - cx, b.y - 32.9, 28);
    if (b.mode === 'warning') { glow(ctx, b.x + 14 - cx, b.y - 12, 29, '#ef942f', .32); label(ctx, 'LEAK!', b.x - cx, b.y - 39, '#ffbc72', 5); }
    if (b.mode === 'leak') { sprite(ctx, 'leak', b.x - 10 - cx, b.y - 12, 40); glow(ctx, b.x + 10 - cx, b.y - 8, 30, '#c7ff51', .25); }
  }
  for (const d of f.debris) {
    if (!visible(d.x, 30, cx, vw)) continue;
    if (d.mode === 'warning') { label(ctx, '!', d.x - cx, 128, '#ffcf83', 10); glow(ctx, d.x + 7 - cx, 144, 18, '#faad4c', .15); }
    if (d.mode === 'warning' || d.mode === 'fall') sprite(ctx, 'debris', d.x - cx, d.drawY, 14, d.mode === 'fall' ? time : 0);
  }
  for (const item of f.fans) if (visible(item.x, 88, cx, vw)) fan(ctx, item, cx, time);
  const g = f.gas;
  if (visible(g.x, g.w, cx, vw)) {
    ctx.save(); ctx.beginPath(); ctx.rect(g.x - cx, 148, g.w, 82); ctx.clip();
    ctx.globalAlpha = g.density * .2;
    for (let x = Math.max(g.x - cx, -140); x < Math.min(g.x + g.w - cx, vw); x += 96) sprite(ctx, 'mist', x + Math.sin(time * .4) * 10, 162, 96);
    ctx.restore();
    label(ctx, 'GAZ: YUQORI YOLDAN OT!', g.x + 24 - cx, 58, '#c1e78b', 6);
  }
  for (const c of f.checkpoints) {
    if (!visible(c.x, 30, cx, vw)) continue;
    sprite(ctx, 'lamp', c.x - cx, c.y - 18, 18); glow(ctx, c.x + 9 - cx, c.y - 13, 28, c.active ? '#a8ffc6' : '#ffcf6f', .25);
    label(ctx, c.active ? 'SAQLANDI' : 'CHECKPOINT', c.x - cx - 14, c.y - 25, c.active ? '#c4ffd2' : '#ffdc99', 5);
  }
  for (const c of f.pickups) {
    if (!c.got && visible(c.x, 14, cx, vw)) { sprite(ctx, 'lamp', c.x - cx, c.y, 12); glow(ctx, c.x + 6 - cx, c.y + 4, 17, '#ebffcc', .3); }
  }
  const exit = f.exit;
  if (visible(exit.x, 72, cx, vw)) {
    sprite(ctx, 'door', exit.x - cx, exit.y - 8, 72); glow(ctx, exit.x + 36 - cx, exit.y + 40, 40, '#caf7c3', .22);
    label(ctx, 'CONTAINMENT EXIT', exit.x - cx - 13, exit.y - 16, '#d9ffd7', 6);
  }
  if (gs.p) drawBoy(ctx, gs.p, cx, gs.anim, gs);
  drawToxicFront(ctx, vw, cx, gs);
}

// Everything drawn in front of the player: acid drops, particles, foreground, labels and flash.
export function drawToxicFront(ctx, vw, cx, gs) {
  const f = gs.toxic, time = f.time, g = f.gas;
  ctx.fillStyle = '#d7ff57';
  for (const d of f.drops) {
    if (visible(d.x, 8, cx, vw)) { ctx.beginPath(); ctx.ellipse(d.x - cx, d.y, d.r * .7, d.r * 1.5, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  drawParticles(ctx, f.particles, {cx, visible: a => visible(a.x, a.r, cx, vw),
    isSoft: a => a.type === 'mist' || a.type === 'smoke', maxAlpha: a => a.type === 'mist' ? .16 : .7});
  ctx.globalAlpha = .22;
  const off = (cx * 1.08) % 420;
  for (let x = 410 - off; x < vw; x += 420) { sprite(ctx, 'chain', x + Math.sin(time * .5) * 2, 0, 6); sprite(ctx, 'pipeLeg', x + 70, 224, 22); }
  ctx.globalAlpha = 1;
  label(ctx, TOXIC_SECTIONS[f.section].name, 12, 29, '#d5f2b5', 7);
  if (gs.p.x < 180) {
    label(ctx, 'LEVEL 4 / TOXIC WASTE', 32 - cx, 139, '#d8ffab', 8);
    label(ctx, 'YORQIN SUYUQLIK: XATAR. SARIQ CHIZIQ: TAYANCH.', 32 - cx, 150, '#b7c2a9', 5);
  }
  if (g.warning) label(ctx, g.exposure >= 2.5 ? 'GAZ ZARAR YETKAZYAPTI!' : 'GAZ! YUQORIGA CHIQ!', vw / 2 - 64, 43, '#ffd088', 7);
  if (f.chase.active && gs.p.x >= 5504) label(ctx, f.chase.elapsed < 2 ? 'TANK BUZILDI! QOCH!' : 'QOCH! ZAHAR KOTARILMOQDA!', vw / 2 - 76, 43, '#f3ff91', 7);
  if (f.flash > 0) { ctx.globalAlpha = f.flash; ctx.fillStyle = '#caff70'; ctx.fillRect(0, 0, vw, 270); ctx.globalAlpha = 1; }
}
