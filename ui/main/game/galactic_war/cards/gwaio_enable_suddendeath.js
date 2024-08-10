define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Sudden Death tech enables sudden death mode in every system."
    ),
    summarize: _.constant("!LOC:Sudden Death Tech"),
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
      const chance = 30;
      const minionModifier = chance * inventory.minions().length;
      return { chance: chance + minionModifier };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
