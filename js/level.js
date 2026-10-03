import {T, START_LIVES} from './config.js';
import {gameState} from './state.js';
import {setGrid} from './world.js';
import {preload} from './assets.js';
import {LEVELS, RUNTIME_KEYS} from './levels/index.js';

export function loadLevel(index) {
  const gs = gameState;
  if (index >= LEVELS.length) {
    gs.state = 'won';
    return;
  }
  const level = LEVELS[index];
  gs.currentLevel = index;
  gs.camX = gs.camY = 0;
  gs.cameraReset = false;
  gs.exitX = gs.exitY = 0;
  gs.checkpoint = 0;
  gs.lives = START_LIVES; // every level starts with a full set of lives
  gs.spawnGrav = 1;
  gs.levelTick = 0;
  gs.bloodParticles = [];

  setGrid(level.layout);
  level.layout.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'P') { gs.spawnX = x * T; gs.spawnY = y * T; }
      else if (row[x] === 'E') { gs.exitX = x * T; gs.exitY = y * T; }
    }
  });
  for (const key of RUNTIME_KEYS) gs[key] = null;
  const runtime = level.create(gs);
  if (level.key) gs[level.key] = runtime;

  // Fetch this level's art, then the next level's so the transition has it ready.
  preload(level.assets);
  if (LEVELS[index + 1]) preload(LEVELS[index + 1].assets);
}
