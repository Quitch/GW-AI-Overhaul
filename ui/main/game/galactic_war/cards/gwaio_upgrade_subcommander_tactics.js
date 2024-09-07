define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Sub Commander Tactics Tech allows Sub Commanders to make smarter decisions when scouting, fighting, expanding, and escaping danger."
    ),
    summarize: _.constant("!LOC:Sub Commander Tactics Tech"),
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
      const chance = inventory.minions().length * 30;
      return { chance: chance };
    },
    buff: function () {
      // performed in referee_config.js
    },
    dull: function () {},
  };
});
