define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "shared/gw_common",
], function (gwoCard, gwoGroup, GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Cooldown Tech halves the cooldown time between builds for all orbital factories."
    ),
    summarize: _.constant("!LOC:Orbital Cooldown Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_orbital",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 24;
      if (
        context.totalSize <= GW.balance.numberOfSystems[0] ||
        context.totalSize <= GW.balance.numberOfSystems[1]
      ) {
        chance = 12;
      } else if (
        gwoCard.farForSize(
          system,
          context,
          GW.balance.numberOfSystems,
          gwoCard.farLadders.moderate
        )
      ) {
        chance = 120;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.map(gwoGroup.orbitalFactories, function (unit) {
        return {
          file: unit,
          path: "factory_cooldown_time",
          op: "multiply",
          value: 0.5,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
