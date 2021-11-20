define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Sub Commander Fabber Tech doubles the number of fabbers each Sub Commander may use."
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
  deal: function (system, context, inventory) {
    var chance = 0;
    if (inventory.hasCard("gwc_minion")) chance = 30;

    return { chance: chance };
  },
  buff: function () {},
  dull: function () {},
});
