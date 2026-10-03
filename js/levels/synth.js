// Tiny Web Audio helpers shared by the synthesised level soundscapes.
// A level's setup calls bind(ac, noiseBuffer) once its context exists.
import {clamp} from '../utils.js';

const state = {ac: null, noise: null};
export const bind = (ac, noise) => { state.ac = ac; state.noise = noise; };

// Filtered noise burst with a fast attack and exponential decay.
export function burst({freq = 1000, type = 'bandpass', q = 1, dur = .2, vol = .02, pan = 0, rate = 1, attack = .01}) {
  const {ac, noise} = state;
  const t = ac.currentTime, src = ac.createBufferSource(), filter = ac.createBiquadFilter();
  const g = ac.createGain(), panner = ac.createStereoPanner();
  src.buffer = noise; src.playbackRate.value = rate;
  filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
  panner.pan.value = clamp(pan, -.9, .9);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(filter); filter.connect(g); g.connect(panner); panner.connect(ac.destination);
  src.start(t, Math.random()); src.stop(t + dur + .05);
}

// Gliding oscillator tone, optionally with vibrato.
export function tone(f1, f2, dur, type, vol, pan = 0, vibrato = 0) {
  const {ac} = state;
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), panner = ac.createStereoPanner();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
  panner.pan.value = clamp(pan, -.9, .9);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.08, dur / 3));
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  if (vibrato) {
    const lfo = ac.createOscillator(), depth = ac.createGain();
    lfo.frequency.value = 6.5; depth.gain.value = vibrato;
    lfo.connect(depth); depth.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  o.connect(g); g.connect(panner); panner.connect(ac.destination);
  o.start(t); o.stop(t + dur + .05);
}

export function whiteNoise(ac, seconds = 2) {
  const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buffer;
}
