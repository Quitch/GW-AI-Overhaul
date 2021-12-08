define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Sub Commander Fabber Tech increases the number of fabbers each Sub Commander may use by 50%."
  ),
  summarize: _.constant("!LOC:Sub Commander Fabber Tech"),
  icon: _.constant(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png"
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
  buff: function () {
    // performed in referee.js
  },
  dull: function () {
    //empty
  },
});
