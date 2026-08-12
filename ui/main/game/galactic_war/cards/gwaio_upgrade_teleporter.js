define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Teleporter Upgrade Tech removes all energy consumption and efficiency requirements from the interplanetary teleporter and makes it invisible to radar."
      )
    )
  ),

  summarize: () => "!LOC:Teleporter Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_energy_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_efficiency",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.teleporter)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.teleporter,
        path: "energy_efficiency_requirement",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.teleporter,
        path: "teleporter.energy_demand",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.teleporter,
        path: "recon.observable.ignore_radar",
        op: "replace",
        value: true,
      },
    ]);
  },

  dull: function () {},
}));
