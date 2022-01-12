define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwaioCards, gwaioUnits, gwaioGroups) {
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Default Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(""),
    deal: _.constant(false),
    buff: function (inventory) {
      inventory.maxCards(
        inventory.maxCards() + GW.balance.initialCardSlots + 1
      );
      // Modifications if player is playing as Cluster faction
      gwaioCards.setupCluster(inventory);
      // Correct issues which prevent buffs being applied correctly
      inventory.addMods([
        {
          // Slammer torpedo should be encompassed in bot buffs not structures'
          file: gwaioUnits.slammerTorpedo,
          path: "ammo_id",
          op: "replace",
          value: gwaioUnits.slammerTorpedoAmmo,
        },
        {
          // Match the damage of the previous ammo
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "damage",
          op: "multiply",
          value: 2.5,
        },
      ]);
      var commander = inventory.getTag("global", "commander");
      // Basic defence, intel, orbital, naval, and eco
      var starterUnits = gwaioGroups.starterUnits.concat(commander);
      inventory.addUnits(starterUnits);
    },
    dull: function () {
      // empty
    },
  };
});
