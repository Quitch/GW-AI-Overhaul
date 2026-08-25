define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Galata Upgrade Tech enables the targeting of land and surface naval units by anti-air defense."
        )
      )
    ),
    summarize: _.constant("!LOC:Galata Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.galata)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.galata, "push", {
            unit_types: "UNITTYPE_SurfaceDefense",
          })
          .concat(
            gwoCard.mods(gwoUnit.galataWeapon, "push", {
              target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
              target_priorities: ["Mobile & (Land | Naval)"],
            }),
            gwoCard.mods(gwoUnit.galataAmmo, "replace", {
              armor_damage_map: {},
            })
          )
      );
    },
    dull: function () {},
  };
});
