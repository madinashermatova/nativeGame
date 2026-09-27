const keys = new Set();
const pressedQueue = new Set();

const jumpCodes = new Set([
    "Space",
    "KeyW",
    "ArrowUp"
]);

const watchedCodes = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "Space",
    "KeyA",
    "KeyD",
    "KeyW"
]);

window.addEventListener("keydown", (e) => {

    if (watchedCodes.has(e.code)) {
        e.preventDefault();
    }

    if (!e.repeat && !keys.has(e.code)) {
        pressedQueue.add(e.code);
    }

    keys.add(e.code);
});

window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
});

window.addEventListener("blur", () => {
    keys.clear();
    pressedQueue.clear();
});

export function pollActions() {

    const left =
        keys.has("KeyA") ||
        keys.has("ArrowLeft");

    const right =
        keys.has("KeyD") ||
        keys.has("ArrowRight");

    const jumpPressed =
        [...jumpCodes].some(code =>
            pressedQueue.has(code)
        );

    const jumpHeld =
        [...jumpCodes].some(code =>
            keys.has(code)
        );

    pressedQueue.clear();

    return {
        moveX: Number(right) - Number(left),
        jumpHeld,
        jumpPressed
    };
}