define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  {
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
      getContext: gwaioCards.getContext,
      deal: function (system, context, inventory) {
        var chance = 0;
        if (
          inventory.hasCard("gwc_enable_titans") ||
          inventory.hasCard("gwc_start_titans")
        ) {
          chance = 80;
        }
        return { chance: chance };
      },
      buff: function (inventory) {
        inventory.addMods(
          _.map(gwaioGroups.titans, function (unit) {
            return {
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.5,
            };
          })
        );
      },
      dull: function () {
        // empty
      },
    };
  }
});