define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Leviathan Upgrade Tech replaces the battleship's cannons with Holkins advanced artillery."
    ),
    summarize: _.constant("!LOC:Leviathan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/sea/battleship/battleship.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.0.spec_id",
          op: "replace",
          value:
            "/pa/units/land/artillery_long/artillery_long_tool_weapon.json",
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.0.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.1.spec_id",
          op: "replace",
          value:
            "/pa/units/land/artillery_long/artillery_long_tool_weapon.json",
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.1.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.2.spec_id",
          op: "replace",
          value:
            "/pa/units/land/artillery_long/artillery_long_tool_weapon.json",
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.2.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.3.spec_id",
          op: "replace",
          value:
            "/pa/units/land/artillery_long/artillery_long_tool_weapon.json",
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "tools.3.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
      ]);
    },
    dull: function () {},
  };
});
