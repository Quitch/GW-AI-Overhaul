define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Vehicle Cooldown Tech halves the cooldown time between builds for all vehicle factories.",

  summarize: () => "!LOC:Vehicle Cooldown Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_vehicle",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.vehicleFactories),
      70,
    );
  },

  buff: function (inventory) {
    const mods = _.map(gwoGroup.vehicleFactories, (unit) => ({
      file: unit,
      path: "factory_cooldown_time",
      op: "multiply",
      value: 0.5,
    }));
    inventory.addMods(mods);
  },

  dull: function () {},
}));
