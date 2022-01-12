define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
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
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_artillery") ||
        inventory.hasCard("gwc_start_artillery")
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.map(gwaioGroups.structuresArtillery, function (unit) {
          return {
            file: unit,
            path: "build_metal_cost",
            op: "multiply",
            value: 0.25,
          };
        })
      );
    },
    dull: function () {
      // empty
    },
  };
});