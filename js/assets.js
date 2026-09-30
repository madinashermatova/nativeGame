const IMG_DIR = 'assets/images/';
const load = name => { const i = new Image(); i.src = IMG_DIR + name; return i; };
export const IMG = {
  sky:    load('bg-sky.png'),
  far:    load('bg-clouds.png'),
  near:   load('bg-clouds-near.png'),
  land:   load('bg-land.png'),
  player: load('player.png'),

  // Zona rasmlari
  bg1:    load('l1-bg1.png'),    // Osmon / quyosh botishi (1-Dunyo foni)
  bg2:    load('l1-bg2.png'),    // O'rmon + shaxta foni  (2-Dunyo foni)
  tiles1: load('l1-bg3.png'),    // Tabiat tileset spritesheet (64px, 5 ustun x 2 qator = 10 sprite)
  deco:   load('l1.1.png'),      // Yog'och qurilmalar dekoratsiyasi
  props:  load('l1.2.png'),      // Toshlar, o'tlar, aravalari props
  hazards:load('l1.3.png'),      // Tikanlar va arra sprite
};
export const ready = i => i && i.complete && i.naturalWidth > 0;
