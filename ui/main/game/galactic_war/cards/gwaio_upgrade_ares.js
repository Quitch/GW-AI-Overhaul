define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Ares Upgrade Tech increases the range of the rolling fortress by 25%."
      )
    )
  ),

  summarize: () => "!LOC:Ares Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.ares)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.aresWeapon,
        path: "max_range",
        op: "multiply",
        value: 1.25,
      },
      {
        file: gwoUnit.aresWeapon,
        path: "pitch_range",
        op: "replace",
        value: 89,
      },
      {
        file: gwoUnit.aresWeapon,
        path: "arc_type",
        op: "replace",
        value: "ARC_high",
      },
      {
        file: gwoUnit.aresSecondary,
        path: "max_range",
        op: "multiply",
        value: 1.25,
      },
      {
        file: gwoUnit.aresSecondaryAmmo,
        path: "max_velocity",
        op: "replace",
        value: 200,
      },
    ]);
  },

  dull: function () {},
}));
