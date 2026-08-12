define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Combat Tech increases speed of all vehicles by 50%, health by 50%, and damage by 25%",
    ),
    summarize: _.constant("!LOC:Vehicle Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png",
    ),
    audio: _.constant({
      found: "PA/VO/Computer/gw/board_tech_available_combat",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.vehiclesMobile),
        gwoCard.travelledShort(system, context, sizes) ? 60 : 30,
      );
    },
    buff: function (inventory) {
      var mods = [];
      _.forEach(gwoGroup.vehiclesMobile, function (unit) {
        mods.push(
          {
            file: unit,
            path: "navigation.move_speed",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.brake",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.acceleration",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.turn_speed",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.5,
          },
        );
      });
      _.forEach(gwoGroup.vehiclesAmmo, function (ammo) {
        mods.push(
          {
            file: ammo,
            path: "damage",
            op: "multiply",
            value: 1.25,
          },
          {
            file: ammo,
            path: "splash_damage",
            op: "multiply",
            value: 1.25,
          },
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
