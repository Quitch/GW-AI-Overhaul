define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  const airFactories = [gwoUnit.airFactory, gwoUnit.airFactoryAdvanced]
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Cooldown Tech halves the cooldown time between builds for all bot factories."
    ),
    summarize: _.constant("!LOC:Air Cooldown Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_factory.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), airFactories)) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.map(airFactories, function (unit) {
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
