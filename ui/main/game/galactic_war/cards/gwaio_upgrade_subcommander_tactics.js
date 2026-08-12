define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], (
  gwoCard,
) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Sub Commander Tactics Tech allows Sub Commanders to make smarter decisions when scouting, fighting, expanding, and escaping danger.",

  summarize: () => "!LOC:Sub Commander Tactics Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_subcommander",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return { chance: gwoCard.subcommanderWeight(inventory, 55) };
  },

  buff: function () {
    // performed in shared/referee_subcommander_tech.js
  },

  dull: function () {},
}));
