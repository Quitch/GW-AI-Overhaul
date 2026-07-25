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
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_cost_reduction",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      // Ran backwards: a build cost reduction is worth more the more you build, and
      // deeper systems have more planets to cover with radar.
      var sizes = GW.balance.numberOfSystems;
      if (gwoCard.travelledFar(system, context, sizes)) {
        return { chance: 120 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 60 : 25,
      };
    },
    buff: function (inventory) {
      var units = gwoGroup.energyIntel.concat(
        gwoUnit.hermes,
        gwoUnit.skitter,
        gwoUnit.firefly,
        gwoUnit.stitch,
        gwoUnit.mend,
        gwoUnit.barnacle,
        gwoUnit.teleporter
      );
      var mods = _.map(units, function (unit) {
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
