define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Vehicle Factory Upgrade Tech enables the building of advanced units by basic vehicle manufacturing."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Vehicle Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_factory_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_vehicle",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        !inventory.hasCard("gwaio_start_rapid") &&
          gwoCard.hasUnit(inventory.units(), gwoUnit.vehicleFactory)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);

      var advancedVehiclesExcludingFabber = _.without(
        gwoGroup.vehiclesAdvancedMobile,
        gwoUnit.vehicleFabberAdvanced
      );

      inventory.addUnits(advancedVehiclesExcludingFabber);

      var units = [
        "AdvancedArmorTank",
        "AdvancedArtilleryVehicle",
        "AdvancedLaserTank",
        "FlakTank",
      ];
      var aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "replace",
              toBuild: unit,
              idToMod: "priority",
              value: 97,
              refId: "builders",
              refValue: ["AdvancedVehicleFactory"],
            },
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicVehicleFactory",
              refId: "builders",
              refValue: ["AdvancedVehicleFactory"],
            },
          ];
        })
      );

      inventory.addMods(
        gwoCard.mods(gwoUnit.vehicleFactory, "add", {
          buildable_types: " | (Tank & Mobile & FactoryBuild & Custom58)",
        })
      );
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
