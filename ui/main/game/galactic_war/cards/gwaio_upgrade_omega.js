define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Omega Upgrade Tech allows all the orbital battleship's lasers to target the planet."
    ),
    summarize: _.constant("!LOC:Omega Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital_fighter.png"
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
          "/pa/units/orbital/orbital_factory/orbital_factory.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_battleship/orbital_battleship.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/sea/drone_carrier/drone/drone.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/orbital_battleship/orbital_battleship_tool_weapon.json",
          path: "target_layers",
          op: "push",
          value: [
            "WL_Air",
            "WL_LandHorizontal",
            "WL_WaterSurface",
            "WL_SeaFloor",
          ],
        },
        {
          file: "/pa/units/orbital/orbital_battleship/orbital_battleship_tool_weapon.json",
          path: "pitch_range",
          op: "replace",
          value: 180,
        },
      ]);
    },
    dull: function () {},
  };
});
