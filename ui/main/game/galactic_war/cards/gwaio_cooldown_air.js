define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Air Cooldown Tech halves the cooldown time between builds for all air factories.",

  summarize: () => "!LOC:Air Cooldown Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_air" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.airFactories),
      70,
    );
  },

  buff: function (inventory) {
    inventory.addMods(
      gwoCard.flatMapMods(gwoGroup.airFactories, "multiply", {
        factory_cooldown_time: 0.5,
      }),
    );
  },

  dull: function () {},
}));
