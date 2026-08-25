define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Phoenix Upgrade Tech changes the advanced interplanetary fighter's weapon from anti-air to anti-ground."
        )
      )
    ),
    summarize: _.constant("!LOC:Phoenix Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.phoenix)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.phoenixWeapon, "replace", {
            target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
          })
          .concat(
            gwoCard.mods(gwoUnit.phoenix, "push", {
              unit_types: "UNITTYPE_Gunship",
            }),
            gwoCard.mods(gwoUnit.phoenixAmmo, "replace", {
              "armor_damage_map.AT_Structure": 1,
            }),
            gwoCard.mods(gwoUnit.phoenix, "replace", {
              guard_layer: "WL_AnySurface",
            })
          )
      );

      inventory.addAIMods([
        {
          type: "factory",
          op: "load",
          value: "gwaio_upgrade_phoenix.json",
        },
      ]);
    },
    dull: function () {},
  };
});
