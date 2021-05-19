define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Phoenix Upgrade Tech increases the interplanetary movement speed of the advanced interplanetary fighter by 200%."
    ),
    summarize: _.constant("!LOC:Phoenix Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_air_engine.png"
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
    deal: function (system, context, inventory) {
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        (hasUnit("/pa/units/air/air_factory_adv/air_factory_adv.json") ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        hasUnit("/pa/units/air/fighter_adv/fighter_adv.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/fighter_adv/fighter_adv.json",
          path: "system_velocity_multiplier",
          op: "multiply",
          value: 3,
        },
        {
          file: "/pa/units/air/fighter_adv/fighter_adv.json",
          path: "gravwell_velocity_multiplier",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {},
  };
});
