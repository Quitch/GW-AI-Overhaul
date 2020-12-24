define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Storm Upgrade Tech enables interception of tactical missiles by the flak tank."
    ),
    summarize: _.constant("!LOC:Storm Upgrade Tech"),
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
        gwaioFunctions.hasUnit("/pa/units/land/tank_flak/tank_flak.json")
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/tank_flak/tank_flak.json",
          path: "tools",
          op: "push",
          value: {
            spec_id:
              "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
            aim_bone: "socket_aim",
            muzzle_bone: [
              "socket_muzzle01",
              "socket_muzzle02",
              "socket_muzzle03",
              "socket_muzzle04",
            ],
          },
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
