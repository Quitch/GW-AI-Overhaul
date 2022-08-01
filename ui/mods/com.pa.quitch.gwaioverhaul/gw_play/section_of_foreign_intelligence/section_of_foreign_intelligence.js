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

            var factionIndex = 0;

            var intelligence = function (commander, index) {
              var name = commander.name;
              var eco = commander.econ_rate;
              var factionNames = [
                "Legonis Machina",
                "Foundation",
                "Synchronous",
                "Revenants",
                "Cluster",
              ];
              var faction = factionNames[commander.faction];
              var inventory = model.game().inventory();
              var playerFaction = inventory.getTag("global", "playerFaction");
              // Minions aren't assigned a faction number so use the previous one
              factionIndex = _.isUndefined(commander.faction)
                ? factionIndex
                : commander.faction;
              if (factionIndex === playerFaction) {
                // allies appear after player and sub commanders in colour
                index += inventory.minions().length + 1;
              } else {
                index = commander.faction ? 0 : index + 1;
              }
              var numCommanders = 0;
              if (commander.bossCommanders > 1) {
                numCommanders = commander.bossCommanders;
              } else if (commander.commanderCount > 1) {
                numCommanders = commander.commanderCount;
              }
              if (numCommanders) {
                name = name.concat(" x", numCommanders);
                eco = eco * ((numCommanders + 1) / 2);
              }
              var character = commander.character
                ? loc(commander.character)
                : loc("!LOC:None");
              if (commander.penchantName) {
                character = character + " " + loc(commander.penchantName);
              }
              return {
                name: name,
                color: gwoColour.rgb(
                  gwoColour.pick(factionIndex, commander.color, index)
                ),
                character: character,
                eco: eco,
                faction: faction,
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

            model.gwoSystemThreat = ko.computed(function () {
              var primary = model.selection.system().star.ai();
              var commanders = [];
              var totalEco = 0;
              if (primary) {
                commanders.push(intelligence(primary, 0));
                if (primary.minions) {
                  commanders = commanders.concat(
                    _.map(primary.minions, intelligence)
                  );
                }
                if (primary.foes) {
                  commanders = commanders.concat(
                    _.map(primary.foes, intelligence)
                  );
                  _.forEach(primary.foes, function (army) {
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
                _.forEach(primary.typeOfBuffs, function (buff) {
                  switch (buff) {
                    case 0: // cost
                    case 4: // build
                      totalEco += 0.3;
                      break;
                    case 1: // damage
                    case 2: // health
                      totalEco += 0.2;
                      break;
                    case 3: // speed
                      totalEco += 0.1;
                      break;
                    case 6: // combat
                      totalEco += 0.5;
                  }
                });
                if (primary.mirrorMode === true) {
                  totalEco += 1.6;
                }
                if (primary.ally) {
                  totalEco -= primary.ally.econ_rate || 1;
                }
              }
              return totalEco.toPrecision(2);
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

            // System Faction

            model.gwoSystemOwner = ko.computed(function () {
              var primary = model.selection.system().star.ai();
              var commanders = [];
              if (primary) {
                commanders.push(intelligence(primary, 0));
                if (primary.minions) {
                  commanders = commanders.concat(
                    _.map(primary.minions, intelligence)
                  );
                }
              }
              return commanders;
            });

            // Additional Factions & Allies

            model.gwoAdditionalFactions = ko.computed(function () {
              var primary = model.selection.system().star.ai();
              var commanders = [];
              if (primary && primary.foes) {
                commanders = _.map(primary.foes, intelligence);
              }
              if (primary && primary.ally) {
                commanders = [intelligence(primary.ally, 0)];
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
