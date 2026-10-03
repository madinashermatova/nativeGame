import {SPRITES, BACKGROUNDS, FILES} from './atlas-data.js';

const IMG_DIR = 'assets/images/';
const cache = new Map();

function loadImage(file) {
  if (!file) return null;
  if (cache.has(file)) return cache.get(file);
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = IMG_DIR + file;
  cache.set(file, img);
  return img;
}

export function preload(files = []) {
  for (const file of files) loadImage(file);
}

const imageOf = file => (file ? loadImage(file) : null);
export const ready = img => !!img && (img.width > 0 || img.complete);
export const background = name => imageOf(BACKGROUNDS[name]);

// Returns {img, rect:[x,y,w,h]} once the atlas texture exists, otherwise null.
export function spriteSource(name) {
  const def = SPRITES[name];
  if (!def) throw new Error('Unknown sprite: ' + name);
  const img = imageOf(def[0]);
  return ready(img) ? {img, rect: def.slice(1)} : null;
}

// Every shipped file belonging to an atlas group, e.g. assetFiles('l3', 'l3-bg').
export function assetFiles(...groups) {
  return Object.keys(FILES).filter(f => groups.some(g => f === `atlas-${g}.webp` || f === `${g}.webp`));
}
