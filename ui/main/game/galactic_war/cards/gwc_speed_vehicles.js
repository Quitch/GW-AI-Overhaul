define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Engine Tech increases speed of all vehicles by 50%"
    ),
    summarize: _.constant("!LOC:Vehicle Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.vehiclesMobile),
        70
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.vehiclesMobile, "multiply", {
          "navigation.move_speed": 1.5,
          "navigation.brake": 1.5,
          "navigation.acceleration": 1.5,
          "navigation.turn_speed": 1.5,
        })
      );
    },
    dull: function () {},
  };
});
