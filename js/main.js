import Game from "./game.js";
import UI from "./ui.js";
import Upgrades from "./upgrades.js";

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  const ui = new UI(game);
  const upgrades = new Upgrades(game, ui);

  // Rock click event
  const rockElement = document.getElementById("rock");
  rockElement.addEventListener("click", () => {
    game.handleRockClick();
    ui.updateRockVisual();
  });

  // Gem click event (for manual collection)
  const gemElement = document.getElementById("gem");
  gemElement.addEventListener("click", () => {
    game.collectGem();
    ui.updateGemDisplay();
  });

  // Stone Rock Upgrade Buttons
  document.getElementById("upgrade-pickaxe-tier1")
    .addEventListener("click", () => upgrades.purchaseUpgrade("pickaxeTier1"));
  document.getElementById("upgrade-pickaxe-tier2")
    .addEventListener("click", () => upgrades.purchaseUpgrade("pickaxeTier2"));
  document.getElementById("upgrade-autoclick")
    .addEventListener("click", () => upgrades.purchaseUpgrade("autoClicker"));
  document.getElementById("upgrade-autocollect")
    .addEventListener("click", () => upgrades.purchaseUpgrade("autoCollect"));

  // Beach Rock Upgrade Buttons
  document.getElementById("upgrade-beach-pickaxe-tier1")
    .addEventListener("click", () => upgrades.purchaseUpgrade("beachPickaxeTier1"));
  document.getElementById("upgrade-beach-pickaxe-tier2")
    .addEventListener("click", () => upgrades.purchaseUpgrade("beachPickaxeTier2"));
  document.getElementById("upgrade-beach-autoclick")
    .addEventListener("click", () => upgrades.purchaseUpgrade("beachAutoClicker"));
  document.getElementById("upgrade-beach-autocollect")
    .addEventListener("click", () => upgrades.purchaseUpgrade("beachAutoCollect"));

  // Stone Selection Buttons
  document.querySelectorAll(".stone-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const stoneType = e.target.getAttribute("data-stone");
      game.setStoneType(stoneType);
      ui.updateRockType();
    });
  });

  // Expand/Collapse for Stone Rock Upgrade Group
  const stoneGroupHeader = document.querySelector("#upgrade-group-stone-rock .group-header");
  const stoneGroupContent = document.querySelector("#upgrade-group-stone-rock .group-content");
  stoneGroupHeader.addEventListener("click", () => {
    if (stoneGroupContent.style.display === "none" || stoneGroupContent.style.display === "") {
      stoneGroupContent.style.display = "block";
      stoneGroupHeader.textContent = "Stone Rock ▼";
    } else {
      stoneGroupContent.style.display = "none";
      stoneGroupHeader.textContent = "Stone Rock ►";
    }
  });

  // Expand/Collapse for Beach Rock Upgrade Group
  const beachGroupHeader = document.querySelector("#upgrade-group-beach-rock .group-header");
  const beachGroupContent = document.querySelector("#upgrade-group-beach-rock .group-content");
  beachGroupHeader.addEventListener("click", () => {
    if (beachGroupContent.style.display === "none" || beachGroupContent.style.display === "") {
      beachGroupContent.style.display = "block";
      beachGroupHeader.textContent = "Beach Rock ▼";
    } else {
      beachGroupContent.style.display = "none";
      beachGroupHeader.textContent = "Beach Rock ►";
    }
  });

  // Start game loop
  game.startGameLoop();
});
