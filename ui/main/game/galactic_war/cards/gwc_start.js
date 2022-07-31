define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
], function (GW, gwoGroup, gwoTech) {
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

      var isCluster = inventory.getTag("global", "playerFaction") === 4;
      if (isCluster) {
        inventory.addMods(gwoTech.clusterCommanders);
      }

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
