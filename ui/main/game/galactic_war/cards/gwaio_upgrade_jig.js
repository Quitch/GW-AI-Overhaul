define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Jig Upgrade Tech adds storage to gas mining and doubles its energy production.",
      ),
    ),
  ),

  summarize: () => "!LOC:Jig Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(gwoCard.hasUnit(inventory.units(), gwoUnit.jig));
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.jig,
        path: "production.energy",
        op: "multiply",
        value: 2,
      },
      {
        file: gwoUnit.jig,
        path: "storage.energy",
        op: "add",
        value: 50000,
      },
      {
        file: gwoUnit.jig,
        path: "storage.metal",
        op: "add",
        value: 10000,
      },
    ]);
  },

  dull: function () {},
}));
