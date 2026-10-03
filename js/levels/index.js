import {VH, T} from '../config.js';
import {clamp} from '../utils.js';
import {assetFiles} from '../assets.js';
import {MAPS} from './classic-maps.js';
import {
  createClassic, stepClassic, groundClassic, damageClassic,
  interactClassic, onDeathClassic, cameraClassic, shakeClassic
} from './classic.js';
import {drawClassicBackground, drawClassicWorld} from './classic-render.js';

import {
  createFoundry, createFoundryLayout, stepFoundry,
  foundryDamage, foundryInteractions, resetFoundryBodies,
  resolveFoundryGround
} from './foundry.js';
import {drawFoundryBackground, drawFoundryWorld} from './foundry-render.js';
import {foundrySound} from './foundry-audio.js';

import {
  createToxic, createToxicLayout, stepToxic,
  toxicDamage, hurtToxic, toxicInteractions,
  resetToxic, resolveToxicGround
} from './toxic.js';
import {drawToxicBackground, drawToxicWorld} from './toxic-render.js';
import {toxicSound} from './toxic-audio.js';

import {
  INDUSTRIAL, createIndustrial, createIndustrialLayout,
  stepIndustrial, industrialDamage, industrialInteractions,
  resetIndustrial, resolveIndustrialGround, industrialCamera
} from './industrial.js';
import {drawIndustrialBackground, drawIndustrialWorld} from './industrial-render.js';
import {industrialSound} from './industrial-audio.js';

import {
  CRYPT, createCrypt, createCryptLayout, stepCrypt, resolveCryptGround,
  cryptDamage, cryptInteractions, cryptCamera, resetCrypt
} from './crypt.js';
import {drawCryptBackground, drawCryptWorld} from './crypt-render.js';
import {cryptSound} from './crypt-audio.js';

import {
  CINDER, createCinder, createCinderLayout, stepCinder, resolveCinderGround,
  cinderDamage, cinderInteractions, cinderCamera, resetCinder
} from './cinder.js';
import {drawCinderBackground, drawCinderWorld} from './cinder-render.js';
import {cinderSound} from './cinder-audio.js';

import {
  GRAVITY, createGravity, createGravityLayout, stepGravity, gravityDamage,
  gravityInteractions, gravityCamera, resetGravity
} from './gravity.js';
import {drawGravityBackground, drawGravityWorld} from './gravity-render.js';
import {gravitySound} from './gravity-audio.js';

import {
  MYCO, createMyco, createMycoLayout, stepMyco, resolveMycoGround,
  mycoDamage, mycoInteractions, mycoCamera, resetMyco
} from './myco.js';
import {drawMycoBackground, drawMycoWorld} from './myco-render.js';
import {mycoSound} from './myco-audio.js';

import {
  FINALE, createFinale, createFinaleLayout, stepFinale, finaleDamage,
  finaleInteractions, finaleCamera, resetFinale
} from './finale.js';
import {drawFinaleBackground, drawFinaleWorld} from './finale-render.js';
import {finaleSound} from './finale-audio.js';

function classicLevel(name, layout, theme, extra = {}) {
  return {
    name,
    layout,
    theme,
    key: 'classic',
    dust: theme === 'meadow' ? '#ecd2a8' : '#9fc0b0',
    assets: [],
    worldHeight: VH,
    scrollHeight: VH,
    airJump: false,
    create: () => createClassic(layout),
    step: (gs, dt, vw) => stepClassic(gs, dt, vw),
    ground: (gs, p, prevBottom) => groundClassic(gs, p, prevBottom),
    damage: (gs, dt) => damageClassic(gs, dt),
    interact: gs => interactClassic(gs),
    onDeath: gs => onDeathClassic(gs),
    camera: (gs, vw) => cameraClassic(gs, vw),
    shake: gs => shakeClassic(gs),
    drawBackground: (ctx, vw, gs) => drawClassicBackground(ctx, vw, gs, theme),
    drawWorld: (ctx, vw, gs) => drawClassicWorld(ctx, vw, gs, theme, extra.hints),
    ...extra
  };
}

const FOUNDRY = {
  name: 'FOUNDRY',
  key: 'foundry',
  dust: '#d0b090',
  layout: createFoundryLayout(),
  assets: assetFiles('l3', 'l3-bg'),
  worldHeight: VH,
  scrollHeight: VH,
  airJump: true,
  sound: foundrySound,
  create: () => createFoundry(),
  step: (gs, dt, vw) => stepFoundry(gs, dt, vw),
  ground: (gs, p, prevBottom) => resolveFoundryGround(gs, p, prevBottom),
  damage: (gs) => {
    const res = foundryDamage(gs);
    if (res === 'death') {
      foundrySound.cue('death', gs.p.x, gs.p.x);
      return 'death';
    }
    return null;
  },
  interact: gs => foundryInteractions(gs),
  onDeath: gs => resetFoundryBodies(gs.foundry),
  camera: (gs, vw) => {
    const p = gs.p;
    if (p) {
      const target = clamp(p.x + p.w / 2 - vw / 2 + p.face * 48, 0, Math.max(0, 192 * T - vw));
      gs.camX += (target - gs.camX) * 0.1;
    }
  },
  shake: gs => [Math.min(2.4, gs.foundry.shake), 0.65],
  drawBackground: (ctx, vw, gs) => drawFoundryBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawFoundryWorld(ctx, vw, gs.camX, gs)
};

