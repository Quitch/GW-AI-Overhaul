define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Holkins Upgrade Tech triples the number of shots fired per volley by the artillery while also tripling their deviation from target."
    ),
    summarize: _.constant("!LOC:Holkins Upgrade Tech"),
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
    deal: function (unused0, unused1, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/artillery_short/artillery_short.json"
        ) &&
        (gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory/bot_factory.json"
        ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/air/air_factory/air_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory/naval_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory/vehicle_factory.json"
          ) ||
          inventory.hasCard("gwc_start_artillery"))
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/artillery_short/artillery_short.json",
          path: "tools.0.projectiles_per_fire",
          op: "replace",
          value: 3,
        },
        {
          file: "/pa/units/land/artillery_short/artillery_short.json",
          path: "tools.0.muzzle_bone",
          op: "replace",
          value: ["socket_muzzle", "socket_muzzle", "socket_muzzle"],
        },
        {
          file:
            "/pa/units/land/artillery_short/artillery_short_tool_weapon.json",
          path: "firing_standard_deviation",
          op: "multiply",
          value: 3,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
