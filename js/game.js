export default class Game {
  constructor() {
    this.gemCount = 0;
    this.currentStone = "original"; // "original" or "new"
    this.currentProgress = 0;
    this.pickaxeTier = 0; // 0 = no upgrade, 1 = Tier 1, 2 = Tier 2
    this.upgrades = {
      autoClicker: false,
      autoCollect: false,
      newStone: false,
    };
    this.autoClickerInterval = null;
    this.waitingForGem = false;
  }

  // Returns the number of clicks needed to break the current rock
  getThreshold() {
    if (this.currentStone === "original") {
      if (this.pickaxeTier === 2) return 6;
      if (this.pickaxeTier === 1) return 8;
      return 10;
    } else if (this.currentStone === "new") {
      return 20;
    }
    return 10;
  }

  // Called when the rock is clicked (or auto-clicked)
  handleRockClick() {
    // If we're waiting for gem collection, do not register clicks
    if (this.waitingForGem) return;
    this.currentProgress++;
    if (this.currentProgress >= this.getThreshold()) {
      this.breakRock();
    }
  }

  // Breaks the rock, animates its break, and then resets after 1 second
  breakRock() {
    const rockElement = document.getElementById("rock");
    // Add a 'broken' class to trigger break animation
    rockElement.classList.add("broken");

    let gemDrop = false;
    if (this.currentStone === "original") {
      gemDrop = Math.random() < 0.5; // 50% chance for red gem
    } else if (this.currentStone === "new") {
      gemDrop = Math.random() < 0.4; // 40% chance for pink gem
    }

    if (gemDrop) {
      if (this.upgrades.autoCollect) {
        this.gemCount++;
        // Wait 1 second, then reset rock
        setTimeout(() => {
          rockElement.classList.remove("broken");
          this.currentProgress = 0;
        }, 1000);
      } else {
        // Spawn the gem and mark that we're waiting for gem collection
        this.spawnGem();
        this.waitingForGem = true;
      }
    } else {
      // No gem drop: after 1 second, remove broken animation and reset progress
      setTimeout(() => {
        rockElement.classList.remove("broken");
        this.currentProgress = 0;
      }, 1000);
    }
  }

  // Displays the gem on the screen for manual collection
  spawnGem() {
    const gemElement = document.getElementById("gem");
    gemElement.style.display = "block";
    if (this.currentStone === "original") {
      gemElement.classList.remove("pink-gem");
      gemElement.style.background = "red";
    } else if (this.currentStone === "new") {
      gemElement.classList.add("pink-gem");
      gemElement.style.background = "pink";
    }
  }

  // Called when the player clicks the gem to collect it
  collectGem() {
    const gemElement = document.getElementById("gem");
    gemElement.style.display = "none";
    this.gemCount++;
    if (this.waitingForGem) {
      const rockElement = document.getElementById("rock");
      rockElement.classList.remove("broken");
      this.currentProgress = 0;
      this.waitingForGem = false;
    }
  }

  // Sets the current stone type and resets progress/visuals
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

  // Starts the game loop which checks for auto-clicker activation every second
  startGameLoop() {
    setInterval(() => {
      if (this.upgrades.autoClicker && !this.waitingForGem) {
        this.handleRockClick();
        const event = new CustomEvent("autoClick");
        document.dispatchEvent(event);
      }
    }, 1000);
  }
}
