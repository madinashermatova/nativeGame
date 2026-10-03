// Source art lives in assets/source/. Only these crops ship to the browser.
// crop: [x, y, w, h] in source pixels (omit for the whole image).
// maxW: widest on-screen size in logical pixels; sprites are stored at maxW * RENDER_SCALE
// at most, which matches a 1080p canvas (270 logical rows -> 4x). Larger screens upscale.
export const RENDER_SCALE = 4;

export const ATLASES = {
  l3: {
    'l3.metal': {src: 'l3-tile3.png', crop: [240, 75, 410, 185], maxW: 176},
    'l3.pipe': {src: 'l3-tile3.png', crop: [263, 131, 157, 125], maxW: 54},
    'l3.lamp': {src: 'l3-tile3.png', crop: [426, 133, 45, 66], maxW: 12},
    'l3.brace': {src: 'l3-tile3.png', crop: [554, 121, 31, 120], maxW: 6},
    'l3.chunk': {src: 'l3-tile3.png', crop: [559, 80, 51, 38], maxW: 18},
    'l3.bridge': {src: 'l3-tile2.png', crop: [665, 236, 320, 157], maxW: 114},
    'l3.beam': {src: 'l3-tile2.png', crop: [670, 238, 308, 62], maxW: 80},
    'l3.ramp': {src: 'l3-tile1.png', crop: [500, 282, 305, 195], maxW: 64},
    'l3.gear': {src: "l3-g'ildirak.png", crop: [400, 250, 510, 510], maxW: 64},
    'l3.movingGear': {src: "l3-g'ildirak2.png", crop: [590, 300, 360, 350], maxW: 30},
    'l3.laser': {src: 'l3-lazer.png', crop: [875, 375, 250, 270], maxW: 40},
    'l3.leftEmitter': {src: 'l3-lazer.png', crop: [880, 376, 55, 267], maxW: 12},
    'l3.rightEmitter': {src: 'l3-lazer.png', crop: [1054, 376, 65, 267], maxW: 14},
    'l3.spikes': {src: 'l3-tuzoq.png', crop: [325, 224, 112, 70], maxW: 24},
  },
  l4: {
    'l4.tile': {src: 'l4-tile1.png', crop: [435, 379, 200, 180], maxW: 48},
    'l4.bridge': {src: 'l4-tile1.png', crop: [435, 379, 200, 120], maxW: 80},
    'l4.support': {src: 'l4-tile1.png', crop: [94, 600, 78, 290], maxW: 8},
    'l4.debris': {src: 'l4-tile1.png', crop: [107, 600, 70, 62], maxW: 14},
    'l4.liquid': {src: 'l4-tuzoq1.png', crop: [430, 518, 240, 205], maxW: 48},
    'l4.leak': {src: 'l4-tuzoq1.png', crop: [520, 540, 170, 45], maxW: 40},
    'l4.poolTank': {src: 'l4-tuzoq1.png', crop: [5, 214, 1438, 710], maxW: 190},
    'l4.stripe': {src: 'l4-tuzoq2.png', crop: [250, 552, 190, 88], maxW: 28},
    'l4.barrel': {src: 'l4-tuzoq2.png', crop: [214, 207, 285, 335], maxW: 28},
    'l4.barrelAssembly': {src: 'l4-tuzoq2.png', crop: [40, 185, 1370, 700], maxW: 170},
    'l4.pipe': {src: 'l4-tuzoq3.png', crop: [20, 35, 1200, 310], maxW: 140},
    'l4.pipeLeg': {src: 'l4-tuzoq3.png', crop: [933, 492, 248, 552], maxW: 28},
    'l4.stream': {src: 'l4-tuzoq3.png', crop: [774, 360, 126, 620], maxW: 18},
    'l4.fan': {src: 'l4-gaz.png', maxW: 88},
    'l4.rotor': {src: 'l4-gaz.png', crop: [345, 330, 470, 550], maxW: 40},
    'l4.mist': {src: 'l4-gaz.png', crop: [850, 620, 340, 490], maxW: 96},
    'l4.tank': {src: 'l4-bg.png', crop: [690, 12, 225, 330], maxW: 120},
    'l4.stairs': {src: 'l4-bg.png', crop: [143, 410, 131, 105], maxW: 80},
    'l4.lamp': {src: 'l4-bg.png', crop: [307, 270, 32, 18], maxW: 18},
    'l4.door': {src: 'l4-bg.png', crop: [35, 303, 102, 102], maxW: 72},
    'l4.chain': {src: 'l4-bg.png', crop: [1070, 0, 21, 186], maxW: 6},
  },
  l5: {
    'l5.platform': {src: 'l5-tile1.png', crop: [165, 129, 378, 70], maxW: 220},
    'l5.moving': {src: 'l5-tile2.png', crop: [109, 80, 244, 120], maxW: 160},
    'l5.broken': {src: 'l5-tile2.png', crop: [109, 80, 244, 66], maxW: 160},
    'l5.panel': {src: 'l5-tusiq1.png', crop: [804, 532, 48, 48], maxW: 48},
    'l5.panelAlt': {src: 'l5-tusiq1.png', crop: [804, 628, 48, 48], maxW: 48},
    'l5.support': {src: 'l5-tusiq1.png', crop: [775, 375, 100, 374], maxW: 30},
    'l5.lamp': {src: 'l5-tusiq1.png', crop: [876, 459, 39, 57], maxW: 10},
    'l5.gear': {src: 'l5-arra.png', crop: [232, 98, 138, 144], maxW: 70},
    'l5.blade': {src: 'l5-arra1.png', crop: [642, 679, 247, 78], maxW: 44},
    'l5.sawMount': {src: 'l5-arra1.png', crop: [727, 561, 93, 117], maxW: 14},
    'l5.electric': {src: 'l5-tuzoq1.png', crop: [644, 506, 141, 137], maxW: 14},
    'l5.chain': {src: 'l5-tuzoq1.png', crop: [706, 210, 30, 276], maxW: 4},
    'l5.pipe': {src: 'l5-zahar1.png', crop: [522, 145, 112, 140], maxW: 20},
    'l5.reactor': {src: 'l5-zahar1.png', crop: [495, 133, 547, 515], maxW: 370},
    'l5.liquid': {src: 'l5-zaharli-suv.png', crop: [154, 321, 199, 61], maxW: 64},
    'l5.liquidBody': {src: 'l5-bg.png', crop: [600, 1120, 100, 60], maxW: 64},
    'l5.door': {src: 'l5-bg.png', crop: [1150, 1059, 64, 80], maxW: 62},
  },
};

// Opaque full-screen art: lossy WebP, kept at a size that fills 270 logical rows at 4x.
export const BACKGROUNDS = {
  'l3-bg': {src: 'l3-bg.png'},
  'l4-bg': {src: 'l4-bg.png'},
  'l5-bg': {src: 'l5-bg.png', crop: [370, 275, 520, 520]},
};
