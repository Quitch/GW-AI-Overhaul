define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Tsunami Tech increases the water and lava level in all systems you fight in."
    ),
    summarize: _.constant("!LOC:Tsunami Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      if (
        inventory.hasCard("gwaio_start_naval") ||
        inventory.hasCard("gwaio_enable_orbitalbombardment")
      ) {
        return { chance: 0 };
      }
      var navalBonuses = _.filter(inventory.cards(), function (card) {
        return _.includes(card.id, "_sea");
      }).length;
      return { chance: Math.min(30 + navalBonuses * 15, 90) };
    },
    buff: function () {
      // performed in referee_config.js
    },
    dull: function () {},
  };
});
