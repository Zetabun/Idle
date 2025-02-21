export default class Upgrades {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    // For testing: all upgrades cost 1 gem
    this.costs = {
      pickaxeTier1: 1,
      pickaxeTier2: 1,
      autoClicker: 1,
      autoCollect: 1,
      newStone: 1,
    };
  }

  // Purchases an upgrade if the player has enough gems and it hasn't been purchased yet
  purchaseUpgrade(upgradeKey) {
    const cost = this.costs[upgradeKey];
    if (this.game.gemCount < cost) {
      alert("Not enough gems.");
      return;
    }
    if (upgradeKey === "pickaxeTier1") {
      if (this.game.pickaxeTier !== 0) {
        alert("Tier 1 already purchased.");
        return;
      }
      this.game.gemCount -= cost;
      this.game.pickaxeTier = 1;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("pickaxeTier1");
      // Reveal Tier 2 button
      document.getElementById("upgrade-pickaxe-tier2").style.display = "block";
    } else if (upgradeKey === "pickaxeTier2") {
      if (this.game.pickaxeTier !== 1) {
        alert("Purchase Tier 1 first.");
        return;
      }
      this.game.gemCount -= cost;
      this.game.pickaxeTier = 2;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("pickaxeTier2");
    } else {
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
}
