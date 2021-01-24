define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Unit Cannon Upgrade Tech doubles the launch capacity of this interplanetary transport."
    ),
    summarize: _.constant("!LOC:Unit Cannon Upgrade Tech"),
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
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit("/pa/units/land/unit_cannon/unit_cannon.json"))
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/unit_cannon/unit_cannon.json",
          path: "factory.spawn_points",
          op: "push",
          value: [
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
          ],
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
