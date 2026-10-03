import {getAudioContext, beep} from '../audio.js';
import {clamp} from '../utils.js';
import {bind, burst, tone, whiteNoise} from './synth.js';

// Level 7 soundscape: a furnace rumble that swells with the rising lava, crackling, an alarm horn
// when the lava gets close, and positional cues for jets, geysers, boulders and fireballs.
let ac = null, noise = null, nodes = null, active = false;
let nextCrackle = 0, nextHorn = 0, nextGroan = 8;

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
    const rumble = ac.createBufferSource(), low = ac.createBiquadFilter(), rumbleGain = ac.createGain();
    rumble.buffer = noise; rumble.loop = true;
    low.type = 'lowpass'; low.frequency.value = 140;
    rumbleGain.gain.value = .25;
    rumble.connect(low); low.connect(rumbleGain); rumbleGain.connect(master); rumble.start();
    const sub = ac.createOscillator(), subGain = ac.createGain();
    sub.type = 'sine'; sub.frequency.value = 36; subGain.gain.value = .06;
    sub.connect(subGain); subGain.connect(master); sub.start();
    nodes = {master, rumbleGain, low, sub};
  }
  return true;
}

const pan = (e, p) => clamp((e.x - p.x) / 320, -.85, .85);
const reach = (e, p, range = 340) => Math.max(0, 1 - Math.hypot(e.x - p.x, e.y - p.y) / range);

const CUES = {
  'jet-warning': (v, e, p) => burst({freq: 2200, q: 1.5, dur: .6, vol: v * .03, attack: .4, pan: pan(e, p)}),
  'jet-active': (v, e, p) => { burst({freq: 700, q: .6, dur: .9, vol: v * .08, attack: .06, pan: pan(e, p), rate: .8}); tone(120, 70, .8, 'sawtooth', v * .02, pan(e, p)); },
  'geyser-warning': (v, e, p) => { for (let i = 0; i < 4; i++) setTimeout(() => ac && burst({freq: 500 + i * 120, q: 4, dur: .12, vol: v * .04, pan: pan(e, p)}), i * 150); },
  'geyser-active': (v, e, p) => { burst({freq: 400, type: 'lowpass', dur: .8, vol: v * .12, attack: .05, pan: pan(e, p)}); burst({freq: 3000, q: 1, dur: .6, vol: v * .03, pan: pan(e, p)}); },
  'boulder-warning': (v, e, p) => tone(70, 55, .9, 'sawtooth', v * .03, pan(e, p), 3),
  'boulder-fall': (v, e, p) => burst({freq: 900, q: .7, dur: .6, vol: v * .05, attack: .3, pan: pan(e, p), rate: .7}),
  'boulder-land': (v, e, p) => { tone(90, 28, .5, 'sawtooth', v * .1, pan(e, p)); burst({freq: 300, type: 'lowpass', dur: .5, vol: v * .12, pan: pan(e, p)}); },
  collapse: (v, e, p) => { tone(110, 40, .4, 'sawtooth', v * .05, pan(e, p)); burst({freq: 600, type: 'lowpass', dur: .4, vol: v * .06, pan: pan(e, p)}); },
  creak: (v, e, p) => tone(90, 140, .4, 'sawtooth', v * .03, pan(e, p), 4),
  spring: (v, e, p) => { tone(180, 720, .22, 'triangle', .07, pan(e, p)); tone(300, 1000, .16, 'sine', .04, pan(e, p)); },
  'fireball-warning': (v, e, p) => { for (let i = 0; i < 3; i++) setTimeout(() => ac && burst({freq: 700, q: 6, dur: .08, vol: v * .05, pan: pan(e, p)}), i * 170); },
  'fireball-launch': (v, e, p) => { burst({freq: 1500, q: .8, dur: .5, vol: v * .06, attack: .05, pan: pan(e, p)}); tone(200, 700, .4, 'sawtooth', v * .02, pan(e, p)); },
  checkpoint: () => { beep(330, 392, .3, 'triangle', .03); beep(494, 587, .4, 'sine', .025, .12); }
};

export const cinderSound = {
  setActive(on) {
    if (on || !active) return;
    active = false;
    if (nodes) nodes.master.gain.setTargetAtTime(0, ac.currentTime, .15);
  },
  update(gs) {
    if (!setup()) return;
    const f = gs.cinder, p = gs.p;
    if (!f || !p) return;
    if (!active) { active = true; nextCrackle = nextHorn = f.time; nextGroan = f.time + 8; }
    const t = ac.currentTime;
    nodes.master.gain.setTargetAtTime(.9, t, .3);

    // The rumble and sub tone grow as the lava gets closer.
    const gap = f.lava.y - (p.y + p.h);
    const danger = f.lava.active ? clamp(1 - gap / 320, 0, 1) : 0;
    nodes.rumbleGain.gain.setTargetAtTime(.2 + danger * .5, t, .3);
    nodes.low.frequency.setTargetAtTime(120 + danger * 260, t, .3);
    nodes.sub.frequency.setTargetAtTime(34 + danger * 14, t, .4);

    for (const e of f.events) {
      const cue = CUES[e.type];
      if (!cue) continue;
      const v = reach(e, p);
      if (v > .02 || e.type === 'checkpoint' || e.type === 'spring') cue(v, e, p);
    }
    if (f.time >= nextCrackle) {
      nextCrackle = f.time + rand(.15, .5) / (1 + danger * 2);
      burst({freq: rand(1500, 4500), q: 3, dur: .03, vol: .008 + danger * .015, pan: rand(-.7, .7)});
    }
    if (danger > .55 && f.time >= nextHorn) { // alarm horn, quicker as the lava closes in
      nextHorn = f.time + 1.4 - danger * .8;
      tone(150, 140, .5, 'sawtooth', .02 + danger * .02);
      tone(225, 210, .5, 'square', .008 + danger * .01);
    }
    if (f.time >= nextGroan) { nextGroan = f.time + rand(9, 15); tone(rand(50, 70), rand(35, 50), 1.6, 'sawtooth', .03, rand(-.6, .6), 2); }
  },
  death() {
    if (!ac) return;
    tone(380, 50, .8, 'sawtooth', .05);
    burst({freq: 900, q: .7, dur: .6, vol: .07, rate: .8});
  }
};
