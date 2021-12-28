define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Hermes Upgrade Tech increases the vision of the space probe by 50%."
    ),
    summarize: _.constant("!LOC:Hermes Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.orbitalLauncher) &&
        gwaioCards.hasUnit(gwaioUnits.hermes)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.hermes,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwaioUnits.hermes,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwaioUnits.hermes,
          path: "recon.observer.items.2.radius",
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
