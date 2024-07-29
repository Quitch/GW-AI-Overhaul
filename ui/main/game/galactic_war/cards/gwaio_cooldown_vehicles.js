define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Cooldown Tech halves the cooldown time between builds for all vehicle factories."
    ),
    summarize: _.constant("!LOC:Vehicle Cooldown Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      const vehicleFactories = [gwoUnit.vehicleFactory, gwoUnit.vehicleFactoryAdvanced]
      if (gwoCard.hasUnit(inventory.units(), vehicleFactories)) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const vehicleFactories = [gwoUnit.vehicleFactory, gwoUnit.vehicleFactoryAdvanced]
      const mods = _.map(vehicleFactories, function (unit) {
        return {
          file: unit,
          path: "factory_cooldown_time",
          op: "multiply",
          value: 0.5,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