const TOXIC = {
  name: 'TOXIC WASTE',
  key: 'toxic',
  dust: '#b8e070',
  layout: createToxicLayout(),
  assets: assetFiles('l4', 'l4-bg'),
  worldHeight: VH,
  scrollHeight: VH,
  airJump: true,
  sound: toxicSound,
  create: () => createToxic(),
  step: (gs, dt, vw) => stepToxic(gs, dt, vw),
  ground: (gs, p, prevBottom) => resolveToxicGround(gs, p, prevBottom),
  damage: (gs, dt) => {
    let res = toxicDamage(gs, dt);
    if (res === 'hurt') res = hurtToxic(gs);
    if (res === 'death') {
      toxicSound.cue('death', gs.p.x, gs.p.x);
      return 'death';
    }
    return null;
  },
  interact: gs => toxicInteractions(gs),
  onDeath: gs => resetToxic(gs.toxic),
  camera: (gs, vw) => {
    const p = gs.p;
    if (p) {
      const target = clamp(p.x + p.w / 2 - vw * (p.face > 0 ? 0.38 : 0.62), 0, Math.max(0, 400 * T - vw));
      gs.camX += (target - gs.camX) * 0.1;
    }
  },
  shake: gs => [Math.min(1.8, gs.toxic.shake), 0.55],
  drawBackground: (ctx, vw, gs) => drawToxicBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawToxicWorld(ctx, vw, gs.camX, gs)
};

const INDUSTRIAL_LEVEL = {
  name: 'INDUSTRIAL',
  key: 'industrial',
  dust: '#b0b4a8',
  layout: createIndustrialLayout(),
  assets: assetFiles('l5', 'l5-bg'),
  worldHeight: INDUSTRIAL.height,
  scrollHeight: INDUSTRIAL.height,
  airJump: false,
  sound: industrialSound,
  create: () => createIndustrial(),
  step: (gs, dt, vw) => stepIndustrial(gs, dt, vw),
  ground: (gs, p, prevBottom) => resolveIndustrialGround(gs, p, prevBottom),
  damage: (gs, dt) => (industrialDamage(gs, dt) ? 'death' : null),
  interact: gs => {
    const done = industrialInteractions(gs);
    if (done && industrialSound.unlock) industrialSound.unlock();
    return done;
  },
  onDeath: gs => resetIndustrial(gs.industrial),
  camera: (gs, vw) => industrialCamera(gs, vw),
  shake: gs => [Math.min(1.5, gs.industrial.shake), 0.5],
  drawBackground: (ctx, vw, gs) => drawIndustrialBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawIndustrialWorld(ctx, vw, gs.camX, gs)
};

const CRYPT_LEVEL = {
  name: 'ARVOHLAR DAHMAZI',
  key: 'crypt',
  dust: '#a8a0c0',
  layout: createCryptLayout(),
  assets: [],
  worldHeight: CRYPT.height,
  scrollHeight: CRYPT.height,
  airJump: false,
  sound: cryptSound,
  create: () => createCrypt(),
  step: (gs, dt, vw) => stepCrypt(gs, dt, vw),
  ground: (gs, p, prevBottom) => resolveCryptGround(gs, p, prevBottom),
  damage: gs => {
    if (!cryptDamage(gs)) return null;
    cryptSound.death();
    return 'death';
  },
  interact: gs => cryptInteractions(gs),
  onDeath: gs => resetCrypt(gs.crypt, gs.spawnX),
  camera: (gs, vw) => cryptCamera(gs, vw),
  shake: gs => [Math.min(2, gs.crypt.shake), 0.6],
  drawBackground: (ctx, vw, gs) => drawCryptBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawCryptWorld(ctx, vw, gs.camX, gs)
};

