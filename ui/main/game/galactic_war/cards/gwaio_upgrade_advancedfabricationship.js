define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Advanced Fabrication Ship Upgrade Tech changes the advanced naval fabricator into a hover unit, allowing it to cross land and lava."
      )
    )
  ),

  summarize: () => "!LOC:Advanced Fabrication Ship Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_sea" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.navalFactoryAdvanced),
      gwoCard.navalWeight(inventory, 30)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.navalFabberAdvanced,
        path: "unit_types",
        op: "push",
        value: "UNITTYPE_Hover",
      },
      {
        file: gwoUnit.navalFabberAdvanced,
        path: "navigation.type",
        op: "replace",
        value: "hover",
      },
    ]);
  },

  dull: function () {},
}));
