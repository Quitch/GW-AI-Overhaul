define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
], function (GWFactions, gwoCard, gwoGroup, gwoAI, gwoRaces) {
  var coopMinionCount = function () {
    var game = model.game();
    // Counts minions of absent players too, in case one rejoins.
    var coopPlayerInventoryData =
      game.coopPlayerInventoryData && _.isFunction(game.coopPlayerInventoryData)
        ? game.coopPlayerInventoryData()
        : [];
    var minionCount = 0;
    _.forEach(coopPlayerInventoryData, function (playerData) {
      if (
        playerData &&
        playerData.inventory &&
        _.isArray(playerData.inventory.minions)
      ) {
        minionCount += playerData.inventory.minions.length;
      }
    });
    return minionCount;
  };

  return {
    visible: _.constant(true),
    describe: function (params) {
      var minion = params.minion;
      var result = [];
      result.push(
        "!LOC:Adds a Sub Commander that will join you in battles.",
        "<br>",
        "!LOC:Name:",
        " " + minion.name
      );
      if (minion.character) {
        result.push("<br>", "!LOC:Personality:", " " + loc(minion.character));
        if (minion.penchantName) {
          result.push(" " + loc(minion.penchantName));
        }
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
        totalSize: galaxy.stars().length,
        faction: inventory.getTag("global", "playerFaction") || 0,
      };
    },
    deal: function (system, context, inventory, rng) {
      var chance = 80;
      if (
        gwoCard.missingAllUnits(
          inventory.units(),
          gwoGroup.landFactoriesBasic
        ) ||
        inventory.hasCard("gwaio_start_tourist")
      ) {
        chance = 0;
      } else if (inventory.minions) {
        var hostMinionCount = inventory.minions().length;
        var allMinionCount = coopMinionCount();
        var totalMinions = Math.max(hostMinionCount, allMinionCount);
        chance = chance / (totalMinions + 1);
      }

      // GWO - a Sub Commander fights as the player's race, and with it that
      // race's ally brain. See races.md.
      var race = gwoRaces.raceOf(inventory);
      var allyBrain = gwoAI.aiInUse("subcommander", race);
      var minionPool = GWFactions[context.faction].minions;
      if (allyBrain === "Queller") {
        minionPool = gwoAI.quellerCompatibleMinions(minionPool);
      }
      var minion = _.cloneDeep(
        rng ? rng.pick(minionPool) : _.sample(minionPool)
      );
      // Every reader gives a Sub Commander its own rate, so the card carries
      // no rate the template may hold.
      delete minion.econ_rate;
      if (!gwoRaces.isMla(race)) {
        minion.race = race;
        var raceCommander = gwoRaces.commanderFor(
          rng ? rng.stream("commander") : undefined,
          race
        );
        if (raceCommander) {
          minion.commander = raceCommander;
        }
      }

      // Only the name is recorded: its tags are built at launch. See galaxy.md.
      if (allyBrain === "Penchant") {
        minion.penchantName = gwoAI.penchants(rng).penchantName;
      }

      return {
        params: {
          minion: minion,
          unique: gwoCard.uniqueValue(rng),
        },
        chance: chance,
      };
    },
    buff: function (inventory, params) {
      var minion = params.minion;
      inventory.minions.push(minion);
      if (minion.commander) {
        inventory.addUnits([minion.commander]);
      }
    },
    dull: function () {},
  };
});
