define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (GW, gwoCard) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Sudden Death tech enables the sudden death game modifier in every system."
    ),
    summarize: _.constant("!LOC:Sudden Death Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 28;

      if (gwoCard.travelledFar(system, context, GW.balance.numberOfSystems)) {
        chance = 120;
      }
      return { chance: chance };
    },
    buff: function () {
      // performed in referee_config.js
    },
    dull: function () {},
  };
});
