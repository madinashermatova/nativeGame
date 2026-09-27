export const TILE = 32;

export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;
export const MAX_STEPS = 5;

export const PLAYER_TUNE = {
    maxRun: 300,

    groundAccel: 2400,
    groundFriction: 2000,

    airAccel: 1300,
    airFriction: 400,

    gravity: 1900,
    maxFall: 800,

    jumpSpeed: 700,

    coyoteTime: 0.12,
    jumpBufferTime: 0.12
};