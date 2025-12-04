define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete air tech enables building of all mobile air units and factories. Basic air factories are built via your commander or any basic fabricator. Advanced factories are built via a basic or advanced vehicle fabricator."
    ),
    summarize: _.constant("!LOC:Complete Air Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.air)) {
        const dist = system.distance();
        if (
          (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 2) ||
          (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 3) ||
          (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 4) ||
          (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 5) ||
          dist > 6
        ) {
          chance = 200;
        } else {
          chance = 25;
        }
        if (
          gwoCard.hasUnit(inventory.units(), gwoGroup.air) &&
          gwoCard.missingAllUnits(inventory.units(), gwoGroup.factoriesAdvanced)
        ) {
          chance *= 3;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.starterUnitsAdvanced.concat(gwoGroup.air));
    },
    dull: function () {},
  };
});
