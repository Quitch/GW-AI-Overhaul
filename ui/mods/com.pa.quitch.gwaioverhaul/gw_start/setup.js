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
        ai: ko.observable(0).extend({ numeric: 0 }),
        paLore: ko.observable(true).extend({ local: "gwaio_lore_enabled" }),
        customDifficulty: ko.observable(false),
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
      };

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

      var gameDifficultyLabelId = "#game-difficulty-label";
      $(gameDifficultyLabelId).before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_dropdown.html"
        )
      );

      $(gameDifficultyLabelId).append(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels_tooltip.html"
        )
      );

      var gameDifficultyId = "#game-difficulty";
      $(gameDifficultyId).replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.html"
        )
      );
      locTree($(gameDifficultyId));

      $(gameDifficultyId).after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_options.html"
        )
      );
      locTree($("#difficulty-options"));
      locTree($("#custom-difficulty-settings"));
      // Because PA Inc wants to avoid escaping characters in HTML
      model.gwaioFactionScalingTooltip =
        "!LOC:The number of enemy factions is adjusted for the galaxy's size.";

      // We change how we monitor model.ready() to prevent
      // Shared Systems for Galactic War breaking our new lobby
      var enableGoToWar = ko.observable(true);
      model.ready = ko.computed(function () {
        return enableGoToWar() && !!model.activeStartCard();
      });
      api.mods.getMounted("client", true).then(function (mods) {
        var modMounted = function (modIdentifier) {
          return _.some(mods, { identifier: modIdentifier });
        };
        // Shared Systems for Galactic War
        if (modMounted("com.wondible.pa.gw_shared_systems")) {
          model.selectedNames.subscribe(function (names) {
            if (_.isEmpty(names)) {
              enableGoToWar(false);
            } else {
              enableGoToWar(true);
            }
          });
          // Remove System Scaling feature as this mod can't use it
          $("#system-scaling").remove();
          model.gwaioDifficultySettings.systemScaling(false);
        }
      });

      // Prevent changes to settings creating new galaxies
      model.makeGame = function () {
        //empty
      };

      requireGW(
        [
          "require",
          "shared/gw_common",
          "shared/gw_factions",
          "pages/gw_start/gw_breeder",
          "pages/gw_start/gw_teams",
          "main/shared/js/star_system_templates",
          "main/game/galactic_war/shared/js/gw_easy_star_systems",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        ],
        function (
          require,
          GW,
          GWFactions,
          GWBreeder,
          GWTeams,
          normalSystemTemplates, // window.star_system_templates is set instead
          easySystemTemplates,
          gwaioTech,
          gwaioBank,
          gwaioLore,
          gwaioDifficulty,
          gwaioAI
        ) {
          var selectedDifficulty = 0;

          // Track difficulty settings so GW-CUSTOM fields appear and display correct values
          ko.computed(function () {
            selectedDifficulty = model.newGameDifficultyIndex();

            if (
              gwaioDifficulty.difficulties[selectedDifficulty].customDifficulty
            ) {
              model.gwaioDifficultySettings.customDifficulty(true);
            } else {
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
          });

          if (!model.gwaioNewStartCards) {
            model.gwaioNewStartCards = [];
          }
          model.gwaioNewStartCards.push(
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
          var startingCards = [
            { id: "gwc_start_vehicle" },
            { id: "gwc_start_air" },
            { id: "gwc_start_orbital" },
            { id: "gwc_start_bot" },
          ];
          var lockedBaseCards = [
            { id: "gwc_start_artillery" },
            { id: "gwc_start_subcdr" },
            { id: "gwc_start_combatcdr" },
            { id: "gwc_start_allfactory" },
            { id: "gwc_start_storage" },
          ];
          var allCards = startingCards.concat(
            lockedBaseCards,
            model.gwaioNewStartCards
          );
          // Determine which start cards are available and which are locked
          var startCards = _.map(allCards, function (cardData) {
            if (
              _.includes(startingCards, cardData) ||
              GW.bank.hasStartCard(cardData) ||
              gwaioBank.hasStartCard(cardData)
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
            require(["cards/" + card.id], function (cardFile) {
              cardFile.id = card.id;
              processedStartCards[card.id] = cardFile;
              --loadCount;
              if (loadCount === 0) {
                loaded.resolve();
              }
            });
          });

          // replicates the functionality of model.makeGame() but
          // only generates the galaxy once the player clicks Go To War
          model.navToNewGame = function () {
            if (!model.ready()) {
              return;
            }
            enableGoToWar(false);

            var busyToken = {};
            model.makeGameBusy(busyToken);

            var version = "5.x.x-dev";
            console.log("War created using Galactic War Overhaul v" + version);

            var game = new GW.Game();

            game.name(model.newGameName());
            game.mode(model.mode());
            game.hardcore(model.newGameHardcore());
            game.content(api.content.activeContent());

            selectedDifficulty = model.newGameDifficultyIndex();

            var useEasySystems =
              gwaioDifficulty.difficulties[selectedDifficulty]
                .useEasierSystemTemplate;
            var systemTemplates = useEasySystems
              ? easySystemTemplates
              : star_system_templates;
            var sizes = GW.balance.numberOfSystems;
            var size = sizes[model.newGameSizeIndex()] || 40;

            var aiFactions = _.range(GWFactions.length);
            aiFactions.splice(model.playerFactionIndex(), 1);
            if (model.gwaioDifficultySettings.factionScaling()) {
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

              var gwaioDealStartCard = function (params) {
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
              if (model.gwaioDifficultySettings.easierStart()) {
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

                  // GWTeams.makeWorker() replaced because Penchant needs
                  // _.cloneDeep() to preserve personality_tags
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

              var setAIData = function (
                ai,
                distance,
                isBoss,
                faction,
                minionCount
              ) {
                if (ai.faction === undefined) {
                  ai.faction = faction;
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
                ) {
                  ai.personality.starting_location_evaluation_radius =
                    model.gwaioDifficultySettings.startingLocationEvaluationRadius();
                }

                var econBase = model.gwaioDifficultySettings.econBase();
                var econRatePerDist =
                  model.gwaioDifficultySettings.econRatePerDist();
                ai.econ_rate = aiEconRate(
                  econBase,
                  econRatePerDist,
                  distance,
                  minionCount
                );
                if (isBoss) {
                  ai.bossCommanders =
                    model.gwaioDifficultySettings.bossCommanders();
                }

                // Penchant AI
                if (model.gwaioDifficultySettings.ai() === 2) {
                  var penchantValues = gwaioAI.penchants();
                  ai.personality.personality_tags =
                    ai.personality.personality_tags.concat(
                      penchantValues.penchants
                    );
                  ai.penchantName = penchantValues.penchantName;
                }
              };

              var selectAIBuffs = function (numberBuffs) {
                var buffType = [0, 1, 2, 3, 4, 6]; // 0 = cost; 1 = damage; 2 = health; 3 = speed; 4 = build; 6 = combat
                return _.sample(buffType, numberBuffs);
              };

              var setupAIBuffs = function (distance, buffDistanceDelay) {
                var numberBuffs = Math.floor(distance / 2 - buffDistanceDelay);
                return selectAIBuffs(numberBuffs);
              };

              var aiTech = function (buffs, inventory, faction, tech) {
                var inventoryCopy = inventory;
                _.times(buffs.length, function (n) {
                  inventoryCopy = inventoryCopy.concat(tech[faction][buffs[n]]);
                });
                return inventoryCopy;
              };

              var countMinions = function (minionBase, minionStep, distance) {
                return Math.floor(minionBase + distance * minionStep);
              };

              var selectMinion = function (minions, clusterName) {
                if (clusterName) {
                  return _.cloneDeep(
                    _.sample(
                      _.filter(minions, {
                        name: clusterName,
                      })
                    )
                  );
                } else {
                  return _.cloneDeep(_.sample(minions));
                }
              };

              var setupMinions = function (
                factionMinions,
                minionCount,
                clusterName,
                faction,
                distance
              ) {
                var armies = minionCount;
                var minions = [];

                if (clusterName) {
                  armies = 1;
                }

                _.times(armies, function () {
                  var minion = selectMinion(factionMinions, name);
                  setAIData(minion, distance, false, faction, minionCount);
                  if (clusterName) {
                    minion.commanderCount = minionCount;
                  }
                  minions.push(minion);
                });

                return minions;
              };

              var gameModeEnabled = function (gameModeChance) {
                if (Math.random() * 100 <= gameModeChance) {
                  return true;
                }
                return false;
              };

              _.forEach(teamInfo, function (info) {
                var factionTechHandicap =
                  model.gwaioDifficultySettings.factionTechHandicap();

                var numMinions = 0;
                var mandatoryMinions =
                  model.gwaioDifficultySettings.mandatoryMinions();
                var minionMod = model.gwaioDifficultySettings.minionMod();
                var minions = GWFactions[info.faction].minions;

                // Setup boss system
                setAIData(info.boss, maxDist, true);

                info.boss.inventory = [];
                // Setup Cluster commanders
                if (info.boss.isCluster === true) {
                  info.boss.inventory = gwaioTech.clusterCommanders;
                }

                // Setup boss AI Buffs
                var bossBuffs = setupAIBuffs(maxDist, factionTechHandicap);
                info.boss.typeOfBuffs = bossBuffs; // for intelligence reports
                info.boss.inventory = aiTech(
                  bossBuffs,
                  info.boss.inventory,
                  info.boss.faction,
                  gwaioTech.factionTechs
                );

                // Setup boss minions
                numMinions = countMinions(mandatoryMinions, minionMod, maxDist);
                if (numMinions > 0) {
                  var minionName;
                  if (info.boss.isCluster === true) {
                    minionName = "Security";
                  }
                  info.boss.minions = setupMinions(
                    minions,
                    numMinions,
                    minionName,
                    info.boss.faction,
                    maxDist
                  );
                }

                // Setup non-boss AI system
                _.forEach(info.workers, function (worker) {
                  // Determine game modes in use for this system
                  worker.ai.landAnywhere = gameModeEnabled(
                    model.gwaioDifficultySettings.landAnywhereChance()
                  );
                  worker.ai.suddenDeath = gameModeEnabled(
                    model.gwaioDifficultySettings.suddenDeathChance()
                  );
                  worker.ai.bountyMode = gameModeEnabled(
                    model.gwaioDifficultySettings.bountyModeChance()
                  );
                  worker.ai.bountyModeValue =
                    model.gwaioDifficultySettings.bountyModeValue();

                  var dist = worker.star.distance();

                  numMinions = countMinions(mandatoryMinions, dist, minionMod);

                  setAIData(worker.ai, dist, false, _, numMinions);

                  worker.ai.inventory = [];
                  // Setup Cluster commanders
                  if (worker.ai.isCluster === true) {
                    worker.ai.inventory = gwaioTech.clusterCommanders;
                  }

                  // Setup non-boss AI buffs
                  var workerBuffs = setupAIBuffs(dist, factionTechHandicap);
                  worker.ai.typeOfBuffs = workerBuffs; // for intelligence reports
                  worker.ai.inventory = aiTech(
                    workerBuffs,
                    worker.ai.inventory,
                    worker.ai.faction,
                    gwaioTech.factionTechs
                  );

                  if (worker.ai.name === "Worker") {
                    console.log(worker.ai.name);
                    console.log("Minion count:", numMinions);
                  }

                  // Setup non-boss minions
                  if (numMinions > 0) {
                    worker.ai.minions = [];

                    var name;
                    var totalMinions = numMinions;
                    if (worker.ai.isCluster === true) {
                      name = worker.ai.name;
                      totalMinions =
                        numMinions +
                        Math.floor(
                          model.gwaioDifficultySettings.bossCommanders() / 2
                        );
                      console.log("Total minions:", totalMinions);
                    }

                    // Workers have additional commanders not minions
                    if (name === "Worker") {
                      worker.ai.commanderCount = totalMinions;
                    } else {
                      worker.ai.minions = setupMinions(
                        minions,
                        totalMinions,
                        name,
                        worker.ai.faction,
                        dist
                      );
                    }
                  }

                  // Setup additional factions for FFA
                  var availableFactions = _.without(
                    aiFactions,
                    worker.ai.faction
                  );
                  _.times(availableFactions.length, function () {
                    if (
                      gameModeEnabled(model.gwaioDifficultySettings.ffaChance())
                    ) {
                      if (worker.ai.foes === undefined) {
                        worker.ai.foes = [];
                      }
                      availableFactions = _.shuffle(availableFactions);
                      var foeFaction = availableFactions.splice(0, 1);
                      var foeCommander = _.cloneDeep(
                        _.sample(GWFactions[foeFaction].minions)
                      );
                      var numFoes = Math.round((numMinions + 1) / 2);

                      // Cluster Workers get additional commanders
                      if (foeCommander.name === "Worker") {
                        numFoes += Math.floor(
                          model.gwaioDifficultySettings.bossCommanders() / 2
                        );
                      }
                      foeCommander.commanderCount = numFoes;
                      foeCommander.inventory = [];

                      // Setup Cluster commanders
                      if (foeCommander.isCluster === true) {
                        foeCommander.inventory = gwaioTech.clusterCommanders;
                      }

                      setAIData(foeCommander, dist, false, foeFaction);

                      // Setup additional faction AI buffs
                      foeCommander.inventory = aiTech(
                        workerBuffs,
                        foeCommander.inventory,
                        foeFaction,
                        gwaioTech.factionTechs
                      );

                      worker.ai.foes.push(foeCommander);
                    }
                  });
                });
              });

              var treasurePlanetSetup = false;
              var loreEntry = 0;
              var optionalLoreEntry = 0;
              var treasureCards = lockedBaseCards.concat(
                model.gwaioNewStartCards
              );
              _.forEach(game.galaxy().stars(), function (star) {
                var ai = star.ai();
                var system = star.system();
                if (!ai) {
                  // Add some lore to neutral systems
                  if (gwaioLore.neutralSystems[loreEntry]) {
                    system.name = gwaioLore.neutralSystems[loreEntry].name;
                    system.description =
                      gwaioLore.neutralSystems[loreEntry].description;
                    loreEntry += 1;
                  }
                } else {
                  _.forEach(star.system().planets, function (planet) {
                    planet.generator.shuffleLandingZones = true;
                  });
                  if (!ai.bossCommanders) {
                    // Setup The Guardians' treasure planet
                    if (treasurePlanetSetup === false) {
                      treasurePlanetSetup = true;
                      delete ai.commanderCount;
                      delete ai.minions;
                      delete ai.foes;
                      delete ai.team;
                      delete ai.penchantName;
                      ai.icon =
                        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png";
                      ai.boss = true; // otherwise it won't display its icon
                      ai.mirrorMode = true;
                      ai.treasurePlanet = true;
                      ai.econ_rate = aiEconRate(
                        model.gwaioDifficultySettings.econBase(),
                        model.gwaioDifficultySettings.econRatePerDist(),
                        maxDist
                      );
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
                      var lockedStartCards = _.filter(
                        treasureCards,
                        function (card) {
                          return (
                            !GW.bank.hasStartCard(card) &&
                            !gwaioBank.hasStartCard(card)
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
                      model.gwaioDifficultySettings.paLore() &&
                      gwaioLore.aiSystems[optionalLoreEntry]
                    ) {
                      // Add lore to systems
                      system.description =
                        gwaioLore.aiSystems[optionalLoreEntry];
                      optionalLoreEntry += 1;
                    }
                  }
                }
              });
            });

            var warInfo = finishAis.then(function () {
              // Hacky way to store war information for GWO Panel
              var galaxy = game.galaxy();
              var originSystem = galaxy.stars()[galaxy.origin()].system();
              originSystem.gwaio = {};
              originSystem.gwaio.version = version;
              originSystem.gwaio.difficulty =
                gwaioDifficulty.difficulties[selectedDifficulty].difficultyName;
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
              if (model.gwaioDifficultySettings.ai() === 1) {
                originSystem.gwaio.ai = "Queller";
              } else if (model.gwaioDifficultySettings.ai() === 2) {
                originSystem.gwaio.ai = "Penchant";
              } else {
                originSystem.gwaio.ai = "Titans";
              }
              originSystem.gwaio.aiMods = [];
              // We don't need to apply the hotfix as it's for v5.17.1 and earlier
              originSystem.treasurePlanetFixed = true;
            });

            var finishSetup = warInfo.then(function () {
              if (model.makeGameBusy() !== busyToken) {
                return null;
              }

              model.makeGameBusy(false);
              model.newGame(game);
              model.updateCommander();
              return game;
            });

            // the original model.navToNewGame()
            finishSetup.then(function () {
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
  gwaioSetup();
}
