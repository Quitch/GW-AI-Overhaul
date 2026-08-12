define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], (
  gwoCard
) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Sub Commander Duplication Tech adds an extra Commander to every Sub Commander's army.",

  summarize: () => "!LOC:Sub Commander Duplication Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_subcommander",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return { chance: gwoCard.subcommanderWeight(inventory, 35) };
  },

  buff: function () {
    // performed in shared/referee_subcommander_tech.js
  },

  dull: function () {},
}));
