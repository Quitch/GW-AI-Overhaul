define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Defense Fabrication Tech reduces metal build costs of all defensive structures by 50%"
    ),
    summarize: _.constant("!LOC:Defense Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      var chance = 50;
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.map(gwoGroup.structuresDefences, function (unit) {
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
