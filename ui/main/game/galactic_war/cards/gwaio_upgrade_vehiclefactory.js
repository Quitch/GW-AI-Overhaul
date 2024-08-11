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
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Vehicle Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_factory_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !inventory.hasCard("gwaio_start_rapid") &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.vehicleFactory)
      ) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      const newUnits = gwoGroup.starterUnitsAdvanced.concat(
        gwoGroup.vehiclesAdvancedMobile
      );
      inventory.addUnits(newUnits);

      inventory.addMods([
        {
          file: gwoUnit.vehicleFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Tank & Mobile & FactoryBuild & Custom58)",
        },
      ]);

      const units = [
        "AdvancedArmorTank",
        "AdvancedArtilleryVehicle",
        "AdvancedLaserTank",
        "FlakTank",
      ];
      const aiMods = _.flatten(
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
      aiMods.push(
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedVehicleFabber",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "new",
          toBuild: "AdvancedVehicleFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        }
      );
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
