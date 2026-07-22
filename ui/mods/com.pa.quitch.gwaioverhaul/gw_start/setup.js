var gwoSetupLoaded;

function gwoSetup() {
  if (gwoSetupLoaded) {
    return;
  }

  gwoSetupLoaded = true;

  try {
    model.makeGame = function () {}; // Prevent changes to settings causing creation of new galaxies

    var enableGoToWar = ko.observable(true);
    var sharedSystemsForGalacticWarActive = false;
    var defaultNewGameName = model.newGameName();
    var warGenerationFailed;

    // We change how we monitor model.ready() to prevent
    // Shared Systems for Galactic War breaking our new lobby
    model.ready = ko.computed(function () {
      return enableGoToWar() && !!model.activeStartCard();
    });

    var onSelectedNamesChanged = function (names) {
      // No systems selected
      if (_.isEmpty(names)) {
        enableGoToWar(false);
      } else {
        enableGoToWar(true);
      }
    };

    var onModsMounted = function (mods) {
      var modMounted = function (modIdentifier) {
        return _.some(mods, { identifier: modIdentifier });
      };
      // Shared Systems for Galactic War
      if (modMounted("com.wondible.pa.gw_shared_systems")) {
        sharedSystemsForGalacticWarActive = true;
        model.selectedNames.subscribe(onSelectedNamesChanged);
        // Remove features this mod can't use
        $("#system-scaling").closest(".gwo-game-option-row").remove();
        model.gwoDifficultySettings.systemScaling(false);
        $("#system-size").closest(".gwo-game-option-row").remove();
        model.gwoDifficultySettings.simpleSystems(false);
        $("#large-planets").closest(".gwo-game-option-row").remove();
        model.gwoDifficultySettings.largePlanets(false);
      }
    };

    api.mods.getMounted("client", true).then(onModsMounted);

    var getQuellerAITag = function (faction) {
      var quellerTag = "queller";
      var legonisMachinaTags = ["tank", quellerTag];
      var foundationTags = ["air", quellerTag];
      var synchronousTags = ["bot", quellerTag];
      var revenantsTags = ["orbital", quellerTag];
      var clusterTags = ["land", quellerTag];

      switch (faction) {
        case 0:
          return legonisMachinaTags;
        case 1:
          return foundationTags;
        case 2:
          return synchronousTags;
        case 3:
          return revenantsTags;
        case 4:
          return clusterTags;
        default:
          console.error("Undefined faction:", faction);
          warGenerationFailed = true;
      }
    };

    var selectAIBuffs = function (numberOfBuffs) {
      var buffType = [0, 1, 2, 3, 4, 6, 7]; // 0 = cost; 1 = damage; 2 = health; 3 = speed; 4 = build; 6 = combat; 7 = cooldown
      return _.sample(buffType, numberOfBuffs);
    };

    var setupAIBuffs = function (distance, buffDistanceDelay) {
      var numberBuffs = Math.floor(distance / 2 - buffDistanceDelay);
      return selectAIBuffs(numberBuffs);
    };

    var aiTech = function (buffs, inventory, faction, tech) {
      _.times(buffs.length, function (n) {
        inventory = inventory.concat(tech[faction][buffs[n]]);
      });
      return inventory;
    };

    var countMinions = function (minionBase, minionStep, distance) {
      return Math.floor(minionBase + distance * minionStep);
    };

    var clusterCommanderCount = function (minionCount, bossCommanders) {
      return minionCount + Math.floor(bossCommanders / 2);
    };

    var selectMinion = function (minions, faction, minionName) {
      var isCluster = minionName === "Worker" || minionName === "Security";
      var selectedMinion;
      if (isCluster) {
        selectedMinion = _.cloneDeep(
          _.sample(
            _.filter(minions, {
              name: minionName,
            })
          )
        );
      } else {
        selectedMinion = _.cloneDeep(_.sample(minions));
      }
      if (_.isUndefined(selectedMinion)) {
        console.error("No minion found for faction " + faction);
        warGenerationFailed = true;
      }
      return selectedMinion;
    };

    var randomPercentageAdjustment = function (min, max) {
      return _.random(min, max, true);
    };

    var aiEcoMinionReduction = function (
      eco,
      ecoStep,
      distance,
      minionBase,
      minionStep
    ) {
      var minions = 0;
      var previousMinions = 0;

      if (distance > 0) {
        minions = countMinions(minionBase, minionStep, distance);
        previousMinions = countMinions(minionBase, minionStep, distance - 1);
      }

      if (minions > previousMinions) {
        return eco - ecoStep;
      }

      return eco;
    };

    // playerCount is optional; omit it (e.g. for a boss's own econ rate)
    // to skip the minion-count reduction entirely.
    var aiEconRate = function (distance, playerCount) {
      var difficulty = model.gwoDifficultySettings;
      var ecoBase = Number.parseFloat(difficulty.econBase());
      var ecoStep = Number.parseFloat(difficulty.econRatePerDist());
      var eco =
        (ecoBase + distance * ecoStep) * randomPercentageAdjustment(0.9, 1.1);

      if (playerCount) {
        var minionBase = difficulty.mandatoryMinions() * playerCount;
        var minionStep =
          Number.parseFloat(difficulty.minionMod()) * playerCount;
        eco = aiEcoMinionReduction(
          eco,
          ecoStep,
          distance,
          minionBase,
          minionStep
        );
      }

      return Math.max(ecoBase, eco);
    };

    var gameModeEnabled = function (gameModeChance) {
      return _.random(100) <= gameModeChance;
    };

    var enableAnEradicationModeTypes = function (ai) {
      var numberOfModes = _.random(1, 3);
      var modes = ["SubCommanders", "Factories", "Fabbers"];

      _.forEach(_.sample(modes, numberOfModes), function (mode) {
        ai["eradicationMode" + mode] = true;
      });
    };

    var startCardAllyCompatibility = function (game) {
      var gwoStarCardsWhichBreakAllies = [
        "nem_start_deepspace",
        "gwaio_start_tourist",
      ];
      // global for modder compatibility
      gwoStarCardsWhichBreakAllies = _.isArray(
        model.gwoStarCardsWhichBreakAllies
      )
        ? gwoStarCardsWhichBreakAllies.concat(
            model.gwoStarCardsWhichBreakAllies
          )
        : gwoStarCardsWhichBreakAllies;
      return _.some(gwoStarCardsWhichBreakAllies, function (card) {
        return card === game.inventory().cards()[0].id;
      });
    };

    var setupQuellerFFATag = function (ais) {
      if (!ais) {
        return;
      }

      var ffa = ["ffa", "platoon"];

      if (_.isArray(ais)) {
        _.forEach(ais, function (ai) {
          ai.personality.personality_tags =
            ai.personality.personality_tags.concat(ffa);
        });
      } else {
        ais.personality.personality_tags =
          ais.personality.personality_tags.concat(ffa);
      }
    };

    var saveDifficultySettings = function () {
      var settings = model.gwoDifficultySettings;
      var settingNames = _.keys(settings);
      _.pull(settingNames, "previousSettings");
      var snapshot = {};
      _.forEach(settingNames, function (name) {
        snapshot[name] = settings[name]();
      });
      settings.previousSettings(snapshot);
    };

    var warGenerationAttempts = 0;

    var warGenerationFailure = function () {
      model.makeGameBusy(false);
      enableGoToWar(true);
      if (warGenerationAttempts < 5) {
        model.newGameSeed(Math.floor(_.random(1000000, true)).toString());
        model.navToNewGame();
      } else {
        warGenerationAttempts = 0;
        console.error("Failed to generate valid war");
      }
    };

    var bossCommanderCount = function (difficulty, playerCount) {
      return difficulty.bossCommanders() * playerCount;
    };

    var galaxySizeNames = [
      "!LOC:Small",
      "!LOC:Medium",
      "!LOC:Large",
      "!LOC:Epic",
      "!LOC:Uber",
      // Support Bigger Galactic War mod
      "!LOC:Vast",
      "!LOC:Gigantic",
      "!LOC:Ridiculous",
      "!LOC:Marathon",
    ];

    var generatedWarName = function (
      selectedDifficulty,
      playerCount,
      sizeIndex,
      startCard,
      difficulties
    ) {
      var difficultyName = loc(difficulties[selectedDifficulty].difficultyName);
      var players = playerCount + " " + loc("!LOC:Players");
      var sizeName = loc(galaxySizeNames[sizeIndex] || galaxySizeNames[1]);
      var startCardSummary =
        startCard && startCard.summary ? loc(startCard.summary()) : "";

      return _.compact([
        difficultyName,
        players,
        sizeName,
        startCardSummary,
      ]).join(" - ");
    };

    requireGW(
      [
        "shared/gw_common",
        "shared/gw_factions",
        "pages/gw_start/gw_breeder",
        "pages/gw_start/gw_teams",
        "main/shared/js/star_system_templates",
        "main/game/galactic_war/shared/js/gw_easy_star_systems",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
      ],
      function (
        GW,
        GWFactions,
        GWBreeder,
        GWTeams,
        normalSystemTemplates, // window.star_system_templates is set instead
        easySystemTemplates,
        gwoCluster,
        gwoTech,
        gwoBank,
        gwoLore,
        gwoDifficulty,
        gwoAI,
        loadouts
      ) {
        model.startCards(loadouts.startCards);
        var processedStartCards = {};
        var loadCount = loadouts.allCards.length;
        var loaded = $.Deferred();

        _.forEach(loadouts.allCards, function (card) {
          requireGW(["cards/" + card.id], function (cardFile) {
            cardFile.id = card.id;
            processedStartCards[card.id] = cardFile;
            --loadCount;
            if (loadCount === 0) {
              loaded.resolve();
            }
          });
        });

        var gwoDealStartCard = function (params) {
          var result = $.Deferred();

          var onCardsLoaded = function () {
            var card = _.find(processedStartCards, { id: params.id });
            if (!card) {
              console.error("No matching start card ID found");
              warGenerationFailed = true;
            }
            var context =
              card.getContext &&
              card.getContext(params.galaxy, params.inventory);
            var deal = card.deal && card.deal(params.star, context);
            var product = { id: params.id };
            var cardParams = deal && deal.params;
            if (cardParams && _.isObject(cardParams)) {
              _.assign(product, cardParams);
            }
            card.keep && card.keep(deal, context);
            card.releaseContext && card.releaseContext(context);
            result.resolve(product, deal);
          };

          loaded.then(onCardsLoaded);
          return result;
        };

        var setupPenchantAI = function (ai, titansAITags) {
          var penchantValues = gwoAI.penchants();
          ai.personality.personality_tags =
            ai.personality.personality_tags.concat(
              penchantValues.penchants,
              titansAITags
            );
          ai.penchantName = penchantValues.penchantName;
        };

        var setAIPersonality = function (ai, difficulty, faction) {
          var personalityId = "#gwo-personality-picker";
          var personality = ai.personality;

          personality.micro_type = difficulty.microType();
          personality.go_for_the_kill = difficulty.goForKill();
          personality.priority_scout_metal_spots =
            difficulty.priorityScoutMetalSpots();
          personality.factory_build_delay_min =
            difficulty.factoryBuildDelayMin();
          personality.factory_build_delay_max =
            difficulty.factoryBuildDelayMax();
          personality.unable_to_expand_delay = difficulty.unableToExpandDelay();
          personality.enable_commander_danger_responses =
            difficulty.enableCommanderDangerResponses();
          personality.per_expansion_delay = difficulty.perExpansionDelay();
          personality.max_basic_fabbers = difficulty.maxBasicFabbers();
          personality.max_advanced_fabbers = difficulty.maxAdvancedFabbers();
          personality.personality_tags =
            $(personalityId).val() === null ? [] : $(personalityId).val();
          // We treat 0 as undefined, which means the AI examines the
          // radius of the spawn zone
          if (difficulty.startingLocationEvaluationRadius() > 0) {
            personality.starting_location_evaluation_radius =
              difficulty.startingLocationEvaluationRadius();
          }

          var titansAITags = ["Default"];

          switch (difficulty.ai()) {
            case "Penchant":
              setupPenchantAI(ai, titansAITags);
              break;
            case "Queller":
              personality.personality_tags =
                personality.personality_tags.concat(getQuellerAITag(faction));
              break;
            case "Titans":
              personality.personality_tags =
                personality.personality_tags.concat(titansAITags);
              break;
            default:
              console.error("Undefined AI type:", difficulty.ai());
              warGenerationFailed = true;
          }
        };

        // replicates the functionality of model.makeGame() but
        // only generates the galaxy once the player clicks Go To War
        model.navToNewGame = function () {
          if (!model.ready()) {
            return;
          }

          enableGoToWar(false);
          warGenerationFailed = false;
          warGenerationAttempts++;

          var busyToken = {};
          model.makeGameBusy(busyToken);

          var version = "6.2.3";
          console.log("War created using Galactic War Overhaul v" + version);

          var game = new GW.Game();
          game.mode(model.mode());
          game.hardcore(model.newGameHardcore());
          game.content(api.content.activeContent());
          game.coopPlayers(model.normalizedNewGameCoopPlayers());
          game.coopPlayersSpecified(true);
          game.lockCoopPlayers(model.newGameLockCoopPlayers());
          game.perPlayerTechCards(model.newGamePerPlayerTechCards());
          game.sharedByDefault(
            game.perPlayerTechCards() ? false : model.newGameSharedByDefault()
          );

          var selectedDifficulty =
            model.gwoDifficultySettings.difficultyLevel();
          var systemTemplates = model.gwoDifficultySettings.simpleSystems()
            ? easySystemTemplates
            : star_system_templates;
          var sizes = GW.balance.numberOfSystems;
          var size = sizes[model.newGameSizeIndex()] || 40;
          var aiFactions = _.range(GWFactions.length);
          aiFactions.splice(model.playerFactionIndex(), 1);
          if (model.gwoDifficultySettings.factionScaling()) {
            var numFactions = model.newGameSizeIndex() + 1;
            aiFactions = _.sample(aiFactions, numFactions);
          }
          var playerCount = game.coopPlayers();
          var largePlanets = model.gwoDifficultySettings.largePlanets();
          var startCard = model.activeStartCard();

          if (model.newGameName() === defaultNewGameName) {
            model.newGameName(
              generatedWarName(
                selectedDifficulty,
                playerCount,
                model.newGameSizeIndex(),
                startCard,
                gwoDifficulty.difficulties
              )
            );
          }
          game.name(model.newGameName());

          model.updateCommander();
          game
            .inventory()
            .setTag("global", "playerFaction", model.playerFactionIndex());
          game.inventory().setTag("global", "playerColor", model.playerColor());

          var buildGalaxy = game.galaxy().build({
            seed: model.newGameSeed(),
            size: size,
            difficultyIndex: selectedDifficulty,
            systemTemplates: systemTemplates,
            content: game.content(),
            coopPlayersForSystemGeneration: playerCount,
            minStarDistance: 2,
            maxStarDistance: 4,
            maxConnections: 4,
            minimumDistanceBonus: 8,
            largePlanets: largePlanets,
          });

          var onStartCardDealt = function (startCardProduct) {
            game
              .inventory()
              .cards.push(startCardProduct || { id: startCard.id() });
          };

          var onGalaxyBuilt = function (galaxy) {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            return gwoDealStartCard({
              id: startCard.id(),
              inventory: game.inventory(),
              galaxy: galaxy,
              star: galaxy.stars()[galaxy.origin()],
            }).then(onStartCardDealt);
          };

          var dealStartCard = buildGalaxy.then(onGalaxyBuilt);

          var onStartCardApplied = function () {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }
            var galaxy = game.galaxy();
            game.move(galaxy.origin());
            var star = galaxy.stars()[game.currentStar()];
            star.explored(true);
            game.gameState(GW.Game.gameStates.active);
          };

          var moveIn = dealStartCard.then(onStartCardApplied);

          var onMovedIn = function () {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            // Scatter some AIs
            aiFactions = _.shuffle(aiFactions);
            var teams = _.map(aiFactions, GWTeams.getTeam);
            if (model.gwoDifficultySettings.ai() === "Queller") {
              // Filter each team's minion pool (used by makeWorker below)
              // before anything gets sampled from it, so Queller-incompatible
              // minions can never be spread onto the galaxy as a worker AI.
              _.forEach(teams, function (team) {
                team.remainingMinions = gwoAI.quellerCompatibleMinions(
                  team.remainingMinions
                );
                team.faction = _.assign({}, team.faction, {
                  minions: gwoAI.quellerCompatibleMinions(team.faction.minions),
                });
              });
            }
            var teamInfo = _.map(teams, function (team, teamIndex) {
              return {
                team: team,
                workers: [],
                faction: aiFactions[teamIndex],
              };
            });

            var neutralStars = 2;
            if (model.gwoDifficultySettings.easierStart()) {
              neutralStars = 4;
            }

            // GWTeams.makeWorker() replaced to allow use of _.cloneDeep()
            // to preserve personality_tags. Defined here (a sibling of handleSpread
            // below) rather than nested inside it, taking team/ai/star as explicit
            // params, so the promise callbacks don't sit six function-levels deep.
            var makeWorker = function (team, ai) {
              if (team.workers) {
                _.assign(ai, _.cloneDeep(_.sample(team.workers)));
              } else if (team.remainingMinions) {
                var minion = _.sample(
                  team.remainingMinions.length
                    ? team.remainingMinions
                    : team.faction.minions
                );
                _.assign(ai, _.cloneDeep(minion));
                _.remove(team.remainingMinions, { name: ai.name });
              }
              return $.when(ai);
            };

            var onWorkerMade = function (team, ai, star) {
              if (team.workers) {
                _.remove(team.workers, { name: ai.name });
              }
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].workers.push({
                ai: ai,
                star: star,
              });
            };

            var onBossMade = function (ai) {
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].boss = ai;
            };

            var handleSpread = function (star, ai) {
              var team = teams[ai.team];
              return makeWorker(team, ai).then(
                onWorkerMade.bind(null, team, ai, star)
              );
            };

            var handleBoss = function (star, ai) {
              return GWTeams.makeBoss(
                star,
                ai,
                teams[ai.team],
                systemTemplates
              ).then(onBossMade.bind(null, ai));
            };

            var returnTeamInfo = function () {
              return teamInfo;
            };

            return GWBreeder.populate({
              galaxy: game.galaxy(),
              teams: teams,
              neutralStars: neutralStars,
              orderedSpawn: false,
              spawn: function () {},
              canSpread: _.constant(true),
              spread: handleSpread,
              boss: handleBoss,
              breedToOrigin: game.isTutorial(),
            }).then(returnTeamInfo);
          };

          var populate = moveIn.then(onMovedIn);

          // Sibling helpers for onPopulated's nested star/planet loops, defined here
          // and passed by reference (bind) so the loop bodies don't sit six
          // function-levels deep.
          var setupPlanetForAI = function (ai, planet) {
            planet.generator.shuffleLandingZones = true;
            // Set up Foundation planets
            if (
              sharedSystemsForGalacticWarActive === false &&
              ai.faction === 1 &&
              !ai.boss
            ) {
              planet.generator.waterHeight = 50;
            }
          };

          var isCardLocked = function (card) {
            return !GW.bank.hasStartCard(card) && !gwoBank.hasStartCard(card);
          };

          var onPopulated = function (teamInfo) {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            var maxDist = _.reduce(
              game.galaxy().stars(),
              function (value, star) {
                return Math.max(star.distance(), value);
              },
              0
            );

            var startCardBreaksAllies = startCardAllyCompatibility(game);

            // Set up the AI
            _.forEach(teamInfo, function (info) {
              var boss = info.boss;

              if (!boss) {
                console.error(
                  "No AI boss found for faction " +
                    info.faction +
                    ", terminating war generation"
                );
                warGenerationFailed = true;
                return;
              }

              var difficulty = model.gwoDifficultySettings;
              var workerPool = info.workers;
              var minionPool = GWFactions[info.faction].minions;
              if (difficulty.ai() === "Queller") {
                // info.workers is already Queller-compatible: it's built via
                // makeWorker() from team.remainingMinions/team.faction.minions,
                // which we pre-filter above. This re-filter is a no-op for the
                // built-in factions, kept as a safety net for any faction (e.g.
                // a modded one, in the style of the base game's gw_faction_credits_*
                // "Credits War" factions) that populates team.workers instead,
                // a path our pre-filter doesn't cover.
                workerPool = gwoAI.quellerCompatibleMinions(workerPool);
                minionPool = gwoAI.quellerCompatibleMinions(minionPool);
              }

              // Set up boss system
              setAIPersonality(boss, difficulty, boss.faction);
              boss.econ_rate = aiEconRate(maxDist);
              var bossCommanders = bossCommanderCount(difficulty, playerCount);
              boss.bossCommanders = bossCommanders;

              boss.inventory = [];

              if (boss.isCluster === true) {
                boss.inventory = gwoCluster.clusterCommanders;
              }

              var factionTechHandicap = Number.parseFloat(
                difficulty.factionTechHandicap()
              );
              var bossBuffs = setupAIBuffs(maxDist, factionTechHandicap);
              boss.typeOfBuffs = bossBuffs; // for intelligence reports
              boss.inventory = aiTech(
                bossBuffs,
                boss.inventory,
                boss.faction,
                gwoTech.factionTechs
              );

              var mandatoryMinions =
                difficulty.mandatoryMinions() * playerCount;
              var minionMod =
                Number.parseFloat(difficulty.minionMod()) * playerCount;
              var clusterType = "";
              // Set up boss minions
              var numMinions = countMinions(
                mandatoryMinions,
                minionMod,
                maxDist
              );
              var totalMinions = numMinions;

              if (numMinions > 0) {
                boss.minions = [];

                if (boss.isCluster === true) {
                  clusterType = "Security";
                  totalMinions = 1;
                }

                _.times(totalMinions, function () {
                  var minion = selectMinion(
                    minionPool,
                    boss.faction,
                    clusterType
                  );
                  setAIPersonality(minion, difficulty, boss.faction);
                  minion.econ_rate = aiEconRate(maxDist, playerCount);
                  if (boss.isCluster === true) {
                    minion.commanderCount = numMinions;
                  }
                  boss.minions.push(minion);
                });
              }

              // Set up non-boss AI system
              _.forEach(workerPool, function (worker) {
                var ai = worker.ai;

                ai.landAnywhere = gameModeEnabled(
                  difficulty.landAnywhereChance()
                );
                ai.suddenDeath = gameModeEnabled(
                  difficulty.suddenDeathChance()
                );
                ai.bountyMode = gameModeEnabled(difficulty.bountyModeChance());
                ai.bountyModeValue = Number.parseFloat(
                  difficulty.bountyModeValue()
                );
                ai.eradicationMode = gameModeEnabled(
                  difficulty.eradicationModeChance()
                );
                enableAnEradicationModeTypes(ai);

                var dist = worker.star.distance();

                numMinions = countMinions(mandatoryMinions, minionMod, dist);

                setAIPersonality(ai, difficulty, ai.faction);
                ai.econ_rate = aiEconRate(dist, playerCount);

                ai.inventory = [];

                if (ai.isCluster === true) {
                  ai.inventory = gwoCluster.clusterCommanders;
                }

                var workerBuffs = setupAIBuffs(dist, factionTechHandicap);
                ai.typeOfBuffs = workerBuffs; // for intelligence reports
                ai.inventory = aiTech(
                  workerBuffs,
                  ai.inventory,
                  ai.faction,
                  gwoTech.factionTechs
                );

                // Set up non-boss minions
                if (numMinions > 0) {
                  ai.minions = [];

                  totalMinions = numMinions;
                  var clusterWorkers = 0;
                  if (ai.isCluster === true) {
                    clusterType = "Worker";
                    clusterWorkers = clusterCommanderCount(
                      numMinions,
                      bossCommanders
                    );
                    totalMinions = 1;
                  }

                  // Cluster Workers get additional commanders in place of minions
                  if (ai.name === "Worker") {
                    ai.commanderCount = Math.max(clusterWorkers, 2);
                  } else {
                    _.times(totalMinions, function () {
                      var minion = selectMinion(
                        minionPool,
                        ai.faction,
                        clusterType
                      );
                      setAIPersonality(minion, difficulty, ai.faction);
                      minion.econ_rate = aiEconRate(dist, playerCount);
                      if (ai.isCluster === true) {
                        minion.commanderCount = clusterWorkers;
                      }
                      ai.minions.push(minion);
                    });
                  }
                }

                // Set up additional factions for FFA
                var availableFactions = _.without(aiFactions, ai.faction);
                _.times(availableFactions.length, function () {
                  if (gameModeEnabled(difficulty.ffaChance())) {
                    if (!ai.foes) {
                      ai.foes = [];
                    }

                    availableFactions = _.shuffle(availableFactions);
                    var foeFaction = availableFactions.shift();
                    var foeMinions = GWFactions[foeFaction].minions;
                    if (difficulty.ai() === "Queller") {
                      foeMinions = gwoAI.quellerCompatibleMinions(foeMinions);
                    }
                    var foeCommander = selectMinion(foeMinions, foeFaction);
                    foeCommander.faction = foeFaction;
                    setAIPersonality(
                      foeCommander,
                      difficulty,
                      foeCommander.faction
                    );
                    foeCommander.econ_rate = aiEconRate(dist, playerCount);
                    var numFoes = Math.round((numMinions + 1) / 2);
                    // Cluster Workers get additional commanders in place of armies
                    if (foeCommander.name === "Worker") {
                      numFoes = clusterCommanderCount(
                        numMinions,
                        bossCommanders
                      );
                    }
                    foeCommander.commanderCount = numFoes;

                    foeCommander.inventory = [];
                    if (foeCommander.isCluster === true) {
                      foeCommander.inventory = gwoCluster.clusterCommanders;
                    }

                    foeCommander.inventory = aiTech(
                      workerBuffs,
                      foeCommander.inventory,
                      foeCommander.faction,
                      gwoTech.factionTechs
                    );

                    ai.foes.push(foeCommander);
                  }
                });

                // Set up allied commander
                if (
                  !startCardBreaksAllies &&
                  gameModeEnabled(difficulty.alliedCommanderChance())
                ) {
                  var playerFaction = model.playerFactionIndex();
                  var allyMinions = GWFactions[playerFaction].minions;
                  if (difficulty.aiAlly() === "Queller") {
                    allyMinions = gwoAI.quellerCompatibleMinions(allyMinions);
                  }
                  var allyCommander = selectMinion(allyMinions, playerFaction);
                  allyCommander.faction = playerFaction;
                  ai.ally = allyCommander;
                  if (difficulty.aiAlly() === "Penchant") {
                    setupPenchantAI(ai.ally);
                  }
                }

                if (difficulty.ai() === "Queller" && ai.foes) {
                  setupQuellerFFATag(ai);
                  setupQuellerFFATag(ai.minions);
                  setupQuellerFFATag(ai.foes);
                  setupQuellerFFATag(ai.ally);
                }
              });
            });

            var treasurePlanetSetup = false;
            var loreEntry = 0;
            var optionalLoreEntry = 0;
            var treasureCards = loadouts.lockedBaseCards.concat(
              model.gwoNewStartCards
            );
            _.forEach(game.galaxy().stars(), function (star) {
              var ai = star.ai();
              var system = star.system();
              if (ai) {
                _.forEach(
                  star.system().planets,
                  setupPlanetForAI.bind(null, ai)
                );

                if (!ai.bossCommanders) {
                  var difficulty = model.gwoDifficultySettings;

                  // Set up The Guardians' treasure planet
                  if (treasurePlanetSetup === false) {
                    treasurePlanetSetup = true;
                    delete ai.commanderCount;
                    delete ai.minions;
                    delete ai.foes;
                    delete ai.ally;
                    delete ai.team;
                    delete ai.penchantName;
                    ai.icon =
                      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png";
                    ai.boss = true; // otherwise it won't display its icon
                    ai.mirrorMode = true;
                    ai.treasurePlanet = true;
                    ai.econ_rate = aiEconRate(maxDist);
                    ai.bossCommanders = bossCommanderCount(
                      difficulty,
                      playerCount
                    );
                    ai.name = "The Guardians";
                    ai.character = "!LOC:Unknown";
                    ai.color = [
                      [255, 255, 255],
                      [255, 192, 203],
                    ];
                    ai.commander =
                      "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";
                    var lockedStartCards = _.filter(
                      treasureCards,
                      isCardLocked
                    );

                    // Deal a loadout to the treasure planet
                    if (!_.isEmpty(lockedStartCards)) {
                      var treasurePlanetCard = _.sample(lockedStartCards);
                      _.assign(treasurePlanetCard, { allowOverflow: true });
                      star.cardList().push(treasurePlanetCard);
                      system.description =
                        "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.";
                    }
                  } else if (
                    difficulty.paLore() &&
                    gwoLore.aiSystems[optionalLoreEntry]
                  ) {
                    // Add lore to systems
                    system.description = gwoLore.aiSystems[optionalLoreEntry];
                    optionalLoreEntry += 1;
                  }
                }
              } else if (gwoLore.neutralSystems[loreEntry]) {
                system.name = gwoLore.neutralSystems[loreEntry].name;
                system.description =
                  gwoLore.neutralSystems[loreEntry].description;
                loreEntry += 1;
              }
            });
          };

          var finishAis = populate.then(onPopulated);

          var onAisFinished = function () {
            if (warGenerationFailed === true) {
              return;
            }

            // Hacky way to store war information for the gw_play scene
            var galaxy = game.galaxy();
            var originSystem = galaxy.stars()[galaxy.origin()].system();
            originSystem.gwaio = {};
            originSystem.gwaio.version = version;
            originSystem.gwaio.difficulty =
              gwoDifficulty.difficulties[selectedDifficulty].difficultyName;
            originSystem.gwaio.galaxySize =
              galaxySizeNames[model.newGameSizeIndex()];
            originSystem.gwaio.factionScaling =
              model.gwoDifficultySettings.factionScaling();
            originSystem.gwaio.systemScaling =
              model.gwoDifficultySettings.systemScaling();
            originSystem.gwaio.simpleSystems =
              model.gwoDifficultySettings.simpleSystems();
            originSystem.gwaio.largePlanets =
              model.gwoDifficultySettings.largePlanets();
            originSystem.gwaio.easierStart =
              model.gwoDifficultySettings.easierStart();
            if (model.devMode()) {
              originSystem.gwaio.cheatsUsed = true;
            }
            originSystem.gwaio.ai = model.gwoDifficultySettings.ai();
            originSystem.gwaio.aiAlly = model.gwoDifficultySettings.aiAlly();
            originSystem.gwaio.aiMods = [];
            originSystem.gwaio.techCardDeck =
              model.gwoDifficultySettings.techCardDeck();
            originSystem.gwaio.staticTech =
              model.gwoDifficultySettings.staticTech();
            // We don't need to apply the hotfix as it's for v5.17.1 and earlier
            originSystem.gwaio.treasurePlanetFixed = true;
            // We don't need to apply the hotfix as it's for v5.22.1 and earlier
            originSystem.gwaio.clusterFixed = true;
            originSystem.gwaio.coopPlayerScalingCount = playerCount;
          };

          var warInfo = finishAis.then(onAisFinished);

          var onWarInfoStored = function () {
            if (
              model.makeGameBusy() !== busyToken ||
              warGenerationFailed === true
            ) {
              return;
            }

            model.makeGameBusy(false);
            model.newGame(game);
            model.updateCommander();
            if (game.perPlayerTechCards()) {
              var displayName = ko
                .observable()
                .extend({ session: "displayName" });
              game.upsertCoopPlayerInventoryData({
                playerId: model.uberId(),
                playerName: displayName(),
                commander: model.selectedCommander(),
                loadoutCardId: startCard.id(),
                inventory: game.inventory().save(),
                techCardDealCount: 0,
                updatedAt: _.now(),
              });
            }
            return game;
          };

          var finishSetup = warInfo.then(onWarInfoStored);

          var onGameSaved = function () {
            model.lastSceneUrl(
              "coui://ui/main/game/galactic_war/gw_start/gw_start.html"
            );
            window.location.href =
              "coui://ui/main/game/galactic_war/gw_play/gw_play.html";
          };

          var onSetupFinished = function () {
            if (warGenerationFailed === true) {
              warGenerationFailure();
              return;
            }

            saveDifficultySettings();

            var save = GW.manifest.saveGame(model.newGame());
            model.activeGameId(model.newGame().id);
            save.then(onGameSaved);
          };

          var onWarGenerationError = function (err) {
            console.error(err);
            warGenerationFailure();
          };

          finishSetup.then(onSetupFinished).fail(onWarGenerationError);
        };
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoSetup();
