define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Combat Tech increases speed of all vehicles by 50%, health by 50%, and damage by 25%"
    ),
    summarize: _.constant("!LOC:Vehicle Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: _.constant({
      found: "PA/VO/Computer/gw/board_tech_available_combat",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.vehiclesMobile),
        gwoCard.travelledShort(system, context, sizes) ? 60 : 30
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.vehiclesMobile, "multiply", {
            "navigation.move_speed": 1.5,
            "navigation.brake": 1.5,
            "navigation.acceleration": 1.5,
            "navigation.turn_speed": 1.5,
            max_health: 1.5,
          })
          .concat(
            gwoCard.flatMapMods(gwoGroup.vehiclesAmmo, "multiply", {
              damage: 1.25,
              splash_damage: 1.25,
            })
          )
      );
    },
    dull: function () {},
  };
});
