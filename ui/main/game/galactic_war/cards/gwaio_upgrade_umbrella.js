define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Umbrella Upgrade Tech enables the targeting of land and surface naval units by anti-orbital defenses."
      )
    )
  ),

  summarize: () => "!LOC:Umbrella Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.umbrella)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.umbrella,
        path: "unit_types",
        op: "push",
        value: "UNITTYPE_SurfaceDefense",
      },
      {
        file: gwoUnit.umbrellaWeapon,
        path: "target_layers",
        op: "push",
        value: ["WL_LandHorizontal", "WL_WaterSurface"],
      },
      {
        file: gwoUnit.umbrellaAmmo,
        path: "turn_rate",
        op: "replace",
        value: 1000,
      },
    ]);
  },

  dull: function () {},
}));
