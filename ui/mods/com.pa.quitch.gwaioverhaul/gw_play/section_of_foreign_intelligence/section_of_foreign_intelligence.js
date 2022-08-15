// Modified by Quitch - changes documented at https://github.com/Quitch/GW-AI-Overhaul
var gwoIntelligenceLoaded;

if (!gwoIntelligenceLoaded) {
  gwoIntelligenceLoaded = true;

  function gwoIntelligence() {
    try {
      if (!model.game().isTutorial()) {
        requireGW(
          [
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
          ],
          function (gwoColour) {
            var url =
              "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/section_of_foreign_intelligence/section_of_foreign_intelligence.html";
            $.get(url, function (html) {
              var $fi = $(html);
              $("#system-detail").append($fi);
              locTree($(".section-of-foreign-intelligence"));
              ko.applyBindings(model, $fi[0]);
            });

            var getNumberOfCommanders = function (commander) {
              if (commander.bossCommanders) {
                return commander.bossCommanders;
              } else if (commander.commanderCount) {
                return commander.commanderCount;
              }
              return 1;
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

            var factionIndex = 0;

            var getFactionColourIndex = function (commander, index) {
              var inventory = model.game().inventory();
              var playerFaction = inventory.getTag("global", "playerFaction");
              factionIndex = _.isUndefined(commander.faction)
                ? factionIndex
                : commander.faction;

              if (factionIndex === playerFaction) {
                // allies appear after the player and sub commanders in colour
                return index + inventory.minions().length + 1;
              }
              return commander.faction ? 0 : index + 1;
            };

            var getFactionName = function (commander) {
              var inventory = model.game().inventory();
              var playerFaction = inventory.getTag("global", "playerFaction");
              var factionNames = [
                "Legonis Machina",
                "Foundation",
                "Synchronous",
                "Revenants",
                "Cluster",
              ];
              var faction = factionNames[commander.faction];
              if (factionIndex === playerFaction) {
                faction += " (" + loc("!LOC:ALLY") + ")";
              }
              return faction;
            };

            var intelligence = function (commander, index) {
              var adjustedIndex = getFactionColourIndex(commander, index);
              var name = commander.name;
              var eco = commander.econ_rate;
              var numCommanders = getNumberOfCommanders(commander);

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
                faction: getFactionName(commander),
              };
            };

            // Planetary Intelligence

            var formattedString = function (number) {
              var km2 = 1000000;
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

            var toFixedIfNecessary = function (value, decimals) {
              // + converts the string output of toFixed() back to a float
              return +parseFloat(value).toFixed(decimals);
            };

            model.gwoSystemThreat = ko.computed(function () {
              var ai = model.selection.system().star.ai();
              var commanders = [];
              var totalEco = 0;
              if (ai) {
                commanders.push(intelligence(ai, 0));
                if (ai.minions) {
                  commanders = commanders.concat(
                    _.map(ai.minions, intelligence)
                  );
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
                    totalEco += army.econ_rate * 0.4 * (commanderCount - 1);
                  });
                }
                _.times(commanders.length, function (n) {
                  totalEco += commanders[n].eco;
                });
                _.forEach(ai.typeOfBuffs, function (buff) {
                  switch (buff) {
                    case 0: // cost
                    case 4: // build
                      totalEco *= 1.3;
                      break;
                    case 1: // damage
                    case 2: // health
                      totalEco *= 1.2;
                      break;
                    case 3: // speed
                      totalEco *= 1.1;
                      break;
                    case 6: // combat
                      totalEco *= 1.5;
                  }
                });
                if (ai.mirrorMode === true) {
                  totalEco *= 2;
                }
                if (ai.ally) {
                  totalEco -= ai.ally.econ_rate || 1;
                }
              }
              return toFixedIfNecessary(totalEco, 2);
            });

            // Available Technology

            model.gwoCardName = ko.computed(function () {
              var star = model.selection.system().star;
              if (star.ai() && star.ai().cardName) {
                return star.ai().cardName;
              }
              return null;
            });

            model.gwoCardAvailable = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().treasurePlanet !== true &&
                star.cardList() &&
                // Don't show when finding cards through Explore
                star.cardList().length === 1
              );
            });

            // Game Options

            model.gwoBountyMode = ko.computed(function () {
              var star = model.selection.system().star;
              return star.ai() && star.ai().bountyMode;
            });

            model.gwoLandAnywhere = ko.computed(function () {
              var star = model.selection.system().star;
              return star.ai() && star.ai().landAnywhere;
            });

            model.gwoSuddenDeath = ko.computed(function () {
              var star = model.selection.system().star;
              return star.ai() && star.ai().suddenDeath;
            });

            model.gwoGameOptions = ko.computed(function () {
              return (
                model.gwoBountyMode() ||
                model.gwoLandAnywhere() ||
                model.gwoSuddenDeath()
              );
            });

            // AI Buffs

            model.gwoTechBuild = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 4)
              );
            });

            model.gwoTechCost = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 0)
              );
            });

            model.gwoTechDamage = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 1)
              );
            });

            model.gwoTechHealth = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 2)
              );
            });

            model.gwoTechSpeed = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 3)
              );
            });

            // v5.11.0 and earlier only
            model.gwoEnhancedCommanders = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 5)
              );
            });

            model.gwoTechCombat = ko.computed(function () {
              var star = model.selection.system().star;
              return (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 6)
              );
            });

            model.gwoTechMirror = ko.computed(function () {
              var star = model.selection.system().star;
              return star.ai() && star.ai().mirrorMode === true;
            });

            model.gwoAiBuffs = ko.computed(function () {
              return (
                model.gwoTechBuild() ||
                model.gwoTechCombat() ||
                model.gwoTechCost() ||
                model.gwoEnhancedCommanders() ||
                model.gwoTechDamage() ||
                model.gwoTechHealth() ||
                model.gwoTechSpeed() ||
                model.gwoTechMirror()
              );
            });

            model.gwoAIs = ko.computed(function () {
              var ai = model.selection.system().star.ai();
              var commanders = [];
              if (ai) {
                commanders.push(intelligence(ai, 0));
                if (ai.minions) {
                  var minions = _.map(ai.minions, intelligence);
                  commanders = commanders.concat(minions);
                }
                if (ai.foes) {
                  var foes = _.map(ai.foes, intelligence);
                  commanders = commanders.concat(foes);
                }
                if (ai.ally) {
                  var commander = intelligence(ai.ally, 0);
                  commanders.push(commander);
                }
              }
              return commanders;
            });
          }
        );
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoIntelligence();
}
