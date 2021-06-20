define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Phoenix Upgrade Tech changes the advanced interplanetary fighter's weapon from anti-air to anti-ground."
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
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/air/fighter_adv/fighter_adv.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/fighter_adv/fighter_adv_tool_weapon.json",
          path: "target_layers",
          op: "replace",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: "/pa/units/air/fighter_adv/fighter_adv.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Gunship",
        },
      ]);
    },
    dull: function () {},
  };
});
