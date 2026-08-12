define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Naval Cooldown Tech halves the cooldown time between builds for all naval factories.",

  summarize: () => "!LOC:Naval Cooldown Tech",

  icon: () => "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_sea" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.navalFactories),
      gwoCard.navalWeight(inventory, 70),
    );
  },

  buff: function (inventory) {
    const mods = _.map(gwoGroup.navalFactories, (unit) => ({
      file: unit,
      path: "factory_cooldown_time",
      op: "multiply",
      value: 0.5,
    }));
    inventory.addMods(mods);
  },

  dull: function () {},
}));
