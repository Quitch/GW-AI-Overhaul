var gwoSetupLoaded;

if (!gwoSetupLoaded) {
  gwoSetupLoaded = true;

  function gwoSetup() {
    try {
      model.makeGame = function () {
        // Prevent changes to settings causing creation of new galaxies
      };

      // We change how we monitor model.ready() to prevent
      // Shared Systems for Galactic War breaking our new lobby
      var enableGoToWar = ko.observable(true);
      var sharedSystemsForGalacticWarActive = false;
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
          $("#system-scaling").remove();
          model.gwoDifficultySettings.systemScaling(false);
          $("#gwo-system-size").remove();
          model.gwoDifficultySettings.simpleSystems(false);
        }
      });

      requireGW(
        [
          "shared/gw_common",
          "shared/gw_factions",
          "pages/gw_start/gw_breeder",
          "pages/gw_start/gw_teams",
          "main/shared/js/star_system_templates",
          "main/game/galactic_war/shared/js/gw_easy_star_systems",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cluster.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/tech.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
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
          gwoAI
        ) {
          if (!model.gwoNewStartCards) {
            model.gwoNewStartCards = [];
          }
          model.gwoNewStartCards.push(
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
          if (!model.gwoStartingCards) {
            model.gwoStartingCards = [];
          }
          model.gwoStartingCards.push(
            { id: "gwc_start_vehicle" },
            { id: "gwc_start_air" },
            { id: "gwc_start_orbital" },
            { id: "gwc_start_bot" }
          );
          var lockedBaseCards = [
            { id: "gwc_start_artillery" },
            { id: "gwc_start_subcdr" },
            { id: "gwc_start_combatcdr" },
            { id: "gwc_start_allfactory" },
            { id: "gwc_start_storage" },
          ];
          var allCards = model.gwoStartingCards.concat(
            lockedBaseCards,
            model.gwoNewStartCards
          );
          var startCards = _.map(allCards, function (cardData) {
            if (
              _.includes(model.gwoStartingCards, cardData) ||
              GW.bank.hasStartCard(cardData) ||
              gwoBank.hasStartCard(cardData)
            ) {
              return model.makeKnown(cardData);
            } else {
              return model.makeUnknown(cardData);
            }
          });
          model.startCards(startCards);

          var processedStartCards = {};
          var loadCount = allCards.length;
          var loaded = $.Deferred();
          _.forEach(allCards, function (card) {
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
              if (_.isUndefined(card)) {
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

          var randomPercentageAdjustment = function (min, max) {
            return Math.random() * (max - min) + min;
          };

          var aiEcoMinionReduction = function (eco, ecoStep, minions) {
            return eco - minions * ecoStep;
          };

          var aiEconRate = function (ecoBase, ecoStep, distance, minions) {
            var eco =
              (ecoBase + distance * ecoStep) *
              randomPercentageAdjustment(0.9, 1.1);
            if (minions) {
              eco = aiEcoMinionReduction(eco, ecoStep, minions);
            }
            return eco;
          };

          var aiFaction = 0;
          var getQuellerAITag = function (faction) {
            // Minions don't have a faction number so use the previous one
            // which should be from the primary AI and accurate
            if (!_.isUndefined(faction)) {
              aiFaction = parseInt(faction);
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
            }
          };

          var titansAITags = ["Default", "GalacticWar"];

          var setupPenchantAI = function (ai) {
            var penchantValues = gwoAI.penchants();
            ai.personality.personality_tags =
              ai.personality.personality_tags.concat(
                penchantValues.penchants,
                titansAITags
              );
            ai.penchantName = penchantValues.penchantName;
          };

          var parseBoolean = function (string) {
            return string === "true";
          };

          var personalityId = "#gwo-personality-picker";

          var setAIPersonality = function (ai, difficulty) {
            ai.personality.micro_type = difficulty.microType();
            ai.personality.go_for_the_kill = parseBoolean(
              difficulty.goForKill()
            );
            ai.personality.priority_scout_metal_spots = parseBoolean(
              difficulty.priorityScoutMetalSpots()
            );
            ai.personality.factory_build_delay_min =
              difficulty.factoryBuildDelayMin();
            ai.personality.factory_build_delay_max =
              difficulty.factoryBuildDelayMax();
            ai.personality.unable_to_expand_delay =
              difficulty.unableToExpandDelay();
            ai.personality.enable_commander_danger_responses = parseBoolean(
              difficulty.enableCommanderDangerResponses()
            );
            ai.personality.per_expansion_delay = difficulty.perExpansionDelay();
            ai.personality.max_basic_fabbers = difficulty.maxBasicFabbers();
            ai.personality.max_advanced_fabbers =
              difficulty.maxAdvancedFabbers();
            ai.personality.personality_tags =
              $(personalityId).val() === null ? [] : $(personalityId).val();
            // We treat 0 as undefined, which means the AI examines the
            // radius of the spawn zone
            if (difficulty.startingLocationEvaluationRadius() > 0) {
              ai.personality.starting_location_evaluation_radius =
                difficulty.startingLocationEvaluationRadius();
            }

            switch (difficulty.ai()) {
              case "Queller":
                ai.personality.personality_tags =
                  ai.personality.personality_tags.concat(
                    getQuellerAITag(ai.faction)
                  );
                break;
              case "Penchant":
                setupPenchantAI(ai);
                break;
              case "Titans":
                ai.personality.personality_tags =
                  ai.personality.personality_tags.concat(titansAITags);
            }
          };

          var selectAIBuffs = function (numberOfBuffs) {
            var buffType = [0, 1, 2, 3, 4, 6]; // 0 = cost; 1 = damage; 2 = health; 3 = speed; 4 = build; 6 = combat
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
            // Cluster
            if (minionName === "Worker" || minionName === "Security") {
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

          var startCardAllyCompatibility = function (game) {
            if (!model.gwoStarCardsWhichBreakAllies) {
              model.gwoStarCardsWhichBreakAllies = [];
            }
            model.gwoStarCardsWhichBreakAllies.push("nem_start_deepspace");
            return _.some(model.gwoStarCardsWhichBreakAllies, function (card) {
              return card === game.inventory().cards()[0].id;
            });
          };

          var setupQuellerFFATag = function (ais) {
            if (_.isUndefined(ais)) {
              return;
            }

            if (_.isArray(ais)) {
              _.forEach(ais, function (ai) {
                ai.personality.personality_tags.push("ffa");
              });
            } else if (ais) {
              ais.personality.personality_tags.push("ffa");
            }
          };

          var saveDifficultySettings = function () {
            var difficultySettings = model.gwoDifficultySettings;
            var previousSettings = difficultySettings.previousSettings();
            var settingNames = _.keys(model.gwoDifficultySettings);
            _.pull(settingNames, "previousSettings");
            difficultySettings.personalityTags($(personalityId).val());
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

            var version = "5.50.0";
            console.log("War created using Galactic War Overhaul v" + version);

            var game = new GW.Game();
            game.name(model.newGameName());
            game.mode(model.mode());
            game.hardcore(model.newGameHardcore());
            game.content(api.content.activeContent());

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
              if (model.makeGameBusy() !== busyToken) {
                return null;
              }

              return gwoDealStartCard({
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
                return null;
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
                spawn: function () {
                  //empty
                },
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
                var econBase = parseFloat(difficulty.econBase());
                var econRatePerDist = parseFloat(difficulty.econRatePerDist());

                // Set up boss system
                setAIPersonality(boss, difficulty);
                boss.econ_rate = aiEconRate(econBase, econRatePerDist, maxDist);
                var bossCommanders = difficulty.bossCommanders();
                boss.bossCommanders = bossCommanders;

                boss.inventory = [];

                if (boss.isCluster === true) {
                  boss.inventory = gwoCluster.clusterCommanders;
                }

                var factionTechHandicap = parseFloat(
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

                var mandatoryMinions = difficulty.mandatoryMinions();
                var minionMod = parseFloat(difficulty.minionMod());
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
                  ai.bountyMode = gameModeEnabled(
                    difficulty.bountyModeChance()
                  );
                  ai.bountyModeValue = parseFloat(difficulty.bountyModeValue());

                  var dist = worker.star.distance();

                  numMinions = countMinions(mandatoryMinions, dist, minionMod);

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
                      if (_.isUndefined(ai.foes)) {
                        ai.foes = [];
                      }

                      availableFactions = _.shuffle(availableFactions);
                      var foeFaction = availableFactions.splice(0, 1);
                      var foeCommander = selectMinion(
                        GWFactions[foeFaction].minions
                      );
                      foeCommander.faction = parseInt(foeFaction);
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
                    if (difficulty.ai() === "Penchant") {
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
              var treasureCards = lockedBaseCards.concat(
                model.gwoNewStartCards
              );
              _.forEach(game.galaxy().stars(), function (star) {
                var ai = star.ai();
                var system = star.system();
                if (!ai) {
                  // Add some lore to neutral systems
                  if (gwoLore.neutralSystems[loreEntry]) {
                    system.name = gwoLore.neutralSystems[loreEntry].name;
                    system.description =
                      gwoLore.neutralSystems[loreEntry].description;
                    loreEntry += 1;
                  }
                } else {
                  _.forEach(star.system().planets, function (planet) {
                    planet.generator.shuffleLandingZones = true;
                    // Set up Foundation planets
                    if (
                      sharedSystemsForGalacticWarActive === false &&
                      ai.faction === 1 &&
                      ai.boss !== true
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
                      var econBase = parseFloat(difficulty.econBase());
                      var econRatePerDist = parseFloat(
                        difficulty.econRatePerDist()
                      );
                      ai.econ_rate = aiEconRate(
                        econBase,
                        econRatePerDist,
                        maxDist
                      );
                      ai.bossCommanders = difficulty.bossCommanders();
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
              originSystem.gwaio.galaxySize = [
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
              ][model.newGameSizeIndex()];
              originSystem.gwaio.factionScaling =
                model.gwoDifficultySettings.factionScaling();
              originSystem.gwaio.systemScaling =
                model.gwoDifficultySettings.systemScaling();
              originSystem.gwaio.simpleSystems =
                model.gwoDifficultySettings.simpleSystems();
              originSystem.gwaio.easierStart =
                model.gwoDifficultySettings.easierStart();
              if (model.devMode() === true) {
                originSystem.gwaio.cheatsUsed = true;
              }
              originSystem.gwaio.ai = model.gwoDifficultySettings.ai();
              originSystem.gwaio.aiMods = [];
              originSystem.gwaio.techCardDeck =
                model.gwoDifficultySettings.techCardDeck();
              // We don't need to apply the hotfix as it's for v5.17.1 and earlier
              originSystem.gwaio.treasurePlanetFixed = true;
            });

            var finishSetup = warInfo.then(function () {
              if (
                model.makeGameBusy() !== busyToken ||
                warGenerationFailed === true
              ) {
                return null;
              }

              model.makeGameBusy(false);
              model.newGame(game);
              model.updateCommander();
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
}
