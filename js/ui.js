export default class UI {
  constructor(game) {
    this.game = game;
    this.redGemElement = document.getElementById("red-gem-count");
    this.yellowGemElement = document.getElementById("yellow-gem-count");
    this.rockElement = document.getElementById("rock");

    document.addEventListener("autoClick", () => {
      this.updateGemDisplay();
      this.updateRockVisual();
    });
  }

  // Updates both gem displays
  updateGemDisplay() {
    this.redGemElement.textContent = this.game.redGemCount;
    this.yellowGemElement.textContent = this.game.yellowGemCount;
  }

  // Updates upgrade button state when purchased
  updateUpgradeButton(upgradeKey) {
    let buttonId = "";
    switch (upgradeKey) {
      case "pickaxeTier1":
        buttonId = "upgrade-pickaxe-tier1";
        break;
      case "pickaxeTier2":
        buttonId = "upgrade-pickaxe-tier2";
        break;
      case "autoClicker":
        buttonId = "upgrade-autoclick";
        break;
      case "autoCollect":
        buttonId = "upgrade-autocollect";
        break;
      case "beachPickaxeTier1":
        buttonId = "upgrade-beach-pickaxe-tier1";
        break;
      case "beachPickaxeTier2":
        buttonId = "upgrade-beach-pickaxe-tier2";
        break;
      case "beachAutoClicker":
        buttonId = "upgrade-beach-autoclick";
        break;
      case "beachAutoCollect":
        buttonId = "upgrade-beach-autocollect";
        break;
    }
    const button = document.getElementById(buttonId);
    if (button) {
      button.textContent += " (Purchased)";
      button.disabled = true;
    }
  }

  // Updates rock visuals based on current progress (cracks and rumble)
  updateRockVisual() {
    const progress = this.game.currentProgress;
    const threshold = this.game.getThreshold();
    this.rockElement.classList.remove("cracked-1", "cracked-2", "cracked-3");
    let crackLevel = 0;
    if (progress > threshold * 0.66) {
      crackLevel = 3;
    } else if (progress > threshold * 0.33) {
      crackLevel = 2;
    } else if (progress > 0) {
      crackLevel = 1;
    }
    if (crackLevel > 0) {
      this.rockElement.classList.add(`cracked-${crackLevel}`);
    }
    this.rockElement.classList.add("rumble");
    setTimeout(() => {
      this.rockElement.classList.remove("rumble");
    }, 200);
  }

  // Clears rock crack visuals when stone type changes
  updateRockType() {
    this.rockElement.classList.remove("cracked-1", "cracked-2", "cracked-3");
  }
}
