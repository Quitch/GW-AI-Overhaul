define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
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
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwoCard.hasUnit(inventory.units(), gwoGroup.fabbersAdvanced) ||
        gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalFactory)
      ) {
        chance = 150;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.titans);
    },
    dull: function () {},
  };
});
