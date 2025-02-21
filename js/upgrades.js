export default class Upgrades {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    // For testing, all upgrade costs are 1 gem.
    // Stone Rock upgrades use red gems; Beach Rock upgrades use yellow gems.
    this.costs = {
      pickaxeTier1: 1,
      pickaxeTier2: 1,
      autoClicker: 1,
      autoCollect: 1,
      beachPickaxeTier1: 1,
      beachPickaxeTier2: 1,
      beachAutoClicker: 1,
      beachAutoCollect: 1,
    };
  }

  purchaseUpgrade(upgradeKey) {
    const cost = this.costs[upgradeKey];
    // Determine which currency to use based on upgrade key
    let currency = null;
    if (
      upgradeKey === "pickaxeTier1" ||
      upgradeKey === "pickaxeTier2" ||
      upgradeKey === "autoClicker" ||
      upgradeKey === "autoCollect"
    ) {
      currency = "red";
    } else if (
      upgradeKey === "beachPickaxeTier1" ||
      upgradeKey === "beachPickaxeTier2" ||
      upgradeKey === "beachAutoClicker" ||
      upgradeKey === "beachAutoCollect"
    ) {
      currency = "yellow";
    }

    if (currency === "red") {
      if (this.game.redGemCount < cost) {
        alert("Not enough red gems.");
        return;
      }
    } else if (currency === "yellow") {
      if (this.game.yellowGemCount < cost) {
        alert("Not enough yellow gems.");
        return;
      }
    }

    // Process upgrade purchase based on key
    if (upgradeKey === "pickaxeTier1") {
      if (this.game.stonePickaxeTier !== 0) {
        alert("Tier 1 already purchased.");
        return;
      }
      this.game.redGemCount -= cost;
      this.game.stonePickaxeTier = 1;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("pickaxeTier1");
      document.getElementById("upgrade-pickaxe-tier2").style.display = "block";
    } else if (upgradeKey === "pickaxeTier2") {
      if (this.game.stonePickaxeTier !== 1) {
        alert("Purchase Tier 1 first.");
        return;
      }
      this.game.redGemCount -= cost;
      this.game.stonePickaxeTier = 2;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("pickaxeTier2");
    } else if (upgradeKey === "autoClicker") {
      if (this.game.upgrades.autoClicker) {
        alert("Auto Clicker already purchased.");
        return;
      }
      this.game.redGemCount -= cost;
      this.game.upgrades.autoClicker = true;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("autoClicker");
    } else if (upgradeKey === "autoCollect") {
      if (this.game.upgrades.autoCollect) {
        alert("Auto Collect already purchased.");
        return;
      }
      this.game.redGemCount -= cost;
      this.game.upgrades.autoCollect = true;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("autoCollect");
    } else if (upgradeKey === "beachPickaxeTier1") {
      if (this.game.beachPickaxeTier !== 0) {
        alert("Tier 1 already purchased.");
        return;
      }
      this.game.yellowGemCount -= cost;
      this.game.beachPickaxeTier = 1;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("beachPickaxeTier1");
      document.getElementById("upgrade-beach-pickaxe-tier2").style.display = "block";
    } else if (upgradeKey === "beachPickaxeTier2") {
      if (this.game.beachPickaxeTier !== 1) {
        alert("Purchase Tier 1 first.");
        return;
      }
      this.game.yellowGemCount -= cost;
      this.game.beachPickaxeTier = 2;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("beachPickaxeTier2");
    } else if (upgradeKey === "beachAutoClicker") {
      if (this.game.upgrades.beachAutoClicker) {
        alert("Auto Clicker already purchased.");
        return;
      }
      this.game.yellowGemCount -= cost;
      this.game.upgrades.beachAutoClicker = true;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("beachAutoClicker");
    } else if (upgradeKey === "beachAutoCollect") {
      if (this.game.upgrades.beachAutoCollect) {
        alert("Auto Collect already purchased.");
        return;
      }
      this.game.yellowGemCount -= cost;
      this.game.upgrades.beachAutoCollect = true;
      this.ui.updateGemDisplay();
      this.ui.updateUpgradeButton("beachAutoCollect");
    }
  }
}
