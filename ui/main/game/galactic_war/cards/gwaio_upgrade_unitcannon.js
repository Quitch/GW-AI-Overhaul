define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
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
    deal: function (system, context, inventory) {
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        hasUnit("/pa/units/land/unit_cannon/unit_cannon.json") &&
        (hasUnit("/pa/units/air/air_factory_adv/air_factory_adv.json") ||
          inventory.hasCard("gwaio_upgrade_airfactory") ||
          hasUnit("/pa/units/land/bot_factory_adv/bot_factory_adv.json") ||
          inventory.hasCard("gwaio_upgrade_botfactory") ||
          hasUnit("/pa/units/sea/naval_factory_adv/naval_factory_adv.json") ||
          inventory.hasCard("gwaio_upgrade_navalfactory") ||
          hasUnit(
            "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory"))
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
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
      ]);
    },
    dull: function () {},
  };
});
