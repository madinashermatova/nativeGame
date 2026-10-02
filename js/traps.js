// One clock defines laser visuals and damage, including a warning before firing.
export function laserMode(laser, tick) {
  const t = (tick + laser.phase) % 240;
  return t < 30 ? 'warning' : t < 130 ? 'active' : 'off';
}
export function laserHitbox(laser) {
  return {x: laser.x + 8, y: laser.y + 6, w: laser.w - 16, h: laser.h - 12};
}
