// Vendored from wondible's Section of Foreign Intelligence for Galactic War
// (Apache 2.0, see LICENSE.txt); modified by Quitch - changes documented at
// https://github.com/Quitch/GW-AI-Overhaul

(function () {
  if (model.game().isTutorial()) {
    return;
  }

  // shared/ai.js's BUFF_TYPES, filled once it loads, plus `commanders`, which
  // only v5.11.0 and earlier saves carry.
  var gwoBuffType = {};
  var eradicationModes = [];
  var eradicationModeNames = {
    SubCommanders: "!LOC:Colonel",
    Factories: "!LOC:Factory",
    Fabbers: "!LOC:Fabber",
  };

  try {
    model.gwoAvailableTechTooltip =
      "!LOC:This card will be offered as part of the first draw.";
    model.gwoGameModifiersTooltip = [
      loc("!LOC:BOUNTIES: earn an economic multiplier for every kill."),
      loc(
        "!LOC:LAND ANYWHERE: players can start anywhere on viable starting planets."
      ),
      loc(
        "!LOC:SUDDEN DEATH: any commander death on a team kills the entire team."
      ),
      loc("!LOC:ERADICATE: all units of specific types must be eradicated."),
    ].join("<br>");
    model.gwoAIBuffsTooltip =
      "!LOC:Applied to AI commanders and units preferred by the faction.";

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
      _.forEach(eradicationModes, function (mode) {
        if (ai["eradicationMode" + mode]) {
          modes.push(loc(eradicationModeNames[mode]));
        }
      });

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
            // Inside a ko.computed, so a throw would take the tooltip down.
            console.warn("Undefined buff type: " + buff);
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_star_cards_view.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_threat.js",
      ],
      function (
        gwoColour,
        gwoCards,
        gwoAI,
        gwoRefereeCoop,
        gwoStarCardsView,
        gwoRaces,
        gwoStarThreat
      ) {
        var starCardsView = gwoStarCardsView();
        _.assign(gwoBuffType, gwoAI.BUFF_TYPES, { commanders: 5 });
        eradicationModes = gwoAI.ERADICATION_MODES;

        var getNumberOfCommanders = function (commander) {
          return gwoAI.commanderCount(commander);
        };

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
            // By index, not name: an ally's name carries a suffix.
            cluster:
              !commander.mirrorMode &&
              gwoAI.factionIndex(commander) === gwoAI.CLUSTER_FACTION,
            tooltip: faction.tooltip,
            iconFill: icon.fill,
            iconOutline: icon.outline,
          };
        };

        // Wrapped so _.map cannot hand its third argument to allyPosition.
        var intelligenceOf = function (commander, index) {
          return intelligence(commander, index);
        };

        // The star's AI, its minions and its foes, built once for both the
        // threat and the panel. The order matters: intelligence() carries the
        // faction from one call to the next.
        var starCommanders = function (ai) {
          return [intelligence(ai, 0)].concat(
            _.map(ai.minions, intelligenceOf),
            _.map(ai.foes, intelligenceOf)
          );
        };

        var createAIIntelligence = function (ai, commanders) {
          if (ai.ally) {
            var game = model.game();
            var subcommanders = gwoRefereeCoop.getOrderedSubcommanders(
              game.inventory(),
              game
            );
            return commanders.concat([
              intelligence(ai.ally, 0, subcommanders.length),
            ]);
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
          var commanders = starCommanders(ai);
          model.gwoSystemThreat(gwoStarThreat.measure(ai));
          model.gwoAvailableTech(availableTech(star, starIndex, starCardsView));
          model.gwoAIBuffs(convertBuffNumberToName(ai));
          model.gwoGameModifiers(convertGameModifiersToName(ai, inventory));
          model.gwoAis(createAIIntelligence(ai, commanders));
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
