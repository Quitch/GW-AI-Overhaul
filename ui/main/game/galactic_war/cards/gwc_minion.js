define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], function (GWFactions, gwoCard, gwoUnit, gwoAI) {
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
        if (minion.penchant) {
          result.push(" " + loc(minion.penchant));
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
      var aiOpeningFactories = [
        gwoUnit.vehicleFactory,
        gwoUnit.botFactory,
        gwoUnit.airFactory,
      ];

      if (
        gwoCard.missingAllUnits(inventory.units(), aiOpeningFactories) ||
        inventory.hasCard("nem_start_deepspace") ||
        inventory.hasCard("gwaio_start_tourist")
      ) {
        chance = 0;
      } else if (inventory.minions) {
        var hostMinionCount = inventory.minions().length;
        var allMinionCount = coopMinionCount();
        var totalMinions = Math.max(hostMinionCount, allMinionCount);
        chance = chance / (totalMinions + 1);
      }

      var galaxy = model.game().galaxy();
      var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
      var minionPool = GWFactions[context.faction].minions;
      if (gwoSettings && gwoSettings.aiAlly === "Queller") {
        minionPool = gwoAI.quellerCompatibleMinions(minionPool);
      }
      var minion = _.cloneDeep(
        rng ? rng.pick(minionPool) : _.sample(minionPool)
      );

      if (gwoSettings) {
        var ai = gwoSettings.ai;
        if (ai === "Penchant") {
          var penchantValues = gwoAI.penchants(rng);
          minion.character =
            minion.character + (" " + loc(penchantValues.penchantName));
          minion.personality.personality_tags =
            minion.personality.personality_tags.concat(
              penchantValues.penchants
            );
        }
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
