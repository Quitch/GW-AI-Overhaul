define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], function (GWFactions, gwoCard, gwoUnit, gwoAI) {
  return {
    visible: _.constant(true),
    describe: function (params) {
      const minion = params.minion;
      const result = [];
      result.push("!LOC:Adds a Sub Commander that will join you in battles.");
      result.push("<br>");
      result.push("!LOC:Name:");
      result.push(" " + minion.name);
      if (minion.character) {
        result.push("<br>");
        result.push("!LOC:Personality:");
        result.push(" " + loc(minion.character));
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
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_subcommander",
      };
    },
    getContext: function (galaxy, inventory) {
      return {
        totalSize: galaxy.stars().length,
        faction: inventory.getTag("global", "playerFaction") || 0,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 100;
      const aiOpeningFactories = [
        gwoUnit.vehicleFactory,
        gwoUnit.botFactory,
        gwoUnit.airFactory,
      ];

      if (
        !gwoCard.hasUnit(inventory.units(), aiOpeningFactories) ||
        inventory.hasCard("nem_start_deepspace") ||
        inventory.hasCard("gwaio_start_tourist")
      ) {
        chance = 0;
      } else if (inventory.minions) {
        chance = chance / (inventory.minions().length + 1);
      }

      const minion = _.cloneDeep(_.sample(GWFactions[context.faction].minions));
      const galaxy = model.game().galaxy();
      const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

      if (gwoSettings) {
        const ai = gwoSettings.ai;
        if (ai === "Penchant") {
          const penchantValues = gwoAI.penchants();
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
          unique: Math.random(),
        },
        chance: chance,
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
    keep: function (params, context) {
      context.chance = 50;
    },
    discard: function (params, context) {
      context.chance *= Math.log(context.totalSize) * 0.25;
    },
  };
});
