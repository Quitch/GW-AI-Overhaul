define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Manhattan Upgrade Tech increases the damage dealt by the mobile nuke to orbital units and commanders by 200%."
    ),
    summarize: _.constant("!LOC:Manhattan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/land/tank_nuke/tank_nuke.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "armor_damage_map.AT_Orbital",
          op: "multiply",
          value: 3,
        },
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "armor_damage_map.AT_Commander",
          op: "multiply",
          value: 3,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
