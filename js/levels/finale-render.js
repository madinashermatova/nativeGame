import {T} from '../config.js';
import {solid} from '../world.js';
import {R, cached, makeCanvas, glow, softDot, drawParticles} from '../gfx.js';
import {drawBoy, drawGirl} from '../renderer.js';
import {FINALE, FINALE_SECTIONS, bossPhase} from './finale.js';

// Level 10: a ruined iron fortress. Tiles are baked once; the boss, traps and cage are drawn in code.
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const GOLD = '#ffd060', EMBER = '#ff7a2a', STEEL = '#8a92a8';

function paintTile(g, kind, v) {
  const r = rng(v * 719 + kind.charCodeAt(0));
  g.fillStyle = '#120a10'; g.fillRect(0, 0, T, T);
  g.fillStyle = '#241622'; g.fillRect(1, 1, T - 2, T - 2);
  g.fillStyle = '#34202e'; g.fillRect(1, 1, T - 2, 1);
  g.fillStyle = '#0a0509'; g.fillRect(1, T - 2, T - 2, 1);
  if (r() < .45) { g.fillStyle = 'rgba(255,100,40,.5)'; const x = 3 + Math.floor(r() * 9); g.fillRect(x, 3, 1, 3); g.fillRect(x + 1, 6, 1, 4); }
  g.fillStyle = '#4a3040'; g.fillRect(2, 2, 1, 1); g.fillRect(T - 3, T - 3, 1, 1);
  if (kind === 'cap') { g.fillStyle = '#6a4a58'; g.fillRect(0, 0, T, 3); g.fillStyle = '#8a6678'; g.fillRect(0, 0, T, 1); g.fillStyle = '#ff8a40'; if (r() < .4) g.fillRect(Math.floor(r() * 12), 3, 3, 1); }
  else if (kind === 'ceil') { g.fillStyle = '#080406'; g.fillRect(0, T - 3, T, 3); }
}
const tileCanvas = (kind, v) => cached(`finale-${kind}-${v}`, T, T, g => paintTile(g, kind, v));

function drawTiles(ctx, vw, cx) {
  const c0 = Math.max(0, Math.floor(cx / T)), c1 = Math.min(FINALE.cols - 1, Math.ceil((cx + vw) / T));
  for (let r = 0; r < FINALE.rows; r++) for (let c = c0; c <= c1; c++) {
    if (!solid(c, r)) continue;
    const kind = !solid(c, r - 1) ? 'cap' : !solid(c, r + 1) ? 'ceil' : 'panel';
    const tile = tileCanvas(kind, hash(c, r) % 5), x = c * T - cx, y = r * T;
    if (tile) ctx.drawImage(tile, x, y); else R(ctx, x, y, T, T, '#241622');
  }
}

export function drawFinaleBackground(ctx, vw, cx, gs) {
  const f = gs.finale, time = f ? f.time : 0, rage = f && f.boss.active && !f.boss.dead ? .4 + bossPhase(f) * .2 : 0;
  const grad = ctx.createLinearGradient(0, 0, 0, 270);
  grad.addColorStop(0, '#07040a'); grad.addColorStop(1, `rgb(${34 + rage * 40 | 0},8,16)`);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, vw, 270);
  // Tall stained-glass windows with a lava-lit glow.
  const step = 200, far = cx * .2;
  for (let i = -1; (i + 1) * step - (far % step) < vw + step; i++) {
    const x = i * step - (far % step) + 50, idx = Math.floor(far / step) + i, h = hash(idx);
    ctx.fillStyle = '#0c060c'; ctx.beginPath(); ctx.moveTo(x - 4, 200); ctx.lineTo(x - 4, 60); ctx.arc(x + 24, 60, 28, Math.PI, 0); ctx.lineTo(x + 52, 200); ctx.fill();
    ctx.fillStyle = `hsla(${h % 40},90%,${30 + rage * 20}%,${.25 + .1 * Math.sin(time * 2 + idx)})`;
    ctx.beginPath(); ctx.moveTo(x, 198); ctx.lineTo(x, 60); ctx.arc(x + 24, 60, 24, Math.PI, 0); ctx.lineTo(x + 48, 198); ctx.fill();
    ctx.fillStyle = '#0c060c'; ctx.fillRect(x + 22, 36, 4, 164); ctx.fillRect(x, 110, 48, 3);
  }
  for (let i = 0; i < 5; i++) glow(ctx, ((i * 123 + time * 6 - cx * .4) % (vw + 160) + vw + 160) % (vw + 160) - 60, 238, 70, '#7a2018', .08);
}

