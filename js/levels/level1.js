import { TILE } from "../config.js";

const rows = [
    "................................",
    "................................",
    "........##.......###............",
    "................................",
    "................................",
    "...........####.................",
    "....................##..........",
    "................................",
    "..####..........................",
    "................................",
    "................................",
    "################################"
];

const solidTiles = new Set();

for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {

        if (rows[row][col] === "#") {
            solidTiles.add(`${row},${col}`);
        }

    }
}

export const level1 = {
    id: 1,

    background: "./assets/backgrounds/level1.png",

    rows,

    solidTiles,

    width: rows[0].length * TILE,

    height: rows.length * TILE
};