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

export const sfx = {
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
