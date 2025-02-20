export default class UI {
  constructor(game) {
    this.game = game;
    this.gemCountElement = document.getElementById("gem-count");
    this.rockElement = document.getElementById("rock");

    // Update UI on auto-click events
    document.addEventListener("autoClick", () => {
      this.updateGemDisplay();
      this.updateRockVisual();
    });
  }

  // Updates the gem count display
  updateGemDisplay() {
    this.gemCountElement.textContent = this.game.gemCount;
  }

  // Updates the text and state of an upgrade button when purchased
  updateUpgradeButton(upgradeKey) {
    let buttonId = "";
    switch (upgradeKey) {
      case "betterPickAxe":
        buttonId = "upgrade-pickaxe";
        break;
      case "autoClicker":
        buttonId = "upgrade-autoclick";
        break;
      case "autoCollect":
        buttonId = "upgrade-autocollect";
        break;
      case "newStone":
        buttonId = "upgrade-newstone";
        break;
    }
    const button = document.getElementById(buttonId);
    if (button) {
      button.textContent += " (Purchased)";
      button.disabled = true;
    }
  }

  // Updates the rock's visual state (cracks and rumble effect)
  updateRockVisual() {
    const progress = this.game.currentProgress;
    const threshold = this.game.getThreshold();

    // Remove existing crack classes
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

    // Add a brief rumble animation
    this.rockElement.classList.add("rumble");
    setTimeout(() => {
      this.rockElement.classList.remove("rumble");
    }, 200);
  }

  // Resets rock visuals when the stone type changes
  updateRockType() {
    this.rockElement.classList.remove("cracked-1", "cracked-2", "cracked-3");
  }
}
