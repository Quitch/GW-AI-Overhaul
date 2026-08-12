define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], (
  gwoCard
) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Land Anywhere tech enables the land anywhere game modifier in every system.",

  summarize: () => "!LOC:Land Anywhere Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return {
      chance: Math.min(40 + 20 * inventory.minions().length, 100),
    };
  },

  buff: function () {
    // performed in referee_config.js
  },

  dull: function () {},
}));
