import {drawForestScene} from './scenery.js';
import {cached, R} from './gfx.js';

// The main menu backdrop: the dusk pine forest from scenery.js drifting slowly, with a grass-and-brick
// strip along the bottom. It replaces the old sky/cloud/land PNG layers.
const W = 480, H = 270, GROUND = 24;
const canvas = document.getElementById('menu-art');
const menu = document.getElementById('menu');

function ground(ctx, scroll) {
  const strip = cached('menu-ground', 96, GROUND, g => {
    R(g, 0, 0, 96, GROUND, '#8a4a30');
    for (let row = 0; row < 3; row++) for (let x = (row % 2) * 8 - 8; x < 96; x += 16) {
      R(g, x, 6 + row * 6, 15, 5, ['#a85a3a', '#9a5034', '#b0643e'][(x / 16 + row) & 1 ? 0 : row]);
      R(g, x, 6 + row * 6, 15, 1, 'rgba(255,200,150,.25)');
    }
    R(g, 0, 0, 96, 5, '#5aa83a'); R(g, 0, 0, 96, 2, '#92d44a');
    for (let x = 0; x < 96; x += 3) R(g, x, 5 + (x % 7 === 0 ? 1 : 0), 2, 1, '#3f8a2c');
  });
  if (!strip) return;
  const x0 = -(((scroll * 4) % 96) + 96) % 96;
  for (let x = x0; x < W; x += 96) ctx.drawImage(strip, Math.round(x), H - GROUND, 96, GROUND);
}

if (canvas && menu) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let last = 0;
  const frame = now => {
    requestAnimationFrame(frame);
    if (menu.style.display === 'none' || menu.style.opacity === '0' || now - last < 33) return; // ~30 fps, only while visible
    last = now;
    const t = now / 1000;
    drawForestScene(ctx, W, H, t * 6, t, 'dusk', {near: true});
    ground(ctx, t);
  };
  requestAnimationFrame(frame);
}
