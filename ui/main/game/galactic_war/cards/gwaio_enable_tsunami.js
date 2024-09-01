define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "shared/gw_common",
], function (gwoCard, GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Tsunami Tech increases the water and lava level in all systems you fight in."
    ),
    summarize: _.constant("!LOC:Tsunami Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 40;
      const dist = system.distance();
      if (
        inventory.hasCard("gwaio_start_naval") ||
        inventory.hasCard("gwaio_enable_orbitalbombardment")
      ) {
        chance = 0;
      } else if (
        context.totalSize <= GW.balance.numberOfSystems[0] ||
        context.totalSize <= GW.balance.numberOfSystems[1]
      ) {
        chance = 80;
      } else if (
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 6) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 9) ||
        dist > 7
      ) {
        chance = 20;
      }
      return { chance: chance };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
