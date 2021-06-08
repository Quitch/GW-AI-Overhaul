// Modified by Quitch - changes documented at https://github.com/Quitch/GW-AI-Overhaul
var gwaioIntelligenceLoaded;

if (!gwaioIntelligenceLoaded) {
  gwaioIntelligenceLoaded = true;

  function gwaioIntelligence() {
    try {
      if (!model.game().isTutorial()) {
        var url =
          "coui://ui/mods/section_of_foreign_intelligence/section_of_foreign_intelligence.html";
        $.get(url, function (html) {
          var $fi = $(html);
          $("#system-detail").append($fi);
          locTree($(".section_of_foreign_intelligence"));
          ko.applyBindings(model, $fi[0]);
        });

        var threat = function (rate) {
          if (!rate) return "!LOC:Unknown";
          else if (rate <= 0.5) return "!LOC:Worthless";
          else if (rate <= 0.6) return "!LOC:Helpless";
          else if (rate <= 0.725) return "!LOC:Weakling";
          else if (rate <= 0.85) return "!LOC:Inexperienced";
          else if (rate <= 0.95) return "!LOC:Competent";
          else if (rate <= 1.1) return "!LOC:Skilled";
          else if (rate <= 1.2) return "!LOC:Experienced";
          else if (rate <= 1.325) return "!LOC:Veteran";
          else if (rate <= 1.45) return "!LOC:Masterful";
          else if (rate <= 1.6) return "!LOC:Hardcore";
          else if (rate <= 1.8) return "!LOC:Dangerous";
          else if (rate <= 2) return "!LOC:Deadly";
          else if (rate <= 2.225) return "!LOC:Inhuman";
          else if (rate <= 2.5) return "!LOC:Genocidal";
          else if (rate <= 2.75) return "!LOC:Nightmare";
          else if (rate <= 3) return "!LOC:Demigod";
          else if (rate < 9) return "!LOC:Godlike";
          else return "!LOC:Titan";
        };
        var rgb = function (color) {
          return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
        };
        var factionNames = [
          "Legonis Machina",
          "Foundation",
          "Synchronous",
          "Revenants",
          "Cluster",
        ];
        var intelligence = function (commander) {
          var name = commander.name;
          var eco = commander.econ_rate;
          var faction = factionNames[commander.faction];
          if (commander.bossCommanders > 1)
            var numCommanders = commander.bossCommanders;
          else if (commander.commanderCount > 1)
            numCommanders = commander.commanderCount;
          if (numCommanders) {
            name = name.concat(" x", numCommanders);
            eco = eco * ((numCommanders + 1) / 2);
          }
          return {
            name: name,
            threat: loc(threat(eco)),
            color: rgb(
              (commander.color && commander.color[0]) || [255, 255, 255]
            ),
            character: loc(commander.character),
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
        model.gwaioSystemSurfaceArea = ko.computed(function () {
          var area = 0;
          model.selection
            .system()
            .planets()
            .forEach(function (world) {
              if (
                (world.generator && world.generator.biome !== "gas") ||
                (world.planet && world.planet.biome !== "gas")
              )
                area += 4 * Math.PI * Math.pow(world.generator.radius, 2);
            });
          return formattedString(area);
        });

        var totalThreat = function (totalRate) {
          if (!totalRate) return "!LOC:None";
          else if (totalRate <= 0.6) return "!LOC:Very Low";
          else if (totalRate <= 0.9) return "!LOC:Low";
          else if (totalRate <= 1.6) return "!LOC:Moderate";
          else if (totalRate <= 2.05) return "!LOC:High";
          else if (totalRate <= 2.9) return "!LOC:Very High";
          else if (totalRate <= 3.975) return "!LOC:Extreme";
          else if (totalRate <= 5.625) return "!LOC:Critical";
          else if (totalRate <= 7.2) return "!LOC:Suicidal";
          else if (totalRate <= 10) return "!LOC:Apocalyptic";
          else if (totalRate <= 20) return "!LOC:Impossible";
          else return "!LOC:Skynet";
        };
        model.gwaioSystemThreat = ko.computed(function () {
          var primary = model.selection.system().star.ai();
          var commanders = [];
          if (primary) {
            commanders.push(intelligence(primary));
            if (primary.minions) {
              commanders = commanders.concat(primary.minions.map(intelligence));
            }
            if (primary.foes) {
              commanders = commanders.concat(primary.foes.map(intelligence));
            }
          }
          var totalEco = 0;
          _.times(commanders.length, function (n) {
            totalEco += commanders[n].eco;
          });
          return loc(totalThreat(totalEco));
        });

        // Game Options

        model.gwaioBountyMode = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().bountyMode
          )
            return true;
        });

        model.gwaioLandAnywhere = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().landAnywhere
          )
            return true;
        });

        model.gwaioSuddenDeath = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().suddenDeath
          )
            return true;
        });

        model.gwaioGameOptions = ko.computed(function () {
          if (
            model.gwaioBountyMode() ||
            model.gwaioLandAnywhere() ||
            model.gwaioSuddenDeath()
          )
            return true;
        });

        // AI Buffs

        model.gwaioTechBuild = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().typeOfBuffs &&
            _.includes(model.selection.system().star.ai().typeOfBuffs, 4)
          )
            return true;
        });

        model.gwaioTechCost = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().typeOfBuffs &&
            _.includes(model.selection.system().star.ai().typeOfBuffs, 0)
          )
            return true;
        });

        model.gwaioTechDamage = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().typeOfBuffs &&
            _.includes(model.selection.system().star.ai().typeOfBuffs, 1)
          )
            return true;
        });

        model.gwaioTechHealth = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().typeOfBuffs &&
            _.includes(model.selection.system().star.ai().typeOfBuffs, 2)
          )
            return true;
        });

        model.gwaioTechSpeed = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().typeOfBuffs &&
            _.includes(model.selection.system().star.ai().typeOfBuffs, 3)
          )
            return true;
        });

        model.gwaioEnhancedCommanders = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().typeOfBuffs &&
            _.includes(model.selection.system().star.ai().typeOfBuffs, 5)
          )
            return true;
        });

        model.gwaioTechMirror = ko.computed(function () {
          if (
            model.selection.system().star.ai() &&
            model.selection.system().star.ai().mirrorMode === true
          )
            return true;
        });

        model.gwaioAiBuffs = ko.computed(function () {
          if (
            model.gwaioTechBuild() ||
            model.gwaioTechCost() ||
            model.gwaioEnhancedCommanders() ||
            model.gwaioTechDamage() ||
            model.gwaioTechHealth() ||
            model.gwaioTechSpeed() ||
            model.gwaioTechMirror()
          )
            return true;
        });

        // System Faction

        model.gwaioSystemOwner = ko.computed(function () {
          var primary = model.selection.system().star.ai();
          var commanders = [];
          if (primary) {
            commanders.push(intelligence(primary));
            if (primary.minions) {
              commanders = commanders.concat(primary.minions.map(intelligence));
            }
          }
          return commanders;
        });

        // Additional Factions

        model.gwaioFfaOpponents = ko.computed(function () {
          var primary = model.selection.system().star.ai();
          var commanders = [];
          if (primary && primary.foes) {
            commanders = primary.foes.map(intelligence);
          }
          return commanders;
        });
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioIntelligence();
}
