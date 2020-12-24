define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Hornet Upgrade Tech adds splash damage to the tactical bomber's attacks."
    ),
    summarize: _.constant("!LOC:Hornet Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
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
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/air/bomber_adv/bomber_adv.json")
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/air/bomber_adv/bomber_adv_ammo.json",
          path: "splash_damage",
          op: "replace",
          value: 1000,
        },
        {
          file: "/pa/units/air/bomber_adv/bomber_adv_ammo.json",
          path: "splash_radius",
          op: "replace",
          value: 12,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
