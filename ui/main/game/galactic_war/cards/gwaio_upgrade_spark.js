define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Spark Upgrade Tech increases the tesla bot's splash damage radius by 200%."
    ),
    summarize: _.constant("!LOC:Spark Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.spark)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.sparkAmmo,
          path: "splash_radius",
          op: "multiply",
          value: 3,
        },
        {
          file: gwoUnit.sparkAmmo,
          path: "full_damage_splash_radius",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {},
  };
});
