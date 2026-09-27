import { Game } from "./game.js";
import { level1 } from "./levels/level1.js";

const canvas = document.getElementById("game");
const menuEl = document.getElementById("menu");
const startBtn = document.getElementById("start");

function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const game = new Game(canvas, level1);

if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (menuEl) {
      menuEl.style.display = "none";
    }
    game.start();
  });
} else {
  console.warn("Start button (#start) topilmadi.");
}
