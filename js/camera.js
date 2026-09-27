export class Camera {

    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(player, canvas, level) {

        const maxY = Math.max(
            0,
            level.height - canvas.height
        );

        const targetY =
            player.y +
            player.h / 2 -
            canvas.height / 2;

        // faqat yuqoriga
        this.y = Math.min(
            this.y,
            targetY
        );

        this.y = Math.max(
            0,
            Math.min(this.y, maxY)
        );

        this.x = 0;
    }
}