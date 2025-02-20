import Game from "./game.js";
import UI from "./ui.js";
import Upgrades from "./upgrades.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize game, UI, and upgrades modules
  const game = new Game();
  const ui = new UI(game);
  const upgrades = new Upgrades(game, ui);

  // Rock click event
  const rockElement = document.getElementById("rock");
  rockElement.addEventListener("click", () => {
    game.handleRockClick();
    ui.updateRockVisual();
  });

  // Gem click event (to manually collect a dropped gem)
  const gemElement = document.getElementById("gem");
  gemElement.addEventListener("click", () => {
    game.collectGem();
    ui.updateGemDisplay();
  });

  // Upgrade button events
  document
    .getElementById("upgrade-pickaxe")
    .addEventListener("click", () => upgrades.purchaseUpgrade("betterPickAxe"));
  document
    .getElementById("upgrade-autoclick")
    .addEventListener("click", () => upgrades.purchaseUpgrade("autoClicker"));
  document
    .getElementById("upgrade-autocollect")
    .addEventListener("click", () => upgrades.purchaseUpgrade("autoCollect"));
  document
    .getElementById("upgrade-newstone")
    .addEventListener("click", () => {
      upgrades.purchaseUpgrade("newStone");
      if (game.upgrades.newStone) {
        document.getElementById("stone-selection").style.display = "block";
      }
    });

  // Stone selection events
  document.querySelectorAll(".stone-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const stoneType = e.target.getAttribute("data-stone");
      game.setStoneType(stoneType);
      ui.updateRockType();
    });
  });

  // Start the game loop (which handles auto-clicking, if enabled)
  game.startGameLoop();
});
