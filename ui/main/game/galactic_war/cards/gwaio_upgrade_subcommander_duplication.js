define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Sub Commander Duplication Tech adds an extra Commander to every Sub Commander's army."
    ),
    summarize: _.constant("!LOC:Sub Commander Duplication Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_subcommander",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (inventory.minions().length > 0) {
        chance = 30;
      }
      return { chance: chance };
    },
    buff: function () {
      // performed in referee_config.js
    },
    dull: function () {},
  };
});
