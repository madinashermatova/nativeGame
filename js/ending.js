import {beep} from './audio.js';
import {R} from './gfx.js';
import {drawBoy, drawGirl} from './renderer.js';

// The victory screen: sunrise over the hill, fireworks, the two heroes together, the player's stats,
// a growing checklist of all ten levels and a looping fanfare. Everything is derived from gs.anim
// (60 ticks per second), so no extra state is needed besides the start tick.
const FONT = '"Press Start 2P", "Courier New", monospace';
const hash = n => { let h = (n * 374761393) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export function startEnding(gs) {
  gs.endingT0 = gs.anim;
  gs.endingStep = -1;
  gs.endingBurst = -1;
}

const secs = gs => (gs.anim - (gs.endingT0 ?? gs.anim)) / 60;

// ---- sound: a 4-chord loop (C, Am, F, G) in 16th-note steps plus fireworks pops ----
const CHORDS = [[262, 330, 392, 523], [220, 262, 330, 440], [175, 220, 262, 349], [196, 247, 294, 392]];
const MELODY = [0, 2, 3, 2, 1, 3, 2, 1, 0, 2, 3, 3, 2, 1, 2, 0];

export function tickEnding(gs) {
  if (gs.endingT0 === undefined) return;
  const step = Math.floor(secs(gs) / .2);
  if (step !== gs.endingStep) {
    gs.endingStep = step;
    const bar = Math.floor(step / 8) % CHORDS.length, i = step % 8, chord = CHORDS[bar];
    if (step === 0) { // opening fanfare
      [523, 659, 784, 1047].forEach((f, k) => { beep(f, f, .28, 'triangle', .06, k * .13); beep(f * 1.5, f * 1.5, .22, 'square', .02, k * .13); });
      beep(131, 98, 1.2, 'sawtooth', .05);
    }
    if (i % 4 === 0) beep(chord[0] / 2, chord[0] / 2, .7, 'sine', .07);
    beep(chord[MELODY[(step * 2) % 16] % 4] * 2, chord[MELODY[(step * 2) % 16] % 4] * 2, .22, 'triangle', .035);
    if (i % 2 === 1) beep(chord[(i >> 1) % 4], chord[(i >> 1) % 4], .3, 'sine', .025);
  }
  const burst = Math.floor(secs(gs) / .75);
  if (burst !== gs.endingBurst && burst >= 1) { // pop and crackle, in time with the fireworks
    gs.endingBurst = burst;
    beep(900, 120, .25, 'sawtooth', .025);
    for (let k = 0; k < 4; k++) beep(2000 + hash(burst * 5 + k) * 3000, 600, .05, 'square', .01, .12 + k * .05);
  }
}

function fireworks(ctx, VW, t) {
  const PERIOD = .75;
  for (let k = 0; k < 4; k++) {
    const idx = Math.floor(t / PERIOD) - k;
    if (idx < 1) continue;
    const age = t - idx * PERIOD;
    if (age > 2.2) continue;
    const cx = VW * (.1 + .8 * hash(idx)), cy = 28 + hash(idx + 99) * 90, hue = Math.floor(hash(idx + 7) * 360);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + hash(idx + i) * .3, sp = 40 + hash(idx * 3 + i) * 30;
      const x = cx + Math.cos(a) * sp * age * .8, y = cy + Math.sin(a) * sp * age * .8 + 28 * age * age;
      ctx.globalAlpha = Math.max(0, 1 - age / 2.2);
      ctx.fillStyle = `hsl(${hue + (i % 3) * 20},100%,${70 - age * 12}%)`;
      ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      if (age < .5) { ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(cx), Math.round(cy), 3, 3); }
    }
  }
  ctx.globalAlpha = 1;
}

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillText(str, x + 1.5, y + 1.5);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}

