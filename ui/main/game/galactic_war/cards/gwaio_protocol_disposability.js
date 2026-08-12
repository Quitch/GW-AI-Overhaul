define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All structures cost 30% less but have 50% less health and leave no wreckage.",

  summarize: () => "!LOC:Protocol: Disposability",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    inventory.addMods(
      _.flatten(
        _.map(gwoGroup.structures, (unit) =>
          gwoCard.mods(unit, "replace", { wreckage_health_frac: 0 }).concat(
            gwoCard.mods(unit, "multiply", {
              build_metal_cost: 0.7,
              max_health: 0.5,
            })
          )
        )
      )
    );
  },

  dull: function () {},
}));
