define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Sub Commander Fabber Tech increases the number of fabbers each Sub Commander may use by 50%."
  ),
  summarize: _.constant("!LOC:Sub Commander Fabber Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_subcommander",
    };
  },
  getContext: function (galaxy) {
    return {
      totalSize: galaxy.stars().length,
    };
  },
  deal: function () {
    var chance = 0;
    if (model.game().inventory().minions().length > 0) chance = 30;

    return { chance: chance };
  },
  buff: function () {},
  dull: function () {},
});
