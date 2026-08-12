define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Fabrication Tech reduces metal build costs of all orbital vehicles by 25%",
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital_fabrication.png",
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_cost_reduction",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var sizes = GW.balance.numberOfSystems;
      return {
        chance: gwoCard.travelledShort(system, context, sizes) ? 70 : 35,
      };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.orbitalMobile, function (unit) {
            return gwoCard.mods(unit, "multiply", { build_metal_cost: 0.75 });
          }),
        ),
      );
    },
    dull: function () {},
  };
});
