// ──────────────────────────────────────────
// Kodda chizilgan sprite'lar (PNG yo'q).
// Har bir sprite 100 birlik kenglikda chiziladi; balandligi ratio*100.
// place() kenglik bo'yicha masshtablaydi, shuning uchun darajalarning o'lchamlari o'zgarmaydi.
// ──────────────────────────────────────────

function place(ctx, x, y, w, ratio, angle, flip, draw) {
  const h = w * ratio;
  ctx.save();
  if (angle || flip) {
    ctx.translate(x + w / 2, y + h / 2);
    if (angle) ctx.rotate(angle);
    if (flip) ctx.scale(-1, 1);
    ctx.translate(-w / 2, -h / 2);
  } else {
    ctx.translate(x, y);
  }
  ctx.scale(w / 100, w / 100);
  draw(ctx);
  ctx.restore();
  return h;
}

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function circle(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, pts, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function gear(ctx, cx, cy, r, teeth, body, hub) {
  ctx.fillStyle = body;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.8 : r;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  circle(ctx, cx, cy, r * 0.42, hub);
  circle(ctx, cx, cy, r * 0.14, '#111318');
}

// ──────────────────────────────────────────
// 3-LEVEL (qonli fabrika) sprite'lari
// ──────────────────────────────────────────
export const FACTORY_RATIO = {
  metal: 0.45, pipe: 0.8, gear: 1, movingGear: 0.97, bridge: 0.49, beam: 0.2,
  brace: 3.87, lamp: 1.47, ramp: 0.64, laser: 1.08, leftEmitter: 4.85,
  rightEmitter: 4.1, spikes: 0.625, chunk: 0.745
};

const FACTORY_DRAW = {
  metal(c) {
    rect(c, 0, 0, 100, 45, '#394050');
    rect(c, 0, 0, 100, 6, '#7b8397');
    rect(c, 0, 40, 100, 5, '#222733');
    for (const x of [50]) rect(c, x - 0.6, 6, 1.2, 34, '#262b38');
    circle(c, 9, 23, 2, '#9aa1b3');
    circle(c, 91, 23, 2, '#9aa1b3');
  },
  pipe(c) {
    rect(c, 0, 20, 100, 60, '#6b3a2a');
    rect(c, 0, 26, 100, 8, '#a0603f');
    rect(c, 0, 60, 100, 4, '#4a2519');
    rect(c, 0, 14, 8, 72, '#3b3f4b');
    rect(c, 92, 14, 8, 72, '#3b3f4b');
  },
  gear(c) {
    gear(c, 50, 50, 46, 9, '#5b6172', '#2a2e3a');
    circle(c, 66, 30, 4, '#7a4a2e');
  },
  movingGear(c) {
    gear(c, 50, 48, 46, 7, '#7a4a2e', '#3a2418');
    circle(c, 30, 70, 5, '#a86a3a');
  },
  bridge(c) {
    rect(c, 0, 0, 100, 8, '#5c6373');
    rect(c, 0, 41, 100, 8, '#5c6373');
    c.strokeStyle = '#3e4452';
    c.lineWidth = 4;
    c.beginPath();
    for (let x = -10; x < 110; x += 20) {
      c.moveTo(x, 8); c.lineTo(x + 10, 41);
      c.moveTo(x + 10, 8); c.lineTo(x, 41);
    }
    c.stroke();
  },
  beam(c) {
    rect(c, 0, 0, 100, 20, '#4a505e');
    rect(c, 0, 0, 100, 3, '#7b8397');
  },
  brace(c) {
    rect(c, 30, 0, 40, 387, '#444a58');
    rect(c, 40, 0, 20, 387, '#2c313c');
  },
  lamp(c) {
    rect(c, 40, 0, 20, 40, '#2c313c');
    circle(c, 50, 95, 30, '#ffd27a');
    circle(c, 50, 95, 14, '#fff6d6');
  },
  ramp(c) {
    poly(c, [[0, 64], [100, 64], [100, 0]], '#3d4456');
    c.strokeStyle = '#8a93a8';
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(100, 0); c.lineTo(0, 64); c.stroke();
  },
  laser(c) {
    rect(c, 0, 0, 100, 108, 'rgba(255, 58, 42, 0.85)');
    rect(c, 40, 0, 20, 108, '#ffd0c8');
  },
  leftEmitter(c) {
    rect(c, 20, 0, 80, 485, '#3b3f4b');
    rect(c, 0, 200, 30, 60, '#ff6a4a');
  },
  rightEmitter(c) {
    rect(c, 0, 0, 80, 410, '#3b3f4b');
    rect(c, 70, 170, 30, 60, '#ff6a4a');
  },
  spikes(c) {
    for (let i = 0; i < 4; i++) {
      poly(c, [[i * 25, 62.5], [i * 25 + 12.5, 0], [(i + 1) * 25, 62.5]], '#9ca3af');
      poly(c, [[i * 25 + 8, 62.5], [i * 25 + 12.5, 22], [i * 25 + 17, 62.5]], '#ef4444');
    }
  },
  chunk(c) {
    poly(c, [[10, 74.5], [30, 20], [60, 0], [90, 30], [100, 74.5]], '#5a4c44');
    poly(c, [[30, 20], [60, 0], [55, 35]], '#7a685d');
  }
};

export function drawFactorySprite(ctx, key, x, y, w, angle = 0) {
  return place(ctx, x, y, w, FACTORY_RATIO[key], angle, false, FACTORY_DRAW[key]);
}

// ──────────────────────────────────────────
// 4-LEVEL (zaharli kimyo) sprite'lari
// ──────────────────────────────────────────
export const TOXIC_RATIO = {
  tile: 0.9, bridge: 0.6, stripe: 0.46, support: 3.7, debris: 0.89, liquid: 0.854,
  leak: 0.26, poolTank: 0.49, barrel: 1.18, barrelAssembly: 0.51, pipe: 0.26,
  pipeLeg: 2.2, stream: 4.9, fan: 1, rotor: 1.17, mist: 1.44, tank: 1.47,
  stairs: 0.8, lamp: 0.56, door: 1, chain: 8.9
};

const TOXIC_DRAW = {
  // Laboratoriya plitkasi: metall ramka, chokli
  tile(c) {
    rect(c, 0, 0, 100, 90, '#2d3b35');
    rect(c, 0, 0, 100, 8, '#5f7c6d');
    rect(c, 0, 84, 100, 6, '#18221e');
    rect(c, 0, 44, 100, 1.5, '#1a241f');
    rect(c, 50, 10, 1.5, 74, '#1a241f');
    circle(c, 14, 22, 2, '#8aa596');
    circle(c, 86, 22, 2, '#8aa596');
    circle(c, 14, 68, 2, '#8aa596');
    circle(c, 86, 68, 2, '#8aa596');
  },
  // Metall panjara
  bridge(c) {
    rect(c, 0, 0, 100, 60, '#3a4a43');
    rect(c, 0, 0, 100, 8, '#7fa08c');
    c.fillStyle = '#18221e';
    for (let x = 6; x < 100; x += 16) c.fillRect(x, 16, 9, 30);
  },
  // Xavf belgisi: sariq-qora chiziqlar
  stripe(c) {
    rect(c, 0, 0, 100, 46, '#e0b52a');
    c.fillStyle = '#1b1b12';
    for (let x = -20; x < 120; x += 20) {
      c.beginPath();
      c.moveTo(x, 46); c.lineTo(x + 10, 46); c.lineTo(x + 26, 0); c.lineTo(x + 16, 0);
      c.closePath(); c.fill();
    }
  },
  // Po'lat ustun
  support(c) {
    rect(c, 30, 0, 40, 370, '#4a5a52');
    rect(c, 30, 0, 6, 370, '#6f8a7c');
    circle(c, 50, 90, 3, '#2a3530');
    circle(c, 50, 220, 2.5, '#2a3530');
  },
  // Beton bo'lagi
  debris(c) {
    poly(c, [[5, 89], [25, 25], [55, 0], [88, 30], [100, 89]], '#55645c');
    poly(c, [[25, 25], [55, 0], [50, 40]], '#748a7f');
  },
  // Zaharli suyuqlik: sirti yorqin, chuqurligi to'q yashil, pufakchalar
  liquid(c) {
    rect(c, 0, 0, 100, 85, '#3e9a12');
    rect(c, 0, 0, 100, 10, '#6fd81e');
    c.fillStyle = '#c8ff6a';
    c.beginPath();
    c.moveTo(0, 4);
    for (let x = 0; x <= 100; x += 10) c.lineTo(x, 3 + Math.sin(x * 0.3) * 1.5);
    c.lineTo(100, 0); c.lineTo(0, 0); c.closePath(); c.fill();
    circle(c, 30, 40, 5, 'rgba(216,255,138,0.6)');
    circle(c, 68, 62, 3.5, 'rgba(199,255,81,0.6)');
    circle(c, 52, 22, 2.2, 'rgba(216,255,138,0.6)');
  },
  // Tomchi: suyuqlik sirtidan tushayotgan tomchi
  leak(c) {
    poly(c, [[50, 0], [58, 14], [50, 22], [42, 14]], '#8ef03a');
    circle(c, 50, 17, 7, '#8ef03a');
    circle(c, 49, 14, 2, '#e2ffb0');
  },
  // Suyuqlik solingan tank (sirtdan pastgacha)
  poolTank(c) {
    rect(c, 0, 0, 100, 49, '#4a5e55');
    rect(c, 0, 0, 100, 5, '#9fb8ad');
    rect(c, 4, 20, 92, 27, '#3e9a12');
    rect(c, 4, 20, 92, 3, '#8ef03a');
  },
  // Xavfli bochka: zangsiz metall, sariq halqa va xavf belgisi
  barrel(c) {
    rect(c, 0, 0, 100, 118, '#4d6470');
    rect(c, 0, 26, 100, 8, '#e0b52a');
    rect(c, 0, 80, 100, 8, '#e0b52a');
    rect(c, 12, 0, 9, 118, '#7f97a3');
    poly(c, [[50, 44], [66, 60], [50, 76], [34, 60]], '#e0b52a');
    poly(c, [[50, 51], [58, 60], [50, 69], [42, 60]], '#1b1b12');
  },
  // Kichik bochkalar guruhi
  barrelAssembly(c) {
    for (let i = 0; i < 3; i++) {
      rect(c, i * 34, 0, 30, 51, '#4d6470');
      rect(c, i * 34, 10, 30, 3, '#e0b52a');
      rect(c, i * 34, 0, 30, 3, '#7f97a3');
    }
  },
  // Metall quvur
  pipe(c) {
    rect(c, 0, 0, 100, 26, '#6c7b73');
    rect(c, 0, 5, 100, 5, '#9fb1a7');
    rect(c, 0, 0, 6, 26, '#3b4a42');
  },
  // Vertikal quvur
  pipeLeg(c) {
    rect(c, 30, 0, 40, 220, '#6c7b73');
    rect(c, 28, 0, 44, 6, '#3b4a42');
    rect(c, 36, 0, 8, 220, '#9fb1a7');
  },
  // Kislota oqimi
  stream(c) {
    rect(c, 30, 0, 40, 490, 'rgba(120, 230, 50, 0.75)');
    rect(c, 42, 0, 16, 490, '#e2ffb0');
  },
  // Ventilyator korpusi
  fan(c) {
    circle(c, 50, 50, 46, '#26332d');
    c.strokeStyle = '#7f958a';
    c.lineWidth = 6;
    c.beginPath(); c.arc(50, 50, 42, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#4a5e55';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(50, 50); c.lineTo(50 + Math.cos(i * 1.57) * 40, 50 + Math.sin(i * 1.57) * 40); c.stroke(); }
  },
  // Ventilyator parraklari
  rotor(c) {
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(50, 58);
      c.rotate(i * (Math.PI * 2 / 3));
      c.fillStyle = '#a9c4b6';
      c.beginPath(); c.ellipse(0, -30, 12, 28, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    circle(c, 50, 58, 8, '#26332d');
  },
  // Zaharli bug: yumshoq, tarqalib ketadigan
  mist(c) {
    const g = c.createRadialGradient(50, 72, 2, 50, 72, 60);
    g.addColorStop(0, 'rgba(160, 235, 100, 0.75)');
    g.addColorStop(1, 'rgba(160, 235, 100, 0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(50, 72, 60, 72, 0, 0, Math.PI * 2); c.fill();
  },
  // Shisha tank: yashil suyuqlik, yorug' aks
  tank(c) {
    rect(c, 0, 0, 100, 147, 'rgba(160, 200, 185, 0.22)');
    rect(c, 0, 0, 100, 147, 'rgba(0,0,0,0)');
    c.strokeStyle = '#9fb8ad';
    c.lineWidth = 3;
    c.strokeRect(2, 2, 96, 143);
    c.fillStyle = '#3e9a12';
    c.fillRect(5, 60, 90, 82);
    rect(c, 5, 58, 90, 3, '#8ef03a');
    rect(c, 12, 10, 6, 130, 'rgba(255,255,255,0.22)');
    c.fillStyle = '#4a5e55';
    c.fillRect(0, 0, 100, 6);
  },
  // Pog'onali metall zina
  stairs(c) {
    for (let i = 0; i < 4; i++) rect(c, i * 25, 80 - (i + 1) * 20, 25, (i + 1) * 20, '#5d6e66');
    rect(c, 0, 80, 100, 3, '#26332d');
  },
  // Shiftdagi lampa: to'r ichida yorqin linza
  lamp(c) {
    rect(c, 44, 0, 12, 20, '#26332d');
    c.fillStyle = '#e8ffc0';
    c.beginPath(); c.arc(50, 40, 22, Math.PI, 0); c.fill();
    rect(c, 28, 40, 44, 8, '#26332d');
  },
  // Laboratoriya eshigi: oyna va ramka
  door(c) {
    rect(c, 0, 0, 100, 100, '#33433c');
    rect(c, 8, 8, 84, 84, '#7a9a8a');
    rect(c, 14, 14, 72, 72, '#1d2a24');
    rect(c, 22, 22, 56, 56, 'rgba(200, 245, 208, 0.45)');
    rect(c, 48, 22, 4, 56, '#33433c');
  },
  // Zanjir
  chain(c) {
    c.strokeStyle = '#6b7f74';
    c.lineWidth = 6;
    for (let y = 0; y < 890; y += 40) { c.beginPath(); c.ellipse(50, y + 10, 10, 16, 0, 0, Math.PI * 2); c.stroke(); }
  }
};

export function drawToxicSprite(ctx, key, x, y, w, angle = 0, flip = false) {
  return place(ctx, x, y, w, TOXIC_RATIO[key], angle, flip, TOXIC_DRAW[key]);
}
