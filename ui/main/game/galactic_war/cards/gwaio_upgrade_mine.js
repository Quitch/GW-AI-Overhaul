define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Mine Upgrade Tech allows mines to explode without self-destructing."
    ),
    summarize: _.constant("!LOC:Mine Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
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
        gwaioFunctions.hasUnit(gwaioUnits.landMine) &&
        (gwaioFunctions.hasUnit(gwaioUnits.barnacle) ||
          gwaioFunctions.hasUnit(gwaioUnits.stitch) ||
          gwaioFunctions.hasUnit(gwaioUnits.botFactoryAdvanced))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.landMineWeapon,
          path: "self_destruct",
          op: "replace",
          value: false,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
