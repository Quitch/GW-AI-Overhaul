define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (module, GWCStart, gwaioBank, gwaioTech, gwaioFunctions) {
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
    deal: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          if (inventory.getTag("global", "playerFaction") === 4)
            inventory.addMods(gwaioTech.clusterCommanders);

          var unitCannons = [
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
            "/pa/units/land/unit_cannon/unit_cannon.json",
          ];
          var unitCannonUnits = [
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/assault_bot/assault_bot.json",
            "/pa/units/land/attack_vehicle/attack_vehicle.json",
            "/pa/units/land/bot_aa/bot_aa.json",
            "/pa/units/land/bot_bomb/bot_bomb.json",
            "/pa/units/land/bot_grenadier/bot_grenadier.json",
            "/pa/units/land/bot_tesla/bot_tesla.json",
            "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
          ];
          var units = unitCannons.concat(unitCannonUnits);
          inventory.addUnits(units);

          var mods = [];
          _.forEach(unitCannons, function (unit) {
            mods.push(
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
              }
            );
          });

          var unitCannonUnitsAdditional = [];
          if (
            inventory.hasCard("gwc_enable_vehicles_all") ||
            inventory.hasCard("gwc_enable_vehicles_t1")
          )
            unitCannonUnitsAdditional.push(
              "/pa/units/land/tank_armor/tank_armor.json",
              "/pa/units/land/tank_hover/tank_hover.json",
              "/pa/units/land/land_scout/land_scout.json"
            );
          if (
            inventory.hasCard("gwc_enable_vehicles_all") ||
            inventory.hasCard("gwaio_upgrade_vehiclefactory")
          )
            unitCannonUnitsAdditional.push(
              "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
              "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
              "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json",
              "/pa/units/land/tank_flak/tank_flak.json",
              "/pa/units/land/tank_nuke/tank_nuke.json"
            );
          if (
            inventory.hasCard("gwc_enable_bots_all") ||
            inventory.hasCard("gwaio_upgrade_botfactory")
          )
            unitCannonUnitsAdditional.push(
              "/pa/units/land/bot_tactical_missile/bot_tactical_missile.json",
              "/pa/units/land/bot_sniper/bot_sniper.json",
              "/pa/units/land/bot_support_commander/bot_support_commander.json"
            );
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
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
