import { STEP, MAX_FRAME, MAX_STEPS } from "./config.js";
import { pollActions } from "./input.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";
import { updateParticles } from "./particles.js";
import { drawGame } from "./renderer.js";

export class Game {

    constructor(canvas, level) {

        this.canvas = canvas;

        this.ctx =
            canvas.getContext("2d");

        this.level = level;

        this.player =
            new Player(100, 100);

        this.camera =
            new Camera();

        this.previous = null;
        this.accumulator = 0;

        this.scene = "menu";
    }

    start() {

        this.scene = "playing";

        requestAnimationFrame(
            this.frame.bind(this)
        );
    }

    update(dt, actions) {

        this.player.update(
            dt,
            actions,
            this.level
        );

        updateParticles(
            this.player,
            dt
        );

        this.camera.update(
            this.player,
            this.canvas,
            this.level
        );
    }

    frame(timestampMs) {

        if (this.previous === null) {
            this.previous = timestampMs;
        }

        const frameSeconds =
            Math.min(
                (timestampMs -
                    this.previous) / 1000,
                MAX_FRAME
            );

        this.previous = timestampMs;

        const actions =
            pollActions();

        if (this.scene === "playing") {

            this.accumulator +=
                frameSeconds;

        } else {

            this.accumulator = 0;
        }

        let steps = 0;

        while (
            this.accumulator >= STEP &&
            steps < MAX_STEPS
        ) {

            this.update(
                STEP,
                actions
            );

            this.accumulator -= STEP;

            steps++;
        }

        if (steps === MAX_STEPS) {
            this.accumulator = 0;
        }

        drawGame(
            this.ctx,
            this.canvas,
            this.level,
            this.player,
            this.camera
        );

        requestAnimationFrame(
            this.frame.bind(this)
        );
    }
}