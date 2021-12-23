define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwaioBank, gwaioFunctions, gwaioUnits) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
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
    deal: gwaioFunctions.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioFunctions.setupCluster(inventory);

          var unitCannons = [gwaioUnits.lob, gwaioUnits.unitCannon];
          var unitCannonUnits = [
            gwaioUnits.spinner,
            gwaioUnits.dox,
            gwaioUnits.stryker,
            gwaioUnits.stinger,
            gwaioUnits.boom,
            gwaioUnits.grenadier,
            gwaioUnits.spark,
            gwaioUnits.stitch,
            gwaioUnits.ant,
          ];
          var units = unitCannons.concat(unitCannonUnits);
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

          var unitCannonUnitsAdditional = [];
          if (
            inventory.hasCard("gwc_enable_vehicles_all") ||
            inventory.hasCard("gwc_enable_vehicles_t1")
          ) {
            unitCannonUnitsAdditional.push(
              gwaioUnits.inferno,
              gwaioUnits.drifter,
              gwaioUnits.skitter
            );
          }
          if (
            inventory.hasCard("gwc_enable_vehicles_all") ||
            inventory.hasCard("gwaio_upgrade_vehiclefactory")
          ) {
            unitCannonUnitsAdditional.push(
              gwaioUnits.leveler,
              gwaioUnits.vanguard,
              gwaioUnits.sheller,
              gwaioUnits.storm,
              gwaioUnits.manhattan
            );
          }
          if (
            inventory.hasCard("gwc_enable_bots_all") ||
            inventory.hasCard("gwaio_upgrade_botfactory")
          ) {
            unitCannonUnitsAdditional.push(
              gwaioUnits.bluehawk,
              gwaioUnits.gilE,
              gwaioUnits.colonel
            );
          }
          // eslint-disable-next-line lodash/prefer-map
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
              value: "gwaio_start_paratrooper.json", // Queller AI
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
      gwaioFunctions.applyDulls(CARD, inventory);
    },
  };
});
