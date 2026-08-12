define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Advanced Energy Plant Upgrade Tech increases the energy production of this advanced economy structure by 25% but decreases its health by 50%.",
      ),
    ),
  ),

  summarize: () => "!LOC:Advanced Energy Plant Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_efficiency",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.energyPlantAdvanced),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.energyPlantAdvanced,
        path: "production.energy",
        op: "multiply",
        value: 1.25,
      },
      {
        file: gwoUnit.energyPlantAdvanced,
        path: "max_health",
        op: "multiply",
        value: 0.5,
      },
    ]);
  },

  dull: function () {},
}));
