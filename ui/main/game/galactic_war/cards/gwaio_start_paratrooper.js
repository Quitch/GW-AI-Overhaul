define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
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
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);

          var unitCannons = [gwoUnit.lob, gwoUnit.unitCannon];
          var units = unitCannons.concat(gwoGroup.unitCannonMobile);
          inventory.addUnits(units);

          var mobileLandUnits = gwoGroup.botsMobile.concat(
            gwoGroup.vehiclesMobile
          );
          var landUnitsNotInUnitCannon = _.filter(
            mobileLandUnits,
            function (unit) {
              return !_.includes(gwoGroup.unitCannonMobile, unit);
            }
          );
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
          _.forEach(landUnitsNotInUnitCannon, function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CannonBuildable",
            });
          });
          mods.push({
            file: gwoUnit.manhattan,
            path: "transportable.size",
            op: "replace",
            value: 1,
          });
          mods.push({
            file: gwoUnit.manhattan,
            path: "attachable.offsets",
            op: "replace",
            value: {
              root: [0, 0, 0],
              head: [0, 0, 7],
            },
          });
          inventory.addMods(mods);

          var aiMods = [
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
              op: "load",
              value: "gwaio_upgrade_leveler.json",
            },
          ];
          var factoryArtillery = ["UnitCannon", "MiniUnitCannon"];
          _.forEach(factoryArtillery, function (structure) {
            aiMods.push(
              {
                type: "fabber",
                op: "append",
                toBuild: structure,
                idToMod: "builders",
                value: "Commander", // TITANS AI
              },
              {
                type: "fabber",
                op: "append",
                toBuild: structure,
                idToMod: "builders",
                value: "UberCommander", // Queller AI
              }
            );
          });
          var mobileLand = [
            "SupportCommander", // TITANS AI
            "UberSupportCommander", // Queller AI
            "AdvancedArtilleryBot",
            "TMLBot",
            "BasicArmorTank",
            "HoverTank",
            "LandScout",
            "AdvancedArmorTank",
            "AdvancedArtilleryVehicle",
            "NukeTank",
          ];
          _.forEach(mobileLand, function (unit) {
            aiMods.push({
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "UnitCannon",
            });
          });
          inventory.addAIMods(aiMods);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
