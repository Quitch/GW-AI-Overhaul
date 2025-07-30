define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Catapult Upgrade Tech adds flak from the Storm flak tank to the tactical missile launcher."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Catapult Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.catapult)) {
        chance = 30;
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
          file: gwoUnit.catapult,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwoUnit.stormWeapon,
            aim_bone: "bone_missile01",
            projectiles_per_fire: 4,
            muzzle_bone: [
              "bone_missile01",
              "bone_missile01",
              "bone_missile01",
              "bone_missile01",
            ],
          },
        },
        {
          file: gwoUnit.catapult,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_AirDefense",
        },
      ]);
    },
    dull: function () {},
  };
});
