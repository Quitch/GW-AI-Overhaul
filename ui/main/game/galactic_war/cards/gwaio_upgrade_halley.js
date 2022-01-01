define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Halley Upgrade Tech doubles the health of the delta V engine and halves its cost."
    ),
    summarize: _.constant("!LOC:Halley Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.halley) &&
        (gwaioCards.hasUnit(gwaioUnits.airFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_airfactory") ||
          gwaioCards.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_botfactory") ||
          gwaioCards.hasUnit(gwaioUnits.navalFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_navalfactory") ||
          gwaioCards.hasUnit(gwaioUnits.vehicleFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory"))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.halley,
          path: "max_health",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.halley,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.5,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
