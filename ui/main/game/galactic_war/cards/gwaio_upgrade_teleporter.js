define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Teleporter Upgrade Tech removes all energy consumption and efficiency requirements from the interplanetary teleporter and makes it invisible to radar."
    ),
    summarize: _.constant("!LOC:Teleporter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit("/pa/units/land/teleporter/teleporter.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/teleporter/teleporter.json",
          path: "energy_efficiency_requirement",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/land/teleporter/teleporter.json",
          path: "teleporter.energy_demand",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/land/teleporter/teleporter.json",
          path: "recon.observable.ignore_radar",
          op: "replace",
          value: true,
        },
      ]);
    },
    dull: function () {},
  };
});
