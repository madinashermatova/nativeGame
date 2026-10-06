// ──────────────────────────────────────────
// Kodda chizilgan fonlar, bezaklar va elementlar (PNG yo'q).
// Har bir qatlam parallax bilan siljiydi: uzoq qatlam sekinroq.
// ──────────────────────────────────────────

const wrap = (v, m) => ((v % m) + m) % m;

// Deterministik "tasodifiy" qiymat (har kadrda bir xil bo'lishi uchun)
const hash = n => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Qush (V shaklidagi siluet), qanot qoqishi bilan
function drawBirds(ctx, VW, camX, anim, count, color, yMin, yRange) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < count; i++) {
    const speed = 0.12 + hash(i) * 0.12;
    const x = wrap(hash(i + 3) * VW * 2 + anim * speed - camX * 0.1, VW + 80) - 40;
    const y = yMin + hash(i + 9) * yRange;
    const flap = Math.sin(anim * 0.22 + i * 1.7) * 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - flap);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 5, y - flap);
    ctx.stroke();
  }
  ctx.restore();
}

// Bulut soyalari: yerda sekin harakatlanadigan yumshoq qorong'i dog'lar
function drawShadows(ctx, VW, camX, anim, y, alpha) {
  for (let i = 0; i < 3; i++) {
    const span = VW + 360;
    const x = wrap(hash(i + 20) * span + anim * 0.09 - camX * 0.25, span) - 180;
    ctx.save();
    ctx.translate(x, y + i * 18);
    ctx.scale(1, 0.28);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 90);
    g.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ──────────────────────────────────────────
// 1-LEVEL: quyosh botishi
// ──────────────────────────────────────────
export function drawSunsetBackground(ctx, VW, VH, camX, anim) {
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, '#ffd09a');
  sky.addColorStop(0.5, '#f79b7a');
  sky.addColorStop(1, '#b56b8e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);

  // Quyosh (kamera bilan sekin siljiydi)
  const sunX = VW * 0.72 - camX * 0.03;
  const glow = ctx.createRadialGradient(sunX, 120, 10, sunX, 120, 110);
  glow.addColorStop(0, 'rgba(255, 240, 190, 0.7)');
  glow.addColorStop(1, 'rgba(255, 240, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 110, 10, 220, 220);
  ctx.fillStyle = '#ffe6a8';
  ctx.beginPath(); ctx.arc(sunX, 120, 40, 0, Math.PI * 2); ctx.fill();

  // Bulutlar
  ctx.fillStyle = 'rgba(255, 245, 235, 0.75)';
  for (let i = 0; i < 4; i++) {
    const span = VW + 200;
    const x = wrap(i * 150 + anim * 0.08 - camX * 0.05, span) - 100;
    const y = 40 + (i % 2) * 34;
    for (const [dx, dy, r] of [[0, 0, 14], [14, -6, 16], [30, 0, 13]]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawBirds(ctx, VW, camX, anim, 5, 'rgba(60, 20, 40, 0.75)', 55, 60);

  // Uzoq tepaliklar (ikki qatlam)
  const layers = [[0.12, '#c46b7a', 150], [0.25, '#8c4c74', 185]];
  for (const [par, color, base] of layers) {
    const off = camX * par;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW + 8; x += 8) {
      const wx = x + off;
      const y = base + Math.sin(wx * 0.021) * 14 + Math.sin(wx * 0.053) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();
  }
  drawShadows(ctx, VW, camX, anim, 214, 0.18);
}

// ──────────────────────────────────────────
// 2-LEVEL: qorong'i o'rmon (daraxt siluetlari, tuman, qushlar, soyalar)
// ──────────────────────────────────────────
export function drawForestBackground(ctx, VW, VH, camX, anim) {
  // Osmon: tundan yorug' ufqqa (oy nuri ko'rinishi)
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, '#03090b');
  sky.addColorStop(0.45, '#0a1d1f');
  sky.addColorStop(0.8, '#15332f');
  sky.addColorStop(1, '#1d4538');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);

  // Oy va uning yumshoq nuri
  const moonX = VW * 0.8 - camX * 0.02;
  const moon = ctx.createRadialGradient(moonX, 52, 4, moonX, 52, 90);
  moon.addColorStop(0, 'rgba(210, 240, 220, 0.35)');
  moon.addColorStop(1, 'rgba(210, 240, 220, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(moonX - 90, -38, 180, 180);
  ctx.fillStyle = '#d7f2e0';
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(moonX, 52, 9, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  drawBirds(ctx, VW, camX, anim, 4, 'rgba(170, 215, 190, 0.35)', 25, 70);

  // Yorug' nurlar (daraxt tepalari orasidan tushadi)
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const x = ((i * 130 - camX * 0.05 + anim * 0.05) % (VW + 200) + VW + 200) % (VW + 200) - 100;
    const g = ctx.createLinearGradient(x, 0, x + 40, 200);
    g.addColorStop(0, 'rgba(190, 240, 210, 0.13)');
    g.addColorStop(1, 'rgba(190, 240, 210, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x + 70, 200); ctx.lineTo(x + 40, 200);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Daraxtlar: to'rt qatlam, uzoqdan yaqinga; har biri turlicha bo'yalgan va tezligi bilan siljiydi
  const layers = [
    { par: 0.1, color: '#0c2a2a', base: 118, spacing: 30, hgt: 78, shade: '#123838' },
    { par: 0.24, color: '#081c1d', base: 140, spacing: 46, hgt: 110, shade: '#0c2526' },
    { par: 0.45, color: '#041113', base: 166, spacing: 70, hgt: 150, shade: '#06191b' },
    { par: 0.75, color: '#020809', base: 196, spacing: 100, hgt: 190, shade: '#030d0e' }
  ];
  for (const L of layers) {
    const off = camX * L.par;
    const first = Math.floor(off / L.spacing);
    for (let i = first; i < first + Math.ceil(VW / L.spacing) + 2; i++) {
      const x = i * L.spacing - off + hash(i * 3.1) * 8;
      const h = L.hgt * (0.65 + hash(i) * 0.55);
      const w = L.spacing * (0.3 + hash(i + 7) * 0.12);
      // Qarag'ay: 4 ta yumshoq qatlam (yuqoriga torayib boradi), tepasi yorqinroq
      for (let k = 0; k < 4; k++) {
        const top = L.base - h + k * h * 0.22;
        const bottom = L.base - h * 0.04 + k * h * 0.1;
        const ww = w * (1 - k * 0.2);
        ctx.fillStyle = k === 0 ? L.shade : L.color;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.quadraticCurveTo(x + ww * 0.5, (top + bottom) / 2, x + ww, bottom);
        ctx.lineTo(x - ww, bottom);
        ctx.quadraticCurveTo(x - ww * 0.5, (top + bottom) / 2, x, top);
        ctx.fill();
      }
      ctx.fillStyle = L.color;
      ctx.fillRect(x - 2, L.base - 4, 4, VH - L.base + 4);
    }
    // Har bir qatlam orasiga tuman (uzoqdagi daraxtlarni yumshatadi)
    const fog = ctx.createLinearGradient(0, L.base - 30, 0, L.base + 20);
    fog.addColorStop(0, 'rgba(80, 150, 130, 0)');
    fog.addColorStop(0.6, `rgba(80, 150, 130, ${0.12 + L.par * 0.08})`);
    fog.addColorStop(1, 'rgba(80, 150, 130, 0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, L.base - 30, VW, 50);
  }

  // Yer: qorong'i gradient va o't tutamlari
  const ground = ctx.createLinearGradient(0, 200, 0, VH);
  ground.addColorStop(0, '#0a1a14');
  ground.addColorStop(1, '#030806');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 200, VW, VH - 200);
  ctx.fillStyle = '#143224';
  for (let x = -((camX * 0.6) % 12); x < VW; x += 12) {
    const h = 3 + hash(Math.floor((x + camX * 0.6) / 12)) * 5;
    ctx.beginPath();
    ctx.moveTo(x, 204); ctx.lineTo(x + 2, 204 - h); ctx.lineTo(x + 4, 204);
    ctx.fill();
  }

  drawShadows(ctx, VW, camX, anim, 226, 0.42);

  // Chigirtkalar: yumshoq miltillaydi (atrofida nur)
  for (let i = 0; i < 14; i++) {
    const x = wrap(hash(i) * VW * 3 - camX * 0.3, VW);
    const y = 70 + hash(i + 40) * 120;
    const glow = 0.4 + 0.6 * Math.abs(Math.sin(anim * 0.05 + i));
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
    g.addColorStop(0, `rgba(200, 255, 150, ${0.5 * glow})`);
    g.addColorStop(1, 'rgba(200, 255, 150, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.fillStyle = `rgba(230, 255, 180, ${glow})`;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

// ──────────────────────────────────────────
// 5-LEVEL: kimyo laboratoriyasi (ko'k-oq palitra, 4-leveldan farqli)
// ──────────────────────────────────────────
export function drawLabBackground(ctx, VW, camX, anim) {
  const VH = 270;
  const wall = ctx.createLinearGradient(0, 0, 0, VH);
  wall.addColorStop(0, '#0c1b2b');
  wall.addColorStop(1, '#16324a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VW, VH);

  // Devor plitkalari (sekin parallax)
  const gridOff = (camX * 0.15) % 40;
  ctx.fillStyle = 'rgba(120, 200, 255, 0.06)';
  for (let x = -gridOff; x < VW + 40; x += 40) ctx.fillRect(Math.round(x), 0, 1, VH);
  for (let y = 0; y < VH; y += 40) ctx.fillRect(0, y, VW, 1);

  // Laboratoriya javonlari va kolbalar (o'rta parallax)
  const shelfOff = (camX * 0.35) % 72;
  for (const shelfY of [70, 138]) {
    ctx.fillStyle = '#244862';
    ctx.fillRect(0, shelfY, VW, 4);
    for (let x = -shelfOff; x < VW + 72; x += 72) {
      const idx = Math.round((x + camX * 0.35) / 72);
      const h = 18 + hash(idx + shelfY) * 10;
      ctx.fillStyle = 'rgba(180, 230, 255, 0.18)';
      ctx.fillRect(Math.round(x + 10), shelfY - h, 14, h);
      ctx.fillStyle = hash(idx) > 0.5 ? 'rgba(56, 200, 255, 0.55)' : 'rgba(150, 120, 255, 0.5)';
      ctx.fillRect(Math.round(x + 10), shelfY - h * 0.55, 14, h * 0.55);
      ctx.fillStyle = 'rgba(180, 230, 255, 0.25)';
      ctx.fillRect(Math.round(x + 13), shelfY - h - 4, 8, 4);
    }
  }

  // Shiftdan tushgan nur (sekin o'zgaradi)
  const pulse = 0.5 + 0.5 * Math.sin(anim * 0.02);
  for (let x = 0; x < VW; x += 160) {
    const sx = x - ((camX * 0.1) % 160);
    ctx.fillStyle = `rgba(160, 230, 255, ${0.04 + 0.02 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(sx + 60, 0); ctx.lineTo(sx + 100, 0);
    ctx.lineTo(sx + 130, VH); ctx.lineTo(sx + 30, VH);
    ctx.closePath(); ctx.fill();
  }

  // Yerdagi ko'k chiziq
  ctx.fillStyle = 'rgba(80, 200, 255, 0.25)';
  ctx.fillRect(0, 232, VW, 2);
}

export function drawLabTile(ctx, sx, sy, hasTopFace) {
  const x = Math.round(sx), y = Math.round(sy);
  ctx.fillStyle = hasTopFace ? '#2b4a63' : '#22394d';
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = '#1a2f42';
  ctx.fillRect(x, y + 7, 16, 1);
  ctx.fillRect(x + 8, y, 1, 7);
  ctx.fillRect(x, y + 8, 1, 8);
  if (hasTopFace) {
    ctx.fillStyle = '#7fd8ff';
    ctx.fillRect(x, y, 16, 2);
    ctx.fillStyle = 'rgba(200, 245, 255, 0.5)';
    ctx.fillRect(x + 3, y + 3, 6, 1);
  }
}

// ──────────────────────────────────────────
// Suv (U): to'lqin, ko'pik va pufakchalar bilan
// ──────────────────────────────────────────
export function drawWater(ctx, x, y, T, seed, anim) {
  ctx.fillStyle = '#1a6fa8';
  ctx.fillRect(x, y + 2, T, T - 2);
  ctx.fillStyle = '#0f4c7a';
  ctx.fillRect(x, y + 9, T, T - 9);

  // Yuza to'lqini
  ctx.fillStyle = '#3fb6e8';
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  for (let i = 0; i <= T; i += 2) {
    ctx.lineTo(x + i, y + 4 + Math.sin(anim * 0.12 + seed + i * 0.8) * 1.2);
  }
  ctx.lineTo(x + T, y + 8);
  ctx.closePath();
  ctx.fill();

  // Ko'pik nuqtalari (yuzada siljiydi)
  ctx.fillStyle = '#d8f6ff';
  for (let k = 0; k < 2; k++) {
    const fx = x + ((anim * 0.5 + seed * 5 + k * 7) % T);
    ctx.fillRect(Math.round(fx), Math.round(y + 3 + Math.sin(anim * 0.1 + k) * 1), 2, 1);
  }

  // Ko'tarilayotgan pufakchalar
  ctx.fillStyle = 'rgba(200, 245, 255, 0.55)';
  for (let k = 0; k < 2; k++) {
    const by = y + T - ((anim * 0.3 + seed * 3 + k * 6) % (T - 4));
    ctx.beginPath(); ctx.arc(x + 4 + k * 8, by, 1.1, 0, Math.PI * 2); ctx.fill();
  }
}

// ──────────────────────────────────────────
// Olov (F): alangalaydi; faol bo'lmaganda faqat ko'mir va uchqun
// ──────────────────────────────────────────
export function drawFire(ctx, x, y, T, seed, anim, active) {
  ctx.fillStyle = '#3a1a12';
  ctx.fillRect(x, y + 10, T, T - 10);
  ctx.fillStyle = '#7a2e1c';
  ctx.fillRect(x + 1, y + 9, T - 2, 2);

  if (!active) {
    ctx.fillStyle = 'rgba(255, 122, 58, 0.6)';
    ctx.fillRect(Math.round(x + 5 + Math.sin(anim * 0.1 + seed) * 2), Math.round(y + 7), 2, 2);
    return;
  }

  // Yorug' aura
  const g = ctx.createRadialGradient(x + 8, y + 6, 2, x + 8, y + 6, 16);
  g.addColorStop(0, 'rgba(255, 120, 30, 0.45)');
  g.addColorStop(1, 'rgba(255, 120, 30, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 8, y - 10, T + 16, T + 16);

  // Alanga tillari: tashqi (to'q) va ichki (yorqin) qatlam
  for (let i = 0; i < 3; i++) {
    const cx = x + 3 + i * 5;
    const h = 11 + Math.sin(anim * 0.25 + seed + i * 1.7) * 3 + (i === 1 ? 3 : 0);
    ctx.fillStyle = '#ff5a1a';
    ctx.beginPath();
    ctx.moveTo(cx - 3.2, y + 10);
    ctx.quadraticCurveTo(cx - 4, y + 10 - h * 0.5, cx, y + 10 - h);
    ctx.quadraticCurveTo(cx + 4, y + 10 - h * 0.5, cx + 3.2, y + 10);
    ctx.fill();
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath();
    ctx.moveTo(cx - 1.5, y + 10);
    ctx.quadraticCurveTo(cx - 1.8, y + 10 - h * 0.5, cx, y + 10 - h * 0.72);
    ctx.quadraticCurveTo(cx + 1.8, y + 10 - h * 0.5, cx + 1.5, y + 10);
    ctx.fill();
  }

  // Uchqunlar
  ctx.fillStyle = '#ffe8a0';
  for (let k = 0; k < 2; k++) {
    const ey = y + 2 - ((anim * 0.4 + seed * 4 + k * 9) % 12);
    ctx.fillRect(Math.round(x + 4 + k * 7), Math.round(ey), 1, 1);
  }
}

// ──────────────────────────────────────────
// Yurak (hayot ikonkasi). Pixel naqsh, s — bitta piksel o'lchami
// ──────────────────────────────────────────
const HEART = [
  '0110110',
  '1111111',
  '1111111',
  '0111110',
  '0011100',
  '0001000'
];
export function drawHeart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  HEART.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '1') ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  });
}

// ──────────────────────────────────────────
// 1-LEVEL: o'simlik (props)
// ──────────────────────────────────────────
export function drawBush(ctx, x, y) {
  ctx.fillStyle = '#3f7d3a';
  ctx.beginPath(); ctx.arc(x + 9, y + 18, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 17, y + 16, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2e5f2c';
  ctx.beginPath(); ctx.arc(x + 13, y + 22, 7, 0, Math.PI * 2); ctx.fill();
}

// ──────────────────────────────────────────
// 6-LEVEL: zamonaviy shahar-zavod (tun, neon, tutun)
// ──────────────────────────────────────────
// Tutun ustunlari: ventilyatorlardan ko'tarilib, kengayib so'nadi (holat talab qilmaydi)
const VENTS = [0.12, 0.42, 0.74];
function drawSmoke(ctx, VW, camX, anim, baseY) {
  for (let v = 0; v < VENTS.length; v++) {
    const x = VW * VENTS[v] * 1.6 - camX * 0.45;
    for (let k = 0; k < 6; k++) {
      const life = ((anim * 0.5 + k * 27 + v * 13) % 150) / 150; // 0..1
      const y = baseY - life * 120;
      const r = 4 + life * 16;
      const wob = Math.sin(anim * 0.03 + k * 2 + v) * (6 + life * 8);
      const g = ctx.createRadialGradient(x + wob, y, 0, x + wob, y, r);
      g.addColorStop(0, `rgba(170, 200, 210, ${0.16 * (1 - life)})`);
      g.addColorStop(1, 'rgba(170, 200, 210, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + wob - r, y - r, r * 2, r * 2);
    }
  }
}

export function drawModernBackground(ctx, VW, camX, anim) {
  const VH = 270;
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, '#060a18');
  sky.addColorStop(0.6, '#0f1a33');
  sky.addColorStop(1, '#1d1838');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);

  // Yulduzlar (sekin siljiydi)
  for (let i = 0; i < 26; i++) {
    const x = wrap(hash(i) * VW * 2 - camX * 0.03, VW);
    const y = 8 + hash(i + 50) * 90;
    ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(anim * 0.02 + i));
    ctx.fillStyle = '#cfe9ff';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.globalAlpha = 1;

  // Shahar siluetlari ikki qatlamda, derazalari yonib-o'chadi
  const layers = [[0.15, '#0c1530', 150, 26], [0.35, '#080f22', 190, 36]];
  for (const [par, color, base, bw] of layers) {
    const off = camX * par;
    const first = Math.floor(off / bw);
    for (let i = first; i < first + Math.ceil(VW / bw) + 2; i++) {
      const x = i * bw - off;
      const h = 40 + hash(i * 1.7) * 90;
      ctx.fillStyle = color;
      ctx.fillRect(x, base - h, bw - 2, VH - base + h);
      // Derazalar
      for (let wy = base - h + 6; wy < base - 6; wy += 9) {
        if (hash(i + wy) > 0.55) {
          const on = Math.sin(anim * 0.05 + i * 3 + wy) > -0.4;
          ctx.fillStyle = on ? (hash(i + 7) > 0.5 ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 60, 140, 0.4)') : 'rgba(40, 60, 90, 0.4)';
          ctx.fillRect(x + 4, wy, 4, 4);
        }
      }
      // Antenna va qizil chiroq
      if (hash(i + 99) > 0.6) {
        ctx.fillStyle = color;
        ctx.fillRect(x + bw / 2 - 1, base - h - 14, 2, 14);
        ctx.fillStyle = Math.sin(anim * 0.1 + i) > 0 ? '#ff3355' : '#551020';
        ctx.fillRect(x + bw / 2 - 1, base - h - 15, 2, 2);
      }
    }
  }

  // Neon bo'ylama chiziqlar (holografik yo'l)
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let y = 200; y < VH; y += 10) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke();
  }
  ctx.restore();

  drawSmoke(ctx, VW, camX, anim, 210);
  drawShadows(ctx, VW, camX, anim, 228, 0.35);
  // Pastki neon chiziq
  ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
  ctx.fillRect(0, 232, VW, 2);
}

export function drawModernTile(ctx, sx, sy, hasTopFace) {
  const x = Math.round(sx), y = Math.round(sy);
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = '#0d121c';
  ctx.fillRect(x, y + 8, 16, 1);
  ctx.fillRect(x + 8, y, 1, 8);
  ctx.fillStyle = '#3a4a66';
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + 12, y + 12, 2, 2);
  if (hasTopFace) {
    ctx.fillStyle = '#22e3ff';
    ctx.fillRect(x, y, 16, 2);
    ctx.fillStyle = 'rgba(34, 227, 255, 0.25)';
    ctx.fillRect(x, y + 2, 16, 3);
  }
}

// Robot dushman: dumaloq bosh, qizil ko'z, yurganda oyoqlari harakatlanadi
export function drawRobot(ctx, x, y, w, h, dir, anim, alive) {
  const cx = x + w / 2;
  // Oyoqlar
  const step = Math.sin(anim * 0.3) * 1.5;
  ctx.fillStyle = '#2b3a52';
  ctx.fillRect(cx - 4 + step, y + h - 2, 3, 3);
  ctx.fillRect(cx + 1 - step, y + h - 2, 3, 3);
  // Tana
  ctx.fillStyle = '#c9d6e8';
  ctx.fillRect(x + 1, y + 4, w - 2, h - 7);
  ctx.fillStyle = '#7d8ba3';
  ctx.fillRect(x + 1, y + h - 5, w - 2, 1);
  // Bosh va vizor
  ctx.fillStyle = '#1c2638';
  ctx.fillRect(x + 2, y, w - 4, 5);
  const eyeX = dir > 0 ? x + w - 5 : x + 3;
  ctx.fillStyle = '#ff3355';
  ctx.fillRect(eyeX, y + 1, 2, 2);
  const g = ctx.createRadialGradient(eyeX + 1, y + 2, 0, eyeX + 1, y + 2, 6);
  g.addColorStop(0, 'rgba(255, 51, 85, 0.55)');
  g.addColorStop(1, 'rgba(255, 51, 85, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(eyeX - 5, y - 4, 12, 12);
  // Antenna (miltillaydi)
  ctx.fillStyle = '#7d8ba3';
  ctx.fillRect(cx - 0.5, y - 4, 1, 4);
  ctx.fillStyle = Math.sin(anim * 0.2) > 0 ? '#22e3ff' : '#113a44';
  ctx.fillRect(cx - 1, y - 6, 2, 2);
}

// Neon arra: tishlari va yorqin halqasi bilan
export function drawModernSaw(ctx, x, y, r, angle) {
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r + 6);
  glow.addColorStop(0, 'rgba(34, 227, 255, 0.35)');
  glow.addColorStop(1, 'rgba(34, 227, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(angle);
  const teeth = 12;
  ctx.fillStyle = '#cfd8e6';
  for (let i = 0; i < teeth; i++) {
    ctx.save();
    ctx.rotate((i / teeth) * Math.PI * 2);
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.22, -r * 0.62); ctx.lineTo(-r * 0.22, -r * 0.62); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#3a4a66';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22e3ff';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ──────────────────────────────────────────
// Keyingi bosqichga chiqish eshigi (levelning oxirida)
// ──────────────────────────────────────────
export function drawExitDoor(ctx, x, y, anim) {
  const pulse = 0.5 + 0.5 * Math.sin(anim * 0.08);
  // Yorug' aura
  const g = ctx.createRadialGradient(x + 8, y + 10, 4, x + 8, y + 10, 34);
  g.addColorStop(0, `rgba(125, 255, 154, ${0.28 + 0.12 * pulse})`);
  g.addColorStop(1, 'rgba(125, 255, 154, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 26, y - 24, 68, 68);
  // Ramka va panel
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(x - 2, y - 14, 20, 30);
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(x, y - 12, 16, 26);
  // Ichki yorug' panel (pastdan yuqoriga)
  const panel = ctx.createLinearGradient(0, y - 12, 0, y + 14);
  panel.addColorStop(0, 'rgba(125, 255, 154, 0.15)');
  panel.addColorStop(1, `rgba(125, 255, 154, ${0.35 + 0.25 * pulse})`);
  ctx.fillStyle = panel;
  ctx.fillRect(x + 1, y - 11, 14, 24);
  // Neon chetlari
  ctx.fillStyle = '#7dff9a';
  ctx.fillRect(x - 2, y - 14, 20, 1);
  ctx.fillRect(x - 2, y - 14, 1, 30);
  ctx.fillRect(x + 17, y - 14, 1, 30);
  // Yuqoriga yo'nalgan ko'rsatkich (harakatlanadi)
  const bob = Math.sin(anim * 0.1) * 1.5;
  ctx.fillStyle = '#e8fff0';
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 22 + bob);
  ctx.lineTo(x + 13, y - 17 + bob);
  ctx.lineTo(x + 3, y - 17 + bob);
  ctx.closePath();
  ctx.fill();
}
