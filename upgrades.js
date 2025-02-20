export default class Upgrades {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    // Define the gem cost for each upgrade
    this.costs = {
      betterPickAxe: 10,
      autoClicker: 50,
      autoCollect: 100,
      newStone: 500,
    };
  }

  // Purchases an upgrade if the player has enough gems and it hasn't been purchased yet
  purchaseUpgrade(upgradeKey) {
    const cost = this.costs[upgradeKey];
    if (this.game.gemCount >= cost && !this.game.upgrades[upgradeKey]) {
      this.game.gemCount -= cost;
      this.game.upgrades[upgradeKey] = true;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton(upgradeKey);
    } else {
      alert("Not enough gems or upgrade already purchased.");
    }
  }
}
