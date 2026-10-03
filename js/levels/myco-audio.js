import {getAudioContext, beep} from '../audio.js';
import {clamp} from '../utils.js';
import {bind, burst, tone, whiteNoise} from './synth.js';
import {MYCO_SCALE} from './myco.js';

// Level 9: a quiet, glassy cave full of chimes that turns hostile when something hunts you.
// Mushrooms ring a pentatonic note when you pass (flat and detuned while you are being chased),
// a heartbeat and a dissonant drone grow with the danger value, stalkers thump behind you and
// floaters sing a rising theremin wail. A petrified chaser resolves the tension with a bright shatter.
let ac = null, noise = null, nodes = null, active = false;
let nextBeat = 0, nextDrip = 0, nextStep = 0, nextBreath = 0, danger = 0;

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
      return {o, g};
    };
    osc('sine', 38, .06); osc('sine', 40.5, .04);
    // Air that breathes through the spores.
    const air = ac.createBufferSource(), band = ac.createBiquadFilter(), airGain = ac.createGain();
    air.buffer = noise; air.loop = true;
    band.type = 'bandpass'; band.frequency.value = 1800; band.Q.value = 2;
    airGain.gain.value = .012;
    const lfo = ac.createOscillator(), lfoGain = ac.createGain();
    lfo.frequency.value = .09; lfoGain.gain.value = 700;
    lfo.connect(lfoGain); lfoGain.connect(band.frequency); lfo.start();
    air.connect(band); band.connect(airGain); airGain.connect(master); air.start();
    // Dissonant tritone that fades in with danger.
    const tension = [osc('sawtooth', 110, 0), osc('sawtooth', 155.6, 0)];
    // Floater theremin.
    const theremin = ac.createOscillator(), thGain = ac.createGain(), vib = ac.createOscillator(), vibGain = ac.createGain();
    theremin.type = 'sine'; theremin.frequency.value = 520; thGain.gain.value = 0;
    vib.frequency.value = 5.5; vibGain.gain.value = 9;
    vib.connect(vibGain); vibGain.connect(theremin.frequency); vib.start();
    theremin.connect(thGain); thGain.connect(master); theremin.start();
    nodes = {master, airGain, tension, theremin, thGain};
  }
  return true;
}

const pan = (e, p) => clamp((e.x - p.x) / 320, -.85, .85);
const reach = (e, p, range = 420) => Math.max(0, 1 - Math.hypot(e.x - p.x, (e.y ?? p.y) - p.y) / range);

const bell = (freq, vol, pn = 0, detune = 0) => {
  tone(freq * (1 - detune), freq * (1 - detune) * .995, 1.6, 'sine', vol, pn);
  tone(freq * 2 * (1 + detune), freq * 2 * (1 + detune), .9, 'triangle', vol * .35, pn);
};

const ALWAYS = new Set(['checkpoint', 'pickup', 'chaser-emerge', 'freeze', 'chime', 'bounce']);
const CUES = {
  chime: (v, e, p) => bell(MYCO_SCALE[e.note % MYCO_SCALE.length], .028, pan(e, p), danger * .04),
  bounce: (v, e, p) => { const f = MYCO_SCALE[e.note % MYCO_SCALE.length]; tone(f, f * 3, .3, 'triangle', .07, pan(e, p)); tone(f * 1.5, f * 4, .22, 'sine', .04, pan(e, p)); },
  'chaser-emerge': (v, e, p) => {
    if (e.kind === 'stalker') { // guttural roar
      tone(95, 38, 1.1, 'sawtooth', .09, pan(e, p), 14);
      burst({freq: 500, q: 1.2, dur: 1, vol: .08, attack: .15, pan: pan(e, p), rate: .7});
    } else { tone(420, 1100, 1.1, 'sine', .06, pan(e, p), 30); tone(630, 1500, .9, 'triangle', .025, pan(e, p), 40); }
    tone(60, 30, .8, 'sine', .1);
  },
  // The cold resolution: glass shatter plus a bright chord built on the mushroom's own note.
  freeze: (v, e, p) => {
    const f = MYCO_SCALE[e.note % MYCO_SCALE.length], ratios = [1, 1.25, 1.5, 2];
    burst({freq: 6000, type: 'highpass', dur: .5, vol: .06, pan: pan(e, p)});
    burst({freq: 300, type: 'lowpass', dur: .4, vol: .1, pan: pan(e, p)});
    ratios.forEach((r, i) => setTimeout(() => ac && tone(f * r, f * r, 1.4, 'sine', .035, pan(e, p)), i * 70));
  },
  shatter: (v, e, p) => { burst({freq: 5000, type: 'highpass', dur: .3, vol: .05, pan: pan(e, p)}); tone(900, 200, .3, 'triangle', .03, pan(e, p)); },
  'chaser-gone': (v, e, p) => tone(300, 80, 1, 'sine', .02, pan(e, p)),
  'cloud-warning': (v, e, p) => burst({freq: 2500, q: 1.5, dur: .6, vol: v * .03, attack: .4, pan: pan(e, p)}),
  'cloud-active': (v, e, p) => burst({freq: 900, q: .6, dur: 1.2, vol: v * .08, attack: .05, pan: pan(e, p), rate: .8}),
  checkpoint: () => { bell(523, .03); setTimeout(() => ac && bell(784, .03), 120); setTimeout(() => ac && bell(1047, .025), 240); },
  pickup: () => { beep(660, 1100, .25, 'sine', .03); beep(990, 1320, .3, 'triangle', .02, .06); }
};

