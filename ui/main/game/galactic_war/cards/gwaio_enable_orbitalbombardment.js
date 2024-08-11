define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "shared/gw_common",
], function (gwoCard, GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Bombardment Tech removes all trees, lava, and water from the systems you fight in."
    ),
    summarize: _.constant("!LOC:Orbital Bombardment Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 40;
      const dist = system.distance();
      if (
        context.totalSize <= GW.balance.numberOfSystems[0] ||
        context.totalSize <= GW.balance.numberOfSystems[1]
      ) {
        chance = 20;
      } else if (
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 6) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 9) ||
        dist > 7
      ) {
        chance = 80;
      }
      return { chance: chance };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
