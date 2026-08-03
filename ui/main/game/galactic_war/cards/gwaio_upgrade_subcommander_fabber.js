define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Sub Commander Fabber Tech increases the number of fabbers each Sub Commander may use by 50%."
    ),
    summarize: _.constant("!LOC:Sub Commander Fabber Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_subcommander",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var galaxy = model.game().galaxy();
      var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
      if (gwoSettings && gwoSettings.aiAlly === "Queller") {
        return { chance: 0 };
      }
      return { chance: gwoCard.subcommanderWeight(inventory, 55) };
    },
    buff: function () {
      // performed in shared/referee_subcommander_tech.js
    },
    dull: function () {},
  };
});
