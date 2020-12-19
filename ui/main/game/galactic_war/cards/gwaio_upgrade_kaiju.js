define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (GW, gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant("!LOC:The Kaiju can use teleporters."),
    summarize: _.constant("!LOC:Intergalactic Navy"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/sea/hover_ship/hover_ship.json")
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
          file: "/pa/units/sea/hover_ship/hover_ship.json",
          path: "teleportable",
          op: "replace",
          value: {},
        },
        {
          file: "/pa/units/sea/hover_ship/hover_ship.json",
          path: "command_caps",
          op: "replace",
          value: [
            "ORDER_Move",
            "ORDER_Patrol",
            "ORDER_Attack",
            "ORDER_Assist",
            "ORDER_Use",
          ],
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
