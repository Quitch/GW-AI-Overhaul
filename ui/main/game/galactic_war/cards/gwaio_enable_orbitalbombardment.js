define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "shared/gw_common",
], function (gwoCard, GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Bombardment Tech removes all trees, lava, and water from the systems you fight in."
    ),
    summarize: _.constant("!LOC:Orbital Bombardment Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      if (
        inventory.hasCard("gwaio_start_naval") ||
        inventory.hasCard("gwaio_enable_tsunami")
      ) {
        return { chance: 0 };
      }
      if (context.totalSize <= sizes[0] || context.totalSize <= sizes[1]) {
        return { chance: 20 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 80 : 40,
      };
    },
    buff: function () {
      // performed in referee_config.js
    },
    dull: function () {},
  };
});
