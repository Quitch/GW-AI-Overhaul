define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwaioFunctions, gwaioUnits, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Structure Combat Tech increases the health of all structures by 50%. Defensive structures also gain a 25% damage increase."
    ),
    summarize: _.constant("!LOC:Structure Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png"
    ),
    audio: function () {
      return {
        found: "PA/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 28;
          if (dist > 4) {
            chance = 142;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 28;
          if (dist > 6) {
            chance = 142;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 28;
          if (dist > 9) {
            chance = 142;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 28;
          if (dist > 11) {
            chance = 142;
          }
        } else {
          chance = 28;
          if (dist > 13) {
            chance = 142;
          }
        }
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = gwaioGroups.structures;
      var mods = [];
      units.forEach(function (unit) {
        mods.push({
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        });
      });
      var ammos = [
        gwaioUnits.landMineAmmo,
        gwaioUnits.flakAmmo,
        gwaioUnits.galataAmmo,
        gwaioUnits.laserDefenseTowerAdvancedAmmo,
        gwaioUnits.singleLaserDefenseTowerAmmo,
        gwaioUnits.laserDefenseTowerAmmo,
        gwaioUnits.catapultAmmo,
        gwaioUnits.anchorAmmoAG,
        gwaioUnits.anchorAmmoAO,
        gwaioUnits.umbrellaAmmo,
        gwaioUnits.torpedoLauncherAdvancedLandAmmo,
        gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
        gwaioUnits.torpedoLauncherAdvancedAmmo,
        gwaioUnits.torpedoLauncherLandAmmo,
        gwaioUnits.torpedoLauncherWaterAmmo,
        gwaioUnits.torpedoLauncherAmmo,
      ];
      ammos.forEach(function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
