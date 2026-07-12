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

    // We change how we monitor model.ready() to prevent
    // Shared Systems for Galactic War breaking our new lobby
    model.ready = ko.computed(function () {
      return enableGoToWar() && !!model.activeStartCard();
    });

    api.mods.getMounted("client", true).then(function (mods) {
      var modMounted = function (modIdentifier) {
        return _.some(mods, { identifier: modIdentifier });
      };
      // Shared Systems for Galactic War
      if (modMounted("com.wondible.pa.gw_shared_systems")) {
        sharedSystemsForGalacticWarActive = true;
        model.selectedNames.subscribe(function (names) {
          // No systems selected
          if (_.isEmpty(names)) {
            enableGoToWar(false);
          } else {
            enableGoToWar(true);
          }
        });
        // Remove features this mod can't use
        $("#system-scaling").closest(".gwo-game-option-row").remove();
        model.gwoDifficultySettings.systemScaling(false);
        $("#system-size").closest(".gwo-game-option-row").remove();
        model.gwoDifficultySettings.simpleSystems(false);
        $("#large-planets").closest(".gwo-game-option-row").remove();
        model.gwoDifficultySettings.largePlanets(false);
      }
    });

    var randomPercentageAdjustment = function (min, max) {
      return Math.random() * (max - min) + min;
    };

    var aiEcoMinionReduction = function (eco, ecoStep, minions) {
      return eco - minions * ecoStep;
    };

    var aiEconRate = function (ecoBase, ecoStep, distance, minions) {
      var eco =
        (ecoBase + distance * ecoStep) * randomPercentageAdjustment(0.9, 1.1);
      if (minions) {
        eco = aiEcoMinionReduction(eco, ecoStep, minions);
      }
      return eco;
    };

    var aiFaction = 0;
    var getQuellerAITag = function (faction) {
      if (faction) {
        // Minions don't have a faction number so use the previous one
        // which should be from the primary AI and accurate
        aiFaction = Number.parseInt(faction);
      }

      var quellerTag = "queller";
      var legonisMachinaTags = ["tank", quellerTag];
      var foundationTags = ["air", quellerTag];
      var synchronousTags = ["bot", quellerTag];
      var revenantsTags = ["orbital", quellerTag];
      var clusterTags = ["land", quellerTag];

      switch (aiFaction) {
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
          throw new Error("Undefined faction: " + aiFaction);
      }
    };

    var parseBoolean = function (string) {
      return string === "true";
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

    var selectMinion = function (minions, minionName) {
      var isCluster = minionName === "Worker" || minionName === "Security";
      if (isCluster) {
        return _.cloneDeep(
          _.sample(
            _.filter(minions, {
              name: minionName,
            })
          )
        );
      }
      return _.cloneDeep(_.sample(minions));
    };

    var gameModeEnabled = function (gameModeChance) {
      return Math.random() * 100 <= gameModeChance;
    };

    var enableAnEradicationModeTypes = function (ai) {
      while (
        !ai.eradicationModeSubCommanders &&
        !ai.eradicationModeFactories &&
        !ai.eradicationModeFabbers
      ) {
        ai.eradicationModeSubCommanders = gameModeEnabled(50);
        ai.eradicationModeFactories = gameModeEnabled(50);
        ai.eradicationModeFabbers = gameModeEnabled(50);
      }
    };

    var startCardAllyCompatibility = function (game) {
      // global for modder compatibility
      model.gwoStarCardsWhichBreakAllies = _.isArray(
        model.gwoStarCardsWhichBreakAllies
      )
        ? model.gwoStarCardsWhichBreakAllies
        : [];
      model.gwoStarCardsWhichBreakAllies.push(
        "nem_start_deepspace",
        "gwaio_start_tourist"
      );
      return _.some(model.gwoStarCardsWhichBreakAllies, function (card) {
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
      var difficultySettings = model.gwoDifficultySettings;
      var previousSettings = difficultySettings.previousSettings();
      var settingNames = _.keys(model.gwoDifficultySettings);
      _.pull(settingNames, "previousSettings");
      difficultySettings.personalityTags($("#gwo-personality-picker").val());
      _.forEach(settingNames, function (name, i) {
        previousSettings[i] = difficultySettings[name]();
      });
      difficultySettings.previousSettings.valueHasMutated();
    };

    var warGenerationAttempts = 0;

    var warGenerationFailure = function () {
      model.makeGameBusy(false);
      enableGoToWar(true);
      if (warGenerationAttempts < 5) {
        model.newGameSeed(Math.floor(Math.random() * 1000000).toString());
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
          loaded.then(function () {
            var card = _.find(processedStartCards, { id: params.id });
            if (!card) {
              console.error("No matching start card ID found");
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
          });
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

        var setAIPersonality = function (ai, difficulty) {
          var personalityId = "#gwo-personality-picker";
          var personality = ai.personality;

          personality.micro_type = difficulty.microType();
          personality.go_for_the_kill = parseBoolean(difficulty.goForKill());
          personality.priority_scout_metal_spots = parseBoolean(
            difficulty.priorityScoutMetalSpots()
          );
          personality.factory_build_delay_min =
            difficulty.factoryBuildDelayMin();
          personality.factory_build_delay_max =
            difficulty.factoryBuildDelayMax();
          personality.unable_to_expand_delay = difficulty.unableToExpandDelay();
          personality.enable_commander_danger_responses = parseBoolean(
            difficulty.enableCommanderDangerResponses()
          );
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
                personality.personality_tags.concat(
                  getQuellerAITag(ai.faction)
                );
              break;
            case "Titans":
              personality.personality_tags =
                personality.personality_tags.concat(titansAITags);
              break;
            default:
              throw new Error("Undefined AI type: " + difficulty.ai());
          }
        };

        // replicates the functionality of model.makeGame() but
        // only generates the galaxy once the player clicks Go To War
        model.navToNewGame = function () {
          if (!model.ready()) {
            return;
          }

          enableGoToWar(false);
          var warGenerationFailed = false;
          warGenerationAttempts++;

          var busyToken = {};
          model.makeGameBusy(busyToken);

          var version = "6.1.0";
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

          var dealStartCard = buildGalaxy.then(function (galaxy) {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            return gwoDealStartCard({
              id: startCard.id(),
              inventory: game.inventory(),
              galaxy: galaxy,
              star: galaxy.stars()[galaxy.origin()],
            }).then(function (startCardProduct) {
              game
                .inventory()
                .cards.push(startCardProduct || { id: startCard.id() });
            });
          });

          var moveIn = dealStartCard.then(function () {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }
            var galaxy = game.galaxy();
            game.move(galaxy.origin());
            var star = galaxy.stars()[game.currentStar()];
            star.explored(true);
            game.gameState(GW.Game.gameStates.active);
          });

          var populate = moveIn.then(function () {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            // Scatter some AIs
            aiFactions = _.shuffle(aiFactions);
            var teams = _.map(aiFactions, GWTeams.getTeam);
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

            return GWBreeder.populate({
              galaxy: game.galaxy(),
              teams: teams,
              neutralStars: neutralStars,
              orderedSpawn: false,
              spawn: function () {},
              canSpread: _.constant(true),
              spread: function (star, ai) {
                var team = teams[ai.team];
                // GWTeams.makeWorker() replaced to allow use of _.cloneDeep()
                // to preserve personality_tags
                var makeWorker = function () {
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
                return makeWorker().then(function () {
                  if (team.workers) {
                    _.remove(team.workers, { name: ai.name });
                  }
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

            // Set up the AI
            _.forEach(teamInfo, function (info) {
              var boss = info.boss;

              if (!boss) {
                console.warn(
                  "No AI boss found for faction " +
                    info.faction +
                    ", terminating war generation"
                );
                warGenerationFailed = true;
                return;
              }

              var difficulty = model.gwoDifficultySettings;
              var econBase = Number.parseFloat(difficulty.econBase());
              var econRatePerDist = Number.parseFloat(
                difficulty.econRatePerDist()
              );

              // Set up boss system
              setAIPersonality(boss, difficulty);
              boss.econ_rate = aiEconRate(econBase, econRatePerDist, maxDist);
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
              var minions = GWFactions[info.faction].minions;
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
                  var minion = selectMinion(minions, clusterType);
                  setAIPersonality(minion, difficulty);
                  minion.econ_rate = aiEconRate(
                    econBase,
                    econRatePerDist,
                    maxDist,
                    numMinions
                  );
                  if (boss.isCluster === true) {
                    minion.commanderCount = numMinions;
                  }
                  boss.minions.push(minion);
                });
              }

              // Set up non-boss AI system
              _.forEach(info.workers, function (worker) {
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

                setAIPersonality(ai, difficulty);
                ai.econ_rate = aiEconRate(
                  econBase,
                  econRatePerDist,
                  dist,
                  numMinions
                );

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
                      var minion = selectMinion(minions, clusterType);
                      setAIPersonality(minion, difficulty);
                      minion.econ_rate = aiEconRate(
                        econBase,
                        econRatePerDist,
                        dist,
                        numMinions
                      );
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
                    var foeFaction = availableFactions.splice(0, 1);
                    var foeCommander = selectMinion(
                      GWFactions[foeFaction].minions
                    );
                    foeCommander.faction = Number.parseInt(foeFaction);
                    setAIPersonality(foeCommander, difficulty);
                    foeCommander.econ_rate = aiEconRate(
                      econBase,
                      econRatePerDist,
                      dist,
                      numMinions
                    );
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
                var startCardBreaksAllies = startCardAllyCompatibility(game);

                if (
                  !startCardBreaksAllies &&
                  gameModeEnabled(difficulty.alliedCommanderChance())
                ) {
                  var playerFaction = model.playerFactionIndex();
                  var allyCommander = selectMinion(
                    GWFactions[playerFaction].minions
                  );
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
                _.forEach(star.system().planets, function (planet) {
                  planet.generator.shuffleLandingZones = true;
                  // Set up Foundation planets
                  if (
                    sharedSystemsForGalacticWarActive === false &&
                    ai.faction === 1 &&
                    !ai.boss
                  ) {
                    planet.generator.waterHeight = 50;
                  }
                });

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
                    var econBase = Number.parseFloat(difficulty.econBase());
                    var econRatePerDist = Number.parseFloat(
                      difficulty.econRatePerDist()
                    );
                    ai.econ_rate = aiEconRate(
                      econBase,
                      econRatePerDist,
                      maxDist
                    );
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
                      function (card) {
                        return (
                          !GW.bank.hasStartCard(card) &&
                          !gwoBank.hasStartCard(card)
                        );
                      }
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
          });

          var warInfo = finishAis.then(function () {
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
          });

          var finishSetup = warInfo.then(function () {
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
          });

          finishSetup.then(function () {
            if (warGenerationFailed === true) {
              warGenerationFailure();
              return;
            }

            saveDifficultySettings();

            var save = GW.manifest.saveGame(model.newGame());
            model.activeGameId(model.newGame().id);
            save.then(function () {
              model.lastSceneUrl(
                "coui://ui/main/game/galactic_war/gw_start/gw_start.html"
              );
              window.location.href =
                "coui://ui/main/game/galactic_war/gw_play/gw_play.html";
            });
          });
        };
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoSetup();
