// Har bir levelni haqiqiy fizika bilan o'ynab tekshiradi: nurli qidiruv (beam search)
// o'lmasdan finishgacha yo'l topa olishi kerak. Bu o'tish mumkinligini isbotlamaydi,
// lekin level yutib bo'lmaydigan darajada noto'g'ri bo'lsa, shu testda yiqiladi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLevel, levels } from '../js/level.js';
import { gameState as gs } from '../js/state.js';
import { keys } from '../js/input.js';
import { spawnPlayer, updatePlayer, die } from '../js/player.js';
import { updateEnemies } from '../js/enemy.js';
import { stepToxic, toxicDamage, hurtToxic, toxicInteractions } from '../js/toxic.js';
import { stepFoundry, foundryDamage, foundryInteractions } from '../js/foundry.js';
import { VH, START_LIVES, STEP } from '../js/config.js';

// main.js update() ning DOM'siz nusxasi
function tick(a) {
  keys.left = !!a.left; keys.right = !!a.right; keys.jump = !!a.jump;
  if (a.jump && !gs._prevJump) gs.p.jumpBuf = 8; // onJump: keydown fronti
  gs._prevJump = !!a.jump;
  const lvl = gs.currentLevel;
  const deaths = gs.deaths;
  gs.levelTick++;
  gs.levelTime += STEP / 1000;
  if (lvl === 2) stepFoundry(gs, STEP / 1000, 480);
  if (lvl === 3) stepToxic(gs, STEP / 1000, 480);
  let won = false;
  updatePlayer({ getVH: () => VH, nextLevel: () => { won = true; } });
  if (won) return 'won';
  if (gs.state !== 'playing') return 'died';
  updateEnemies({ getVH: () => VH });
  if (lvl === 2) {
    if (foundryDamage(gs) === 'death') die({ getVH: () => VH });
    else if (foundryInteractions(gs)) return 'won';
  }
  if (lvl === 3) {
    let d = toxicDamage(gs, STEP / 1000);
    if (d === 'hurt') d = hurtToxic(gs);
    if (d === 'death') die({ getVH: () => VH });
    else if (toxicInteractions(gs)) return 'won';
  }
  if (gs.deaths !== deaths) return 'died';
  return 'ok';
}

// Holat nusxasi (klon) va tiklash
const snapshot = () => structuredClone({ ...gs, p: gs.p, _prevJump: gs._prevJump });
function restore(snap) {
  for (const k of Object.keys(gs)) delete gs[k];
  Object.assign(gs, structuredClone(snap));
}

const ACTIONS = [
  {}, { left: 1 }, { right: 1 }, { jump: 1 }, { right: 1, jump: 1 }, { left: 1, jump: 1 }
];
// Avval tez sozlama; o'tmasa aniqroq (kichik qadam, keng qidiruv) bilan qayta tekshiriladi
const FAST = { hold: 6, beam: 40 };
const FINE = { hold: 3, beam: 150 };
const MAX_STEPS = 900;   // ~ 5400 kadr (90 soniya) chegarasi

function solveLevel(index, { hold, beam }) {
  loadLevel(index);
  gs.p = spawnPlayer();
  gs.state = 'playing';
  gs.lives = START_LIVES;
  gs.deaths = 0;
  gs._prevJump = false;
  const start = snapshot();
  let frontier = [{ snap: start, x: gs.p.x }];
  for (let step = 0; step < MAX_STEPS; step++) {
    const next = [];
    const seen = new Set();
    for (const node of frontier) {
      for (const act of ACTIONS) {
        restore(node.snap);
        let res = 'ok';
        for (let f = 0; f < hold && res === 'ok'; f++) res = tick(act);
        if (res === 'won') return { won: true, steps: step, frames: step * hold };
        if (res === 'died') continue;
        const p = gs.p;
        const key = `${Math.round(p.x)}|${Math.round(p.y)}|${p.onGround ? 1 : 0}|${p.jumps}`;
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ snap: snapshot(), x: p.x });
      }
    }
    if (!next.length) return { won: false, steps: step };
    next.sort((a, b) => b.x - a.x);
    frontier = next.slice(0, beam);
  }
  return { won: false, steps: MAX_STEPS };
}

for (let i = 0; i < levels.length; i++) {
  test(`level ${i + 1} can be finished without dying`, () => {
    const r = solveLevel(i, FAST).won ? { won: true } : solveLevel(i, FINE);
    assert.ok(r.won, `level ${i + 1}: yo'l topilmadi (steps=${r.steps})`);
  });
}

test("mag'lubiyatdan keyin o'sha level qayta boshlanadi", async()=>{
  const { prepareStart } = await import('../js/game-flow.js');
  gs.currentLevel = 4; gs.lives = 0; gs.deaths = 5; gs.state = 'over';
  prepareStart(gs, loadLevel, spawnPlayer, START_LIVES);
  assert.equal(gs.currentLevel, 4);
  assert.equal(gs.lives, START_LIVES);
  assert.equal(gs.deaths, 0);
  gs.state = 'won'; prepareStart(gs, loadLevel, spawnPlayer, START_LIVES);
  assert.equal(gs.currentLevel, 0);
});
