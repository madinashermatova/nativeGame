let ac = null;

export function initAudio() {
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch (e) { ac = null; }
}

export function beep(f1, f2, dur, type = 'square', vol = 0.05, delay = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + dur);
}

// Filtrlangan shovqin: bug' (tutun) va mexanik shovqin uchun
export function noiseBurst(dur, vol, freq, delay = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.4;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(ac.destination);
  src.start(t);
}

export const sfx = {
  door: () => {
    noiseBurst(0.5, 0.05, 900);
    beep(300, 900, 0.25, 'sine', 0.06);
    beep(900, 1400, 0.2, 'triangle', 0.04, 0.2);
  },
  levelStart: () => {
    [523, 659, 784, 1046].forEach((f, i) => beep(f, f, 0.12, 'triangle', 0.06, i * 0.08));
  },
  robot: () => {
    beep(760, 280, 0.12, 'square', 0.03);
    beep(1150, 620, 0.1, 'triangle', 0.02, 0.07);
  },
  steam: () => {
    noiseBurst(0.7, 0.05, 2600);
    beep(180, 120, 0.5, 'sine', 0.012, 0.05);
  },
  jump: () => {
    beep(220, 520, 0.09, 'sawtooth', 0.04);
    beep(160, 320, 0.05, 'sine', 0.03, 0.02);
  },
  spring: () => {
    beep(280, 750, 0.16, 'triangle', 0.08);
    beep(400, 900, 0.12, 'sine', 0.06, 0.04);
  },
  crumble: () => {
    beep(90, 40, 0.18, 'sawtooth', 0.06);
  },
  coin: () => {
    beep(587, 880, 0.08, 'triangle', 0.06);
    beep(880, 1174, 0.12, 'square', 0.05, 0.06);
  },
  stomp: () => {
    beep(180, 45, 0.14, 'sawtooth', 0.07);
    beep(120, 30, 0.1, 'square', 0.05, 0.02);
  },
  die: () => {
    beep(350, 40, 0.25, 'sawtooth', 0.09);
    beep(280, 30, 0.35, 'square', 0.06, 0.03);
    beep(150, 20, 0.45, 'sawtooth', 0.08, 0.06);
  },
  win: () => {
    [440, 554, 659, 880].forEach((f, i) => {
      beep(f, f, 0.14, 'triangle', 0.06, i * 0.11);
      beep(f * 1.5, f * 1.5, 0.12, 'square', 0.03, i * 0.11 + 0.02);
    });
  }
};

export const getAudioContext = () => ac;
