# Level 10 — Yakuniy qutqaruv (final rescue) and the ending

Files: `js/levels/finale.js` (logic), `finale-render.js`, `finale-audio.js`; `js/ending.js` (victory screen).

## Level
130 × 17 tiles. **Part 1** is a short gauntlet (spikes, lava pits, flame vents, sawblades, falling spikes) with
two checkpoints. **Part 2** is the boss arena: the Iron Overseer wakes when you enter and locks the door behind you.
- Phase 1: fireball volleys (ground ring + red column warn 0.9 s before they fall).
- Phase 2: adds laser beams, alternating low (jump / stand on a ledge) and high (stay low).
- Phase 3: adds floor shockwaves that you must jump.
- Surviving 3 attack waves lights the next plate (1 → 2 → 3, left to right); an energy wall blocks the way to the following plate.
  Pressing it stuns the boss for 3 s and damages it. The third plate destroys it, the cage opens and Bandage Girl can be reached.
- Boss progress survives a death (checkpoints at the arena entrance and after plates 1 and 2).

## Victory screen (`ending.js`)
Replaces the old "won" overlay: sunrise over a hill, fireworks, the two heroes hopping together with hearts,
"TABRIKLAYMIZ!", death and soul counters, all ten levels ticking in with checkmarks, and a looping fanfare
(chord arpeggios plus firework pops). ENTER restarts from level 1. The temporary level-jump helper was removed from `main.js`.