// ---------- traps ----------
function drawSpikes(ctx, f, cx, time) {
  ctx.fillStyle = '#c8cbe0';
  for (const s of f.spikes) {
    const x = s.x - cx; if (x < -20 || x > 500) continue;
    ctx.beginPath(); ctx.moveTo(x, s.y + s.h); ctx.lineTo(x + s.w / 2, s.y); ctx.lineTo(x + s.w, s.y + s.h); ctx.fill();
    glow(ctx, x + 6, s.y + 5, 12, '#ff3040', .18 + .08 * Math.sin(time * 4 + s.x));
  }
}
function drawPits(ctx, f, cx, vw, time) {
  for (const p of f.pits) {
    const x = p.x - cx; if (x > vw + 10 || x + p.w < -10) continue;
    ctx.fillStyle = '#3a0a04'; ctx.fillRect(x, p.y - 12, p.w, 32);
    ctx.fillStyle = '#ff6a14'; ctx.beginPath(); ctx.moveTo(x, p.y + 20);
    for (let k = 0; k <= p.w; k += 6) ctx.lineTo(x + k, p.y - 12 + Math.sin(k * .25 + time * 3) * 1.5);
    ctx.lineTo(x + p.w, p.y + 20); ctx.fill();
    glow(ctx, x + p.w / 2, p.y - 12, p.w * .8, EMBER, .35);
  }
}
function drawVents(ctx, f, cx, time) {
  for (const h of f.vents) {
    const x = h.x - cx; if (x < -30 || x > 510) continue;
    R(ctx, x - 1, FINALE.floor - 3, h.w + 2, 3, '#1a1014'); for (let k = 0; k < 4; k++) R(ctx, x + 2 + k * 5, FINALE.floor - 3, 2, 3, EMBER);
    if (h.mode === 'warning') glow(ctx, x + 10, FINALE.floor - 6, 24, '#ff3020', .3 + .2 * Math.sin(time * 30));
    else if (h.mode === 'active') {
      for (const [c, k] of [['#ff5a10', 1], ['#ffb02e', .65], ['#fff2a0', .3]]) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 10 - 9 * k, FINALE.floor - 3);
        ctx.quadraticCurveTo(x + 10 - 7 * k, FINALE.floor - 30, x + 10 + Math.sin(time * 20) * 3, FINALE.floor - h.h * (k === 1 ? 1 : .8 * k + .2));
        ctx.quadraticCurveTo(x + 10 + 7 * k, FINALE.floor - 30, x + 10 + 9 * k, FINALE.floor - 3); ctx.fill();
      }
      glow(ctx, x + 10, FINALE.floor - 28, 44, EMBER, .4);
    }
  }
}
function drawSaws(ctx, f, cx) {
  for (const s of f.saws) {
    const x = s.x - cx; if (x < -40 || x > 520) continue;
    R(ctx, s.cx - s.range - cx, s.y - 1, s.range * 2, 2, '#3a2a34');
    ctx.save(); ctx.translate(x, s.y); ctx.rotate(s.angle);
    ctx.fillStyle = '#d0d4e8'; ctx.beginPath();
    for (let k = 0; k < 16; k++) { const rr = k % 2 ? s.r - 2.5 : s.r + 1.5, a = k * Math.PI / 8; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a1824'; ctx.beginPath(); ctx.arc(0, 0, s.r * .5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
function drawDrops(ctx, f, cx, time) {
  for (const d of f.drops) {
    const x = d.x - cx; if (x < -20 || x > 500) continue;
    if (d.state === 'broken') { for (let i = 0; i < 5; i++) R(ctx, x - 12 + i * 5, 220, 4, 4, '#5a4050'); continue; }
    const y = d.state === 'fall' ? d.y : FINALE.ceiling, sh = d.state === 'warn' ? Math.sin(time * 60) : 0;
    ctx.fillStyle = '#6a4a5a'; ctx.beginPath(); ctx.moveTo(x - 7 + sh, y); ctx.lineTo(x + sh, y + 22); ctx.lineTo(x + 7 + sh, y); ctx.fill();
    if (d.state === 'warn') glow(ctx, x, 54, 16, '#ff3040', .4);
  }
}

// ---------- the boss ----------
function drawBoss(ctx, f, cx, time) {
  const b = f.boss, x = b.x - cx;
  if (x < -120 || x > 600) return;
  const hover = Math.sin(time * 1.6) * 4, y = b.y + hover + (b.dead ? Math.min(150, b.deadT * 60) : 0);
  const damage = 3 - b.hp, stun = b.state === 'stunned';
  const shake = b.state === 'intro' ? Math.sin(time * 70) * 1.5 : stun ? Math.sin(time * 90) * 2 : 0;
  ctx.save(); ctx.translate(x + shake, y);
  if (b.dead) ctx.rotate(Math.min(.6, b.deadT * .25));
  // chains to the ceiling
  ctx.strokeStyle = '#2a1a26'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
  for (const dx of [-34, 34]) { ctx.beginPath(); ctx.moveTo(dx, -30); ctx.lineTo(dx * 1.3, -y + 32); ctx.stroke(); }
  ctx.setLineDash([]);
  // horns and head
  ctx.fillStyle = '#3a2430'; ctx.beginPath(); ctx.moveTo(-46, -22); ctx.lineTo(-62, -52); ctx.lineTo(-30, -34); ctx.fill();
  ctx.beginPath(); ctx.moveTo(46, -22); ctx.lineTo(62, -52); ctx.lineTo(30, -34); ctx.fill();
  const head = ctx.createLinearGradient(0, -34, 0, 34);
  head.addColorStop(0, '#5a3c4c'); head.addColorStop(1, '#2a1822');
  ctx.fillStyle = head; ctx.beginPath(); ctx.moveTo(-48, -20); ctx.lineTo(-38, -34); ctx.lineTo(38, -34); ctx.lineTo(48, -20); ctx.lineTo(42, 22); ctx.lineTo(20, 34); ctx.lineTo(-20, 34); ctx.lineTo(-42, 22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6678'; ctx.lineWidth = 1.5; ctx.stroke();
  for (let k = 0; k < damage; k++) { // cracks glow as it takes damage
    ctx.strokeStyle = `rgba(255,${120 + k * 40},40,.9)`; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(-30 + k * 28, -30); ctx.lineTo(-24 + k * 28, -10); ctx.lineTo(-34 + k * 28, 6); ctx.lineTo(-26 + k * 28, 22); ctx.stroke();
  }
  // eyes track the player
  const look = b.look * 4, angry = b.state === 'attack' || b.state === 'intro';
  for (const ex of [-20, 20]) {
    R(ctx, ex - 9, -14, 18, 10, '#0a0408');
    ctx.fillStyle = stun ? '#6a6a80' : angry ? '#ff3020' : '#ffb040'; ctx.fillRect(ex - 6 + look, -12, 12, 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(ex - 1 + look, -11, 3, 3);
    if (!stun && !b.dead) glow(ctx, ex + look, -9, 26, '#ff3020', .55);
  }
  // jaw
  const open = b.state === 'attack' ? 4 + (b.mouth > 0 ? 7 : 0) : b.state === 'intro' ? 12 : stun ? 2 : 3;
  ctx.fillStyle = '#0a0408'; ctx.fillRect(-24, 10, 48, 6 + open);
  ctx.fillStyle = '#e8e0d0'; for (let k = 0; k < 8; k++) { ctx.fillRect(-23 + k * 6, 10, 3, 5); ctx.fillRect(-20 + k * 6, 10 + 6 + open - 5, 3, 5); }
  if (b.mouth > 0) glow(ctx, 0, 18, 36, EMBER, .6);
  ctx.restore();
  if (stun) { for (let k = 0; k < 3; k++) { const a = time * 4 + k * 2.09; ctx.fillStyle = GOLD; ctx.fillRect(x + Math.cos(a) * 36, y - 48 + Math.sin(a) * 6, 4, 4); } }
}

function drawAttacks(ctx, f, cx, time) {
  for (const b of f.fireballs) {
    const x = b.x - cx;
    if (b.state === 'warn') {
      const k = b.t / .9;
      ctx.strokeStyle = `rgba(255,${60 + 100 * (1 - k) | 0},40,${.5 + .4 * Math.sin(time * 24)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, FINALE.floor - 2, 18 - k * 6, 5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,50,30,${.08 + .08 * k})`; ctx.fillRect(x - 6, FINALE.ceiling, 12, FINALE.floor - FINALE.ceiling);
    } else {
      for (let k = 1; k < 5; k++) { ctx.globalAlpha = .4 - k * .08; R(ctx, x - 4, b.y - 7 - k * 9, 8, 8, EMBER); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ff8a20'; ctx.beginPath(); ctx.arc(x, b.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(x, b.y, 3.5, 0, Math.PI * 2); ctx.fill();
      glow(ctx, x, b.y, 30, EMBER, .6);
    }
  }
  for (const bl of f.blasts) { glow(ctx, bl.x - cx, FINALE.floor - 8, 40, '#ffb040', .8 * (1 - bl.t / .3)); R(ctx, bl.x - cx - 18, FINALE.floor - 14, 36, 14, `rgba(255,150,40,${.7 * (1 - bl.t / .3)})`); }
  for (const w of f.waves) {
    const x = w.x - cx;
    ctx.fillStyle = '#ff5030'; ctx.beginPath(); ctx.moveTo(x - 8, FINALE.floor); ctx.lineTo(x + w.dir * 4, FINALE.floor - 16); ctx.lineTo(x + 8, FINALE.floor); ctx.fill();
    glow(ctx, x, FINALE.floor - 6, 26, '#ff5030', .5);
  }
  for (const bm of f.beams) {
    const x0 = FINALE.arenaX - cx, w = FINALE.arenaEnd - FINALE.arenaX;
    if (bm.state === 'warn') {
      ctx.fillStyle = Math.floor(time * 18) % 2 ? 'rgba(255,60,50,.9)' : 'rgba(255,60,50,.25)';
      for (let x = x0; x < x0 + w; x += 10) ctx.fillRect(x, bm.y + 6, 5, 2);
      ctx.fillStyle = '#ff3020'; ctx.fillRect(x0 - 6, bm.y, 6, bm.h);
    } else {
      ctx.fillStyle = 'rgba(255,60,50,.45)'; ctx.fillRect(x0, bm.y - 3, w, bm.h + 6);
      ctx.fillStyle = '#fff0f0'; ctx.fillRect(x0, bm.y + 3, w, bm.h - 6);
      glow(ctx, x0 + w / 2, bm.y + 7, 200, '#ff3020', .3);
    }
  }
}

function drawButtons(ctx, f, cx, time) {
  for (const btn of f.buttons) {
    const x = btn.x - cx, down = btn.press * 3, col = btn.state === 'ready' ? '#40ff90' : btn.state === 'pressed' ? '#ffd060' : '#4a4a58';
    R(ctx, x - 2, FINALE.floor - 4, btn.w + 4, 4, '#1a1218');
    R(ctx, x + 2, FINALE.floor - 8 + down, btn.w - 4, 4 - down * .5, col);
    ctx.fillStyle = col; ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(btn.index + 1), x + btn.w / 2, FINALE.floor - 14);
    if (btn.state === 'ready') {
      const bob = Math.sin(time * 5) * 2;
      ctx.beginPath(); ctx.moveTo(x + btn.w / 2 - 4, FINALE.floor - 30 + bob); ctx.lineTo(x + btn.w / 2 + 4, FINALE.floor - 30 + bob); ctx.lineTo(x + btn.w / 2, FINALE.floor - 24 + bob); ctx.fill();
      glow(ctx, x + btn.w / 2, FINALE.floor - 8, 34, col, .5 + .2 * Math.sin(time * 5));
    }
  }
}

function drawBarrier(ctx, f, cx, time) {
  if (!f.boss.active || f.boss.dead) return;
  const next = f.buttons.find(b => b.state !== 'pressed');
  if (!next) return;
  const x = next.x + next.w + 8 - cx;
  const grad = ctx.createLinearGradient(x, 0, x + 10, 0);
  grad.addColorStop(0, `rgba(255,80,200,${.45 + .15 * Math.sin(time * 8)})`); grad.addColorStop(1, 'rgba(255,80,200,0)');
  ctx.fillStyle = grad; ctx.fillRect(x, FINALE.ceiling, 10, FINALE.floor - FINALE.ceiling);
  for (let y = FINALE.ceiling + ((time * 40) % 24); y < FINALE.floor; y += 24) R(ctx, x, y, 2, 6, '#ffb0f0');
  R(ctx, x - 1, FINALE.ceiling, 2, FINALE.floor - FINALE.ceiling, '#ff60d0');
}

function drawGirlCage(ctx, f, cx, gs, time) {
  const g = f.girl, x = g.x - cx;
  if (x < -60 || x > 560) return;
  drawGirl(ctx, g.x, g.y + 15, cx, gs.anim); // her feet rest on the cage floor
  if (g.freed) { // the cage flies open
    const t = Math.min(1, g.t * 1.5);
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = STEEL; ctx.lineWidth = 2; ctx.strokeRect(x - 10, g.y - 22 - t * 20, 36, 52);
    ctx.globalAlpha = 1;
    glow(ctx, x + 8, g.y + 10, 70, '#ffd0e8', .5 + .2 * Math.sin(time * 4));
  } else {
    ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
    ctx.strokeRect(x - 10, g.y - 22, 36, 52);
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 10 + k * 9, g.y - 22); ctx.lineTo(x - 10 + k * 9, g.y + 30); ctx.stroke(); }
    R(ctx, x - 12, g.y - 26, 40, 5, '#4a3a48');
    glow(ctx, x + 8, g.y + 6, 40, '#ff80b0', .25);
  }
}

function drawCheckpoints(ctx, f, cx, time) {
  for (const c of f.checkpoints) {
    const x = c.x + 6 - cx, y = c.y + 14;
    R(ctx, x - 1, y - 10, 2, 10, '#4a3a48'); R(ctx, x - 5, y - 12, 10, 3, '#6a5060');
    if (c.active) { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x, y - 16, 3 + Math.sin(time * 6) * .6, 0, Math.PI * 2); ctx.fill(); glow(ctx, x, y - 16, 30, GOLD, .5); }
  }
}

function sign(ctx, text, wx, y, cx) {
  const w = text.length * 3.4 + 8, x = wx - cx;
  R(ctx, x - 1, y - 1, w + 2, 12, '#ff7a2a'); R(ctx, x, y, w, 10, '#140a10');
  ctx.font = '5px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe0b0'; ctx.fillText(text, x + 4, y + 7);
}

let darkLayer = null;
function drawDarkness(ctx, vw, cx, gs, f) {
  if (typeof document === 'undefined') return;
  if (!darkLayer || darkLayer.width !== Math.ceil(vw)) darkLayer = makeCanvas(vw, 270);
  const g = darkLayer.getContext('2d'), p = gs.p;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.clearRect(0, 0, darkLayer.width, 270);
  g.fillStyle = `rgba(4,2,6,${f.boss.active ? .5 - f.flash * .3 : .62})`; g.fillRect(0, 0, darkLayer.width, 270);
  g.globalCompositeOperation = 'destination-out';
  const light = (x, y, r, a) => { if (x < -r || x > vw + r) return; g.globalAlpha = a; softDot(g, x, y, r, '#ffffff'); };
  light(p.x + 6 - cx, p.y + 6, 90, 1);
  for (const pit of f.pits) light(pit.x + pit.w / 2 - cx, pit.y - 8, pit.w * .8, .9);
  for (const c of f.checkpoints) if (c.active) light(c.x + 6 - cx, c.y, 50, .8);
  if (f.boss.active) { light(f.boss.x - cx, f.boss.y + 10, 170, 1); for (const b of f.buttons) light(b.x + 14 - cx, FINALE.floor - 8, 50, .9); }
  for (const bl of f.fireballs) if (bl.state === 'fall') light(bl.x - cx, bl.y, 50, 1);
  light(f.girl.x + 8 - cx, f.girl.y + 6, 60, .9);
  for (let x = 6 * T; x < FINALE.width; x += 14 * T) light(x - cx, 200, 70, .7);
  g.globalAlpha = 1;
  ctx.drawImage(darkLayer, 0, 0);
}

export function drawFinaleWorld(ctx, vw, cx, gs) {
  const f = gs.finale;
  if (!f) return;
  const time = f.time, rcx = Math.round(cx);
  drawTiles(ctx, vw, rcx);
  for (let x = 6 * T; x < FINALE.width; x += 14 * T) { // wall torches
    const sx = x - rcx; if (sx < -20 || sx > vw + 20) continue;
    R(ctx, sx - 1, 206, 2, 18, '#3a2a30'); R(ctx, sx - 4, 202, 8, 4, '#5a4650');
    glow(ctx, sx, 196, 36, EMBER, .5 + .1 * Math.sin(time * 12 + x));
    ctx.fillStyle = '#ff9a30'; ctx.beginPath(); ctx.moveTo(sx - 3, 202); ctx.quadraticCurveTo(sx, 186 + Math.sin(time * 14 + x) * 2, sx + 3, 202); ctx.fill();
  }
  drawPits(ctx, f, rcx, vw, time);
  drawSpikes(ctx, f, rcx, time);
  drawVents(ctx, f, rcx, time);
  sign(ctx, "O'LIM TUZOQLARI - YAKUNIY SINOV", 120, 130, rcx);
  sign(ctx, "TUGMALARNI 1-2-3 TARTIBDA BOS!", 1200, 100, rcx);
  drawSaws(ctx, f, rcx);
  drawDrops(ctx, f, rcx, time);
  drawCheckpoints(ctx, f, rcx, time);
  drawButtons(ctx, f, rcx, time);
  drawBarrier(ctx, f, rcx, time);
  drawGirlCage(ctx, f, rcx, gs, time);
  drawBoss(ctx, f, rcx, time);
  drawBoy(ctx, gs.p, rcx, gs.anim, gs);
  drawDarkness(ctx, vw, rcx, gs, f);
  drawAttacks(ctx, f, rcx, time);
  drawParticles(ctx, f.particles, {
    cx: rcx, visible: a => a.x > rcx - 20 && a.x < rcx + vw + 20,
    isSoft: () => false, maxAlpha: () => .9, color: a => a.color || (a.type === 'ember' ? EMBER : a.type === 'spark' ? GOLD : '#5a4050')
  });
  if (f.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${f.flash * .4})`; ctx.fillRect(0, 0, vw, 270); }

  // Boss health, shown while the fight is on.
  if (f.boss.active && !f.boss.dead) {
    ctx.textAlign = 'center'; ctx.font = '6px monospace'; ctx.fillStyle = '#ffe0b0';
    ctx.fillText("TEMIR XO'JAYIN", vw / 2, 28);
    for (let i = 0; i < 3; i++) R(ctx, vw / 2 - 28 + i * 20, 32, 16, 5, i < f.boss.hp ? '#ff3040' : '#3a2a30');
  }
  if (f.sectionTime < 3.2) {
    const a = Math.min(1, f.sectionTime * 2, (3.2 - f.sectionTime) * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(FINALE_SECTIONS[f.section].name, vw / 2 + 1, 51);
    ctx.fillStyle = GOLD; ctx.fillText(FINALE_SECTIONS[f.section].name, vw / 2, 50);
    ctx.restore();
  }
}
