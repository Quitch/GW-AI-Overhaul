define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Catapult Upgrade Tech adds flak from the Storm flak tank to the tactical missile launcher."
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
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.catapult)) {
        chance = 30;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.catapult,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwaioUnits.stormWeapon,
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
          file: gwaioUnits.catapult,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_AirDefense",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
