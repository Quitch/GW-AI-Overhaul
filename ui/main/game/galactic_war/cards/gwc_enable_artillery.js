define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Activates the Tech to build artillery structures."
    ),
    summarize: _.constant("!LOC:Artillery Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_artillery",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.missingUnit(inventory.units(), gwoGroup.structuresArtillery),
        100
      );
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.structuresArtillery);
    },
    dull: function () {},
  };
});
