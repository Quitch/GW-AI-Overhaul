define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], (
  gwoCard,
) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Bounty tech enables the bounties game modifier in every system.",

  summarize: () => "!LOC:Bounty Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 60 };
  },

  buff: function () {
    // performed in referee_config.js
  },

  dull: function () {},
}));
