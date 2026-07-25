define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Economy Fabrication Tech reduces metal build costs of all metal and energy production structures by 50%"
    ),
    summarize: _.constant("!LOC:Economy Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_economy_fabrication.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_cost_reduction",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      // The base card ran its ladder backwards - 100 near the origin, halved to 50
      // once past the threshold - so the cheapest expansion came where there was
      // least to expand onto. Its size ladder also lumped every galaxy above Uber
      // size together under one "dist > 13" test. The base card's "distance must be
      // non-zero" guard is kept. Halving the cost of every extractor and energy
      // plant is the broadest eco swing in the deck, so the weights are low.
      var sizes = GW.balance.numberOfSystems;
      if (system.distance() === 0) {
        return { chance: 0 };
      }
      if (gwoCard.travelledFar(system, context, sizes)) {
        return { chance: 90 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 45 : 18,
      };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.structuresEco, function (unit) {
            return gwoCard.mods(unit, "multiply", { build_metal_cost: 0.5 });
          })
        )
      );
    },
    dull: function () {},
  };
});
