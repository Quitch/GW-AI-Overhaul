define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwoCard, gwoGroup) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Vehicle Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Vehicle Commander loadout contains basic vehicle factories."
    ),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.vehiclesBasic);
        } else {
          // Don't clog up a slot.
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        // Don't clog up a slot.
        inventory.maxCards(inventory.maxCards() + 1);
        GW.bank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
