define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units."
    ),
    summarize: _.constant("!LOC:Slammer Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/assault_bot_adv/assault_bot_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/assault_bot_adv/assault_bot_adv_torpedo_tool_weapon.json",
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: "/pa/units/land/assault_bot_adv/assault_bot_adv_torpedo_tool_weapon.json",
          path: "target_layers",
          op: "replace",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
      ]);
    },
    dull: function () {},
  };
});
