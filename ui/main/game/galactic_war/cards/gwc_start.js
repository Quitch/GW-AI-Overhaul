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

      var commander = inventory.getTag("global", "commander");
      var starterUnits = gwaioGroups.structuresEcoBasic.concat(
        gwaioGroups.structuresDefencesBasic,
        gwaioGroups.structuresIntelBasic,
        gwaioGroups.navalBasic,
        gwaioGroups.orbitalBasic,
        commander
      );
      inventory.addUnits(starterUnits);
    },
    dull: function () {
      // empty
    },
  };
});
