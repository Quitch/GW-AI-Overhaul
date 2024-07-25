define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js",
], function (GW, gwoUnit, gwoGroup, gwoCluster) {
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

      const playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
      if (playerIsCluster) {
        inventory.addMods(gwoCluster.clusterCommanders);
      }

      const commander = inventory.getTag("global", "commander");
      const starterUnits = gwoGroup.structuresEcoBasic.concat(
        gwoGroup.structuresDefencesBasic,
        gwoGroup.structuresIntelBasic,
        gwoGroup.navalBasic,
        gwoGroup.orbitalBasic,
        gwoUnit.teleporter,
        commander
      );
      inventory.addUnits(starterUnits);
    },
    dull: function () {},
  };
});
