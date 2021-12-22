define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Energy Tech reduces energy costs for intelligence structures by 75%, weapon energy costs by 75%."
    ),
    summarize: _.constant("!LOC:Complete Energy Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 33;
          if (dist > 4) {
            chance = 166;
          } else if (dist > 2) {
            chance = 333;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 33;
          if (dist > 6) {
            chance = 166;
          } else if (dist > 3) {
            chance = 333;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 33;
          if (dist > 9) {
            chance = 166;
          } else if (dist > 5) {
            chance = 333;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 33;
          if (dist > 10) {
            chance = 166;
          } else if (dist > 6) {
            chance = 333;
          }
        } else {
          chance = 33;
          if (dist > 12) {
            chance = 166;
          } else if (dist > 7) {
            chance = 333;
          }
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.deepSpaceOrbitalRadar,
        gwaioUnits.arkyd,
        gwaioUnits.radarSatelliteAdvanced,
        gwaioUnits.radar,
        gwaioUnits.radarAdvanced,
      ];
      var mods = [];
      units.forEach(function (unit) {
        mods.push({
          file: unit,
          path: "consumption.energy",
          op: "multiply",
          value: 0.25,
        });
      });
      var weapons = [
        gwaioUnits.commanderSecondary,
        gwaioUnits.wyrmWeapon,
        gwaioUnits.bumblebeeWeapon,
        gwaioUnits.icarusWeapon,
        gwaioUnits.zeusWeapon,
        gwaioUnits.holkinsWeapon,
        gwaioUnits.pelterWeapon,
        gwaioUnits.sparkWeapon,
        gwaioUnits.sxxWeapon,
        gwaioUnits.artemisWeapon,
        gwaioUnits.heliosWeaponAG,
      ];
      weapons.forEach(function (weapon) {
        mods.push(
          {
            file: weapon,
            path: "ammo_capacity",
            op: "multiply",
            value: 0.25,
          },
          {
            file: weapon,
            path: "ammo_demand",
            op: "multiply",
            value: 0.25,
          },
          {
            file: weapon,
            path: "ammo_per_shot",
            op: "multiply",
            value: 0.25,
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
