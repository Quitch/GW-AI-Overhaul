define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All structures cost 30% less but have 50% less health and leave no wreckage."
    ),
    summarize: _.constant("!LOC:Protocol: Disposability"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.structures, function (unit) {
            return gwoCard
              .mods(unit, "replace", { wreckage_health_frac: 0 })
              .concat(
                gwoCard.mods(unit, "multiply", {
                  build_metal_cost: 0.7,
                  max_health: 0.5,
                })
              );
          })
        )
      );
    },
    dull: function () {},
  };
});
