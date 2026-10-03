import {cached} from './gfx.js';
import {clamp} from './utils.js';

// The hero is a red blob with big eyes (Bandage Girl is the same blob, smaller and pink), drawn in code: the body is painted once at 4x, while the eyes,
// squash-and-stretch, running bob and blinking are animated every frame from the player's state.
export const HERO_W = 20, HERO_H = 22;
const SCALE = 4;

const PALETTES = {
  red: {feet: '#6a0a16', outline: '#5a0812', light: '#ff5a6a', mid: '#dc1c34', dark: '#a00f22', speck: 'rgba(120,0,16,.35)', mouth: '#5a0812'},
  pink: {feet: '#a03266', outline: '#8a2a5a', light: '#ffd0e6', mid: '#ff86bc', dark: '#e0509a', speck: 'rgba(170,40,100,.3)', mouth: '#8a2a5a'}
};

function body(name) {
  const c = PALETTES[name];
  return cached('hero-body-' + name, HERO_W * SCALE, HERO_H * SCALE, g => {
    g.scale(SCALE, SCALE);
    // feet
    g.fillStyle = c.feet;
    for (const x of [6.5, 13.5]) { g.beginPath(); g.ellipse(x, 20, 3, 2, 0, 0, Math.PI * 2); g.fill(); }
    // outline, then the shaded body
    g.fillStyle = c.outline; g.beginPath(); g.ellipse(10, 11.5, 9.4, 9.6, 0, 0, Math.PI * 2); g.fill();
    const grad = g.createRadialGradient(7, 7, 1, 10, 12, 10);
    grad.addColorStop(0, c.light); grad.addColorStop(.55, c.mid); grad.addColorStop(1, c.dark);
    g.fillStyle = grad; g.beginPath(); g.ellipse(10, 11.5, 8.6, 8.8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(6.2, 6.2, 2.4, 1.4, -.6, 0, Math.PI * 2); g.fill();
    // a few glossy specks
    g.fillStyle = c.speck;
    for (const [x, y] of [[13, 16], [5, 15], [15, 9]]) { g.beginPath(); g.arc(x, y, .8, 0, Math.PI * 2); g.fill(); }
  });
}

// (x, y) is the top-left of the hitbox; the sprite is centred on it with the feet on its bottom edge.
// opts: {palette: 'red' | 'pink', scale, phase (shifts the blink timing)}.
export function drawHero(ctx, pl, x, y, anim, opts = {}) {
  const p = {vx: 0, vy: 0, onGround: true, face: 1, ...pl};
  const palette = PALETTES[opts.palette] || PALETTES.red, k = opts.scale ?? 1, t = anim + (opts.phase ?? 0);
  const air = !p.onGround, breathe = !air && Math.abs(p.vx) <= .5 ? Math.sin(t * .07) * .025 : 0;
  const stretch = (air ? clamp(1 + Math.abs(p.vy) * .03, 1, 1.2) : 1) + breathe;
  const bob = !air && Math.abs(p.vx) > .5 ? Math.sin(anim * .55) * .9 : 0;
  const squashX = air ? 1 / Math.sqrt(stretch) : 1 + (bob < 0 ? -bob * .06 : 0);
  const face = p.face < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(Math.round(x + p.w / 2), Math.round(y + p.h));
  ctx.rotate(clamp(p.vx, -2.4, 2.4) * .035);
  ctx.scale(k, k);
  ctx.scale(squashX * face, stretch - Math.abs(bob) * .02);
  ctx.translate(-HERO_W / 2, -HERO_H + bob);
  const sprite = body(opts.palette in PALETTES ? opts.palette : 'red');
  if (sprite) ctx.drawImage(sprite, 0, 0, HERO_W, HERO_H);
  else { ctx.fillStyle = '#d3172c'; ctx.beginPath(); ctx.arc(10, 12, 9, 0, Math.PI * 2); ctx.fill(); }
  // eyes: wider in the air, blinking now and then, pupils lead the direction of travel
  const blink = t % 220 < 6, lookY = clamp(p.vy * .25, -1, 1), lookX = clamp(p.vx * .35, -1, 1) * face;
  for (const ex of [6.6, 13.2]) {
    const r = air ? 3.5 : 3.1;
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    if (blink) ctx.ellipse(ex, 10, r, .7, 0, 0, Math.PI * 2); else ctx.ellipse(ex, 10, r, r * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#16101e'; ctx.beginPath(); ctx.arc(ex + .8 + lookX * 1.1, 10.2 + lookY, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex + .5 + lookX * 1.1, 9.2 + lookY, .8, .8);
    }
  }
  // mouth: a small grin that opens when jumping or falling fast
  ctx.strokeStyle = palette.mouth; ctx.lineWidth = .9; ctx.beginPath();
  if (air && Math.abs(p.vy) > 2) ctx.ellipse(10, 16, 1.6, 1.3, 0, 0, Math.PI * 2); else { ctx.moveTo(8, 15.5); ctx.quadraticCurveTo(10, 17, 12, 15.5); }
  ctx.stroke();
  ctx.restore();
}
