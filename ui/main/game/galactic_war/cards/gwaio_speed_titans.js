define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant("!LOC:Increases the speed of all Titans by 20%."),
    summarize: _.constant("!LOC:Titan Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.titansMobile),
        70
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.titansMobile, "multiply", {
          "navigation.move_speed": 1.2,
          "navigation.brake": 1.2,
          "navigation.acceleration": 1.2,
          "navigation.turn_speed": 1.2,
        })
      );
    },
    dull: function () {},
  };
});
