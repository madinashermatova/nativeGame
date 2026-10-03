import {T} from './config.js';

// Tile collision grid of the active level. '#' is solid; crumbling blocks are
// solid until they collapse. Outside the side walls counts as solid.
export const world = {cols: 0, rows: 0, grid: [], crumbles: new Map(), width: 0};

export function setGrid(layout) {
  world.rows = layout.length;
  world.cols = layout[0].length;
  world.width = world.cols * T;
  world.grid = layout.map(row => Array.from(row, c => c === '#' || c === 'B' ? c : '.'));
  world.crumbles = new Map();
}

export const crumbleKey = (tx, ty) => ty * world.cols + tx;

export function solid(tx, ty) {
  if (tx < 0 || tx >= world.cols) return true;
  if (ty < 0 || ty >= world.rows) return false;
  const c = world.grid[ty][tx];
  if (c === '#') return true;
  if (c === 'B') return !world.crumbles.get(crumbleKey(tx, ty))?.collapsed;
  return false;
}
