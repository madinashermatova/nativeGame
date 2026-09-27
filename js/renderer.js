import { TILE } from "./config.js";
import { drawParticles } from "./particles.js";

export function drawGame(
    ctx,
    canvas,
    level,
    player,
    camera
) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    // level
    ctx.fillStyle = "#2b3550";

    for (
        let row = 0;
        row < level.rows.length;
        row++
    ) {

        for (
            let col = 0;
            col < level.rows[row].length;
            col++
        ) {

            if (
                level.rows[row][col] === "#"
            ) {

                ctx.fillRect(
                    col * TILE,
                    row * TILE,
                    TILE,
                    TILE
                );
            }
        }
    }

    // particle

    drawParticles(ctx);

    // player

    if (player.imageReady) {

        ctx.save();

        if (player.vx < 0) {

            ctx.translate(
                player.x + player.w,
                player.y
            );

            ctx.scale(-1, 1);

            ctx.drawImage(
                player.image,
                0,
                0,
                player.w,
                player.h
            );

        } else {

            ctx.drawImage(
                player.image,
                player.x,
                player.y,
                player.w,
                player.h
            );
        }

        ctx.restore();

    } else {

        ctx.fillStyle = "#ff5d73";

        ctx.fillRect(
            player.x,
            player.y,
            player.w,
            player.h
        );
    }

    ctx.restore();
}