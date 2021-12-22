define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Boom Upgrade Tech replaces Dox with Booms in the Lob."
    ),
    summarize: _.constant("!LOC:Boom Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png"
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
        gwaioFunctions.hasUnit(gwaioUnits.boom) &&
        gwaioFunctions.hasUnit(gwaioUnits.lob)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.lobAmmo,
          path: "spawn_unit_on_death",
          op: "replace",
          value: gwaioUnits.boom,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
