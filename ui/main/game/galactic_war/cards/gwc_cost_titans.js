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
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_titan_cost_reduction",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.titans),
        80
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.titans, "multiply", {
          build_metal_cost: 0.5,
        })
      );
    },
    dull: function () {},
  };
});
