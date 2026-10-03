import {getAudioContext, beep} from '../audio.js';
import {clamp} from '../utils.js';
import {bind, burst, tone, whiteNoise} from './synth.js';

// Level 6 soundscape, all synthesised: a beating drone, wind, a heartbeat that quickens
// near threats, whispers, a distant bell, creaks and positional cues for every trap.
let ac = null, noise = null, nodes = null, active = false;
let nextBeat = 0, nextWhisper = 6, nextBell = 14, nextCreak = 9, nextClack = 0;

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

function setup() {
  const next = getAudioContext();
  if (!next) return false;
  if (next !== ac) { ac = next; noise = null; nodes = null; }
  if (!noise) { noise = whiteNoise(ac); bind(ac, noise); }
  if (!nodes) {
    const master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    const osc = (type, frequency, level) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = frequency; g.gain.value = level;
      o.connect(g); g.connect(master); o.start();
      return g;
    };
    // Two slightly detuned low notes beat against each other.
    osc('sine', 41.2, .05); osc('triangle', 43.4, .035);
    const wind = ac.createBufferSource(), band = ac.createBiquadFilter(), windGain = ac.createGain();
    wind.buffer = noise; wind.loop = true;
    band.type = 'bandpass'; band.frequency.value = 420; band.Q.value = .9;
    windGain.gain.value = .05;
    const lfo = ac.createOscillator(), lfoGain = ac.createGain();
    lfo.frequency.value = .11; lfoGain.gain.value = 260;
    lfo.connect(lfoGain); lfoGain.connect(band.frequency); lfo.start();
    wind.connect(band); band.connect(windGain); windGain.connect(master); wind.start();
    nodes = {master, windGain};
  }
  return true;
}

// A breathy voice: noise through a gliding formant, like someone whispering behind you.
const whisper = pan => {
  const f = rand(900, 1500);
  for (let i = 0; i < 3; i++) setTimeout(() => ac && burst({freq: f * rand(.8, 1.3), q: 7, dur: rand(.25, .5), vol: .016, pan, rate: rand(.8, 1.2), attack: .12}), i * 230);
};
const heartbeat = strength => {
  tone(64, 36, .14, 'sine', .07 + .06 * strength);
  setTimeout(() => ac && tone(56, 32, .16, 'sine', .055 + .05 * strength), 170);
};
const bell = () => {
  tone(196, 190, 3.2, 'sine', .02, rand(-.5, .5));
  tone(392, 380, 2.4, 'sine', .008, 0);
  tone(588, 570, 1.6, 'sine', .004, 0);
};

const pan = (e, p) => clamp((e.x - p.x) / 320, -.85, .85);
const near = (e, p, range = 280) => Math.max(0, 1 - Math.hypot(e.x - p.x, (e.y ?? p.y) - p.y) / range);

const CUES = {
  'spikes-warning': (v, e, p) => { for (let i = 0; i < 4; i++) setTimeout(() => ac && burst({freq: 3200, q: 3, dur: .05, vol: v * .03, pan: pan(e, p)}), i * 70); },
  'spikes-active': (v, e, p) => burst({freq: 2600, q: 2, dur: .12, vol: v * .05, pan: pan(e, p)}),
  'bat-alert': (v, e, p) => { tone(2400, 3600, .22, 'sawtooth', v * .018, pan(e, p), 60); tone(3100, 4400, .16, 'sine', v * .012, pan(e, p)); },
  'bat-swoop': (v, e, p) => { tone(1500, 3300, .3, 'sawtooth', v * .026, pan(e, p), 90); burst({freq: 5000, q: 1, dur: .25, vol: v * .02, pan: pan(e, p)}); },
  'ghost-rise': (v, e, p) => { tone(210, 540, 1.8, 'sine', .05, pan(e, p), 14); tone(318, 800, 1.6, 'triangle', .02, pan(e, p), 18); burst({freq: 700, q: 2, dur: 1.6, vol: .02, attack: .6, pan: pan(e, p)}); },
  'ghost-freeze': (v, e, p) => burst({freq: 220, type: 'lowpass', dur: .2, vol: .03, pan: pan(e, p)}),
  'ghost-thaw': (v, e, p) => { tone(300, 190, .6, 'sine', .028, pan(e, p), 10); whisper(pan(e, p)); },
  'ghost-gone': (v, e, p) => tone(520, 160, 1.2, 'sine', .03, pan(e, p), 12),
  'stalactite-warning': (v, e, p) => { burst({freq: 1800, q: 4, dur: .06, vol: v * .035, pan: pan(e, p)}); setTimeout(() => ac && burst({freq: 1400, q: 4, dur: .06, vol: v * .035, pan: pan(e, p)}), 160); },
  'stalactite-fall': (v, e, p) => burst({freq: 4000, type: 'highpass', dur: .4, vol: v * .02, pan: pan(e, p), rate: 1.3}),
  'stalactite-shatter': (v, e, p) => { burst({freq: 900, type: 'lowpass', dur: .35, vol: v * .1, pan: pan(e, p)}); burst({freq: 3500, q: 1, dur: .2, vol: v * .04, pan: pan(e, p)}); },
  'crusher-warning': (v, e, p) => burst({freq: 120, type: 'lowpass', dur: .9, vol: v * .08, attack: .4, pan: pan(e, p)}),
  'crusher-slam': (v, e, p) => { tone(95, 28, .45, 'sawtooth', v * .1, pan(e, p)); burst({freq: 300, type: 'lowpass', dur: .5, vol: v * .12, pan: pan(e, p)}); },
  'swish': (v, e, p) => burst({freq: 1100, q: .8, dur: .35, vol: v * .035, pan: pan(e, p), attack: .15, rate: .8}),
  'collapse': (v, e, p) => { tone(110, 40, .4, 'sawtooth', v * .05, pan(e, p)); burst({freq: 600, type: 'lowpass', dur: .4, vol: v * .06, pan: pan(e, p)}); },
  'creak': (v, e, p) => tone(80, 130, .5, 'sawtooth', v * .03, pan(e, p), 4),
  'skeleton-rise': (v, e, p) => { for (let i = 0; i < 6; i++) setTimeout(() => ac && burst({freq: rand(1800, 3000), q: 5, dur: .05, vol: v * .04, pan: pan(e, p)}), i * 110); },
  'dread-start': () => { tone(70, 30, 2.4, 'sawtooth', .08, 0, 5); burst({freq: 200, type: 'lowpass', dur: 2.2, vol: .1, attack: .8}); },
  thunder: () => { burst({freq: 160, type: 'lowpass', dur: 2.6, vol: .13, attack: .25, rate: .6}); tone(52, 30, 2, 'sine', .08); },
  checkpoint: () => { beep(330, 392, .3, 'triangle', .03); beep(494, 587, .4, 'sine', .025, .12); },
  pickup: () => { beep(660, 1100, .25, 'sine', .03); beep(990, 1320, .3, 'triangle', .02, .06); }
};

