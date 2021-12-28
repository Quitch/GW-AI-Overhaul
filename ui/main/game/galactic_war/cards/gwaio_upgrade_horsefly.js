define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
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
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioCards.hasUnit(gwaioUnits.airFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        gwaioCards.hasUnit(gwaioUnits.horsefly)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.horsefly,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwaioUnits.bumblebeeWeapon,
            aim_bone: "bone_root",
            muzzle_bone: "bone_root",
          },
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
