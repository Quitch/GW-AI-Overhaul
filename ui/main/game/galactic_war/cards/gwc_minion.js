define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], (GWFactions, gwoCard, gwoUnit, gwoAI) => {
  const coopMinionCount = () => {
    const game = model.game();
    // Counts minions of absent players too, in case one rejoins.
    const coopPlayerInventoryData =
      game.coopPlayerInventoryData && _.isFunction(game.coopPlayerInventoryData)
        ? game.coopPlayerInventoryData()
        : [];
    let minionCount = 0;
    _.forEach(coopPlayerInventoryData, (playerData) => {
      if (
        playerData &&
        playerData.inventory &&
        Array.isArray(playerData.inventory.minions)
      ) {
        minionCount += playerData.inventory.minions.length;
      }
    });
    return minionCount;
  };

  return {
    visible: () => true,
    describe: function (params) {
      const minion = params.minion;
      const result = [];
      result.push(
        "!LOC:Adds a Sub Commander that will join you in battles.",
        "<br>",
        "!LOC:Name:",
        ` ${minion.name}`,
      );
      if (minion.character) {
        result.push("<br>", "!LOC:Personality:", ` ${loc(minion.character)}`);
        if (minion.penchant) {
          result.push(` ${loc(minion.penchant)}`);
        }
      }
      return result;
    },
    summarize: () => "!LOC:Sub Commander",
    icon: () => "coui://ui/main/game/galactic_war/shared/img/red-commander.png",
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
      let chance = 80;
      const aiOpeningFactories = [
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
        const hostMinionCount = inventory.minions().length;
        const allMinionCount = coopMinionCount();
        const totalMinions = Math.max(hostMinionCount, allMinionCount);
        chance = chance / (totalMinions + 1);
      }

      const galaxy = model.game().galaxy();
      const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
      let minionPool = GWFactions[context.faction].minions;
      if (gwoSettings && gwoSettings.aiAlly === "Queller") {
        minionPool = gwoAI.quellerCompatibleMinions(minionPool);
      }
      const minion = _.cloneDeep(
        rng ? rng.pick(minionPool) : _.sample(minionPool),
      );

      if (gwoSettings) {
        const ai = gwoSettings.ai;
        if (ai === "Penchant") {
          const penchantValues = gwoAI.penchants(rng);
          minion.character = `${minion.character} ${loc(penchantValues.penchantName)}`;
          minion.personality.personality_tags =
            minion.personality.personality_tags.concat(
              penchantValues.penchants,
            );
        }
      }

      return {
        params: {
          minion,
          unique: gwoCard.uniqueValue(rng),
        },
        chance,
      };
    },
    buff: function (inventory, params) {
      const minion = params.minion;
      inventory.minions.push(minion);
      if (minion.commander) {
        inventory.addUnits([minion.commander]);
      }
    },
    dull: function () {},
  };
});
