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
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_subcommander",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      const galaxy = model.game().galaxy();
      const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
      const chance =
        gwoSettings && gwoSettings.ai === "Queller"
          ? 0
          : inventory.minions().length * 30;
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function () {
      // performed in referee_config.js
    },
    dull: function () {},
  };
});
