define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Artemis Upgrade Tech allows targeting of planetary units by the railgun platform."
      )
    )
  ),

  summarize: () => "!LOC:Artemis Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.artemis)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.artemisWeapon,
        path: "target_layers",
        op: "push",
        value: ["WL_LandHorizontal", "WL_WaterSurface", "WL_Air"],
      },
      {
        file: gwoUnit.artemisAmmo,
        path: "collision_check",
        op: "replace",
        value: "target",
      },
      {
        file: gwoUnit.artemis,
        path: "unit_types",
        op: "push",
        value: "UNITTYPE_Heavy",
      },
    ]);
  },

  dull: function () {},
}));
