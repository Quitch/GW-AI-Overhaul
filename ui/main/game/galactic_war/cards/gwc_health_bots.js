define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Armor Tech increases health of all bots by 50%"
    ),
    summarize: _.constant("!LOC:Bot Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoGroup.botsMobileNoCluster)) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.map(gwoGroup.botsMobile, function (unit) {
        return {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
