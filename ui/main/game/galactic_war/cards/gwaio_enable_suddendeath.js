define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], (GW, gwoCard) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Sudden Death tech enables the sudden death game modifier in every system.",

  summarize: () => "!LOC:Sudden Death Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function (system, context) {
    const sizes = GW.balance.numberOfSystems;
    if (gwoCard.travelledFar(system, context, sizes)) {
      return { chance: 100 };
    }
    return {
      chance: gwoCard.travelledModerate(system, context, sizes) ? 50 : 25,
    };
  },

  buff: function () {
    // performed in referee_config.js
  },

  dull: function () {},
}));
