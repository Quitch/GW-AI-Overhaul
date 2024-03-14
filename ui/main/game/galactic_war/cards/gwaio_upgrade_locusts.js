define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Locusts Upgrade Tech adds splash damage to nanoswarms."
    ),
    summarize: _.constant("!LOC:Locusts Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.locusts)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.locustsAmmo,
          path: "splash_damage",
          op: "add",
          value: 20,
        },
        {
          file: gwoUnit.locustsAmmo,
          path: "splash_radius",
          op: "add",
          value: 20,
        },
        {
          file: gwoUnit.locustsAmmo,
          path: "full_damage_splash_radius",
          op: "add",
          value: 5,
        },
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
