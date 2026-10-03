# Level 7 — Cho'g'lanma minora (cinder tower)

A vertical climb, bottom to top, in a 704 × 1120 tower (44 × 70 tile map, tiles only for the walls, floor
and ceiling; all platforms are one-way slabs). Lava starts rising once the player leaves the cellar
(12 px/s, +0.15 px/s per second, capped at 28 px/s) and respawns start it 300 px below the checkpoint.
Files: `js/levels/cinder.js` (logic), `cinder-render.js`, `cinder-audio.js`, shared `synth.js`.

## Traps
- **Red-hot side walls** — touching them kills, which also closes the wall-jump shortcut up the sides.
- **Spring pad** (slab 4) — throws the player ~160 px up to slab 7. `player.js` honours `p.launched` so
  releasing the jump key does not cut the boost.
- **Crumbling slabs** (0.55 s warning, back after 4 s) and **moving slabs** with thrusters.
- **Wall flame jets** — off 2 s / warning 0.7 s (blinking nozzle, sparks) / burning 0.9 s.
- **Spinning fire bars**, **lava geysers** (bubbling warning), **magma boulders** (red column + "!" 0.9 s before they fall),
  **fireballs** that leap from the lava after a splash ring.

## Sound
Furnace rumble and sub tone that swell as the lava closes in, crackling, an alarm horn when it is near,
and positional cues for jets, geysers, boulders, collapse, spring and fireballs.
