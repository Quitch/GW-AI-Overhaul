define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Leviathan Upgrade Tech replaces the battleship's cannons with Holkins advanced artillery."
    ),
    summarize: _.constant("!LOC:Leviathan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(gwaioUnits.navalFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioFunctions.hasUnit(gwaioUnits.leviathan)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.leviathan,
          path: "tools.0.spec_id",
          op: "replace",
          value: gwaioUnits.holkinsWeapon,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.0.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.1.spec_id",
          op: "replace",
          value: gwaioUnits.holkinsWeapon,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.1.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.2.spec_id",
          op: "replace",
          value: gwaioUnits.holkinsWeapon,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.2.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.3.spec_id",
          op: "replace",
          value: gwaioUnits.holkinsWeapon,
        },
        {
          file: gwaioUnits.leviathan,
          path: "tools.3.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
