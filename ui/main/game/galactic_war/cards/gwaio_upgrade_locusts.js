define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Locusts Upgrade Tech doubles the vision radius of nanoswarms."
    ),
    summarize: _.constant("!LOC:Locusts Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
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
        (gwaioFunctions.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_start_paratrooper") ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit(gwaioUnits.locusts)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.locusts,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.locusts,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
