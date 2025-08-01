define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Phoenix Upgrade Tech changes the advanced interplanetary fighter's weapon from anti-air to anti-ground."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Phoenix Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.phoenix)) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.phoenixWeapon,
          path: "target_layers",
          op: "replace",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwoUnit.phoenix,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Gunship",
        },
        {
          file: gwoUnit.phoenixAmmo,
          path: "armor_damage_map.AT_Structure",
          op: "replace",
          value: 1,
        },
      ]);

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
