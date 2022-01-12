define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwaioBank, gwaioCards, gwaioUnits, gwaioGroups) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Contains no basic factories, just Lobs and Unit Cannons built by the commander. Halves the cost of both. All land units can be built from the Unit Cannon as they are unlocked."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Paratrooper Commander",
      };
    },
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);

          var unitCannons = [gwaioUnits.lob, gwaioUnits.unitCannon];
          var units = unitCannons.concat(gwaioGroups.unitCannonMobile);
          inventory.addUnits(units);

          var mods = _.flatten(
            _.map(unitCannons, function (unit) {
              return [
                {
                  file: unit,
                  path: "unit_types",
                  op: "push",
                  value: "UNITTYPE_CmdBuild",
                },
                {
                  file: unit,
                  path: "build_metal_cost",
                  op: "multiply",
                  value: 0.5,
                },
              ];
            })
          );

          var exclusion = function (unit) {
            return !_.includes(gwaioGroups.unitCannonMobile, unit);
          };

          var unitCannonUnitsAdditional = [];
          if (
            gwaioCards.hasUnit(
              inventory.units(),
              gwaioUnits.botFactoryAdvanced
            ) ||
            inventory.hasCard("gwaio_upgrade_botfactory")
          ) {
            var remainingAdvancedBots = _.filter(
              gwaioGroups.botsAdvancedMobile,
              exclusion
            );
            unitCannonUnitsAdditional.push.apply(
              unitCannonUnitsAdditional,
              remainingAdvancedBots
            );
          }
          if (
            gwaioCards.hasUnit(inventory.units(), gwaioUnits.vehicleFactory)
          ) {
            var remainingBasicVehicles = _.filter(
              gwaioGroups.vehiclesBasicMobile,
              exclusion
            );
            unitCannonUnitsAdditional.push.apply(
              unitCannonUnitsAdditional,
              remainingBasicVehicles
            );
          }
          if (
            gwaioCards.hasUnit(
              inventory.units(),
              gwaioUnits.vehicleFactoryAdvanced
            ) ||
            inventory.hasCard("gwaio_upgrade_vehiclefactory")
          ) {
            var remainingAdvancedVehicles = _.filter(
              gwaioGroups.vehiclesAdvancedMobile,
              exclusion
            );
            unitCannonUnitsAdditional.push.apply(
              unitCannonUnitsAdditional,
              remainingAdvancedVehicles
            );
          }
          _.forEach(unitCannonUnitsAdditional, function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CannonBuildable",
            });
          });

          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "UnitCannon",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "UnitCannon",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "MiniUnitCannon", // No AI uses this currently
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "MiniUnitCannon", // No AI uses this currently
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "UnitCannon",
              idToMod: "priority",
              value: 478,
              refId: "priority",
              refValue: 360, // TITANS AI
            },
            {
              type: "fabber",
              op: "load",
              value: CARD.id + ".json", // Queller AI
            },
            {
              type: "factory",
              op: "append",
              toBuild: "BasicArmorTank",
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "HoverTank",
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "LandScout",
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "load",
              value: "gwaio_upgrade_leveler.json",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "AdvancedArmorTank",
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "AdvancedArtilleryVehicle",
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "FlakTank",
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "NukeTank", // No AI uses this currently
              idToMod: "builders",
              value: "UnitCannon",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "AdvancedArtilleryBot",
              idToMod: "builders",
              value: "UnitCannon",
            },
          ]);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwaioCards.applyDulls(CARD, inventory);
    },
  };
});
