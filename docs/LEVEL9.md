# Level 9 — Zaharli qo'ziqorinlar (mycelium caves)

A 300 × 17 tile cave (4800 px), bioluminescent and dark. Files: `js/levels/myco.js` (logic),
`myco-render.js`, `myco-audio.js`.

## Core idea
Toxic mushrooms kill whatever touches them. **Chasers hunt the player from behind; run them into a
mushroom and they are petrified** (crystal statue with little mushrooms growing on it). Jump over ground
mushrooms yourself — and do *not* jump under hanging ones.
- **Stalkers** run along the floor (105 px/s vs 144 px/s for the player). They appear 120 px behind after a 0.6 s roar.
- **Floaters** drift at head height and are petrified by hanging mushrooms (then fall and shatter).
- A chaser that is left behind (player leaves its zone) fades away; after a death chasers re-arm or retire
  depending on the checkpoint.

## Traps and sections
Poison pools, timed spore clouds (warning → active), a bounce mushroom that carries the player over the wide
pit in "Spora g'ori", life-giving spore orbs. Five sections, five checkpoints.

## Interactive colour and sound
- A smoothed `danger` value (distance to the nearest hunter) shifts the whole palette from teal/violet to
  blood red, speeds up a red vignette pulse and, when close, splits the colour channels.
- Mushrooms flare and ring a pentatonic note when you brush past (detuned when you are hunted).
- Heartbeat and a dissonant tritone drone grow with danger, stalkers thump behind you, floaters sing a
  rising theremin wail, and petrifying a chaser plays a glass shatter plus a bright chord on that mushroom's note.
