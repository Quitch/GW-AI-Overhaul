define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Tourist Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      const english = _.includes(i18n.detectLanguage(), "en");
      if (english) {
        return "!LOC:You turned up with a fat wallet, but little else. Huge amounts of storage, but no Metal Extractors and no basic land or air factories.";
      }
      return "!LOC:You turned up with a fat wallet, but little else. Huge amounts of storage, but no Metal Extractors and no basic land or air factories. Sub Commanders will not do anything except defend themselves and automatically transfer their excess income to you.";
    },
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Tourist Commander",
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addMods([
            {
              file: gwoUnit.commander,
              path: "storage.metal",
              op: "multiply",
              value: 200,
            },
          ]);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "load",
              value: CARD.id + ".json",
            },
          ]);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      const units = [
        gwoUnit.metalExtractorAdvanced,
        gwoUnit.metalExtractor,
        gwoUnit.jig,
      ];
      gwoCard.applyDulls(CARD, inventory, units);
    },
  };
});
