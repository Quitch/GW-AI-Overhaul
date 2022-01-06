define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Activates the Tech to build artillery structures."
    ),
    summarize: _.constant("!LOC:Artillery Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_artillery",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (!inventory.hasCard("gwc_start_artillery")) {
        chance = 100;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        gwaioUnits.holkins,
        gwaioUnits.pelter,
        gwaioUnits.lob,
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
