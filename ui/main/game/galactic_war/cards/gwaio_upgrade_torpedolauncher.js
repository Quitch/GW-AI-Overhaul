define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Torpedo Launcher Upgrade Tech enables the targeting of hover and coastal naval units by the Torpedo Launcher."
    ),
    summarize: _.constant("!LOC:Torpedo Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
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
          "/pa/units/sea/torpedo_launcher/torpedo_launcher.json"
        )
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/torpedo_launcher/torpedo_launcher_tool_weapon.json",
          path: "exclude_unit_types",
          op: "replace",
          value: "",
        },
      ]);
    },
    dull: function () {},
  };
});
