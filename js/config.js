// Logical resolution: the game world is drawn at 480×270 and scaled up to fill the canvas.
export const VW = 480;
export const VH = 270;
export const T = 16;
export const STEP = 1000 / 60;

// Player feel, in pixels per 60 Hz frame (the scene converts to Arcade's px/s).
export const ACC = 0.22;
export const FRICTION = 0.78;
export const MAXV = 2.4;
export const JUMP = 5.8;
export const GRAV = 0.28;
export const MAXFALL = 6.5;
// Lives are refilled to START_LIVES at the start of every level; bandages and soul orbs can raise them to MAX_LIVES.
export const START_LIVES = 10;
export const MAX_LIVES = 15;
