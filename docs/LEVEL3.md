# Level 3 ? Foundry asset and implementation plan

Only Level 3 uses the foundry runtime. Menu and Level 1/2 layouts and mechanics stay as they are. World coordinates use the existing 270px canvas height and 60Hz fixed-step loop (dt = STEP / 1000).

## Asset audit

There are 8 Level 3 PNGs and no audio files. No dedicated ladder, chain, press, steam pipe, molten pool, debris, generator or exit PNG exists. Use cropped parts of the existing industrial artwork for machinery and pipe outlets, the bridge beam for the press/lift/gate, and the wall's braces for suspended supports. Molten metal, steam, flame, smoke and lighting are effects. No environment geometry is drawn as replacement primitives.

| Filename | Use / source crop (x,y,w,h) | Render size | Invisible collision |
| --- | --- | --- | --- |
| l3-bg.png | Distant wall; existing pipes, fan housing, overhead structures | Height 270; width 480, repeated, parallax .12 | None |
| l3-tile3.png | Platform modules; furnace/machine; pipe/lamp crops (240,75,410,185) | Module 48 ? 21.66, repeated; machine 176 ? 79.41 | Platform top AABB; decor none |
| l3-tile2.png | Lift / collapse / overhead crane / press / freight exit (665,236,320,157) | Width 56 ? height 27.48; press width 64 ? 31.4 | Top-only platform; press crush AABB; exit trigger |
| l3-tile1.png | Real sloped ramp (500,282,305,195) | 64 ? 40.92 | Sloped top collider, separate from transparent pixels |
| l3-g'ildirak.png | Rotating stationary saw; distant rotating machinery (400,250,510,510) | 30 ? 30; decor 64 ? 64 | Circle radius 15; decor none |
| l3-g'ildirak2.png | Traveling saw (590,300,360,350) | 28 ? 27.22 or 30 ? 29.17 | Circle radius 14?15 |
| l3-lazer.png | Timed laser gate (875,375,250,270); inactive gate uses cropped emitters | 40 ? 43.2 | Beam AABB only while active |
| l3-tuzoq.png | Spikes (325,224,112,70); crop excludes white damaged region | 24 ? 15 | Inset lethal AABB |

Sprite crop dimensions determine render height, always preserving aspect ratio. Moving bodies and their colliders share coordinates, but never derive collision from full PNG bounds. Missing/unloaded PNGs do not produce substitute shapes.

## Route

1. Entry at x48, floor y208: safe first steps, real ramp and warning steam outlet.
2. Molten basin x384?832: small fixed, traveling and collapsing platforms, rotating saw.
3. Press hall x832?1072: timed overhead press and fragile bridge, then checkpoint on safe ground.
4. Ascent x1072?1552: staggered platforms and a ramp, steam/fire timing, upper landing.
5. Machine hall x1552?2256: descent, large furnace, debris warnings, second press and checkpoint.
6. Escape x2256?2944: molten metal, diagonal/vertical platforms, saw, fire, laser. Safe freight exit x2992.

Hazards have deterministic warning phases; no random lethal spawning. Steam knocks back and grants short protection; molten metal remains instant death even during protection. Respawn resets temporary bodies and debris near the checkpoint. Offscreen particle emissions and audio triggers are culled. Particles are limited to 220. Graphics are preloaded once using Image. No external audio dependency: a Level 3 SoundManager extends the existing Web Audio architecture with prebuilt noise buffers, faded ambient loops, distance attenuation and varied pitch.
