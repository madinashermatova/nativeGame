export const keys = { left: false, right: false, jump: false };

const codeToKey = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyW: 'jump', ArrowUp: 'jump',
};

export function setupInput(callbacks) {
  window.addEventListener('keydown', e => {
    if (e.code === 'Enter' && callbacks.onEnter) { callbacks.onEnter(e); return; }
    if (e.code === 'Escape' && callbacks.onEscape) { callbacks.onEscape(e); return; }
    const k = codeToKey[e.code];
    if (!k || callbacks.getState() === 'menu') return;
    e.preventDefault();
    if (k === 'jump' && !keys.jump && callbacks.onJump) callbacks.onJump();
    keys[k] = true;
  });

  window.addEventListener('keyup', e => {
    const k = codeToKey[e.code];
    if (k) keys[k] = false;
  });

  window.addEventListener('blur', () => { keys.left = keys.right = keys.jump = false; });
}
