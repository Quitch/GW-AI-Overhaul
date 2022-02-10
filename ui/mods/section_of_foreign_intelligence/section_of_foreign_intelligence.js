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
              "coui://ui/mods/section_of_foreign_intelligence/section_of_foreign_intelligence.html";
            $.get(url, function (html) {
              var $fi = $(html);
              $("#system-detail").append($fi);
              locTree($(".section_of_foreign_intelligence"));
              ko.applyBindings(model, $fi[0]);
            });

            var threat = function (rate) {
              if (!rate) {
                return "!LOC:Unknown";
              } else if (rate <= 0.5) {
                return "!LOC:Worthless";
              } else if (rate <= 0.6) {
                return "!LOC:Helpless";
              } else if (rate <= 0.725) {
                return "!LOC:Weakling";
              } else if (rate <= 0.85) {
                return "!LOC:Inexperienced";
              } else if (rate <= 0.95) {
                return "!LOC:Competent";
              } else if (rate <= 1.1) {
                return "!LOC:Skilled";
              } else if (rate <= 1.2) {
                return "!LOC:Experienced";
              } else if (rate <= 1.325) {
                return "!LOC:Veteran";
              } else if (rate <= 1.45) {
                return "!LOC:Masterful";
              } else if (rate <= 1.6) {
                return "!LOC:Hardcore";
              } else if (rate <= 1.8) {
                return "!LOC:Dangerous";
              } else if (rate <= 2) {
                return "!LOC:Deadly";
              } else if (rate <= 2.225) {
                return "!LOC:Inhuman";
              } else if (rate <= 2.5) {
                return "!LOC:Genocidal";
              } else if (rate <= 2.75) {
                return "!LOC:Nightmare";
              } else if (rate <= 3) {
                return "!LOC:Demigod";
              } else if (rate < 9) {
                return "!LOC:Godlike";
              } else {
                return "!LOC:Titan";
              }
            };

            var rgb = function (color) {
              return (
                "rgb(" +
                color[0][0] +
                "," +
                color[0][1] +
                "," +
                color[0][2] +
                ")"
              );
            };

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
              // Minions aren't assigned a faction number so use the previous one
              factionIndex = commander.faction
                ? commander.faction
                : factionIndex;
              // Setup the next colour for minions but not primary or FFA opponents
              index = commander.faction ? 0 : index + 1;
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
                threat: loc(threat(eco)),
                color: rgb(
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
              } else {
                return Math.floor(number);
              }
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

            var totalThreat = function (totalRate) {
              if (!totalRate) {
                return "!LOC:None";
              } else if (totalRate <= 0.6) {
                return "!LOC:Very Low";
              } else if (totalRate <= 0.9) {
                return "!LOC:Low";
              } else if (totalRate <= 1.6) {
                return "!LOC:Moderate";
              } else if (totalRate <= 2.05) {
                return "!LOC:High";
              } else if (totalRate <= 2.9) {
                return "!LOC:Very High";
              } else if (totalRate <= 3.975) {
                return "!LOC:Extreme";
              } else if (totalRate <= 5.625) {
                return "!LOC:Critical";
              } else if (totalRate <= 7.2) {
                return "!LOC:Suicidal";
              } else if (totalRate <= 10) {
                return "!LOC:Apocalyptic";
              } else if (totalRate <= 20) {
                return "!LOC:Impossible";
              } else {
                return "!LOC:Skynet";
              }
            };

            model.gwoSystemThreat = ko.computed(function () {
              var primary = model.selection.system().star.ai();
              var commanders = [];
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
                }
              }
              var totalEco = 0;
              _.times(commanders.length, function (n) {
                totalEco += commanders[n].eco;
              });
              return loc(totalThreat(totalEco));
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
              if (
                star.ai() &&
                star.ai().treasurePlanet !== true &&
                star.cardList() &&
                // Don't show when finding cards through Explore
                star.cardList().length === 1
              ) {
                return true;
              }
              return false;
            });

            // Game Options

            model.gwoBountyMode = ko.computed(function () {
              var star = model.selection.system().star;
              if (star.ai() && star.ai().bountyMode) {
                return true;
              }
              return false;
            });

            model.gwoLandAnywhere = ko.computed(function () {
              var star = model.selection.system().star;
              if (star.ai() && star.ai().landAnywhere) {
                return true;
              }
              return false;
            });

            model.gwoSuddenDeath = ko.computed(function () {
              var star = model.selection.system().star;
              if (star.ai() && star.ai().suddenDeath) {
                return true;
              }
              return false;
            });

            model.gwoGameOptions = ko.computed(function () {
              if (
                model.gwoBountyMode() ||
                model.gwoLandAnywhere() ||
                model.gwoSuddenDeath()
              ) {
                return true;
              }
              return false;
            });

            // AI Buffs

            model.gwoTechBuild = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 4)
              ) {
                return true;
              }
              return false;
            });

            model.gwoTechCost = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 0)
              ) {
                return true;
              }
              return false;
            });

            model.gwoTechDamage = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 1)
              ) {
                return true;
              }
              return false;
            });

            model.gwoTechHealth = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 2)
              ) {
                return true;
              }
              return false;
            });

            model.gwoTechSpeed = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 3)
              ) {
                return true;
              }
              return false;
            });

            // v5.11.0 and earlier only
            model.gwoEnhancedCommanders = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 5)
              ) {
                return true;
              }
              return false;
            });

            model.gwoTechCombat = ko.computed(function () {
              var star = model.selection.system().star;
              if (
                star.ai() &&
                star.ai().typeOfBuffs &&
                _.includes(star.ai().typeOfBuffs, 6)
              ) {
                return true;
              }
              return false;
            });

            model.gwoTechMirror = ko.computed(function () {
              var star = model.selection.system().star;
              if (star.ai() && star.ai().mirrorMode === true) {
                return true;
              }
              return false;
            });

            model.gwoAiBuffs = ko.computed(function () {
              if (
                model.gwoTechBuild() ||
                model.gwoTechCombat() ||
                model.gwoTechCost() ||
                model.gwoEnhancedCommanders() ||
                model.gwoTechDamage() ||
                model.gwoTechHealth() ||
                model.gwoTechSpeed() ||
                model.gwoTechMirror()
              ) {
                return true;
              }
              return false;
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

            // Additional Factions

            model.gwoFfaOpponents = ko.computed(function () {
              var primary = model.selection.system().star.ai();
              var commanders = [];
              if (primary && primary.foes) {
                commanders = _.map(primary.foes, intelligence);
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
