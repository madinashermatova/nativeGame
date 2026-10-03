# Level 8 — Tortish laboratoriyasi (anti-gravity lab)

A 420 × 17 tile corridor (6720 px) with a floor and a ceiling. **Portals flip gravity**: after crossing one
the player falls to the opposite surface, walks on it upside down and jumps away from it. Files:
`js/levels/gravity.js` (logic), `gravity-render.js`, `gravity-audio.js`.

## Engine support
- `p.gravDir` (1 or -1) in `js/player.js`: gravity, jump impulse, jump-cut, wall slide and out-of-bounds
  checks are all direction-aware; `physics.moveY` marks the player grounded when it lands on a ceiling.
- `gs.spawnGrav` stores the gravity at the last checkpoint (reset to 1 by `loadLevel`).
- `drawBoy` mirrors the sprite vertically when gravity is flipped.

## Traps
- **Portals** (16 px energy sheets with chevrons that point to the new gravity) flip once per crossing.
- **Spikes** on the floor and on the ceiling — landing zones after a flip are left clear.
- **Sawblades** on vertical rails spanning the gap, **laser walls** (off 1.4 s / warning 0.6 s / on 0.8 s),
  **crawler bots** patrolling the floor or ceiling.
- Six sections, five checkpoints, exit teleporter at the end.

## Sound
Humming sweeping drone, saw whine that rises with proximity, portal sweeps that rise or fall with the new gravity
direction, laser charge/zap, crawler clicks, data blips.
