import { resolveCollisions } from "./collision.js";
import { PLAYER_TUNE } from "./config.js";

function approach(value, target, maxChange) {

    if (value < target) {
        return Math.min(
            value + maxChange,
            target
        );
    }

    return Math.max(
        value - maxChange,
        target
    );
}

export class Player {

    constructor(x, y) {

        this.x = x;
        this.y = y;

        this.w = 26;
        this.h = 30;

        this.vx = 0;
        this.vy = 0;

        this.grounded = false;

        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;

        this.jumpConsumed = false;

        this.image = new Image();

        this.image.src =
            "./assets/images/player.png";

        this.imageReady = false;

        this.image.onload = () => {
            this.imageReady = true;
        };
    }

    update(dt, actions, level) {

        if (this.grounded) {

            this.coyoteTimer =
                PLAYER_TUNE.coyoteTime;

            this.jumpConsumed = false;

        } else {

            this.coyoteTimer = Math.max(
                0,
                this.coyoteTimer - dt
            );
        }

        if (actions.jumpPressed) {

            this.jumpBufferTimer =
                PLAYER_TUNE.jumpBufferTime;
        }

        this.jumpBufferTimer = Math.max(
            0,
            this.jumpBufferTimer - dt
        );

        const hasInput =
            Math.abs(actions.moveX) > 0.01;

        const rate = hasInput

            ? this.grounded
                ? PLAYER_TUNE.groundAccel
                : PLAYER_TUNE.airAccel

            : this.grounded
                ? PLAYER_TUNE.groundFriction
                : PLAYER_TUNE.airFriction;

        this.vx = approach(
            this.vx,

            hasInput
                ? actions.moveX *
                PLAYER_TUNE.maxRun
                : 0,

            rate * dt
        );

        if (
            this.jumpBufferTimer > 0 &&
            this.coyoteTimer > 0 &&
            !this.jumpConsumed
        ) {

            this.vy =
                -PLAYER_TUNE.jumpSpeed;

            this.grounded = false;

            this.coyoteTimer = 0;

            this.jumpBufferTimer = 0;

            this.jumpConsumed = true;
        }

        this.vy +=
            PLAYER_TUNE.gravity * dt;

        this.vy = Math.min(
            this.vy,
            PLAYER_TUNE.maxFall
        );

        resolveCollisions(
            this,
            level,
            dt
        );
    }
}