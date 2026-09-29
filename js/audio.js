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
  jump: () => beep(280, 620, 0.12),
  coin: () => { beep(988, 988, 0.06); beep(1319, 1319, 0.12, 'square', 0.05, 0.06); },
  stomp: () => beep(220, 70, 0.12),
  die: () => beep(420, 50, 0.55, 'sawtooth', 0.06),
  win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, f, 0.16, 'square', 0.05, i * 0.13)),
};
