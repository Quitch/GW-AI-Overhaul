define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Artillery Fabrication Tech reduces metal build costs of all artillery structures and mobile artillery units by 75%. Requires technology to build artillery structures and units."
    ),
    summarize: _.constant("!LOC:Artillery Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoGroup.structuresArtillery)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.map(gwoGroup.structuresArtillery, function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.25,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
