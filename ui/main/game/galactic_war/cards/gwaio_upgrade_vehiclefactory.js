define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Vehicle Factory Upgrade Tech",
    description:
      "!LOC:Vehicle Factory Upgrade Tech enables the building of advanced units by basic vehicle manufacturing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_factory_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_vehicle",
    requires: gwoUnit.vehicleFactory,
    unless: "gwaio_start_rapid",
    buff: function (inventory) {
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
  });
});
