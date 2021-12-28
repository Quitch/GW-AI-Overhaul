define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Teleporter Upgrade Tech removes all energy consumption and efficiency requirements from the interplanetary teleporter and makes it invisible to radar."
    ),
    summarize: _.constant("!LOC:Teleporter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_energy_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.teleporter)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.teleporter,
          path: "energy_efficiency_requirement",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.teleporter,
          path: "teleporter.energy_demand",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.teleporter,
          path: "recon.observable.ignore_radar",
          op: "replace",
          value: true,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
