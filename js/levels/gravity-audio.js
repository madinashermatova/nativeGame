import {getAudioContext, beep} from '../audio.js';
import {clamp} from '../utils.js';
import {bind, burst, tone, whiteNoise} from './synth.js';

// Level 8: a humming laboratory. A slowly sweeping filtered drone, quiet data blips, saw whine that
// rises as a blade gets close, and sweeping portal whooshes that go up or down with gravity.
let ac = null, noise = null, nodes = null, active = false;
let nextBlip = 0, nextCrawl = 0;

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
    const hum = ac.createOscillator(), humGain = ac.createGain(), filter = ac.createBiquadFilter();
    hum.type = 'sawtooth'; hum.frequency.value = 55;
    filter.type = 'lowpass'; filter.frequency.value = 220; filter.Q.value = 6;
    humGain.gain.value = .05;
    const lfo = ac.createOscillator(), lfoGain = ac.createGain();
    lfo.frequency.value = .13; lfoGain.gain.value = 140;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
    hum.connect(filter); filter.connect(humGain); humGain.connect(master); hum.start();
    const whine = ac.createOscillator(), whineGain = ac.createGain();
    whine.type = 'sawtooth'; whine.frequency.value = 900; whineGain.gain.value = 0;
    whine.connect(whineGain); whineGain.connect(master); whine.start();
    nodes = {master, whine, whineGain};
  }
  return true;
}

const pan = (e, p) => clamp((e.x - p.x) / 320, -.85, .85);
const reach = (e, p, range = 340) => Math.max(0, 1 - Math.hypot(e.x - p.x, (e.y ?? p.y) - p.y) / range);

const CUES = {
  portal: (v, e) => { // pitch sweeps towards the new gravity direction
    const up = e.dir < 0;
    tone(up ? 180 : 900, up ? 900 : 180, .45, 'sawtooth', .04);
    tone(up ? 360 : 1400, up ? 1400 : 360, .35, 'sine', .03);
    burst({freq: up ? 1200 : 3000, q: 1, dur: .4, vol: .03, attack: .1});
  },
  'laser-warning': (v, e, p) => tone(300, 900, .6, 'square', v * .012, pan(e, p)),
  'laser-active': (v, e, p) => { burst({freq: 4000, q: .8, dur: .8, vol: v * .07, attack: .02, pan: pan(e, p)}); tone(120, 90, .8, 'sawtooth', v * .03, pan(e, p)); },
  checkpoint: () => { beep(440, 660, .2, 'triangle', .03); beep(660, 990, .3, 'sine', .025, .1); }
};

export const gravitySound = {
  setActive(on) {
    if (on || !active) return;
    active = false;
    if (nodes) nodes.master.gain.setTargetAtTime(0, ac.currentTime, .15);
  },
  update(gs) {
    if (!setup()) return;
    const f = gs.gravity, p = gs.p;
    if (!f || !p) return;
    if (!active) { active = true; nextBlip = f.time + 2; nextCrawl = f.time; }
    const t = ac.currentTime;
    nodes.master.gain.setTargetAtTime(.9, t, .3);

    const nearestSaw = f.saws.reduce((best, s) => Math.min(best, Math.hypot(s.x - (p.x + 6), s.y - (p.y + 7))), 999);
    const closeness = clamp(1 - nearestSaw / 160, 0, 1);
    nodes.whineGain.gain.setTargetAtTime(closeness * .012, t, .08);
    nodes.whine.frequency.setTargetAtTime(700 + closeness * 900, t, .1);

    for (const e of f.events) {
      const cue = CUES[e.type];
      if (!cue) continue;
      const v = e.type === 'portal' || e.type === 'checkpoint' ? 1 : reach(e, p);
      if (v > .02) cue(v, e, p);
    }
    if (f.time >= nextBlip) { nextBlip = f.time + rand(2.5, 5); tone(rand(900, 1800), rand(900, 1800), .08, 'square', .006, rand(-.6, .6)); }
    if (f.time >= nextCrawl) {
      nextCrawl = f.time + .22;
      const near = f.crawlers.find(c => Math.abs(c.x - p.x) < 140);
      if (near) burst({freq: 3000, q: 4, dur: .03, vol: .02 * (1 - Math.abs(near.x - p.x) / 140), pan: pan(near, p)});
    }
  },
  death() {
    if (!ac) return;
    tone(900, 60, .5, 'sawtooth', .05);
    burst({freq: 5000, q: .6, dur: .3, vol: .05});
  }
};
