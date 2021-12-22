define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Omega Upgrade Tech allows all the orbital battleship's lasers to target the planet."
    ),
    summarize: _.constant("!LOC:Omega Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.orbitalFactory) &&
        gwaioFunctions.hasUnit(gwaioUnits.omega) &&
        gwaioFunctions.hasUnit(gwaioUnits.squall)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.omegaWeaponAO,
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
          file: gwaioUnits.omegaWeaponAO,
          path: "pitch_range",
          op: "replace",
          value: 180,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
