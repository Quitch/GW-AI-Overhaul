define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Typhoon Upgrade Tech doubles the number of drones held by the Typhoon and any other unit with drones."
    ),
    summarize: _.constant("!LOC:Typhoon Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/sea/drone_carrier/carrier.json") &&
        gwaioFunctions.hasUnit("/pa/units/sea/drone_carrier/drone.json")
      )
        chance = 35;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/drone_carrier/carrier_tool_weapon.json",
          path: "ammo_capacity",
          op: "multiply",
          value: 2,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
