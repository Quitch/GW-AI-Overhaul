define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Bot Cooldown Tech halves the cooldown time between builds for all bot factories.",

  summarize: () => "!LOC:Bot Cooldown Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_factory.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_bot" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.botFactories),
      70,
    );
  },

  buff: function (inventory) {
    const mods = _.map(gwoGroup.botFactories, (unit) => ({
      file: unit,
      path: "factory_cooldown_time",
      op: "multiply",
      value: 0.5,
    }));
    inventory.addMods(mods);
  },

  dull: function () {},
}));
