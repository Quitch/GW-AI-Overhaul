define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "shared/gw_common",
], (gwoCard, gwoGroup, GW) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Orbital Cooldown Tech halves the cooldown time between builds for all orbital factories.",

  summarize: () => "!LOC:Orbital Cooldown Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_orbital",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context) {
    const sizes = GW.balance.numberOfSystems;
    return {
      chance: gwoCard.travelledShort(system, context, sizes) ? 70 : 35,
    };
  },

  buff: function (inventory) {
    const mods = _.map(gwoGroup.orbitalFactories, (unit) => ({
      file: unit,
      path: "factory_cooldown_time",
      op: "multiply",
      value: 0.5,
    }));
    inventory.addMods(mods);
  },

  dull: function () {},
}));
