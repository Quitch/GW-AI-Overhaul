var gwaioSetupLoaded;

if (!gwaioSetupLoaded) {
  gwaioSetupLoaded = true;

  function gwaioSetup() {
    try {
      ko.extenders.decimals = function (target, decimals) {
        // create a writable computed observable to intercept writes to our observable
        var result = ko
          .pureComputed({
            read: target, // always return the original observables value
            write: function (newValue) {
              if (_.isString(newValue)) {
                newValue = newValue.replace(",", ".");

                newValue = parseFloat(newValue);
                if (!isNaN(newValue)) {
                  target(newValue);
                }
              }
              var current = target(),
                roundingMultiplier = Math.pow(10, decimals),
                newValueAsNum = isNaN(newValue) ? 0 : +newValue,
                valueToWrite =
                  Math.round(newValueAsNum * roundingMultiplier) /
                  roundingMultiplier;

              // only write if it changed
              if (valueToWrite !== current) {
                target(valueToWrite);
              } else {
                /* if the rounded value is the same, but a different value was
             written, force a notification for the current field */
                if (newValue !== current) {
                  target.notifySubscribers(valueToWrite);
                }
              }
            },
          })
          .extend({ notify: "always" });

        // initialize with current value to make sure it is rounded appropriately
        result(target());

        return result; // return the new computed observable
      };

      model.newGameDifficultyIndex(0); // set the lowest difficulty as the default

      // gw_start uses ko.applyBindings(model)
      model.gwaioDifficultySettings = {
        factionScaling: ko.observable(true),
        systemScaling: ko.observable(true),
        easierStart: ko.observable(false),
        tougherCommanders: ko.observable(false),
        quellerAI: ko.observable(false),
        paLore: ko.observable(true).extend({ local: "gwaio_lore_enabled" }),
        customDifficulty: ko.observable(false),
        difficultyName: ko.observable(""),
        goForKill: ko.observable(false),
        microType: ko.observableArray([0, 1, 2]),
        microTypeDescription: ko.observable({
          0: "!LOC:No",
          1: "!LOC:Basic",
          2: "!LOC:Advanced",
        }),
        microTypeChosen: ko.observable(0),
        getmicroTypeDescription: function (value) {
          return loc(
            model.gwaioDifficultySettings.microTypeDescription()[value]
          );
        },
        mandatoryMinions: ko.observable(0).extend({
          decimals: 2,
        }),
        minionMod: ko.observable(0).extend({
          decimals: 2,
        }),
        priorityScoutMetalSpots: ko.observable(false),
        useEasierSystemTemplate: ko.observable(false),
        factoryBuildDelayMin: ko.observable(0).extend({
          decimals: 0,
        }),
        factoryBuildDelayMax: ko.observable(0).extend({
          decimals: 0,
        }),
        unableToExpandDelay: ko.observable(0).extend({
          decimals: 0,
        }),
        enableCommanderDangerResponses: ko.observable(false),
        perExpansionDelay: ko.observable(0).extend({
          decimals: 0,
        }),
        personalityTags: ko.observableArray([
          "Default",
          "Tutorial",
          "SlowerExpansion",
          "PreventsWaste",
          "queller",
        ]),
        personalityTagsDescription: ko.observable({
          Default: "!LOC:Default",
          Tutorial: "!LOC:Lobotomy",
          SlowerExpansion: "!LOC:Slower Expansion",
          PreventsWaste: "!LOC:Prevent Waste",
          queller: "!LOC:Queller",
        }),
        personalityTagsChosen: ko.observableArray([]),
        getpersonalityTagsDescription: function (value) {
          return loc(
            model.gwaioDifficultySettings.personalityTagsDescription()[value]
          );
        },
        econBase: ko.observable(0).extend({
          decimals: 2,
        }),
        econRatePerDist: ko.observable(0).extend({
          decimals: 2,
        }),
        maxBasicFabbers: ko.observable(0).extend({
          decimals: 0,
        }),
        maxAdvancedFabbers: ko.observable(0).extend({
          decimals: 0,
        }),
        startingLocationEvaluationRadius: ko.observable(0).extend({
          decimals: 0,
        }),
        ffaChance: ko.observable(0).extend({
          decimals: 0,
        }),
        bossCommanders: ko.observable(0).extend({
          decimals: 0,
        }),
        landAnywhereChance: ko.observable(0).extend({
          decimals: 0,
        }),
        suddenDeathChance: ko.observable(0).extend({
          decimals: 0,
        }),
        bountyModeChance: ko.observable(0).extend({
          decimals: 0,
        }),
        bountyModeValue: ko.observable(0).extend({
          decimals: 2,
        }),
        factionTechHandicap: ko.observable(0).extend({
          decimals: 2,
        }),
        unsavedChanges: ko.observable(false),
        newGalaxyNeeded: ko.observable(false).extend({
          notify: "always",
        }),
      };

      // Scaling isn't applied if Shared Systems for Galactic War is present
      if (model.systemSources)
        model.gwaioDifficultySettings.systemScaling(false);

      ko.computed(function () {
        model.gwaioDifficultySettings.factionScaling();
        model.gwaioDifficultySettings.systemScaling();
        model.gwaioDifficultySettings.easierStart();
        model.gwaioDifficultySettings.tougherCommanders();
        model.gwaioDifficultySettings.quellerAI();
        model.gwaioDifficultySettings.paLore();
        model.gwaioDifficultySettings.newGalaxyNeeded(true);
      });

      model.gwaioDifficultySettings.newGalaxyNeeded.subscribe(function () {
        if (model.gwaioDifficultySettings.newGalaxyNeeded()) {
          model.gwaioDifficultySettings.newGalaxyNeeded(false);
          model.makeGame();
        }
      });

      ko.computed(function () {
        if (model.gwaioDifficultySettings.customDifficulty()) {
          model.gwaioDifficultySettings.bossCommanders();
          model.gwaioDifficultySettings.bountyModeChance();
          model.gwaioDifficultySettings.bountyModeValue();
          model.gwaioDifficultySettings.econBase();
          model.gwaioDifficultySettings.econRatePerDist();
          model.gwaioDifficultySettings.enableCommanderDangerResponses();
          model.gwaioDifficultySettings.factionTechHandicap();
          model.gwaioDifficultySettings.factoryBuildDelayMax();
          model.gwaioDifficultySettings.factoryBuildDelayMin();
          model.gwaioDifficultySettings.ffaChance();
          model.gwaioDifficultySettings.goForKill();
          model.gwaioDifficultySettings.landAnywhereChance();
          model.gwaioDifficultySettings.mandatoryMinions();
          model.gwaioDifficultySettings.maxAdvancedFabbers();
          model.gwaioDifficultySettings.maxBasicFabbers();
          model.gwaioDifficultySettings.microTypeChosen();
          model.gwaioDifficultySettings.minionMod();
          model.gwaioDifficultySettings.perExpansionDelay();
          model.gwaioDifficultySettings.personalityTagsChosen();
          model.gwaioDifficultySettings.priorityScoutMetalSpots();
          model.gwaioDifficultySettings.startingLocationEvaluationRadius();
          model.gwaioDifficultySettings.suddenDeathChance();
          model.gwaioDifficultySettings.unableToExpandDelay();
          model.gwaioDifficultySettings.useEasierSystemTemplate();
          model.gwaioDifficultySettings.unsavedChanges(true);
        }
      });

      /* Prevent simply switching to CUSTOM difficulty causing unsaved changes to become true
      Ensure switching away from CUSTOM with unsaved changes doesn't stop you starting a war */
      model.gwaioDifficultySettings.customDifficulty.subscribe(function () {
        model.gwaioDifficultySettings.unsavedChanges(false);
      });

      // eslint-disable-next-line no-unused-vars
      model.gwaioSaveDifficultySettings = function () {
        model.gwaioDifficultySettings.unsavedChanges(false);
        model.makeGame();
      };

      // Don't let the player go to war with unsaved custom difficulty changes
      model.ready = ko.pureComputed(function () {
        return (
          !!model.newGame() &&
          !!model.activeStartCard() &&
          !model.gwaioDifficultySettings.unsavedChanges()
        );
      });

      $("#faction-select").before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/faction_tooltip.html"
        )
      );

      $("#game-size").before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/size_tooltip.html"
        )
      );

      $("#game-difficulty-label").append(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels_tooltip.html"
        )
      );

      $("#game-difficulty").replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.html"
        )
      );
      locTree($("#game-difficulty"));

      $("#game-difficulty").after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_options.html"
        )
      );
      locTree($("#difficulty-options"));
      locTree($("#custom-difficulty-settings"));
      // Because PA Inc wants to avoid escaping characters in HTML
      model.gwaioFactionScalingTooltip =
        "!LOC:The number of enemy factions is adjusted for the galaxy's size.";

      requireGW(
        [
          "require",
          "shared/gw_common",
          "shared/gw_credits",
          "shared/gw_factions",
          "pages/gw_start/gw_breeder",
          "pages/gw_start/gw_teams",
          "main/shared/js/star_system_templates",
          "main/game/galactic_war/shared/js/gw_easy_star_systems",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
        ],
        function (
          require,
          GW,
          GWCredits,
          GWFactions,
          GWBreeder,
          GWTeams,
          normal_system_templates, // window.star_system_templates is set instead
          easy_system_templates,
          gwaioTech,
          gwaioBank,
          gwaioLore,
          gwaioDifficulty
        ) {
          /* Start of GWAIO implementation of GWDealer */
          if (!model.gwaioTreasureCards) model.gwaioTreasureCards = [];
          model.gwaioTreasureCards.push(
            { id: "gwc_start_storage" },
            { id: "gwc_start_air" },
            { id: "gwc_start_orbital" },
            { id: "gwc_start_bot" },
            { id: "gwc_start_artillery" },
            { id: "gwc_start_subcdr" },
            { id: "gwc_start_combatcdr" },
            { id: "gwc_start_allfactory" },
            { id: "gwaio_start_ceo" },
            { id: "gwaio_start_paratrooper" },
            { id: "nem_start_deepspace" },
            { id: "nem_start_nuke" },
            { id: "nem_start_planetary" },
            { id: "nem_start_tower_rush" },
            { id: "gwaio_start_tourist" },
            { id: "gwaio_start_rapid" },
            { id: "tgw_start_speed" },
            { id: "tgw_start_tank" },
            { id: "gwaio_start_nomad" },
            { id: "gwaio_start_backpacker" },
            { id: "gwaio_start_hoarder" }
          );

          if (!model.gwaioNewStartCards) model.gwaioNewStartCards = [];
          model.gwaioNewStartCards.push(
            { id: "gwc_start_storage" },
            { id: "gwaio_start_ceo" },
            { id: "gwaio_start_paratrooper" },
            { id: "nem_start_deepspace" },
            { id: "nem_start_nuke" },
            { id: "nem_start_planetary" },
            { id: "nem_start_tower_rush" },
            { id: "gwaio_start_tourist" },
            { id: "gwaio_start_rapid" },
            { id: "tgw_start_speed" },
            { id: "tgw_start_tank" },
            { id: "gwaio_start_nomad" },
            { id: "gwaio_start_backpacker" },
            { id: "gwaio_start_hoarder" }
          );
          _.forEach(model.gwaioNewStartCards, function (cardData) {
            if (
              (cardData.id != "gwc_start_storage" &&
                !gwaioBank.hasStartCard(cardData)) ||
              (cardData.id === "gwc_start_storage" &&
                !GW.bank.hasStartCard(cardData))
            )
              model.startCards().push(model.makeUnknown(cardData));
            else if (cardData.id != "gwc_start_storage")
              model.startCards().push(model.makeKnown(cardData));
          });
          model.startCards.valueHasMutated();

          if (!model.gwaioAllStartCards) model.gwaioAllStartCards = [];
          model.gwaioAllStartCards.push(
            "gwc_start_vehicle",
            "gwc_start_air",
            "gwc_start_bot",
            "gwc_start_orbital",
            "gwc_start_artillery",
            "gwc_start_subcdr",
            "gwc_start_combatcdr",
            "gwc_start_allfactory",
            "gwc_start_storage",
            "gwaio_start_ceo",
            "gwaio_start_paratrooper",
            "nem_start_deepspace",
            "nem_start_nuke",
            "nem_start_planetary",
            "nem_start_tower_rush",
            "gwaio_start_tourist",
            "gwaio_start_rapid",
            "tgw_start_speed",
            "tgw_start_tank",
            "gwaio_start_nomad",
            "gwaio_start_backpacker",
            "gwaio_start_hoarder"
          );
          var processedStartCards = {};
          var loadCount = model.gwaioAllStartCards.length;
          var loaded = $.Deferred();
          _.forEach(model.gwaioAllStartCards, function (cardId) {
            require(["cards/" + cardId], function (card) {
              card.id = cardId;
              processedStartCards[cardId] = card;
              if (--loadCount === 0) loaded.resolve();
            });
          });

          // GWDealer.dealCard
          var gwaioDealStartCard = function (params) {
            var result = $.Deferred();
            loaded.then(function () {
              var card = _.find(processedStartCards, { id: params.id });
              var context =
                card.getContext &&
                card.getContext(params.galaxy, params.inventory);
              var deal = card.deal && card.deal(params.star, context);
              var product = { id: params.id };
              var cardParams = deal && deal.params;
              if (cardParams && _.isObject(cardParams))
                _.assign(product, cardParams);
              card.keep && card.keep(deal, context);
              card.releaseContext && card.releaseContext(context);
              result.resolve(product, deal);
            });
            return result;
          };
          /* end of GWAIO implementation of GWDealer */

          // gw_start.js
          model.makeGame = function () {
            console.debug(" ---- MAKING NEW GALAXY ----");
            model.newGame(undefined);

            var busyToken = {};
            model.makeGameBusy(busyToken);

            var game = new GW.Game();

            game.name(model.newGameName());
            game.mode(model.mode());
            game.hardcore(model.newGameHardcore());
            game.content(api.content.activeContent());

            var selectedDifficulty = model.newGameDifficultyIndex() || 0;

            model.gwaioDifficultySettings.difficultyName(
              gwaioDifficulty.difficulties[selectedDifficulty].difficultyName
            );
            if (
              gwaioDifficulty.difficulties[selectedDifficulty].customDifficulty
            ) {
              model.gwaioDifficultySettings.customDifficulty(true);
            }
            if (
              !gwaioDifficulty.difficulties[selectedDifficulty].customDifficulty
            ) {
              model.gwaioDifficultySettings.customDifficulty(false);
              model.gwaioDifficultySettings.goForKill(
                gwaioDifficulty.difficulties[selectedDifficulty].goForKill
              );
              model.gwaioDifficultySettings.microTypeChosen(
                gwaioDifficulty.difficulties[selectedDifficulty].microType
              );
              model.gwaioDifficultySettings.mandatoryMinions(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .mandatoryMinions
              );
              model.gwaioDifficultySettings.minionMod(
                gwaioDifficulty.difficulties[selectedDifficulty].minionMod
              );
              model.gwaioDifficultySettings.priorityScoutMetalSpots(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .priority_scout_metal_spots
              );
              model.gwaioDifficultySettings.useEasierSystemTemplate(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .useEasierSystemTemplate
              );
              model.gwaioDifficultySettings.factoryBuildDelayMin(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .factory_build_delay_min
              );
              model.gwaioDifficultySettings.factoryBuildDelayMax(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .factory_build_delay_max
              );
              model.gwaioDifficultySettings.unableToExpandDelay(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .unable_to_expand_delay
              );
              model.gwaioDifficultySettings.enableCommanderDangerResponses(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .enable_commander_danger_responses
              );
              model.gwaioDifficultySettings.perExpansionDelay(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .per_expansion_delay
              );
              model.gwaioDifficultySettings.personalityTagsChosen(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .personality_tags
              );
              model.gwaioDifficultySettings.econBase(
                gwaioDifficulty.difficulties[selectedDifficulty].econBase
              );
              model.gwaioDifficultySettings.econRatePerDist(
                gwaioDifficulty.difficulties[selectedDifficulty].econRatePerDist
              );
              model.gwaioDifficultySettings.maxBasicFabbers(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .max_basic_fabbers
              );
              model.gwaioDifficultySettings.maxAdvancedFabbers(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .max_advanced_fabbers
              );
              model.gwaioDifficultySettings.ffaChance(
                gwaioDifficulty.difficulties[selectedDifficulty].ffa_chance
              );
              model.gwaioDifficultySettings.bossCommanders(
                gwaioDifficulty.difficulties[selectedDifficulty].bossCommanders
              );
              model.gwaioDifficultySettings.startingLocationEvaluationRadius(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .starting_location_evaluation_radius
              );
              model.gwaioDifficultySettings.landAnywhereChance(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .landAnywhereChance
              );
              model.gwaioDifficultySettings.suddenDeathChance(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .suddenDeathChance
              );
              model.gwaioDifficultySettings.bountyModeChance(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .bountyModeChance
              );
              model.gwaioDifficultySettings.bountyModeValue(
                gwaioDifficulty.difficulties[selectedDifficulty].bountyModeValue
              );
              model.gwaioDifficultySettings.factionTechHandicap(
                gwaioDifficulty.difficulties[selectedDifficulty]
                  .factionTechHandicap
              );
            }

            var useEasySystems =
              gwaioDifficulty.difficulties[selectedDifficulty]
                .useEasierSystemTemplate;
            var systemTemplates = useEasySystems
              ? easy_system_templates
              : star_system_templates;
            var sizes = GW.balance.numberOfSystems;
            var size = sizes[model.newGameSizeIndex()] || 40;

            var aiFactions = _.range(GWFactions.length);
            aiFactions.splice(model.playerFactionIndex(), 1);
            if (model.gwaioDifficultySettings.factionScaling()) {
              var numFactions = model.newGameSizeIndex() + 1;
              aiFactions = _.sample(aiFactions, numFactions);
            }

            if (model.creditsMode())
              size = _.reduce(
                GWFactions,
                function (factionSum, faction) {
                  return _.reduce(
                    faction.teams,
                    function (teamSum, team) {
                      return teamSum + (team.workers || []).length;
                    },
                    factionSum,
                    1
                  );
                },
                0
              );

            model.updateCommander();
            game
              .inventory()
              .setTag("global", "playerFaction", model.playerFactionIndex());
            game
              .inventory()
              .setTag("global", "playerColor", model.playerColor());

            var buildGalaxy = game.galaxy().build({
              seed: model.newGameSeed(),
              size: size,
              difficultyIndex: selectedDifficulty,
              systemTemplates: systemTemplates,
              content: game.content(),
              minStarDistance: 2,
              maxStarDistance: 4,
              maxConnections: 4,
              minimumDistanceBonus: 8,
            });
            var dealStartCard = buildGalaxy.then(function (galaxy) {
              if (model.makeGameBusy() !== busyToken) return;
              return gwaioDealStartCard({
                id: model.activeStartCard().id(),
                inventory: game.inventory(),
                galaxy: galaxy,
                star: galaxy.stars()[galaxy.origin()],
              }).then(function (startCardProduct) {
                game
                  .inventory()
                  .cards.push(
                    startCardProduct || { id: model.activeStartCard().id() }
                  );
              });
            });
            var moveIn = dealStartCard.then(function () {
              if (model.makeGameBusy() !== busyToken) return;
              game.move(game.galaxy().origin());

              var star = game.galaxy().stars()[game.currentStar()];
              star.explored(true);

              game.gameState(GW.Game.gameStates.active);
            });
            var populate = moveIn.then(function () {
              if (model.makeGameBusy() !== busyToken) return;

              // Scatter some AIs
              if (!model.creditsMode()) aiFactions = _.shuffle(aiFactions);
              var teams = _.map(aiFactions, GWTeams.getTeam);
              if (model.creditsMode())
                // Duplicate the workers so we can keep them unique
                _.forEach(teams, function (team) {
                  team.workers = (team.workers || []).slice(0);
                });

              var teamInfo = _.map(teams, function (team, teamIndex) {
                return {
                  team: team,
                  workers: [],
                  faction: aiFactions[teamIndex],
                };
              });

              if (model.creditsMode()) neutralStars = 0;
              else if (model.gwaioDifficultySettings.easierStart())
                var neutralStars = 4;
              else neutralStars = 2;

              return GWBreeder.populate({
                galaxy: game.galaxy(),
                teams: teams,
                neutralStars: neutralStars,
                orderedSpawn: model.creditsMode(),
                spawn: function () {},
                canSpread: function (star, ai) {
                  return (
                    !model.creditsMode() ||
                    !ai ||
                    !!teams[ai.team].workers.length
                  );
                },
                spread: function (star, ai) {
                  var team = teams[ai.team];
                  return GWTeams.makeWorker(star, ai, team).then(function () {
                    if (team.workers) _.remove(team.workers, { name: ai.name });

                    ai.faction = teamInfo[ai.team].faction;
                    teamInfo[ai.team].workers.push({
                      ai: ai,
                      star: star,
                    });
                  });
                },
                boss: function (star, ai) {
                  return GWTeams.makeBoss(
                    star,
                    ai,
                    teams[ai.team],
                    systemTemplates
                  ).then(function () {
                    ai.faction = teamInfo[ai.team].faction;
                    teamInfo[ai.team].boss = ai;
                  });
                },
                breedToOrigin: game.isTutorial(),
              }).then(function () {
                return teamInfo;
              });
            });

            var finishAis = populate.then(function (teamInfo) {
              if (model.makeGameBusy() !== busyToken) return;

              // DIFFICULTY RAMPING CODE
              var maxDist = _.reduce(
                game.galaxy().stars(),
                function (value, star) {
                  return Math.max(star.distance(), value);
                },
                0
              );
              console.debug("Max distance: " + maxDist);

              var setAIData = function (
                ai,
                dist,
                isBossSystem,
                isBoss,
                faction
              ) {
                if (ai.faction === undefined) ai.faction = faction;
                if (model.gwaioDifficultySettings.quellerAI()) {
                  ai.personality.ai_path = "/pa/ai/queller/q_uber";
                }
                ai.personality.micro_type =
                  model.gwaioDifficultySettings.microTypeChosen();
                ai.personality.go_for_the_kill =
                  model.gwaioDifficultySettings.goForKill();
                ai.personality.priority_scout_metal_spots =
                  model.gwaioDifficultySettings.priorityScoutMetalSpots();
                ai.personality.factory_build_delay_min =
                  model.gwaioDifficultySettings.factoryBuildDelayMin();
                ai.personality.factory_build_delay_max =
                  model.gwaioDifficultySettings.factoryBuildDelayMax();
                ai.personality.unable_to_expand_delay =
                  model.gwaioDifficultySettings.unableToExpandDelay();
                ai.personality.enable_commander_danger_responses =
                  model.gwaioDifficultySettings.enableCommanderDangerResponses();
                ai.personality.per_expansion_delay =
                  model.gwaioDifficultySettings.perExpansionDelay();
                ai.personality.max_basic_fabbers =
                  model.gwaioDifficultySettings.maxBasicFabbers();
                ai.personality.max_advanced_fabbers =
                  model.gwaioDifficultySettings.maxAdvancedFabbers();
                ai.personality.personality_tags =
                  model.gwaioDifficultySettings.personalityTagsChosen();
                if (
                  model.gwaioDifficultySettings.startingLocationEvaluationRadius() >
                  0
                )
                  ai.personality.starting_location_evaluation_radius =
                    model.gwaioDifficultySettings.startingLocationEvaluationRadius();
                var getRandomArbitrary = function (min, max) {
                  return Math.random() * (max - min) + min;
                };
                if (isBossSystem) {
                  ai.econ_rate =
                    (model.gwaioDifficultySettings.econBase() +
                      maxDist *
                        model.gwaioDifficultySettings.econRatePerDist()) *
                    getRandomArbitrary(0.9, 1.1);
                  if (isBoss)
                    ai.bossCommanders =
                      model.gwaioDifficultySettings.bossCommanders();
                } else
                  ai.econ_rate =
                    (model.gwaioDifficultySettings.econBase() +
                      dist * model.gwaioDifficultySettings.econRatePerDist()) *
                    getRandomArbitrary(0.9, 1.1);
              };

              var buffType = [0, 1, 2, 3, 4, 5]; // 0 = cost; 1 = damage; 2 = health; 3 = speed; 4 = build; 5 = commanders
              var buffDelay =
                model.gwaioDifficultySettings.factionTechHandicap();
              var aiInventory = [];
              var clusterCommanderInventory = [];

              if (model.gwaioDifficultySettings.tougherCommanders()) {
                aiInventory = aiInventory.concat(
                  gwaioTech.tougherCommanders[0]
                );
                clusterCommanderInventory = clusterCommanderInventory.concat(
                  gwaioTech.tougherCommanders[1]
                );
              }

              _.forEach(teamInfo, function (info) {
                // Setup boss system
                if (info.boss) {
                  setAIData(info.boss, maxDist, true, true);
                  if (info.boss.isCluster === true)
                    info.boss.inventory = gwaioTech.clusterCommanders.concat(
                      clusterCommanderInventory
                    );
                  else info.boss.inventory = aiInventory;
                  var numBuffs = Math.floor(maxDist / 2 - buffDelay);
                  var typeOfBuffs = _.sample(buffType, numBuffs);
                  info.boss.typeOfBuffs = typeOfBuffs; // for intelligence reports
                  _.times(typeOfBuffs.length, function (n) {
                    info.boss.inventory = info.boss.inventory.concat(
                      gwaioTech.factionTechs[info.boss.faction][typeOfBuffs[n]]
                    );
                  });
                  var numMinions = Math.floor(
                    model.gwaioDifficultySettings.mandatoryMinions() +
                      maxDist * model.gwaioDifficultySettings.minionMod()
                  );
                  if (numMinions > 0) {
                    info.boss.minions = [];
                    if (info.boss.isCluster === true) {
                      var bossMinion = _.clone(
                        _.sample(
                          _.filter(GWFactions[info.faction].minions, {
                            name: "Security",
                          })
                        )
                      );
                      setAIData(bossMinion, maxDist, true, false);
                      bossMinion.commanderCount = numMinions;
                      info.boss.minions.push(bossMinion);
                    } else
                      _.times(numMinions, function () {
                        bossMinion = _.clone(
                          _.sample(GWFactions[info.faction].minions)
                        );
                        setAIData(bossMinion, maxDist, true, false);
                        info.boss.minions.push(bossMinion);
                      });
                  }
                  console.debug(
                    "BOSS: " +
                      info.boss.name +
                      " | Faction: " +
                      info.boss.faction +
                      " | Eco: " +
                      info.boss.econ_rate.toPrecision(3) +
                      " | Commanders: " +
                      info.boss.bossCommanders +
                      " | Dist: " +
                      maxDist
                  );
                  if (info.boss.minions) {
                    _.times(info.boss.minions.length, function (n) {
                      console.debug(
                        "\tMinion: " +
                          info.boss.minions[n].name +
                          " | Eco: " +
                          info.boss.minions[n].econ_rate.toPrecision(3) +
                          " | Commanders: " +
                          info.boss.minions[n].commanderCount
                      );
                    });
                  }
                }

                // Setup non-boss AI system
                _.forEach(info.workers, function (worker) {
                  var dist = worker.star.distance();
                  setAIData(worker.ai, dist, false, false);
                  if (
                    Math.random() * 100 <=
                    model.gwaioDifficultySettings.landAnywhereChance()
                  )
                    worker.ai.landAnywhere = true;
                  if (
                    Math.random() * 100 <=
                    model.gwaioDifficultySettings.suddenDeathChance()
                  )
                    worker.ai.suddenDeath = true;
                  if (
                    Math.random() * 100 <=
                    model.gwaioDifficultySettings.bountyModeChance()
                  )
                    worker.ai.bountyMode = true;
                  worker.ai.bountyModeValue =
                    model.gwaioDifficultySettings.bountyModeValue();
                  if (worker.ai.isCluster === true)
                    worker.ai.inventory = gwaioTech.clusterCommanders.concat(
                      clusterCommanderInventory
                    );
                  else worker.ai.inventory = aiInventory;
                  var numBuffs = Math.floor(dist / 2 - buffDelay);
                  var typeOfBuffs = _.sample(buffType, numBuffs);
                  worker.ai.typeOfBuffs = typeOfBuffs; // for intelligence reports
                  _.times(typeOfBuffs.length, function (n) {
                    worker.ai.inventory = worker.ai.inventory.concat(
                      gwaioTech.factionTechs[worker.ai.faction][typeOfBuffs[n]]
                    );
                  });
                  var numMinions = Math.floor(
                    model.gwaioDifficultySettings.mandatoryMinions() +
                      worker.star.distance() *
                        model.gwaioDifficultySettings.minionMod()
                  );
                  if (numMinions > 0) {
                    worker.ai.minions = [];
                    if (worker.ai.name === "Security") {
                      var minion = _.clone(
                        _.sample(
                          _.filter(GWFactions[info.faction].minions, {
                            name: "Worker",
                          })
                        )
                      );
                      setAIData(minion, dist, false, false);
                      minion.commanderCount =
                        numMinions +
                        Math.floor(
                          model.gwaioDifficultySettings.bossCommanders() / 2
                        );
                      worker.ai.minions.push(minion);
                    } else if (worker.ai.name === "Worker")
                      worker.ai.commanderCount =
                        numMinions +
                        Math.floor(
                          model.gwaioDifficultySettings.bossCommanders() / 2
                        );
                    else {
                      _.times(numMinions, function () {
                        minion = _.clone(
                          _.sample(GWFactions[info.faction].minions)
                        );
                        setAIData(minion, dist, false, false);
                        worker.ai.minions.push(minion);
                      });
                    }
                  }

                  // Setup additional factions for FFA
                  var availableFactions = _.without(
                    aiFactions,
                    worker.ai.faction
                  );
                  _.times(availableFactions.length, function () {
                    if (
                      Math.random() * 100 <=
                      model.gwaioDifficultySettings.ffaChance()
                    ) {
                      if (worker.ai.foes === undefined) worker.ai.foes = [];
                      availableFactions = _.shuffle(availableFactions);
                      var foeFaction = availableFactions.splice(0, 1);
                      var foeCommander = _.clone(
                        _.sample(GWFactions[foeFaction].minions)
                      );
                      var numFoes = Math.round((numMinions + 1) / 2);
                      if (foeCommander.name === "Worker") {
                        numFoes += Math.floor(
                          model.gwaioDifficultySettings.bossCommanders() / 2
                        );
                      }
                      setAIData(foeCommander, dist, false, false, foeFaction);
                      foeCommander.inventory = [];
                      if (foeCommander.isCluster === true)
                        foeCommander.inventory =
                          gwaioTech.clusterCommanders.concat(
                            clusterCommanderInventory
                          );
                      else foeCommander.inventory = aiInventory;
                      _.times(typeOfBuffs.length, function (n) {
                        foeCommander.inventory = foeCommander.inventory.concat(
                          gwaioTech.factionTechs[foeFaction][typeOfBuffs[n]]
                        );
                      });
                      foeCommander.commanderCount = numFoes;
                      worker.ai.foes.push(foeCommander);
                    }
                  });
                  console.debug(
                    "WORKER: " +
                      worker.ai.name +
                      " | Faction: " +
                      worker.ai.faction +
                      " | Eco: " +
                      worker.ai.econ_rate.toPrecision(3) +
                      " | Commanders: " +
                      worker.ai.commanderCount +
                      " | Dist: " +
                      dist
                  );
                  if (worker.ai.minions) {
                    _.times(worker.ai.minions.length, function (n) {
                      console.debug(
                        "\tMinion: " +
                          worker.ai.minions[n].name +
                          " | Eco: " +
                          worker.ai.minions[n].econ_rate.toPrecision(3) +
                          " | Commanders: " +
                          worker.ai.minions[n].commanderCount
                      );
                    });
                  }
                  if (worker.ai.foes) {
                    _.times(worker.ai.foes.length, function (n) {
                      console.debug(
                        "\tFoe: " +
                          worker.ai.foes[n].name +
                          " | Eco: " +
                          worker.ai.foes[n].econ_rate.toPrecision(3) +
                          " | Commanders: " +
                          worker.ai.foes[n].commanderCount
                      );
                    });
                  }
                });
              });

              // Replacement for GWDealer.dealBossCards
              var lockedStartCards = _.filter(
                model.gwaioTreasureCards,
                function (card) {
                  return (
                    !GW.bank.hasStartCard(card) && !gwaioBank.hasStartCard(card)
                  );
                }
              );
              if (lockedStartCards) {
                var treasurePlanetCard = _.sample(lockedStartCards);
                _.assign(treasurePlanetCard, { allowOverflow: true });
                var treasurePlanetSetup = false;
              } else treasurePlanetSetup = true;

              var n = 0;
              var m = 0;
              _.forEach(game.galaxy().stars(), function (star) {
                var ai = star.ai();
                var system = star.system();
                if (!ai) {
                  if (gwaioLore.neutralSystems[n]) {
                    system.name = gwaioLore.neutralSystems[n].name;
                    system.description =
                      gwaioLore.neutralSystems[n].description;
                    n += 1;
                  }
                } else {
                  // eslint-disable-next-line lodash/prefer-filter
                  _.forEach(star.system().planets, function (world) {
                    if (world.starting_planet === true)
                      if (world.planet) world.planet.shuffleLandingZones = true;
                      else world.generator.shuffleLandingZones = true;
                  });
                  if (!ai.bossCommanders) {
                    if (treasurePlanetSetup === false) {
                      treasurePlanetSetup = true;
                      delete ai.commanderCount;
                      delete ai.minions;
                      delete ai.foes;
                      delete ai.team;
                      ai.icon =
                        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png";
                      ai.boss = true; // otherwise they don't display an icon
                      ai.mirrorMode = true;
                      ai.treasurePlanet = true;
                      ai.econ_rate =
                        model.gwaioDifficultySettings.econBase() +
                        maxDist *
                          model.gwaioDifficultySettings.econRatePerDist();
                      ai.bossCommanders =
                        model.gwaioDifficultySettings.bossCommanders();
                      ai.name = "The Guardians";
                      ai.character = "!LOC:Unknown";
                      ai.color = [
                        [255, 255, 255],
                        [255, 192, 203],
                      ];
                      ai.commander =
                        "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";
                      system.description =
                        "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.";
                      star.cardList().push(treasurePlanetCard);
                    } else if (
                      model.gwaioDifficultySettings.paLore() &&
                      gwaioLore.aiSystems[m]
                    ) {
                      system.description = gwaioLore.aiSystems[m];
                      m += 1;
                    }
                  }
                }
              });

              // Hacky way to store war information
              var originSystem = game
                .galaxy()
                .stars()
                [game.galaxy().origin()].system();
              originSystem.gwaio = {};
              originSystem.gwaio.version = "#.#.#";
              originSystem.gwaio.difficulty =
                model.gwaioDifficultySettings.difficultyName();
              originSystem.gwaio.galaxySize = [
                "!LOC:Small",
                "!LOC:Medium",
                "!LOC:Large",
                "!LOC:Epic",
                "!LOC:Uber",
                "!LOC:Vast",
                "!LOC:Gigantic",
                "!LOC:Ridiculous",
                "!LOC:Marathon",
              ][model.newGameSizeIndex()];
              originSystem.gwaio.factionScaling =
                model.gwaioDifficultySettings.factionScaling();
              originSystem.gwaio.systemScaling =
                model.gwaioDifficultySettings.systemScaling();
              originSystem.gwaio.easierStart =
                model.gwaioDifficultySettings.easierStart();
              originSystem.gwaio.tougherCommanders =
                model.gwaioDifficultySettings.tougherCommanders();
              if (model.gwaioDifficultySettings.quellerAI()) {
                originSystem.gwaio.ai = "Queller";
              } else {
                originSystem.gwaio.ai = "Titans";
              }

              if (model.creditsMode()) {
                originSystem.name = GWCredits.startSystem.name;
                originSystem.description = GWCredits.startSystem.description;
              }
            });

            finishAis.then(function () {
              if (model.makeGameBusy() !== busyToken) return;

              model.makeGameBusy(false);
              model.newGame(game);
              model.updateCommander();
              return game;
            });
          };

          model.makeGameOrRunCredits();
        }
      );
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioSetup();
}
