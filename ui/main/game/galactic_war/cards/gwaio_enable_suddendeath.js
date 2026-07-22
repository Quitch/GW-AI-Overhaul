define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
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
    deal: function (system, context, inventory) {
      var chance = 30;
      var minionModifier = chance * inventory.minions().length;
      return { chance: chance + minionModifier };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
