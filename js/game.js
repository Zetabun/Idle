export default class Game {
  constructor() {
    this.gemCount = 0;
    this.currentStone = "original"; // "original" or "new"
    this.currentProgress = 0;
    this.upgrades = {
      betterPickAxe: false,
      autoClicker: false,
      autoCollect: false,
      newStone: false,
    };
    this.autoClickerInterval = null;
  }

  // Returns the number of clicks needed to break the current rock
  getThreshold() {
    if (this.currentStone === "original") {
      return this.upgrades.betterPickAxe ? 8 : 10;
    } else if (this.currentStone === "new") {
      return 20;
    }
    return 10;
  }

  // Called when the rock is clicked (or auto-clicked)
  handleRockClick() {
    this.currentProgress++;
    if (this.currentProgress >= this.getThreshold()) {
      this.breakRock();
    }
  }

  // Breaks the rock, attempts to drop a gem, and resets progress
  breakRock() {
    let gemDrop = false;
    if (this.currentStone === "original") {
      gemDrop = Math.random() < 0.5; // 50% chance for red gem
    } else if (this.currentStone === "new") {
      gemDrop = Math.random() < 0.4; // 40% chance for pink gem
    }

    if (gemDrop) {
      // Auto collect gem if upgrade is active; otherwise, display gem
      if (this.upgrades.autoCollect) {
        this.gemCount++;
      } else {
        this.spawnGem();
      }
    }

    // Reset progress after the rock breaks
    this.currentProgress = 0;
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
      if (this.upgrades.autoClicker) {
        this.handleRockClick();
        // Dispatch an event so that UI elements (like crack visuals) can update
        const event = new CustomEvent("autoClick");
        document.dispatchEvent(event);
      }
    }, 1000);
  }
}
