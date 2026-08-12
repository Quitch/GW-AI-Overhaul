define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Metal Storage Upgrade Tech increases the amount of metal storage by 300%.",
      ),
    ),
  ),

  summarize: () => "!LOC:Metal Storage Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_economy",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.metalStorage),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.metalStorage,
        path: "storage.metal",
        op: "multiply",
        value: 4,
      },
    ]);
  },

  dull: function () {},
}));
