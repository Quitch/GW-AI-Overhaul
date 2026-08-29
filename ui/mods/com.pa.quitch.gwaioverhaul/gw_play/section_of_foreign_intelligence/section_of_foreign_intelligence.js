// Vendored from wondible's Section of Foreign Intelligence for Galactic War
// (Apache 2.0, see LICENSE.txt); modified by Quitch - changes documented at
// https://github.com/Quitch/GW-AI-Overhaul
var gwoIntelligenceLoaded;

// The buff indices gw_start/setup.js writes into ai.typeOfBuffs. `commanders` is
// only present in v5.11.0 and earlier saves.
var gwoBuffType = {
  cost: 0,
  damage: 1,
  health: 2,
  speed: 3,
  build: 4,
  commanders: 5,
  combat: 6,
  cooldown: 7,
};

function gwoIntelligence() {
  if (gwoIntelligenceLoaded || model.game().isTutorial()) {
    return;
  }

  gwoIntelligenceLoaded = true;

  try {
    model.gwoAvailableTechTooltip =
      "!LOC:This card will be offered as part of the first draw.";
    model.gwoGameModifiersTooltip =
      "!LOC:BOUNTIES: earn an economic multiplier for every kill.<br>LAND ANYWHERE: players can start anywhere on viable starting planets.<br>SUDDEN DEATH: any commander death on a team kills the entire team.<br>ERADICATE: all units of specific types must be eradicated.";
    model.gwoAIBuffsTooltip =
      "!LOC:Applied to AI commanders and units preferred by the faction.";

    var getNumberOfCommanders = function (commander) {
      return commander.bossCommanders || commander.commanderCount || 1;
    };

    var getCommanderCharacter = function (commander) {
      var character = commander.character
        ? loc(commander.character)
        : loc("!LOC:None");
      if (commander.penchantName) {
        character = character + " " + loc(commander.penchantName);
      }
      return character;
    };

    var setFactionIndex = function (commander, currentFaction) {
      return _.isUndefined(commander.faction)
        ? currentFaction
        : commander.faction;
    };

    // Presence, not truthiness: faction 0 is Legonis Machina. Only an enemy
    // minion omits the field.
    var getFactionColourIndex = function (commander, index) {
      return _.isUndefined(commander.faction) ? index + 1 : 0;
    };

    var getFactionName = function (commander, currentFaction) {
      if (_.isUndefined(commander.faction)) {
        return {
          name: "",
          tooltip: "",
        };
      }

      var playerFaction = model
        .game()
        .inventory()
        .getTag("global", "playerFaction");
      var factionInfo = [
        { name: "Legonis Machina", tooltip: "!LOC:Prefers vehicles." },
        { name: "Foundation", tooltip: "!LOC:Prefers air and navy." },
        { name: "Synchronous", tooltip: "!LOC:Prefers bots." },
        { name: "Revenants", tooltip: "!LOC:Prefers orbital." },
        {
          name: "Cluster",
          tooltip:
            "!LOC:Prefers bots and vehicles; applies tech to structures.",
        },
      ];
      var faction = commander.mirrorMode
        ? { name: "Guardians", tooltip: "!LOC:A mystery." }
        : factionInfo[commander.faction];

      if (currentFaction === playerFaction) {
        faction.name += " (" + loc("!LOC:ALLY") + ")";
        faction.tooltip = "!LOC:Fights for you.";
      }

      return {
        name: faction.name,
        tooltip: faction.tooltip,
      };
    };

    var formattedString = function (number) {
      var km2 = 1000000;
      number = number / km2;
      if (number < 1000) {
        return number.toPrecision(3);
      }
      return Math.floor(number);
    };

    var calculateSurfaceArea = function (system) {
      var area = 0;
      _.forEach(system.planets(), function (world) {
        if (world.generator && world.generator.biome !== "gas") {
          area += 4 * Math.PI * Math.pow(world.generator.radius, 2);
        }
      });
      return formattedString(area);
    };

    var toFixedIfNecessary = function (value, decimals) {
      // + converts the string output of toFixed() back to a float
      return +Number.parseFloat(value).toFixed(decimals);
    };

    // Under per-player tech a viewer is shown their own offer, and nothing at
    // all until the host has dealt them one - ai.cardName is the host's card,
    // which is the thing this exists to stop advertising to them.
    var availableTech = function (star, starIndex, starCardsView) {
      var cardList = star.cardList();
      if (cardList.length !== 1) {
        return ""; // Don't show when finding cards through Explore
      }

      if (
        starCardsView.shouldUseViewerStarCard(
          model.isCampaignViewer(),
          model.gwCampaignPerPlayerTechCards()
        )
      ) {
        return starCardsView.cardName(starCardsView.cardIdForStar(starIndex));
      }

      return star.ai().cardName || "";
    };

    var eradicatorModeNameBuilder = function (ai) {
      var commander = loc("!LOC:Commander");
      var modes = [commander];
      if (ai.eradicationModeSubCommanders) {
        modes.push(loc("!LOC:Colonel"));
      }
      if (ai.eradicationModeFactories) {
        modes.push(loc("!LOC:Factory"));
      }
      if (ai.eradicationModeFabbers) {
        modes.push(loc("!LOC:Fabber"));
      }

      var append = "";

      _.forEach(modes, function (mode, i) {
        append += " ";
        append += mode;
        if (i !== modes.length - 1) {
          append += ",";
        }
      });

      return append;
    };

    var convertBuffNumberToName = function (ai) {
      var buffs = ai.typeOfBuffs;
      var guardians = ai.mirrorMode;
      var buffNames = [];
      _.forEach(buffs, function (buff) {
        switch (buff) {
          case gwoBuffType.cost:
            buffNames.push(loc("!LOC:Costs decreased"));
            break;
          case gwoBuffType.damage:
            buffNames.push(loc("!LOC:Damage increased"));
            break;
          case gwoBuffType.health:
            buffNames.push(loc("!LOC:Health increased"));
            break;
          case gwoBuffType.speed:
            buffNames.push(loc("!LOC:Speed increased"));
            break;
          case gwoBuffType.build:
            buffNames.push(loc("!LOC:Build faster"));
            break;
          case gwoBuffType.commanders:
            buffNames.push(loc("!LOC:Commanders enhanced"));
            break;
          case gwoBuffType.combat:
            buffNames.push(loc("!LOC:Combat units enhanced"));
            break;
          case gwoBuffType.cooldown:
            buffNames.push(loc("!LOC:Factory cooldown decreased"));
            break;
          default:
            throw new Error("Undefined buff type: " + buff);
        }
      });
      if (guardians) {
        buffNames.push(loc("!LOC:Your technology bonuses"));
      }
      return buffNames;
    };

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_star_cards_view.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
      ],
      function (
        gwoColour,
        gwoCards,
        gwoAI,
        gwoRefereeCoop,
        gwoStarCardsView,
        gwoRaces
      ) {
        var starCardsView = gwoStarCardsView();

        var url =
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/section_of_foreign_intelligence/section_of_foreign_intelligence.html";
        $.get(url, function (html) {
          var $fi = $(html);
          $("#system-detail").append($fi);
          locTree($(".section-of-foreign-intelligence"));
          ko.applyBindings(model, $fi[0]);
        });

        var convertGameModifiersToName = function (ai, inventory) {
          var gameModifiers = [];

          if (
            ai.bountyMode ||
            gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_bounties")
          ) {
            gameModifiers.push(loc("!LOC:Bounties"));
          }
          if (
            ai.landAnywhere ||
            gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_landanywhere")
          ) {
            gameModifiers.push(loc("!LOC:Land Anywhere"));
          }
          if (
            ai.suddenDeath ||
            gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_suddendeath")
          ) {
            gameModifiers.push(loc("!LOC:Sudden Death"));
          } else if (
            ai.eradicationMode ||
            gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_eradication")
          ) {
            gameModifiers.push(
              loc("!LOC:Eradicate") + ":" + eradicatorModeNameBuilder(ai)
            );
          }
          return gameModifiers;
        };

        var factionIndex = 0;

        // allyPosition is set only for a star's ai.ally. Its own saved faction is
        // not consulted: the battle forces it into the player's, and wars predating
        // the field would otherwise fall to the enemy palette.
        var intelligence = function (commander, index, allyPosition) {
          var isStarAlly = !_.isUndefined(allyPosition);
          factionIndex = isStarAlly
            ? model.game().inventory().getTag("global", "playerFaction")
            : setFactionIndex(commander, factionIndex);
          var adjustedIndex = isStarAlly
            ? gwoRefereeCoop.alliedColourIndex(allyPosition)
            : getFactionColourIndex(commander, index);
          var name = commander.name;
          var eco = isStarAlly
            ? gwoAI.subcommanderEconRate
            : gwoAI.aiEconRateWithFloor(commander.econ_rate);
          var numCommanders = getNumberOfCommanders(commander);
          // The race shows through the icon, not the name. See races.md.
          var raceDescriptor = gwoRaces.byId(commander.race);
          var faction = getFactionName(commander, factionIndex);

          if (numCommanders > 1) {
            name = name.concat(" x", numCommanders);
            eco = eco * ((numCommanders + 1) / 2);
          }

          var icon = (raceDescriptor && raceDescriptor.playerIcon) || {};

          return {
            name: name,
            color: gwoColour.rgb(
              gwoColour.pick(factionIndex, commander.color, adjustedIndex)
            ),
            character: getCommanderCharacter(commander),
            eco: eco,
            faction: faction.name,
            tooltip: faction.tooltip,
            iconFill: icon.fill,
            iconOutline: icon.outline,
          };
        };

        // Wrapped so _.map cannot hand its third argument to allyPosition.
        var intelligenceOf = function (commander, index) {
          return intelligence(commander, index);
        };

        var measureThreat = function (ai) {
          var commanders = [];
          var totalThreat = 0;
          commanders.push(intelligence(ai, 0));
          if (ai.minions) {
            commanders = commanders.concat(_.map(ai.minions, intelligenceOf));
          }
          if (ai.foes) {
            commanders = commanders.concat(_.map(ai.foes, intelligenceOf));
            _.forEach(ai.foes, function (army) {
              var commanderCount = 1;
              if (army.commanderCount) {
                commanderCount = army.commanderCount;
              } else if (army.landing_policy) {
                // legacy GWO support
                commanderCount = army.landing_policy.length;
              }
              totalThreat +=
                gwoAI.aiEconRateWithFloor(army.econ_rate) *
                0.4 *
                (commanderCount - 1);
            });
          }
          _.times(commanders.length, function (n) {
            totalThreat += commanders[n].eco;
          });
          if (ai.ally) {
            // Not ai.ally.econ_rate - the battle overrides it with this
            // (referee_config_setup.js).
            totalThreat /= gwoAI.subcommanderEconRate + 1;
          }
          _.forEach(ai.typeOfBuffs, function (buff) {
            switch (buff) {
              case gwoBuffType.cost:
              case gwoBuffType.build:
                totalThreat *= 1.3;
                break;
              case gwoBuffType.damage:
              case gwoBuffType.health:
              case gwoBuffType.cooldown:
                totalThreat *= 1.2;
                break;
              case gwoBuffType.speed:
                totalThreat *= 1.1;
                break;
              case gwoBuffType.combat:
                totalThreat *= 1.5;
                break;
              default:
                throw new Error("Undefined buff type: " + buff);
            }
          });
          var guardians = ai.mirrorMode;
          if (guardians) {
            totalThreat *= 3;
          }
          return toFixedIfNecessary(totalThreat, 2);
        };

        var createAIIntelligence = function (ai) {
          var commanders = [];
          commanders.push(intelligence(ai, 0));
          if (ai.minions) {
            var minions = _.map(ai.minions, intelligenceOf);
            commanders = commanders.concat(minions);
          }
          if (ai.foes) {
            var foes = _.map(ai.foes, intelligenceOf);
            commanders = commanders.concat(foes);
          }
          if (ai.ally) {
            var game = model.game();
            var subcommanders = gwoRefereeCoop.getOrderedSubcommanders(
              game.inventory(),
              game
            );
            commanders.push(intelligence(ai.ally, 0, subcommanders.length));
          }
          return commanders;
        };

        model.gwoSystemSurfaceArea = ko.observable(0);
        model.gwoSystemThreat = ko.observable(0);
        model.gwoAvailableTech = ko.observable("");
        model.gwoGameModifiers = ko.observableArray([]);
        model.gwoAIBuffs = ko.observableArray([]);
        model.gwoAis = ko.observableArray([]);

        model.generateIntelligence = ko.computed(function () {
          var inventory = model.game().inventory();
          var system = model.selection.system();
          var starIndex = model.selection.star();
          var star = system.star;
          var ai = star.ai();
          model.gwoSystemSurfaceArea(calculateSurfaceArea(system));
          if (!ai) {
            model.gwoSystemThreat(0);
            model.gwoAvailableTech("");
            model.gwoGameModifiers([]);
            model.gwoAIBuffs([]);
            model.gwoAis([]);
            return;
          }
          model.gwoSystemThreat(measureThreat(ai));
          model.gwoAvailableTech(availableTech(star, starIndex, starCardsView));
          model.gwoAIBuffs(convertBuffNumberToName(ai));
          model.gwoGameModifiers(convertGameModifiersToName(ai, inventory));
          model.gwoAis(createAIIntelligence(ai));
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoIntelligence();
