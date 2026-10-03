import {getAudioContext, beep} from '../audio.js';

// Drone loops plus positional hiss/zap cues for Level 5.
let nodes = null, noise = null, next = 0, active = false;

function setup() {
  const ac = getAudioContext();
  if (!ac) return null;
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (!nodes) {
    nodes = [[48, 'sine'], [94, 'triangle'], [168, 'sawtooth']].map(([frequency, type]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = frequency; g.gain.value = 0;
      o.connect(g); g.connect(ac.destination); o.start();
      return {o, g};
    });
  }
  return ac;
}

function hiss(ac, volume, duration = .3) {
  const source = ac.createBufferSource(), filter = ac.createBiquadFilter(), g = ac.createGain();
  source.buffer = noise; source.loop = true;
  filter.type = 'bandpass'; filter.frequency.value = 1800;
  g.gain.setValueAtTime(volume, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + duration);
  source.connect(filter); filter.connect(g); g.connect(ac.destination);
  source.start(); source.stop(ac.currentTime + duration);
}

export const industrialSound = {
  setActive(on) {
    if (on || !active) return;
    active = false;
    next = 0;
    if (nodes) for (const n of nodes) n.g.gain.setTargetAtTime(0, getAudioContext().currentTime, .1);
  },
  update(gs) {
    const ac = setup();
    if (!ac) return;
    active = true;
    const f = gs.industrial, p = gs.p;
    const proximity = o => Math.max(0, 1 - Math.hypot(p.x - o.x, p.y - o.y) / 220);
    const near = f.saws.reduce((v, h) => Math.max(v, proximity(h)), 0);
    nodes[0].g.gain.setTargetAtTime(.009, ac.currentTime, .3);
    nodes[1].g.gain.setTargetAtTime(.005, ac.currentTime, .3);
    nodes[2].g.gain.setTargetAtTime(near * .008, ac.currentTime, .15);
    for (const e of f.events) {
      const v = proximity(e);
      if (!v) continue;
      if (e.type.startsWith('steam') || e.type.startsWith('gas')) hiss(ac, v * .026, e.type.endsWith('active') ? 1.3 : .3);
      else if (e.type.startsWith('electric')) { beep(1400, 220, .16, 'sawtooth', v * .014); hiss(ac, v * .012, .18); }
      else if (e.type === 'checkpoint') beep(620, 940, .15, 'triangle', .025);
      else if (e.type === 'collapse') beep(100, 35, .3, 'sawtooth', v * .025);
    }
    if (f.time < next) return;
    next = f.time + .85;
    if (f.escape.active) { beep(520, 740, .5, 'triangle', .016); return; }
    beep(160, 70, .09, 'sine', .006);
    if (f.hazards.some(h => h.mode === 'active' && h.type === 'steam' && proximity(h) > .2)) hiss(ac, .012, .9);
  },
  unlock() {
    beep(120, 40, .6, 'sawtooth', .028);
    beep(650, 940, .2, 'triangle', .025);
  }
};
