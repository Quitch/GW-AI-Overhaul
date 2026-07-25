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
      // 0-gate preserved: a naval start is already all-in on naval; orbital
      // bombardment is the opposing terrain modifier.
      if (
        inventory.hasCard("gwaio_start_naval") ||
        inventory.hasCard("gwaio_enable_orbitalbombardment")
      ) {
        return { chance: 0 };
      }
      // Scale with the player's naval commitment, matched by the common "_sea" token
      // (their ships, naval enablement, or anti-ship tech that wants ships to fight)
      // so future/modder naval cards count with no explicit support. Eight cards
      // carry that token today, so the old uncapped "+ 30 each" topped out at 270 -
      // a lock rather than a preference. Capped like the gwaio_upgrade_subcommander_*
      // line does, still tripling the weight for a committed naval run.
      var navalBonuses = _.filter(inventory.cards(), function (card) {
        return _.includes(card.id, "_sea");
      }).length;
      return { chance: Math.min(30 + navalBonuses * 15, 90) };
    },
    buff: function () {
      // referee_config.js
    },
    dull: function () {},
  };
});
