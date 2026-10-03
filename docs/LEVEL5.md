# Level 5 — Toxic Factory

World: 1856 × 1376. Route: bottom left → left shaft → upper machinery → dark corridor → right descent → bottom right exit.

## Geometry and artwork

- The central machinery wall and both exterior walls render opaque PNG metal panels over their actual solid collision regions.
- Platforms render as whole sprites with preserved proportions. Wider descent landings overlap enough for controlled drops without having to jump back into earlier platforms.
- Ceiling chains anchor moving platforms and hanging saws.
- Nine suitable l5 images provide metal, platforms, gears, saws, pipes, warning lamps, electricity, reactor, toxic liquid and exit artwork.
- l5-zina.png is not used: the route has no matching stair/ramp collider.
- Background scene fragments are not used as cable or steam sprites. Electric terminals use the electric PNG; discharge, steam and gas are animated effects.
- Saw circles match round sprites; the hanging blade uses an ellipse matching its profile.
- Wall textures are cached; particles cap at 130; emission and rendering are culled in both axes.

## Fair mechanics

Existing speed, gravity, coyote time and normal Level 5 jumps are retained. Moving platforms transfer motion to the player. Vertical platform travel is reduced to keep every ascent jump within reach.

Steam: 2.5 seconds off / 1 second warning / 1.5 seconds active.
Electric: 1.8 seconds off / 0.4 seconds warning / 1.2 seconds active.
Gas: 3 seconds off / 0.5 seconds warning / 2 seconds active.
Gas requires 0.65 seconds exposure. Toxic liquid kills even during respawn immunity.

Six checkpoints lie on the tested route. Death clears trap exposure, resets hazards, restores broken supports and resets escape pressure. Broken supports warn for 0.85 seconds and recover after 4.5 seconds. The exit has a stable landing.

The escape vent gives its own warning and is low enough to jump over. Pressure starts rising after four seconds. A short machinery impact shake is capped at 1.5 logical pixels.

The camera follows a dead zone with exponential damping and extra downward lookahead during descent. Three subdued background layers move at 0.08 / 0.18 / 0.35.

## Completion

All levels use js/transition.js: 1.3 seconds of victory animation and curtain closure, then 0.4 seconds revealing the next level. Gameplay and hazard audio pause during the transition. Level 10 ends on the victory screen.
