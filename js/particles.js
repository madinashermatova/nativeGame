const particles = [];

let cooldown = 0;

export function updateParticles(
    player,
    dt
) {

    if (
        Math.abs(player.vx) > 15 &&
        player.grounded
    ) {

        cooldown -= dt;

        if (cooldown <= 0) {

            cooldown = 0.055;

            const dir =
                player.vx >= 0 ? 1 : -1;

            const life =
                0.18 + Math.random() * 0.2;

            particles.push({

                x:
                    player.x +
                    player.w / 2 +
                    dir * 5 +
                    (Math.random() - 0.5) * 6,

                y:
                    player.y +
                    player.h -
                    8 +
                    (Math.random() - 0.5) * 6,

                vx:
                    -dir *
                    (6 + Math.random() * 10),

                vy:
                    -12 +
                    Math.random() * 10,

                radius:
                    1.5 +
                    Math.random() * 2.4,

                life,
                maxLife: life
            });
        }
    }

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle = particles[i];

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        particle.vy += 90 * dt;

        particle.life -= dt;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

export function drawParticles(ctx) {

    for (const particle of particles) {

        const alpha =
            Math.max(
                0,
                particle.life /
                particle.maxLife
            );

        ctx.save();

        ctx.globalAlpha = alpha;

        ctx.fillStyle = "#ff5a5a";

        ctx.shadowColor =
            "rgba(255, 90, 90, 0.7)";

        ctx.shadowBlur = 8;

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.radius *
                (0.9 + alpha * 0.8),
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}