define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoUnit, gwoGroup) {
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
      gwoCard.setupCluster(inventory);

      var commander = inventory.getTag("global", "commander");
      var starterUnits = gwoGroup.structuresEcoBasic.concat(
        gwoGroup.structuresDefencesBasic,
        gwoGroup.structuresIntelBasic,
        gwoGroup.navalBasic,
        gwoGroup.orbitalBasic,
        commander
      );
      inventory.addUnits(starterUnits);
    },
    dull: function () {
      // empty
    },
  };
});
