define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Jig Upgrade Tech adds storage to gas mining and doubles its energy production."
    ),
    summarize: _.constant("!LOC:Jig Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.jig)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.jig,
          path: "production.energy",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.jig,
          path: "storage.energy",
          op: "add",
          value: 50000,
        },
        {
          file: gwaioUnits.jig,
          path: "storage.metal",
          op: "add",
          value: 10000,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
