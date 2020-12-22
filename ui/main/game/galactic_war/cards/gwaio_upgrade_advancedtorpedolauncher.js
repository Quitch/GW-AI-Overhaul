define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Torpedo Launcher Upgrade Tech enables the targeting of hover and coastal naval units by the Advanced Torpedo Launcher."
    ),
    summarize: _.constant("!LOC:Advanced Torpedo Launcher Upgrade Tech"),
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
          "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_tool_weapon.json",
          path: "exclude_unit_types",
          op: "replace",
          value: "",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
