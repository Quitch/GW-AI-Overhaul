// Modified by Quitch - changes documented at https://github.com/Quitch/GW-AI-Overhaul
var gwoIntelligenceLoaded;

function gwoIntelligence() {
  if (gwoIntelligenceLoaded || model.game().isTutorial()) {
    return;
  }

  gwoIntelligenceLoaded = true;

  try {
    model.gwoAvailableTechTooltip =
      "This card will be offered as part of the first draw.";
    model.gwoGameModifiersTooltip =
      "BOUNTIES: earn an economic multiplier for every kill.<br>LAND ANYWHERE: players can start anywhere on viable starting planets.<br>SUDDEN DEATH: any commander death on a team kills the entire team.";
    model.gwoAIBuffsTooltip =
      "Applied to AI commanders and units preferred by the faction.";

    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"],
      function (gwoColour) {
        const url =
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/section_of_foreign_intelligence/section_of_foreign_intelligence.html";
        $.get(url, function (html) {
          const $fi = $(html);
          $("#system-detail").append($fi);
          locTree($(".section-of-foreign-intelligence"));
          ko.applyBindings(model, $fi[0]);
        });

        const getNumberOfCommanders = function (commander) {
          if (commander.bossCommanders) {
            return commander.bossCommanders;
          } else if (commander.commanderCount) {
            return commander.commanderCount;
          }
          return 1;
        };

        const getCommanderCharacter = function (commander) {
          var character = commander.character
            ? loc(commander.character)
            : loc("!LOC:None");
          if (commander.penchantName) {
            character = character + " " + loc(commander.penchantName);
          }
          return character;
        };

        const setFactionIndex = function (commander, currentFaction) {
          return _.isUndefined(commander.faction)
            ? currentFaction
            : commander.faction;
        };

        const getFactionColourIndex = function (
          commander,
          index,
          currentFaction
        ) {
          const inventory = model.game().inventory();
          const playerFaction = inventory.getTag("global", "playerFaction");
          if (currentFaction === playerFaction) {
            // allies appear after the player and sub commanders in colour
            return index + inventory.minions().length + 1;
          }
          return commander.faction ? 0 : index + 1;
        };

        const getFactionName = function (commander, currentFaction) {
          if (_.isUndefined(commander.faction)) {
            return {
              name: "",
              tooltip: "",
            };
          }

          const inventory = model.game().inventory();
          const playerFaction = inventory.getTag("global", "playerFaction");
          const factionInfo = [
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
          const faction = commander.mirrorMode
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

        var factionIndex = 0;

        const intelligence = function (commander, index) {
          factionIndex = setFactionIndex(commander, factionIndex);
          const adjustedIndex = getFactionColourIndex(
            commander,
            index,
            factionIndex
          );
          var name = commander.name;
          var eco = commander.econ_rate;
          const numCommanders = getNumberOfCommanders(commander);
          const faction = getFactionName(commander, factionIndex);

          if (numCommanders > 1) {
            name = name.concat(" x", numCommanders);
            eco = eco * ((numCommanders + 1) / 2);
          }

          return {
            name: name,
            color: gwoColour.rgb(
              gwoColour.pick(factionIndex, commander.color, adjustedIndex)
            ),
            character: getCommanderCharacter(commander),
            eco: eco,
            faction: faction.name,
            tooltip: faction.tooltip,
          };
        };

        // Planetary Intelligence

        const formattedString = function (number) {
          const km2 = 1000000;
          number = number / km2;
          if (number < 1000) {
            return number.toPrecision(3);
          }
          return Math.floor(number);
        };

        model.gwoSystemSurfaceArea = ko.computed(function () {
          var area = 0;
          _.forEach(model.selection.system().planets(), function (world) {
            if (
              (world.generator && world.generator.biome !== "gas") ||
              (world.planet && world.planet.biome !== "gas")
            ) {
              area += 4 * Math.PI * Math.pow(world.generator.radius, 2);
            }
          });
          return formattedString(area);
        });

        const toFixedIfNecessary = function (value, decimals) {
          // + converts the string output of toFixed() back to a float
          return +parseFloat(value).toFixed(decimals);
        };

        model.gwoSystemThreat = ko.computed(function () {
          const ai = model.selection.system().star.ai();
          var commanders = [];
          var totalThreat = 0;
          if (ai) {
            commanders.push(intelligence(ai, 0));
            if (ai.minions) {
              commanders = commanders.concat(_.map(ai.minions, intelligence));
            }
            if (ai.foes) {
              commanders = commanders.concat(_.map(ai.foes, intelligence));
              _.forEach(ai.foes, function (army) {
                var commanderCount = 1;
                if (army.commanderCount) {
                  commanderCount = army.commanderCount;
                } else if (army.landing_policy) {
                  // legacy GWO support
                  commanderCount = army.landing_policy.length;
                }
                totalThreat += army.econ_rate * 0.4 * (commanderCount - 1);
              });
            }
            _.times(commanders.length, function (n) {
              totalThreat += commanders[n].eco;
            });
            _.forEach(ai.typeOfBuffs, function (buff) {
              switch (buff) {
                case 0: // cost
                case 4: // build
                  totalThreat *= 1.3;
                  break;
                case 1: // damage
                case 2: // health
                  totalThreat *= 1.2;
                  break;
                case 3: // speed
                  totalThreat *= 1.1;
                  break;
                case 6: // combat
                  totalThreat *= 1.5;
              }
            });
            if (ai.mirrorMode === true) {
              totalThreat *= 2;
            }
            if (ai.ally) {
              if (ai.ally.econ_rate) {
                totalThreat /= ai.ally.econ_rate + 1;
              } else {
                totalThreat /= 2;
              }
            }
          }
          return toFixedIfNecessary(totalThreat, 2);
        });

        // Available Technology

        model.gwoCardName = ko.computed(function () {
          const star = model.selection.system().star;
          if (star.ai() && star.ai().cardName) {
            return star.ai().cardName;
          }
        });

        model.gwoCardAvailable = ko.computed(function () {
          const star = model.selection.system().star;
          return (
            star.ai() &&
            !star.ai().treasurePlanet &&
            star.cardList() &&
            // Don't show when finding cards through Explore
            star.cardList().length === 1
          );
        });

        // AI Buffs & Game Options

        const convertGameMModifiersToName = function (ai) {
          const gameModifiers = [];
          if (ai.bountyMode) {
            gameModifiers.push("Bounties");
          }
          if (ai.landAnywhere) {
            gameModifiers.push("Land Anywhere");
          }
          if (ai.suddenDeath) {
            gameModifiers.push("Sudden Death");
          }
          return gameModifiers;
        };

        const convertBuffNumberToName = function (ai) {
          const buffs = ai.typeOfBuffs;
          const guardians = ai.mirrorMode;
          const buffNames = [];
          _.forEach(buffs, function (buff) {
            switch (buff) {
              case 0:
                buffNames.push(loc("!LOC:Costs decreased"));
                break;
              case 1:
                buffNames.push(loc("!LOC:Damage increased"));
                break;
              case 2:
                buffNames.push(loc("!LOC:Health increased"));
                break;
              case 3:
                buffNames.push(loc("!LOC:Speed increased"));
                break;
              case 4:
                buffNames.push(loc("!LOC:Build faster"));
                break;
              case 5: // v5.11.0 and earlier only
                buffNames.push(loc("!LOC:Commanders enhanced"));
                break;
              case 6:
                buffNames.push(loc("!LOC:Combat units enhanced"));
                break;
              case 7:
                buffNames.push(loc("!LOC:Factory cooldown decreased"));
                break;
            }
          });
          if (guardians) {
            buffNames.push(loc("!LOC:Your technology bonuses"));
          }
          return buffNames;
        };

        const createAIIntelligence = function (ai) {
          var commanders = [];
          commanders.push(intelligence(ai, 0));
          if (ai.minions) {
            const minions = _.map(ai.minions, intelligence);
            commanders = commanders.concat(minions);
          }
          if (ai.foes) {
            const foes = _.map(ai.foes, intelligence);
            commanders = commanders.concat(foes);
          }
          if (ai.ally) {
            const commander = intelligence(ai.ally, 0);
            commanders.push(commander);
          }
          return commanders;
        };

        model.gwoGameModifiers = ko.observableArray([]);
        model.gwoAIBuffs = ko.observableArray([]);
        model.gwoAis = ko.observableArray([]);

        model.generateIntelligence = ko.computed(function () {
          const star = model.selection.system().star;
          const ai = star.ai();
          if (!ai) {
            model.gwoGameModifiers([]);
            model.gwoAIBuffs([]);
            model.gwoAis([]);
            return;
          }
          model.gwoAIBuffs(convertBuffNumberToName(ai));
          model.gwoGameModifiers(convertGameMModifiersToName(ai));
          model.gwoAis(createAIIntelligence(ai));
        });
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoIntelligence();
