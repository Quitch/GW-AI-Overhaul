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
    summarize: _.constant("!LOC:Tourist Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:You turned up with a fat wallet, but little else. Huge amounts of storage, but no Metal Extractors and no basic land or air factories. Sub Commanders will not do anything except defend themselves and automatically transfer their excess income to you."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Tourist Commander",
      };
    },
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.addMods([
            {
              file: gwaioUnits.commander,
              path: "storage.metal",
              op: "multiply",
              value: 200,
            },
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
      var units = [
        gwaioUnits.metalExtractorAdvanced,
        gwaioUnits.metalExtractor,
      ];
      gwaioCards.applyDulls(CARD, inventory, units);
    },
  };
});
