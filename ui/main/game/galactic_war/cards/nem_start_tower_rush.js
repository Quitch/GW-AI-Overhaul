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
    summarize: _.constant("!LOC:Defense Tech Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Defenses are 50% cheaper, fire 25% faster, have 50% more range, and turn 300% quicker. Barriers are 90% cheaper and have their health doubled. All defenses can be built by both the commander and basic fabricators."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Defense Tech Commander",
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
          gwaioFunctions.setupCluster(inventory);
          inventory.addUnits([
            gwaioUnits.flak,
            gwaioUnits.laserDefenseTowerAdvanced,
            gwaioUnits.catapult,
            gwaioUnits.anchor,
            gwaioUnits.torpedoLauncherAdvanced,
          ]);
          var units = [
            gwaioUnits.flak,
            gwaioUnits.laserDefenseTowerAdvanced,
            gwaioUnits.laserDefenseTower,
            gwaioUnits.catapult,
            gwaioUnits.torpedoLauncherAdvanced,
          ];
          var mods = [];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_CmdBuild",
              },
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_FabBuild",
              }
            );
          });
          var costUnits = [
            gwaioUnits.flak,
            gwaioUnits.galata,
            gwaioUnits.laserDefenseTowerAdvanced,
            gwaioUnits.singleLaserDefenseTower,
            gwaioUnits.laserDefenseTower,
            gwaioUnits.catapult,
            gwaioUnits.anchor,
            gwaioUnits.umbrellaAmmo,
            gwaioUnits.torpedoLauncherAdvanced,
            gwaioUnits.torpedoLauncher,
          ];
          costUnits.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.5,
              },
              {
                file: unit,
                path: "area_build_separation",
                op: "multiply",
                value: 0.2,
              }
            );
          });
          var buildUnits = [gwaioUnits.wall];
          buildUnits.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.1,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 2,
              }
            );
          });
          var weapons = [
            gwaioUnits.flakWeapon,
            gwaioUnits.galataWeapon,
            gwaioUnits.laserDefenseTowerAdvancedWeapon,
            gwaioUnits.singleLaserDefenseTowerWeapon,
            gwaioUnits.laserDefenseTowerWeapon,
            gwaioUnits.catapultWeapon,
            gwaioUnits.catapultBeam
            gwaioUnits.anchorWeaponAG,
            gwaioUnits.anchorWeaponAO,
            gwaioUnits.umbrellaBeam,
            gwaioUnits.umbrellaWeapon,
            gwaioUnits.torpedoLauncherAdvancedWeapon,
            gwaioUnits.torpedoLauncherWeapon,
          ];
          weapons.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "rate_of_fire",
                op: "multiply",
                value: 1.25,
              },
              {
                file: unit,
                path: "max_range",
                op: "multiply",
                value: 1.5,
              },
              {
                file: unit,
                path: "yaw_rate",
                op: "multiply",
                value: 4,
              },
              {
                file: unit,
                path: "pitch_rate",
                op: "multiply",
                value: 4,
              }
            );
          });
          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicLandDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicLandDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedAirDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedAirDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedAirDefense",
              idToMod: "builders",
              value: "AnyBasicFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedLandDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedLandDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedLandDefense",
              idToMod: "builders",
              value: "AnyBasicFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "TML",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "TML",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "TML",
              idToMod: "builders",
              value: "AnyBasicFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedNavalDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedNavalDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedNavalDefense",
              idToMod: "builders",
              value: "AnyBasicFabber",
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
