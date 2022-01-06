define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwaioBank, gwaioCards, gwaioUnits) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Hoarder Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Contains every factory on every tier of the tech tree, but this has left no space for anything else. You will need to seek out additional data banks."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Hoarder Commander",
      };
    },
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.maxCards(inventory.maxCards() - 4);
          inventory.addUnits([
            gwaioUnits.airFactoryAdvanced,
            gwaioUnits.airFactory,
            gwaioUnits.firefly,
            gwaioUnits.bumblebee,
            gwaioUnits.hummingbird,
            gwaioUnits.icarus,
            gwaioUnits.pelican,
            gwaioUnits.spinner,
            gwaioUnits.dox,
            gwaioUnits.stryker,
            gwaioUnits.stinger,
            gwaioUnits.boom,
            gwaioUnits.botFactoryAdvanced,
            gwaioUnits.botFactory,
            gwaioUnits.grenadier,
            gwaioUnits.spark,
            gwaioUnits.stitch,
            gwaioUnits.inferno,
            gwaioUnits.drifter,
            gwaioUnits.ant,
            gwaioUnits.vehicleFactoryAdvanced,
            gwaioUnits.vehicleFactory,
            gwaioUnits.jig,
            gwaioUnits.orbitalFactory,
            gwaioUnits.arkyd,
            gwaioUnits.solarArray,
            gwaioUnits.navalFactoryAdvanced,
          ]);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwaioCards.applyDulls(CARD, inventory);
    },
  };
});
