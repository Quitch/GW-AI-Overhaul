define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
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
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (model.game().inventory().minions().length > 0) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function () {
      // performed in referee.js
    },
    dull: function () {
      //empty
    },
  };
});
