define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Basic air tech enables building of mobile air units and factories. Basic air factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Basic Air Tech"),
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
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.airBasic)) {
        const dist = system.distance();
        if (
          (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 2) ||
          (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 3) ||
          (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 4) ||
          (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 5) ||
          dist > 6
        ) {
          chance = 50;
        } else {
          chance = 200;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.airBasic);
    },
    dull: function () {},
  };
});
