define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Land Anywhere tech enables the land anywhere game modifier in every system."
    ),
    summarize: _.constant("!LOC:Land Anywhere Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png"
    ),
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
  };
});
