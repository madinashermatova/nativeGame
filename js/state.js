// Shared game state. Level runtimes live under their own key (gs.foundry, gs.toxic, ...).
export const gameState = {
  state: 'menu',      // menu | playing | levelComplete | levelOpening | over | won
  anim: 0,
  camX: 0,
  camY: 0,
  p: null,
  levelTick: 0,
  lives: 10,
  deaths: 0,
  coinCount: 0,
  checkpoint: 0,
  spawnX: 0,
  spawnY: 0,
  spawnGrav: 1,
  exitX: 0,
  exitY: 0,
  currentLevel: 0,
  classic: null,
  foundry: null,
  toxic: null,
  industrial: null,
  crypt: null,
  cinder: null,
  gravity: null,
  myco: null,
  finale: null
};
