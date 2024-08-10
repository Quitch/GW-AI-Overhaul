define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Artemis Upgrade Tech allows targeting of planetary units by the railgun platform."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Artemis Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.artemis)) {
        chance = 60;
      }
      return { chance: chance };
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
          file: gwoUnit.avenger,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Heavy",
        },
      ]);
    },
    dull: function () {},
  };
});
