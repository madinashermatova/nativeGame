import {VH} from './config.js';

export const TRANSITION_CLOSE = 1.3;
export const TRANSITION_OPEN = .4;

// `last` marks the final level so the card announces the end instead of a next level.
export function beginLevelTransition(gs, last = false) {
  if (gs.state !== 'playing') return false;
  gs.transition = {level: gs.currentLevel, last, elapsed: 0, phase: 'close'};
  gs.state = 'levelComplete';
  return true;
}

export function stepLevelTransition(gs, dt) {
  const t = gs.transition;
  if (!t) return null;
  t.elapsed += dt;
  if (t.phase === 'close' && t.elapsed >= TRANSITION_CLOSE) {
    t.phase = 'open';
    t.elapsed = 0;
    return 'load';
  }
  if (t.phase === 'open' && t.elapsed >= TRANSITION_OPEN) {
    gs.transition = null;
    gs.state = 'playing';
    return 'finished';
  }
  return null;
}

const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export function drawLevelTransition(ctx, vw, gs) {
  const t = gs.transition;
  if (!t) return;
  ctx.save();
  if (t.phase === 'close') {
    const reveal = ease(t.elapsed / .35), fade = 1 - ease((t.elapsed - .85) / .25);
    ctx.fillStyle = 'rgba(5,9,16,' + (reveal * .64) + ')'; ctx.fillRect(0, 0, vw, VH);
    ctx.globalAlpha = reveal * fade;
    ctx.translate(0, (1 - reveal) * 18);
    ctx.textAlign = 'center'; ctx.font = 'bold 17px monospace'; ctx.fillStyle = '#ecffd6';
    ctx.fillText('LEVEL ' + (t.level + 1) + ' COMPLETE', vw / 2, 112);
    ctx.font = '8px monospace'; ctx.fillStyle = '#ffd58a';
    ctx.fillText(t.last ? 'BARCHA LEVELLAR YAKUNLANDI' : 'KEYINGI LEVEL: ' + (t.level + 2), vw / 2, 135);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(vw / 2 - 72, 154, 144, 3);
    ctx.fillStyle = '#b9e8a0'; ctx.fillRect(vw / 2 - 72, 154, 144 * Math.min(1, t.elapsed / .95), 3);
    for (let i = 0; i < 14; i++) {
      const angle = i * Math.PI * 2 / 14, r = 22 + t.elapsed * 42;
      ctx.globalAlpha = reveal * fade * (1 - t.elapsed / 1.4); ctx.fillStyle = i % 2 ? '#ffc98a' : '#dbffbd';
      ctx.fillRect(vw / 2 + Math.cos(angle) * r, 122 + Math.sin(angle) * r, 1.6, 1.6);
    }
    ctx.restore(); ctx.save();
  }
  const cover = t.phase === 'close' ? ease((t.elapsed - .95) / .35) : 1 - ease(t.elapsed / TRANSITION_OPEN);
  ctx.fillStyle = '#080d13';
  ctx.fillRect(0, 0, vw, VH / 2 * cover);
  ctx.fillRect(0, VH - VH / 2 * cover, vw, VH / 2 * cover);
  if (t.phase === 'open' && cover > .1) {
    ctx.fillStyle = '#f2eac8'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.globalAlpha = cover;
    ctx.fillText('LEVEL ' + (gs.currentLevel + 1), vw / 2, 137);
  }
  ctx.restore();
}
