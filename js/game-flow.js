// Boshlash va qayta boshlash mantig'i (DOM'siz, testda ishlatiladi).
// Mag'lubiyatda (jonlar tugasa) o'sha level boshidan boshlanadi.
// Hamma levellar yutilgandan keyin ('won') o'yin 1-leveldan boshlanadi.
export function prepareStart(gs, loadLevelFn, spawnPlayerFn, startLives) {
  gs.camX = 0;
  if (gs.state === 'won') {
    gs.currentLevel = 0;
    gs.deaths = 0;
    gs.coinCount = 0;
    gs.levelTime = 0;
    gs.lives = startLives;
    loadLevelFn(0);
  } else if (gs.lives <= 0) {
    gs.deaths = 0;
    gs.coinCount = 0;
    gs.levelTime = 0;
    gs.lives = startLives;
    loadLevelFn(gs.currentLevel);
  } else {
    loadLevelFn(gs.currentLevel);
  }
  gs.p = spawnPlayerFn();
}
