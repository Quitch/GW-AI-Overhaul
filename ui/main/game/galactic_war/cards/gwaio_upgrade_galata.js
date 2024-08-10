define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Galata Upgrade Tech enables the targeting of land and surface naval units by anti-air defense."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Galata Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.galata)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.galata,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_SurfaceDefense",
        },
        {
          file: gwoUnit.galataWeapon,
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwoUnit.galataWeapon,
          path: "target_priorities",
          op: "push",
          value: ["Mobile & (Land | Naval)"],
        },
        {
          file: gwoUnit.galataAmmo,
          path: "armor_damage_map",
          op: "replace",
          value: {},
        },
      ]);
    },
    dull: function () {},
  };
});
