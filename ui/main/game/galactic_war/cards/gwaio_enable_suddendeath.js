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
    deal: function () {
      // This used to scale up with your Sub Commanders (30 + 30 each, uncapped),
      // which reads the modifier backwards. referee_config_setup.js puts every Sub
      // Commander in the player's own alliance group, and sudden death wipes a
      // whole team the moment any one of its commanders dies - so each extra Sub
      // Commander is another way to lose outright, not another reason to want the
      // card. The enemy AI and its minions share a group too, so it cuts both
      // ways; a flat weight just below its sibling modifiers suits that.
      return { chance: 45 };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
