define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Kraken Upgrade Tech increases the range of the advanced submarine's missiles by 200%."
    ),
    summarize: _.constant("!LOC:Kraken Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.kraken)) {
        chance = 30;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.krakenMissile,
          path: "max_range",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
