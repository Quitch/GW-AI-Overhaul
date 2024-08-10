define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Intelligence Fabrication Tech reduces metal build costs of all intelligence structures and mobile units by 50%"
    ),
    summarize: _.constant("!LOC:Intelligence Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_intelligence_fabrication.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 100;
      const dist = system.distance();
      if (
        (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 4) ||
        (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 5) ||
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 9) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 11) ||
        dist > 13
      ) {
        chance = 50;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const units = gwoGroup.energyIntel.concat(
        gwoUnit.hermes,
        gwoUnit.skitter,
        gwoUnit.firefly,
        gwoUnit.stitch,
        gwoUnit.mend,
        gwoUnit.barnacle,
        gwoUnit.teleporter
      );
      const mods = _.map(units, function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.5,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
