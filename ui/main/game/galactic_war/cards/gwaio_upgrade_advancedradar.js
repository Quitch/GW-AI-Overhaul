define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Radar Upgrade Tech increases the vision and radar radius of advanced radar by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Radar Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.radarAdvanced) &&
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
          file: gwaioUnits.radarAdvanced,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwaioUnits.radarAdvanced,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwaioUnits.radarAdvanced,
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwaioUnits.radarAdvanced,
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwaioUnits.radarAdvanced,
          path: "recon.observer.items.4.radius",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
