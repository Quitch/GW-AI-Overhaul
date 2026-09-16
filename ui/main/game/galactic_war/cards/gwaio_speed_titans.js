define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,
  describe: () => "!LOC:Increases the speed of all Titans by 20%.",
  summarize: () => "!LOC:Titan Engine Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.titansMobile),
      70,
    );
  },

  buff: function (inventory) {
    inventory.addMods(
      gwoCard.flatMapMods(
        gwoGroup.titansMobile,
        "multiply",
        gwoCard.paths.navigation,
        1.2,
      ),
    );
  },

  dull: function () {},
}));