const CINDER_LEVEL = {
  name: "CHO'G'LANMA MINORA",
  key: 'cinder',
  dust: '#e0a878',
  layout: createCinderLayout(),
  assets: [],
  worldHeight: CINDER.height,
  scrollHeight: CINDER.height,
  airJump: false,
  sound: cinderSound,
  create: () => createCinder(),
  step: (gs, dt) => stepCinder(gs, dt),
  ground: (gs, p, prevBottom) => resolveCinderGround(gs, p, prevBottom),
  damage: gs => {
    if (!cinderDamage(gs)) return null;
    cinderSound.death();
    return 'death';
  },
  interact: gs => cinderInteractions(gs),
  onDeath: gs => resetCinder(gs.cinder, gs.spawnY),
  camera: (gs, vw) => cinderCamera(gs, vw),
  shake: gs => [Math.min(1.5, gs.cinder.shake), 1],
  drawBackground: (ctx, vw, gs) => drawCinderBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawCinderWorld(ctx, vw, gs.camX, gs)
};

const GRAVITY_LEVEL = {
  name: 'TORTISH LABORATORIYASI',
  key: 'gravity',
  dust: '#9ae8ff',
  layout: createGravityLayout(),
  assets: [],
  worldHeight: GRAVITY.height,
  scrollHeight: GRAVITY.height,
  airJump: false,
  sound: gravitySound,
  create: gs => createGravity(gs),
  step: (gs, dt, vw) => stepGravity(gs, dt, vw),
  ground: () => {},
  damage: gs => {
    if (!gravityDamage(gs)) return null;
    gravitySound.death();
    return 'death';
  },
  interact: gs => gravityInteractions(gs),
  onDeath: gs => resetGravity(gs.gravity),
  camera: (gs, vw) => gravityCamera(gs, vw),
  shake: gs => [gs.gravity.flip > .6 ? 1 : 0, 1],
  drawBackground: (ctx, vw, gs) => drawGravityBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawGravityWorld(ctx, vw, gs.camX, gs)
};

const MYCO_LEVEL = {
  name: "ZAHARLI QO'ZIQORINLAR",
  key: 'myco',
  dust: '#a8ffd8',
  layout: createMycoLayout(),
  assets: [],
  worldHeight: MYCO.height,
  scrollHeight: MYCO.height,
  airJump: false,
  sound: mycoSound,
  create: () => createMyco(),
  step: (gs, dt, vw) => stepMyco(gs, dt, vw),
  ground: (gs, p, prevBottom) => resolveMycoGround(gs, p, prevBottom),
  damage: gs => {
    if (!mycoDamage(gs)) return null;
    mycoSound.death();
    return 'death';
  },
  interact: gs => mycoInteractions(gs),
  onDeath: gs => resetMyco(gs.myco, gs.spawnX),
  camera: (gs, vw) => mycoCamera(gs, vw),
  shake: gs => [Math.min(2, gs.myco.shake), 0.7],
  drawBackground: (ctx, vw, gs) => drawMycoBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawMycoWorld(ctx, vw, gs.camX, gs)
};

const FINALE_LEVEL = {
  name: 'YAKUNIY QUTQARUV',
  key: 'finale',
  dust: '#d8b090',
  layout: createFinaleLayout(),
  assets: [],
  worldHeight: FINALE.height,
  scrollHeight: FINALE.height,
  airJump: false,
  sound: finaleSound,
  create: () => createFinale(),
  step: (gs, dt, vw) => stepFinale(gs, dt, vw),
  ground: () => {},
  damage: gs => {
    if (!finaleDamage(gs)) return null;
    finaleSound.death();
    return 'death';
  },
  interact: gs => finaleInteractions(gs),
  onDeath: gs => resetFinale(gs.finale, gs.spawnX),
  camera: (gs, vw) => finaleCamera(gs, vw),
  shake: gs => [Math.min(3, gs.finale.shake), 0.8],
  drawBackground: (ctx, vw, gs) => drawFinaleBackground(ctx, vw, gs.camX, gs),
  drawWorld: (ctx, vw, gs) => drawFinaleWorld(ctx, vw, gs.camX, gs)
};

export const LEVELS = [
  classicLevel('BIRINCHI QADAM', MAPS.firstSteps, 'meadow', {
    airJump: true,
    hints: [['SPACE / W / UP: HAVODA HAM SAKRASH', 32, 176]]
  }),
  classicLevel('OLOV VA SUV', MAPS.fireAndWater, 'forest', {
    airJump: true,
    hints: [['LVL 2: OLOV VA SUV', 32, 157], ['SUVGA TUSHMA! OLOVNI SAKRAB OT.', 32, 170]]
  }),
  FOUNDRY,
  TOXIC,
  INDUSTRIAL_LEVEL,
  CRYPT_LEVEL,
  CINDER_LEVEL,
  GRAVITY_LEVEL,
  MYCO_LEVEL,
  FINALE_LEVEL,
];

export const activeLevel = gs => LEVELS[gs.currentLevel];
export const SOUNDS = [foundrySound, toxicSound, industrialSound, cryptSound, cinderSound, gravitySound, mycoSound, finaleSound];
export const RUNTIME_KEYS = ['classic', 'foundry', 'toxic', 'industrial', 'crypt', 'cinder', 'gravity', 'myco', 'finale'];
