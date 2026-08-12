define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Radar Jamming Station Upgrade Tech doubles the jamming radius of the radar jammer."
      )
    )
  ),

  summarize: () => "!LOC:Radar Jamming Station Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_efficiency",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.radarJammingStation)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.radarJammingStation,
        path: "recon.observer.items.2.radius",
        op: "multiply",
        value: 2,
      },
    ]);
  },

  dull: function () {},
}));
