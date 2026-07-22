define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Engine Tech increases the speed of all air units by 25%"
    ),
    summarize: _.constant("!LOC:Air Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_air_engine.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.airMobileNoCluster),
        70
      );
    },
    buff: function (inventory) {
      var mods = _.flatten(
        _.map(gwoGroup.airMobile, function (unit) {
          return [
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 1.25,
            },
          ];
        })
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