export function drawEnding(ctx, VW, VH, gs) {
  const t = secs(gs), dawn = ease(t / 7);
  ctx.save();
  // Sky: from midnight blue to a warm sunrise.
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  const mixc = (a, b) => Math.round(a + (b - a) * dawn);
  sky.addColorStop(0, `rgb(${mixc(8, 40)},${mixc(10, 30)},${mixc(32, 90)})`);
  sky.addColorStop(.6, `rgb(${mixc(24, 220)},${mixc(18, 110)},${mixc(60, 120)})`);
  sky.addColorStop(1, `rgb(${mixc(40, 255)},${mixc(24, 190)},${mixc(70, 110)})`);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);
  // Stars fade as the sun rises.
  ctx.globalAlpha = 1 - dawn;
  for (let i = 0; i < 70; i++) { const tw = .4 + .6 * Math.abs(Math.sin(gs.anim * .03 + i)); ctx.globalAlpha = (1 - dawn) * tw; R(ctx, hash(i) * VW, hash(i + 50) * 150, 1, 1, '#fff'); }
  ctx.globalAlpha = 1;
  const sunY = VH - 70 - dawn * 70;
  const halo = ctx.createRadialGradient(VW / 2, sunY, 4, VW / 2, sunY, 120);
  halo.addColorStop(0, 'rgba(255,240,180,.9)'); halo.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.arc(VW / 2, sunY, 18, 0, Math.PI * 2); ctx.fill();

  fireworks(ctx, VW, t);

  // Hills and the two heroes.
  ctx.fillStyle = '#1a2a3a';
  ctx.beginPath(); ctx.moveTo(0, VH); for (let x = 0; x <= VW; x += 8) ctx.lineTo(x, 214 + Math.sin(x * .02 + 1) * 8); ctx.lineTo(VW, VH); ctx.fill();
  ctx.fillStyle = '#0e1a26';
  ctx.beginPath(); ctx.moveTo(0, VH); for (let x = 0; x <= VW; x += 8) ctx.lineTo(x, 232 + Math.sin(x * .03 + 3) * 6 - (x > VW / 2 - 50 && x < VW / 2 + 50 ? 12 : 0)); ctx.lineTo(VW, VH); ctx.fill();
  const hop = Math.abs(Math.sin(gs.anim * .08)) * 4;
  const fakeGs = {bloodParticles: [], camY: 0};
  drawBoy(ctx, {x: VW / 2 - 16, y: 208 - hop, w: 12, h: 14, face: 1, inv: 0, gravDir: 1}, 0, gs.anim, fakeGs);
  drawGirl(ctx, VW / 2 + 14, 205 - hop * .6, 0, gs.anim);
  for (let i = 0; i < 6; i++) { // hearts drifting up
    const age = ((gs.anim * .012 + i / 6) % 1), x = VW / 2 - 6 + Math.sin(age * 8 + i) * 14, y = 196 - age * 70;
    ctx.globalAlpha = 1 - age; ctx.fillStyle = '#ff6a9b';
    ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3); ctx.fillRect(x + 1, y + 3, 5, 2); ctx.fillRect(x + 2, y + 5, 3, 1);
  }
  ctx.globalAlpha = 1;

  // Title and stats appear one after another.
  const show = (at, fn) => { const a = ease((t - at) / .6); if (a > 0) { ctx.globalAlpha = a; fn(a); ctx.globalAlpha = 1; } };
  show(.4, a => text(ctx, 'TABRIKLAYMIZ!', VW / 2, 34 - (1 - a) * 10, 18 + Math.sin(gs.anim * .1) * .8, '#ffd23f'));
  show(1.6, () => text(ctx, 'BANDAGE GIRL QUTQARILDI!', VW / 2, 60, 8, '#fff4f8'));
  show(2.6, () => text(ctx, `BARCHA ${gs.levelNames?.length ?? 10} TA LEVEL YAKUNLANDI`, VW / 2, 76, 7, '#c8ffd8'));
  show(3.6, () => text(ctx, `JAMI OLIMLAR: ${gs.deaths}`, VW / 2 - 70, 96, 7, '#ff8a8a'));
  show(4.2, () => text(ctx, `RUHLAR: ${gs.coinCount}`, VW / 2 + 70, 96, 7, '#8affc8'));

  // The list of conquered levels ticks in two columns.
  const names = gs.levelNames || [];
  names.forEach((name, i) => {
    const col = i < 5 ? 0 : 1, row = i % 5, at = 5 + i * .25;
    if (t < at) return;
    const x = VW / 2 + (col ? 8 : -150), y = 118 + row * 11;
    ctx.globalAlpha = ease((t - at) / .3);
    ctx.strokeStyle = '#7aff9a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2.5, y + 3); ctx.lineTo(x + 7, y - 4); ctx.stroke();
    text(ctx, `${i + 1}. ${name}`, x + 10, y, 5, '#ffe9b8', 'left');
    ctx.globalAlpha = 1;
  });
  show(8.5, () => text(ctx, "O'YINNI O'YNAGANINGIZ UCHUN RAHMAT!", VW / 2, 180, 6, '#ffffff'));
  if (t > 9 && Math.floor(gs.anim / 30) % 2 === 0) text(ctx, 'ENTER - QAYTA BOSHLASH', VW / 2, 252, 7, '#ffd23f');
  ctx.restore();
}
