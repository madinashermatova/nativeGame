import { TILE } from "./config.js";

function overlaps(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function getNearbyTiles(entity, level) {

    const minCol =
        Math.floor(entity.x / TILE) - 1;

    const maxCol =
        Math.floor(
            (entity.x + entity.w) / TILE
        ) + 1;

    const minRow =
        Math.floor(entity.y / TILE) - 1;

    const maxRow =
        Math.floor(
            (entity.y + entity.h) / TILE
        ) + 1;

    const result = [];

    for (let row = minRow; row <= maxRow; row++) {

        for (let col = minCol; col <= maxCol; col++) {

            if (
                level.solidTiles.has(
                    `${row},${col}`
                )
            ) {

                result.push({
                    x: col * TILE,
                    y: row * TILE,
                    w: TILE,
                    h: TILE
                });
            }
        }
    }

    return result;
}

export function resolveCollisions(player, level, dt) {

    const LEVEL_W = level.width;
    const LEVEL_H = level.height;


    player.x += player.vx * dt;

    player.x = Math.max(
        0,
        Math.min(
            player.x,
            LEVEL_W - player.w
        )
    );

    for (
        const tile of getNearbyTiles(player, level)
    ) {

        if (!overlaps(player, tile)) {
            continue;
        }

        if (player.vx > 0) {
            player.x = tile.x - player.w;
        }
        else if (player.vx < 0) {
            player.x = tile.x + tile.w;
        }

        player.vx = 0;
    }

    player.grounded = false;

    player.y += player.vy * dt;

    player.y = Math.max(
        0,
        Math.min(
            player.y,
            LEVEL_H - player.h
        )
    );

    for (
        const tile of getNearbyTiles(player, level)
    ) {

        if (!overlaps(player, tile)) {
            continue;
        }

        if (player.vy > 0) {

            player.y =
                tile.y - player.h;

            player.grounded = true;
            player.jumpConsumed = false;
        }

        else if (player.vy < 0) {

            player.y =
                tile.y + tile.h;
        }

        player.vy = 0;
    }
}