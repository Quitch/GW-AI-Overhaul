define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant("!LOC:The Lob now launches Booms."),
    summarize: _.constant("!LOC:Boom Launcher"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
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
          "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json"
        )
      )
        chance = 50;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher_ammo.json",
          path: "spawn_unit_on_death",
          op: "replace",
          value: "/pa/units/land/bot_bomb/bot_bomb.json",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
