define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Bombardment Tech removes all trees, lava, and water from systems you fight in."
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
    deal: function () {
      return { chance: 40 };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
