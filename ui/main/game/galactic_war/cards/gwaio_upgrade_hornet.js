define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Hornet Upgrade Tech adds splash damage to the tactical bomber's attacks."
    ),
    summarize: _.constant("!LOC:Hornet Upgrade Tech"),
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
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.hornet)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.hornetAmmo,
          path: "splash_damage",
          op: "replace",
          value: 1000,
        },
        {
          file: gwoUnit.hornetAmmo,
          path: "splash_radius",
          op: "replace",
          value: 12,
        },
      ]);
    },
    dull: function () {},
  };
});
