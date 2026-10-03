# Level 4 x Toxic Waste

## Inventory and plan (before implementation)

The complete assets directory contains six l4 PNGs. They are the exclusive source of Level 4 environment geometry; player.png and the existing character renderer remain shared. There are no separate audio files, ladder sprite or standalone exit sprite. Use stairs, tanks, warning lights, chains and the containment door cropped from l4-bg.png. All crop sizes set the rendered height proportionally. Collision is independent of PNG bounds.

| PNG | Use / source regions | Render size | Collider |
| --- | --- | --- | --- |
| l4-bg.png (1672x941) | Factory parallax; tank (690,12,225,330), stairs (143,410,131,105), lamp (307,270,32,18), door (35,303,102,102), supports (462,10,54,245) | Wall height270; tank100x146.7; stairs80x64.1; lamp12x6.75; door72x72 | Background/props none; slope collider for stairs; door exit trigger |
| l4-tile1.png (1448x1086) | Platform top (435,379,200,180); bridge top (435,379,200,120); corroded supports; debris | Tile48x43.2 repeated; bridge64x38.4; debris14x12.4 | Top-only AABB; collapse at800ms; debris AABB |
| l4-tuzoq1.png (1448x1086) | Pool liquid (430,518,240,205); pool lip / small leak; chemical tank decoration | Liquid48x41 repeated and clipped to pool; full tank190x101 | Pool AABB, instant death; small leak AABB |
| l4-tuzoq2.png (1448x1086) | Barrel (214,207,285,335); barrel assembly (40,185,1370,700); pump | Barrel28x32.9; assembly180x92 | Props none; unstable barrel arms before a floor leak |
| l4-tuzoq3.png (1254x1254) | Rusted/leaking pipe, pipe head (20,35,1200,310), acid stream (774,360,126,620) | Pipe64x16.53; spray PNG14x68.89 rotated; individual acid drops are particles | Predictable drip circle; timed spray AABB |
| l4-gaz.png (1254x1254) | Fan housing and rotor crops; green gas cloud (850,620,340,490) | Housing88x88; rotor40x46.8; gas96x138.4 with low opacity | Fan airflow is safe; gas exposure region and timer |

## Layout

6400 world pixels, eight sections: entry0x800, pools800x1600, drips1600x2400, gas room2400x3200, corrosion3200x4000, barrels4000x4800, spray4800x5504, escape5504x6400. A high route avoids the dense gas near the floor. Moving platforms carry the player; one-way tops keep transparent parts non-solid. Midlevel checkpoints at2368 and3900; pre-chase checkpoint at5424. The final tank breaks only after the player enters the chase. Rising toxic liquid has a grace period, gradual acceleration, ventilation slowdown and resets after death.

Gas starts harmless, warns after1sec and causes periodic damage after2.5sec; leaving the room or ventilation clears exposure. Acid drips use a repeating drop/drop/pause/drop/pause pattern with advance glow and hiss. Spray cycles have off, warning, active and cooldown phases. Corroded platforms shake at200ms, separate PNG pieces at400ms, shed dust at600ms and fall at800ms.

## Architecture / scope

js/levels/toxic.js, toxic-render.js and toxic-audio.js, registered as a level module in js/levels/index.js. Level1x3 layouts and dedicated Foundry modules remain unchanged. No external audio library is needed: Level4 SoundManager uses the existing AudioContext, prepared noise buffers, faded chemical ambience, distance attenuation and stereo pan. Particle budget240; lethal drips have a separate bounded collection. Images load once through assets.js. Fixed-step loop supplies dt = STEP/1000. Render culls offscreen props and particles.
