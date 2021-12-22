define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Flak Upgrade Tech enables the targeting of land and surface naval units by anti-air defense."
    ),
    summarize: _.constant("!LOC:Flak Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.flak)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.flakWeapon,
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwaioUnits.flakWeapon,
          path: "target_priorities",
          op: "push",
          value: ["Mobile & (Land | Naval)"],
        },
        {
          file: gwaioUnits.flak,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_SurfaceDefense",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