export const mycoSound = {
  setActive(on) {
    if (on || !active) return;
    active = false;
    if (nodes) { nodes.master.gain.setTargetAtTime(0, ac.currentTime, .15); nodes.thGain.gain.setTargetAtTime(0, ac.currentTime, .1); }
  },
  update(gs) {
    if (!setup()) return;
    const f = gs.myco, p = gs.p;
    if (!f || !p) return;
    if (!active) { active = true; nextBeat = f.time + 2; nextDrip = f.time + 1; nextStep = nextBreath = f.time; }
    const t = ac.currentTime;
    danger = f.danger;
    nodes.master.gain.setTargetAtTime(.9, t, .3);
    nodes.airGain.gain.setTargetAtTime(.012 + danger * .02, t, .3);
    for (const o of nodes.tension) o.g.gain.setTargetAtTime(danger * danger * .035, t, .2);

    const hunters = f.chasers.filter(c => c.state === 'chase');
    const floater = hunters.filter(c => c.kind === 'floater').sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (floater) {
      const close = clamp(1 - Math.abs(floater.x - p.x) / 320, 0, 1);
      nodes.thGain.gain.setTargetAtTime(.012 + close * .03, t, .1);
      nodes.theremin.frequency.setTargetAtTime(380 + close * 700, t, .1);
    } else nodes.thGain.gain.setTargetAtTime(0, t, .15);

    for (const e of f.events) {
      const cue = CUES[e.type];
      if (!cue) continue;
      const v = reach(e, p);
      if (v > .02 || ALWAYS.has(e.type)) cue(v, e, p);
    }

    // Heartbeat: slow and soft in the quiet, frantic when hunted.
    if (f.time >= nextBeat) {
      nextBeat = f.time + 1.5 - danger * 1.15;
      const vol = .015 + danger * .09;
      tone(60, 34, .14, 'sine', vol);
      setTimeout(() => ac && tone(52, 30, .16, 'sine', vol * .8), 150 - danger * 60);
    }
    // Stalker footfalls behind you.
    if (f.time >= nextStep) {
      nextStep = f.time + .27;
      const s = hunters.find(c => c.kind === 'stalker');
      if (s) {
        const v = reach(s, p, 450);
        tone(70, 40, .12, 'square', .02 + v * .06, pan(s, p));
        burst({freq: 200, type: 'lowpass', dur: .1, vol: .03 + v * .06, pan: pan(s, p)});
      }
    }
    if (f.time >= nextDrip) {
      nextDrip = f.time + rand(2.5, 6);
      const fq = rand(1400, 2600), pn = rand(-.7, .7);
      tone(fq, fq * .6, .12, 'sine', .012, pn);
      setTimeout(() => ac && tone(fq * .98, fq * .5, .15, 'sine', .005, pn), 220);
    }
    if (f.time >= nextBreath && danger > .5) { // wet breathing close behind
      nextBreath = f.time + 1.1 - danger * .5;
      burst({freq: 700, q: 2, dur: .45, vol: .02 * danger, attack: .18, pan: rand(-.4, .4), rate: .8});
    }
  },
  death() {
    if (!ac) return;
    tone(480, 40, .9, 'sawtooth', .06, 0, 20);
    burst({freq: 800, q: .7, dur: .6, vol: .08});
    tone(60, 28, 1, 'sine', .1);
  }
};
