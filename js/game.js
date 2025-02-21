export default class Game {
  constructor() {
    // Resource counts for each currency
    this.redGemCount = 0;
    this.yellowGemCount = 0;
    // Current stone type: "original" (Stone Rock) or "new" (Beach Rock)
    this.currentStone = "original";
    this.currentProgress = 0;
    // Upgrade tiers for each stone type
    this.stonePickaxeTier = 0;    // For Stone Rock: 0, 1, or 2
    this.beachPickaxeTier = 0;    // For Beach Rock: 0, 1, or 2
    // Upgrade flags (separate for each stone type)
    this.upgrades = {
      autoClicker: false,       // Stone Rock Auto Clicker
      autoCollect: false,       // Stone Rock Auto Collect
      beachAutoClicker: false,  // Beach Rock Auto Clicker
      beachAutoCollect: false,  // Beach Rock Auto Collect
    };
    this.autoClickerInterval = null;
    this.waitingForGem = false;
  }

  // Returns the number of clicks required based on stone type and pickaxe upgrade
  getThreshold() {
    if (this.currentStone === "original") {
      if (this.stonePickaxeTier === 2) return 6;
      if (this.stonePickaxeTier === 1) return 8;
      return 10;
    } else if (this.currentStone === "new") {
      if (this.beachPickaxeTier === 2) return 12;
      if (this.beachPickaxeTier === 1) return 16;
      return 20;
    }
    return 10;
  }

  // Called when the rock is clicked or auto-clicked
  handleRockClick() {
    if (this.waitingForGem) return; // Do not register clicks if waiting
    this.currentProgress++;
    if (this.currentProgress >= this.getThreshold()) {
      this.breakRock();
    }
  }

  // Handles the rock break sequence: animate break, spawn gem, and delay rock reset
  breakRock() {
    const rockElement = document.getElementById("rock");
    rockElement.classList.add("broken");

    // Determine gem drop chance based on stone type
    let gemDrop = false;
    if (this.currentStone === "original") {
      gemDrop = Math.random() < 0.5; // 50% chance for Stone Rock
    } else if (this.currentStone === "new") {
      gemDrop = Math.random() < 0.4; // 40% chance for Beach Rock
    }

    if (gemDrop) {
      this.spawnGem();
      // If auto-collect upgrade is active, wait 500ms then auto-collect
      if (
        (this.currentStone === "original" && this.upgrades.autoCollect) ||
        (this.currentStone === "new" && this.upgrades.beachAutoCollect)
      ) {
        setTimeout(() => {
          this.collectGem();
          // Reset rock after gem collection
          rockElement.classList.remove("broken");
          this.currentProgress = 0;
          this.waitingForGem = false;
        }, 500);
      } else {
        // Otherwise, wait for manual collection
        this.waitingForGem = true;
      }
    } else {
      // No gem drop: reset rock after 1 second
      setTimeout(() => {
        rockElement.classList.remove("broken");
        this.currentProgress = 0;
      }, 1000);
    }
  }

  // Spawns a gem (red for Stone Rock, yellow for Beach Rock)
  spawnGem() {
    const gemElement = document.getElementById("gem");
    gemElement.style.display = "block";
    if (this.currentStone === "original") {
      gemElement.classList.remove("yellow-gem");
      gemElement.style.background = "red";
    } else if (this.currentStone === "new") {
      gemElement.classList.add("yellow-gem");
      gemElement.style.background = "yellow";
    }
  }

  // Called when the gem is clicked (manual collection) or auto-collected
  collectGem() {
    const gemElement = document.getElementById("gem");
    gemElement.style.display = "none";
    if (this.currentStone === "original") {
      this.redGemCount++;
    } else if (this.currentStone === "new") {
      this.yellowGemCount++;
    }
    // If we were waiting for gem collection, reset the rock immediately
    if (this.waitingForGem) {
      const rockElement = document.getElementById("rock");
      rockElement.classList.remove("broken");
      this.currentProgress = 0;
      this.waitingForGem = false;
    }
  }

  // Changes the current stone type and resets visuals/progress
  setStoneType(type) {
    this.currentStone = type;
    this.currentProgress = 0;
    const rockElement = document.getElementById("rock");
    if (type === "original") {
      rockElement.classList.remove("new-rock");
      rockElement.classList.add("original-rock");
    } else if (type === "new") {
      rockElement.classList.remove("original-rock");
      rockElement.classList.add("new-rock");
    }
  }

  // Starts the auto-clicker game loop (separate for each stone type)
  startGameLoop() {
    setInterval(() => {
      if (this.currentStone === "original" && this.upgrades.autoClicker && !this.waitingForGem) {
        this.handleRockClick();
        const event = new CustomEvent("autoClick");
        document.dispatchEvent(event);
      } else if (this.currentStone === "new" && this.upgrades.beachAutoClicker && !this.waitingForGem) {
        this.handleRockClick();
        const event = new CustomEvent("autoClick");
        document.dispatchEvent(event);
      }
    }, 1000);
  }
}
