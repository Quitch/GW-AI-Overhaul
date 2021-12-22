define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioFunctions, gwaioGroups) {
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
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_bots_t1") ||
        inventory.hasCard("gwc_enable_bots_all") ||
        inventory.hasCard("gwc_start_bot") ||
        inventory.hasCard("gwaio_start_hoarder") ||
        inventory.hasCard("tgw_start_speed")
      ) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var units = gwaioGroups.mobileBots;
      var mods = [];
      units.forEach(function (unit) {
        mods.push({
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
