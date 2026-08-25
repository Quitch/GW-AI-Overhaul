define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Cooldown Tech halves the cooldown time between builds for all bot factories."
    ),
    summarize: _.constant("!LOC:Bot Cooldown Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_factory.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_bot" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.botFactories),
        70
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.botFactories, "multiply", {
          factory_cooldown_time: 0.5,
        })
      );
    },
    dull: function () {},
  };
});
