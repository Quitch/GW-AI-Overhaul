define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Inferno Upgrade Tech allows the flame tank to heal itself."
    ),
    summarize: _.constant("!LOC:Inferno Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle_armor.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
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
          "/pa/units/land/vehicle_factory/vehicle_factory.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/land/tank_armor/tank_armor.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/tank_armor/tank_armor.json",
          path: "passive_health_regen",
          op: "replace",
          value: 5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
