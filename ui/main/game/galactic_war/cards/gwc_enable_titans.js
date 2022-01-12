define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC: Allows advanced fabricators to build all Titan-class units."
    ),
    summarize: _.constant("!LOC:Titan Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_titans_all",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioGroups.fabbersAdvanced)) {
        chance = 150;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwaioGroups.titans);
    },
    dull: function () {
      //empty
    },
  };
});
