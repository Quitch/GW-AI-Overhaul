define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Boom Upgrade Tech replaces Dox with Booms in the Lob."
    ),
    summarize: _.constant("!LOC:Boom Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
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
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        hasUnit("/pa/units/land/bot_bomb/bot_bomb.json") &&
        hasUnit(
          "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher_ammo.json",
          path: "spawn_unit_on_death",
          op: "replace",
          value: "/pa/units/land/bot_bomb/bot_bomb.json",
        },
      ]);
    },
    dull: function () {},
  };
});
