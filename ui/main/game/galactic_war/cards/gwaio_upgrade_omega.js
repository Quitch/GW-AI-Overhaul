define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (GW, gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Replace's the Omega's anti-ground laser with a drone launcher."
    ),
    summarize: _.constant("!LOC:Orbital Carrier"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_factory/orbital_factory.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_battleship/orbital_battleship.json"
        )
      ) {
        var dist = system.distance();
        if (dist > 0) {
          if (context.totalSize <= GW.balance.numberOfSystems[0]) {
            chance = 28;
            if (dist > 4) chance = 142;
          } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
            chance = 28;
            if (dist > 6) chance = 142;
          } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
            chance = 28;
            if (dist > 9) chance = 142;
          } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
            chance = 28;
            if (dist > 11) chance = 142;
          } else {
            chance = 28;
            if (dist > 13) chance = 142;
          }
        }
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
          path: "tools.4.spec_id",
          op: "replace",
          value: "/pa/units/sea/drone_carrier/carrier/carrier_tool_weapon.json",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
