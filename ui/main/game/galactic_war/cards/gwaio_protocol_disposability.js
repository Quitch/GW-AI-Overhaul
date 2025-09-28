define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  const prepareMods = function (mods) {
    _.forEach(gwoGroup.structures, function (unit) {
      mods.push(
        {
          file: unit,
          path: "wreckage_health_frac",
          op: "replace",
          value: 0,
        },
        {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.7,
        },
        {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 0.5,
        }
      );
    });
  };

  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All structures cost 30% less but have 50% less health and leave no wreckage."
    ),
    summarize: _.constant("!LOC:Protocol: Disposability"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      const mods = [];
      prepareMods(mods);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