export const cryptSound = {
  setActive(on) {
    if (on || !active) return;
    active = false;
    nextBeat = 0;
    if (nodes) nodes.master.gain.setTargetAtTime(0, ac.currentTime, .15);
  },
  update(gs) {
    if (!setup()) return;
    const f = gs.crypt, p = gs.p;
    if (!f || !p) return;
    if (!active) { active = true; nextBeat = nextWhisper = f.time + 4; nextBell = f.time + 12; nextCreak = f.time + 8; }
    nodes.master.gain.setTargetAtTime(.9, ac.currentTime, .3);

    let threat = 0;
    for (const g of f.ghosts) if (g.state === 'hunt') threat = Math.max(threat, near(g, p, 320));
    for (const b of f.bats) if (b.state === 'alert' || b.state === 'swoop') threat = Math.max(threat, near(b, p, 200));
    for (const s of f.skeletons) if (s.state === 'walk') threat = Math.max(threat, near(s, p, 120) * .6);
    if (f.dread.active) threat = Math.max(threat, 1 - clamp((p.x - f.dread.x) / 360, 0, 1));
    nodes.windGain.gain.setTargetAtTime(.05 + threat * .04, ac.currentTime, .4);

    for (const e of f.events) {
      const cue = CUES[e.type];
      if (!cue) continue;
      const v = near(e, p, 340);
      if (v > .02 || e.type === 'thunder' || e.type === 'checkpoint' || e.type === 'pickup' || e.type === 'dread-start') cue(v, e, p);
    }

    if (f.time >= nextBeat) { nextBeat = f.time + 1.2 - .8 * threat; heartbeat(threat); }
    const hunted = f.ghosts.find(g => g.state === 'hunt' && !g.seen);
    if (f.time >= nextWhisper) {
      nextWhisper = f.time + (hunted ? rand(1.8, 3) : rand(7, 13));
      whisper(hunted ? pan(hunted, p) : rand(-.8, .8));
    }
    if (f.time >= nextBell) { nextBell = f.time + rand(18, 26); bell(); }
    if (f.time >= nextCreak) { nextCreak = f.time + rand(9, 15); tone(rand(60, 90), rand(110, 160), 1.1, 'sawtooth', .014, rand(-.7, .7), 3); }
    if (f.time >= nextClack) {
      const walker = f.skeletons.find(s => s.state === 'walk' && near(s, p, 180) > 0);
      nextClack = f.time + .38;
      if (walker) burst({freq: 2400, q: 4, dur: .04, vol: near(walker, p, 180) * .05, pan: pan(walker, p)});
    }
  },
  death() {
    if (!ac) return;
    tone(520, 60, .9, 'sawtooth', .05, 0, 20);
    tone(310, 40, 1.1, 'sine', .06);
    burst({freq: 2800, q: 1, dur: .5, vol: .05});
  }
};
