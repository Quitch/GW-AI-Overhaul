define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Umbrella Upgrade Tech enables the targeting of land and surface naval units by anti-orbital defenses."
        )
      )
    ),
    summarize: _.constant("!LOC:Umbrella Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
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
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.umbrella, "push", {
            unit_types: "UNITTYPE_SurfaceDefense",
          })
          .concat(
            gwoCard.mods(gwoUnit.umbrellaWeapon, "push", {
              target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
            }),
            gwoCard.mods(gwoUnit.umbrellaAmmo, "replace", { turn_rate: 1000 })
          )
      );
    },
    dull: function () {},
  };
});
