define(["shared/gw_factions"], function (GWFactions) {
  return {
    visible: _.constant(true),
    describe: function (params) {
      var minion = params.minion;
      var result = [];
      result.push("!LOC:Adds a Sub Commander that will join you in battles.");
      result.push("<br>");
      result.push("!LOC:Name: ");
      result.push(minion.name);
      if (minion.character) {
        result.push("<br>");
        result.push("!LOC:Personality:");
        result.push(" " + loc(minion.character));
      }
      return result;
    },
    summarize: _.constant("!LOC:Sub Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_subcommander",
    }),
    getContext: function (galaxy, inventory) {
      return {
        chance: 100,
        totalSize: galaxy.stars().length,
        faction: inventory.getTag("global", "playerFaction") || 0,
      };
    },
    deal: function (system, context) {
      function hasUnit(id) {
        return _.any(model.game().inventory().units(), function (unit) {
          return id === unit;
        });
      }
      var chance = context.chance;
      if (
        !hasUnit("/pa/units/land/vehicle_factory/vehicle_factory.json") &
        !hasUnit("/pa/units/land/bot_factory/bot_factory.json") &
        !hasUnit("/pa/units/air/air_factory/air_factory.json")
      ) {
        chance = 0;
      }
      var minion = _.sample(GWFactions[context.faction].minions);
      return {
        params: {
          minion: minion,
          unique: Math.random(),
        },
        chance: system.distance() > 0 ? chance : 0,
      };
    },
    buff: function (inventory, params) {
      // Note: Storing only the name allows changing the parameters, which
      // is easier for testing.  Every time the cards get re-applied, the
      // minion parameters will be updated.
      var minion = params.minion;
      inventory.minions.push(minion);
      if (minion.commander) inventory.addUnits([minion.commander]);
    },
    // eslint-disable-next-line lodash/prefer-noop
    dull: function () {},
    keep: function (_, context) {
      context.chance = 50;
    },
    discard: function (_, context) {
      context.chance *= Math.log(context.totalSize) * 0.25;
    },
  };
});
