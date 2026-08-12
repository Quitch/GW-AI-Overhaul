define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Wyrm Upgrade Tech replaces the siege bomber's bombs with drones.",
      ),
    ),
  ),

  summarize: () => "!LOC:Wyrm Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.wyrm),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoUnit.squall);

    inventory.addMods([
      {
        file: gwoUnit.wyrm,
        path: "tools.0.spec_id",
        op: "replace",
        value: gwoUnit.typhoonWeapon,
      },
      {
        file: gwoUnit.wyrm,
        path: "tools.0.spec_id",
        op: "tag",
      },
      {
        file: gwoUnit.wyrm,
        path: "navigation.aggressive_distance",
        op: "replace",
        value: 250, // matches the Typhoon's drone launcher range
      },
      {
        file: gwoUnit.wyrm,
        path: "navigation.aggressive_behavior",
        op: "replace",
        value: "circle", // loiter at range instead of a bombing run
      },
    ]);
  },

  dull: function () {},
}));
