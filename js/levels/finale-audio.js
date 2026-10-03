import {getAudioContext, beep} from '../audio.js';
import {clamp} from '../utils.js';
import {bind, burst, tone, whiteNoise} from './synth.js';

// Level 10: a menacing choir-like drone that builds into war drums during the boss fight, with big
// positional cues for every attack and a bright rising sting when the Overseer is hit.
let ac = null, noise = null, nodes = null, active = false;
let nextDrum = 0, drumStep = 0, nextTick = 0;

function setup() {
  const next = getAudioContext();
  if (!next) return false;
  if (next !== ac) { ac = next; noise = null; nodes = null; }
  if (!noise) { noise = whiteNoise(ac); bind(ac, noise); }
  if (!nodes) {
    const master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    // Choir pad: detuned saws through two vowel-like band filters.
    const choirGain = ac.createGain();
    choirGain.gain.value = .0;
    const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
    f1.type = f2.type = 'bandpass'; f1.frequency.value = 600; f2.frequency.value = 1100; f1.Q.value = f2.Q.value = 5;
    for (const freq of [73.4, 73.9, 110, 110.6, 146.8]) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
      o.connect(f1); o.connect(f2); o.start();
    }
    const lfo = ac.createOscillator(), lfoGain = ac.createGain();
    lfo.frequency.value = .12; lfoGain.gain.value = 220;
    lfo.connect(lfoGain); lfoGain.connect(f1.frequency); lfo.start();
    f1.connect(choirGain); f2.connect(choirGain); choirGain.connect(master);
    const sub = ac.createOscillator(), subGain = ac.createGain();
    sub.type = 'sine'; sub.frequency.value = 36.7; subGain.gain.value = .07;
    sub.connect(subGain); subGain.connect(master); sub.start();
    nodes = {master, choirGain};
  }
  return true;
}

const pan = (e, p) => clamp((e.x - p.x) / 320, -.85, .85);
const reach = (e, p, range = 520) => Math.max(0, 1 - Math.hypot(e.x - p.x, (e.y ?? p.y) - p.y) / range);
const ALWAYS = new Set(['plate-ready', 'boss-roar', 'boss-hit', 'boss-dead', 'boss-blast', 'checkpoint', 'boss-slam']);

const CUES = {
  'vent-warning': (v, e, p) => burst({freq: 2200, q: 1.5, dur: .6, vol: v * .03, attack: .4, pan: pan(e, p)}),
  'vent-active': (v, e, p) => burst({freq: 700, q: .6, dur: .8, vol: v * .08, attack: .05, pan: pan(e, p), rate: .8}),
  'drop-warning': (v, e, p) => burst({freq: 1800, q: 4, dur: .06, vol: v * .035, pan: pan(e, p)}),
  'drop-fall': (v, e, p) => burst({freq: 4000, type: 'highpass', dur: .35, vol: v * .02, pan: pan(e, p)}),
  'drop-shatter': (v, e, p) => burst({freq: 900, type: 'lowpass', dur: .35, vol: v * .1, pan: pan(e, p)}),
  'boss-roar': () => { tone(80, 30, 1.8, 'sawtooth', .1, 0, 16); burst({freq: 400, q: 1, dur: 1.6, vol: .1, attack: .3, rate: .6}); tone(55, 28, 1.4, 'sine', .12); },
  'boss-rain': (v, e, p) => tone(180, 90, .5, 'sawtooth', .04, pan(e, p), 8),
  'fireball-fall': (v, e, p) => burst({freq: 1200, q: .8, dur: .5, vol: .03, attack: .25, pan: pan(e, p)}),
  'fireball-hit': (v, e, p) => { tone(100, 38, .3, 'sawtooth', v * .08, pan(e, p)); burst({freq: 500, type: 'lowpass', dur: .3, vol: v * .1, pan: pan(e, p)}); },
  'beam-warning': () => { for (let i = 0; i < 6; i++) setTimeout(() => ac && tone(900 + i * 80, 900 + i * 80, .08, 'square', .02), i * 130); },
  'beam-fire': () => { burst({freq: 3500, q: .7, dur: .7, vol: .08, attack: .02}); tone(140, 100, .7, 'sawtooth', .05); },
  'boss-slam': () => { tone(70, 25, .6, 'sawtooth', .12); burst({freq: 250, type: 'lowpass', dur: .6, vol: .14}); },
  'plate-ready': () => { [659, 880, 1175].forEach((f, i) => setTimeout(() => ac && tone(f, f, .5, 'sine', .05), i * 80)); },
  checkpoint: () => { beep(392, 523, .25, 'triangle', .03); beep(659, 784, .35, 'sine', .025, .1); }
};
CUES['boss-hit'] = () => { // rising triumphant sting
  [392, 494, 587, 784].forEach((f, i) => setTimeout(() => ac && tone(f, f * 1.02, .5, 'triangle', .05), i * 90));
  burst({freq: 5000, type: 'highpass', dur: .4, vol: .07}); tone(60, 30, .8, 'sine', .14);
};
CUES['boss-dead'] = () => {
  tone(70, 20, 2.8, 'sawtooth', .14, 0, 10); burst({freq: 200, type: 'lowpass', dur: 2.6, vol: .16, attack: .1});
  [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => ac && tone(f, f, 1.2, 'triangle', .05), 700 + i * 140));
};
CUES['boss-blast'] = (v, e, p) => { tone(120, 35, .35, 'sawtooth', .06, pan(e, p)); burst({freq: 600, type: 'lowpass', dur: .3, vol: .08, pan: pan(e, p)}); };

export const finaleSound = {
  setActive(on) {
    if (on || !active) return;
    active = false;
    if (nodes) nodes.master.gain.setTargetAtTime(0, ac.currentTime, .15);
  },
  update(gs) {
    if (!setup()) return;
    const f = gs.finale, p = gs.p;
    if (!f || !p) return;
    if (!active) { active = true; nextDrum = f.time; nextTick = f.time; drumStep = 0; }
    const t = ac.currentTime, boss = f.boss;
    nodes.master.gain.setTargetAtTime(.9, t, .3);
    const fight = boss.active && !boss.dead;
    nodes.choirGain.gain.setTargetAtTime(fight ? .05 + (3 - boss.hp) * .012 : boss.dead ? .0 : p.x > 900 ? .02 : .012, t, .6);

    for (const e of f.events) {
      const cue = CUES[e.type];
      if (!cue) continue;
      const v = reach(e, p);
      if (v > .02 || ALWAYS.has(e.type)) cue(v, e, p);
    }
    // War drums: a driving pulse during the fight, quicker with each phase; silent while the boss is stunned.
    if (fight && boss.state !== 'stunned' && f.time >= nextDrum) {
      const tempo = .48 - (3 - boss.hp) * .07;
      nextDrum = f.time + tempo / 2;
      const accent = drumStep++ % 4 === 0;
      tone(accent ? 80 : 62, accent ? 36 : 30, .22, 'sine', accent ? .16 : .09);
      burst({freq: accent ? 220 : 160, type: 'lowpass', dur: .12, vol: accent ? .09 : .04});
    }
    if (f.time >= nextTick && !fight && !boss.dead) { nextTick = f.time + 1.1; tone(110, 70, .18, 'sine', .012); }
  },
  death() {
    if (!ac) return;
    tone(420, 40, .9, 'sawtooth', .06, 0, 14);
    burst({freq: 700, q: .8, dur: .6, vol: .07});
  }
};
