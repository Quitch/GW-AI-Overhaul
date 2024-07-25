define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant("!LOC: Reduces the cost of all Titans by 50%."),
    summarize: _.constant("!LOC:Titan Cost Reduction"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_cost_titans.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_titan_cost_reduction",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoGroup.titans)) {
        chance = 80;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.map(gwoGroup.titans, function (unit) {
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
