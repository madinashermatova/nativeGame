const IMG_DIR = 'assets/images/';
const load = name => { const i = new Image(); i.src = IMG_DIR + name; return i; };
export const IMG = {
  sky: load('bg-sky.png'),
  far: load('bg-clouds.png'),
  near: load('bg-clouds-near.png'),
  land: load('bg-land.png'),
  player: load('player.png'),
};
export const ready = i => i.complete && i.naturalWidth > 0;
