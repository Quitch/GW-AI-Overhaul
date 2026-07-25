define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Fabrication Tech reduces metal build costs of all orbital vehicles by 25%"
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital_fabrication.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_cost_reduction",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      // The base card ran its ladder backwards - 100 near the origin, halved to 50
      // once past the threshold - so orbital got cheaper to unlock exactly where it
      // mattered least. Inverted to match the other five orbital cards, and moved
      // onto travelledModerate so Bigger Galactic War sizes are covered. The base
      // card's "distance must be non-zero" guard is kept.
      var sizes = GW.balance.numberOfSystems;
      if (system.distance() === 0) {
        return { chance: 0 };
      }
      if (context.totalSize <= sizes[1]) {
        return { chance: 16 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 160 : 32,
      };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.orbitalMobile, function (unit) {
            return gwoCard.mods(unit, "multiply", { build_metal_cost: 0.75 });
          })
        )
      );
    },
    dull: function () {},
  };
});
