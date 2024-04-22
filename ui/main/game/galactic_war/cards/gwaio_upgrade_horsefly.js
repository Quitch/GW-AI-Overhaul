define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Horsefly Upgrade Tech adds the Bumblebee carpet bomber's weapon to the strafer."
    ),
    summarize: _.constant("!LOC:Horsefly Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.horsefly)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.horsefly,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwoUnit.bumblebeeWeapon,
            aim_bone: "bone_root",
            muzzle_bone: "bone_root",
          },
        },
      ]);
    },
    dull: function () {},
  };
});
