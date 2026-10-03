import { T } from './config.js';
import { solid } from './world.js';

export function moveX(e) {
  e.x += e.vx;
  const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.001) / T);
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) {
      if (solid(tx, ty)) { e.x = tx * T - e.w; e.vx = 0; break; }
    }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / T);
    for (let ty = y0; ty <= y1; ty++) {
      if (solid(tx, ty)) { e.x = (tx + 1) * T; e.vx = 0; break; }
    }
  }
}

export function moveY(e) {
  e.y += e.vy;
  e.onGround = false;
  const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.001) / T);
  if (e.vy > 0) {
    const ty = Math.floor((e.y + e.h) / T);
    for (let tx = x0; tx <= x1; tx++) {
      if (solid(tx, ty)) { e.y = ty * T - e.h; e.vy = 0; e.onGround = true; break; }
    }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y / T);
    for (let tx = x0; tx <= x1; tx++) {
      if (solid(tx, ty)) { e.y = (ty + 1) * T; e.vy = 0; if (e.gravDir === -1) e.onGround = true; break; }
    }
  }
}

export function checkWallContact(e) {
  const y0 = Math.floor((e.y + 2) / T);
  const y1 = Math.floor((e.y + e.h - 2) / T);
  const leftTx = Math.floor((e.x - 1) / T);
  const rightTx = Math.floor((e.x + e.w + 0.99) / T);

  let left = false, right = false;
  for (let ty = y0; ty <= y1; ty++) {
    if (solid(leftTx, ty)) left = true;
    if (solid(rightTx, ty)) right = true;
  }
  return { left, right };
}
