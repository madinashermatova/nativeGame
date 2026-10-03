# Level 6 — Arvohlar Dahmazi (haunted crypt)

World: 3200 × 270, a single dark corridor built from a 200 × 17 tile map. All art is drawn in code
(baked brick/cap/ceiling tiles, animated creatures and traps); sound is synthesised with Web Audio.
Light comes only from the player's flickering lantern, braziers, lit candles and the exit, so every trap
carries its own warning glow. Files: `js/levels/crypt.js` (logic), `crypt-render.js`, `crypt-audio.js`.

## Sections
1. **Dahmaz darvozasi** — spike pit, a buried skeleton that claws out of the floor.
2. **Suyaklar po'li** — pop-up floor spikes (rattle → rise → retract), bone ledge with a patrolling skeleton.
3. **Ko'rshapalaklar uyasi** — bats wake (screech), then swoop once; stalactites shake before dropping; rotten bridge.
4. **Arvohlar zali** — ghosts rise from coffins. They freeze (stone, red eyes) while looked at and creep
   up when the player faces away. Two pendulum axes.
5. **Bosuvchi toshlar** — three skull crushers (rumble → slam → hold → rise).
6. **Qorong'ilik quvadi** — a wall of shadow chases from the last checkpoint; pop-up spikes, moving
   platforms over a spike pit, collapsing bridge, exit door.

## Fairness
Every hazard announces itself: pop-up spikes rattle, bats screech and shake for 0.65 s, stalactites crack for
0.5 s, crushers rumble for 0.9 s, planks creak and give 0.45 s. Respawn immunity (1 s) protects against
enemies and traps, but not against spike pits or the shadow wall. Seven checkpoints; three soul wisps give +1 life.
No air jump in this level (single jump).

## Sound
Beating 41/43 Hz drone, wind, heartbeat that speeds up near ghosts/bats/skeletons/shadow, random whispers
(panned toward a hunting ghost), distant bell, creaks, skeleton clatter, thunder with lightning flashes,
and positional cues for each trap.
