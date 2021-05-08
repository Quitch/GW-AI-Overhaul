define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Flak Upgrade Tech enables the targeting of land and surface naval units by anti-air defense."
    ),
    summarize: _.constant("!LOC:Flak Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png"
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
          "/pa/units/orbital/air_defense_adv/air_defense_adv.json"
        ) &&
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_botfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory") ||
          inventory.hasCard("nem_start_tower_rush"))
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/orbital/air_defense_adv/air_defense_adv_tool_weapon.json",
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file:
            "/pa/units/orbital/air_defense_adv/air_defense_adv_tool_weapon.json",
          path: "target_priorities",
          op: "push",
          value: ["Mobile & (Land | Naval)"],
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
