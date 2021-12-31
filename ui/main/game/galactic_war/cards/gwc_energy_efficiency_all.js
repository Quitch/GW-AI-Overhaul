define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
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
    getContext: gwaioCards.getContext,
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (
        (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 4) ||
        (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 6) ||
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 9) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 10) ||
        dist > 12
      ) {
        chance = 166;
      } else if (
        (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 2) ||
        (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 3) ||
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 5) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 6) ||
        dist > 7
      ) {
        chance = 333;
      } else {
        chance = 33;
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
