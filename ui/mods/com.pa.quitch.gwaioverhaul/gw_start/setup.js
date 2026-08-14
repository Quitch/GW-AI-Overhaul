var gwoSetupLoaded;

function gwoSetup() {
  if (gwoSetupLoaded) {
    return;
  }

  gwoSetupLoaded = true;

  try {
    var cardId = function (card) {
      return card && card.id ? card.id() : undefined;
    };

    // Closure vars, not per-card properties, so the model.gwo* functions below
    // are bindable before the requireGW call sets these.
    var gwoFavourites;
    var gwoFavouriteLoadouts;

    model.gwoIsFavourite = function (card) {
      return !!gwoFavourites && gwoFavourites.has(cardId(card));
    };

    model.gwoToggleFavourite = function (card) {
      if (!gwoFavourites) {
        return;
      }

      var activeCard = model.activeStartCard();
      var activeId = activeCard && cardId(activeCard);

      gwoFavourites.toggle(cardId(card));

      model.startCards(
        gwoFavouriteLoadouts.sortCardsByFavourite(
          model.startCards(),
          gwoFavourites.ids(),
          cardId
        )
      );

      // Reordering moves the active card, so reselect by id, not stale index.
      if (activeId) {
        var newIndex = _.findIndex(model.startCards(), function (c) {
          return cardId(c) === activeId;
        });
        if (newIndex !== -1) {
          model.activeStartCardIndex(newIndex);
        }
      }
    };

    // Injected before ko.applyBindings runs (gw_start.js calls loadMods first),
    // so foreach clones it per unlocked loadout. .card_locked is excluded.
    $("#start-cards .card").prepend(
      '<div class="gwo-favourite-btn" data-bind="' +
        "click: function () { model.gwoToggleFavourite($data); }, " +
        "clickBubble: false, " +
        "css: { on: model.gwoIsFavourite($data) }, " +
        "click_sound: 'default', rollover_sound: 'default', " +
        "tooltip: '!LOC:Toggle Favourite'" +
        '"></div>'
    );

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
      if (modMounted("com.wondible.pa.gw_shared_systems")) {
        sharedSystemsForGalacticWarActive = true;
        model.selectedNames.subscribe(onSelectedNamesChanged);
      }
    };

    // Held so the galaxy build can wait on it - nothing stops the player
    // clicking Go To War before this resolves.
    var modsMounted = api.mods.getMounted("client", true).then(onModsMounted);

    var foundationFaction = 1;

    var saveDifficultySettings = function () {
      var settings = model.gwoDifficultySettings;

      // The personality picker has no data-bind, so its value only reaches the
      // snapshot if pushed back here. Write once at save time, not per AI.
      var pickedTags = $("#gwo-personality-picker").val() || [];
      if (!_.isEqual(pickedTags, settings.personalityTags())) {
        settings.personalityTags(pickedTags);
      }

      var settingNames = _.keys(settings);
      _.pull(settingNames, "previousSettings");
      var snapshot = {};
      _.forEach(settingNames, function (name) {
        snapshot[name] = settings[name]();
      });
      settings.previousSettings(snapshot);
    };

    var warGenerationAttempts = 0;
    // The seed the player actually asked for, captured on the first attempt of a run.
    var warGenerationBaseSeed;

    var warGenerationFailure = function () {
      model.makeGameBusy(false);
      enableGoToWar(true);
      if (warGenerationAttempts < 5) {
        // Derived, not re-rolled, so an entered seed reproduces the whole retry chain.
        model.newGameSeed(warGenerationBaseSeed + "-" + warGenerationAttempts);
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
      var sizeName = loc(galaxySizeNames[sizeIndex] || "!LOC:Unknown");
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/gwo_breeder.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/gwo_teams.js",
        "main/shared/js/star_system_templates",
        "main/game/galactic_war/shared/js/gw_easy_star_systems",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/conquest_setup.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_scaling.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourite_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourites.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_system_brackets.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_seed.js",
        "main/game/galactic_war/shared/js/systems/template-loader",
      ],
      function (
        GW,
        GWFactions,
        gwoBreeder,
        gwoTeams,
        normalSystemTemplates, // window.star_system_templates is set instead
        easySystemTemplates,
        gwoCluster,
        gwoTech,
        gwoLore,
        gwoDifficulty,
        gwoConquestSetup,
        gwoAI,
        gwoScaling,
        gwoCard,
        loadouts,
        gwoLoadoutBanks,
        favouriteLoadoutsModule,
        favouritesModule,
        gwoVersion,
        gwoSystemBrackets,
        gwoRng,
        gwoFactionSeed,
        chooseStarSystemTemplates
      ) {
        gwoFavouriteLoadouts = favouriteLoadoutsModule;
        gwoFavourites = favouritesModule;

        var rebuildStartCards = function () {
          model.startCards(
            gwoFavouriteLoadouts.sortCardsByFavourite(
              loadouts.startCards(),
              gwoFavourites.ids(),
              cardId
            )
          );
        };

        // Resolved before the list is built so a mod loadout the player has
        // earned shows as unlocked rather than as a locked hint.
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
          rebuildStartCards();
        });

        // Each mode shows its own victory badges, and a card view model
        // snapshots its icon at load - so a mode change rebuilds the list.
        // Deferred: ui.js creates gwoDifficultySettings after this script.
        _.defer(function () {
          var applyLoadoutIconMode = function (mode) {
            gwoCard.setLoadoutIconMode(mode);
            rebuildStartCards();
          };
          model.gwoDifficultySettings.warMode.subscribe(applyLoadoutIconMode);
          if (model.gwoDifficultySettings.warMode() !== "war") {
            applyLoadoutIconMode(model.gwoDifficultySettings.warMode());
          }
        });
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
              // Must reject, not fall through - see selectMinion's note on throws
              // inside jQuery deferred callbacks.
              result.reject("no matching start card ID: " + params.id);
              return;
            }
            var context =
              card.getContext &&
              card.getContext(params.galaxy, params.inventory);
            var deal = card.deal && card.deal(params.star, context);
            var product = { id: params.id };
            var cardParams = deal && deal.params;
            if (cardParams && _.isPlainObject(cardParams)) {
              _.assign(product, cardParams);
            }
            card.keep && card.keep(deal, context);
            card.releaseContext && card.releaseContext(context);
            result.resolve(product, deal);
          };

          loaded.then(onCardsLoaded);
          return result;
        };

        var selectMinion = function (rng, minions, faction, minionName) {
          var minion = gwoScaling.selectMinion(
            rng,
            minions,
            faction,
            minionName
          );
          if (_.isUndefined(minion)) {
            warGenerationFailed = true;
          }
          return minion;
        };

        // Omitting playerCount skips the minion-count reduction (e.g. a boss's
        // own rate).
        var aiEconRate = function (rng, distance, playerCount) {
          var difficulty = model.gwoDifficultySettings;
          return gwoScaling.econRate(rng, distance, {
            econBase: Number.parseFloat(difficulty.econBase()),
            econRatePerDist: Number.parseFloat(difficulty.econRatePerDist()),
            mandatoryMinions: difficulty.mandatoryMinions(),
            minionMod: Number.parseFloat(difficulty.minionMod()),
            playerCount: playerCount,
          });
        };

        var startCardAllyCompatibility = function (game) {
          // model.gwoStarCardsWhichBreakAllies is a modder-compatibility global
          // GWO never creates; the mod's loader has to.
          return gwoScaling.startCardBreaksAllies(
            game.inventory().cards()[0].id,
            model.gwoStarCardsWhichBreakAllies
          );
        };

        // The raw values applyPersonality consumes; also snapshotted onto
        // gwaio.conquest so the play scene can build AIs the same way.
        var personalitySettings = function () {
          var difficulty = model.gwoDifficultySettings;
          // Read only; saveDifficultySettings owns the write back.
          var pickedTags = $("#gwo-personality-picker").val();
          return {
            microType: difficulty.microType(),
            // .raw unwraps the stringBoolean extender, which reads back
            // "true"/"false" for the dropdowns. The AI personality contract
            // needs real booleans.
            goForKill: difficulty.goForKill.raw(),
            priorityScoutMetalSpots: difficulty.priorityScoutMetalSpots.raw(),
            factoryBuildDelayMin: difficulty.factoryBuildDelayMin(),
            factoryBuildDelayMax: difficulty.factoryBuildDelayMax(),
            unableToExpandDelay: difficulty.unableToExpandDelay(),
            enableCommanderDangerResponses:
              difficulty.enableCommanderDangerResponses.raw(),
            perExpansionDelay: difficulty.perExpansionDelay(),
            maxBasicFabbers: difficulty.maxBasicFabbers(),
            maxAdvancedFabbers: difficulty.maxAdvancedFabbers(),
            startingLocationEvaluationRadius:
              difficulty.startingLocationEvaluationRadius(),
            personalityTags: pickedTags === null ? [] : pickedTags,
          };
        };

        var setAIPersonality = function (rng, ai, difficulty, faction) {
          var applied = gwoScaling.applyPersonality(
            rng,
            ai,
            _.assign(personalitySettings(), {
              aiType: difficulty.ai(),
              faction: faction,
            }),
            gwoAI.penchants
          );
          if (!applied) {
            warGenerationFailed = true;
          }
        };

        // Must wrap, as stock's playerFaction computed does: gw_factions.js
        // appends Cluster only under Titans, so a stored index of 4 can be
        // restored into a session where it addresses nothing.
        var playerFactionIndex = function () {
          return model.playerFactionIndex() % GWFactions.length;
        };

        // Never rejects - every failure resolves undefined. Rejecting would spend
        // warGenerationFailure's retries on a condition no reseed can change.
        var loadSystemBrackets = function () {
          var ready = $.Deferred();

          var withoutBrackets = function () {
            ready.resolve(undefined);
          };

          var onSystemsLoaded = function () {
            // $.when hands back one array per source.
            var built = gwoSystemBrackets.bracketsFrom(
              _.flatten(_.toArray(arguments))
            );
            ready.resolve(built.length ? built : undefined);
          };

          var onOptionsLoaded = function (options) {
            var loading = [];
            _.forEach(model.selectedNames(), function (name) {
              var option = _.find(options, "name", name);
              if (option) {
                // load() caches per source. Its loading/selected observables
                // drive Shared Systems' own spinner - leave them alone.
                loading.push(option.load());
              }
            });
            if (_.isEmpty(loading)) {
              withoutBrackets();
              return;
            }
            $.when.apply($, loading).then(onSystemsLoaded, withoutBrackets);
          };

          $.when(modsMounted).always(function () {
            // Capability rather than the mod identifier: the identifier changes on a
            // dev build of Shared Systems, this does not.
            if (
              !sharedSystemsForGalacticWarActive ||
              !_.isFunction(chooseStarSystemTemplates.loadOptions) ||
              !_.isFunction(model.selectedNames)
            ) {
              withoutBrackets();
              return;
            }
            chooseStarSystemTemplates
              .loadOptions()
              .then(onOptionsLoaded, withoutBrackets);
          });

          return ready.promise();
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
          if (warGenerationAttempts === 1) {
            warGenerationBaseSeed = model.newGameSeed();
          }

          var busyToken = {};
          model.makeGameBusy(busyToken);

          // Everything random about this war hangs off here. See galaxy.md.
          var warRng = gwoRng.create(model.newGameSeed());
          // Must precede every read of GWFactions: getTeam below shallow-copies a team,
          // snapshotting systemDescription by value.
          gwoFactionSeed.reseed(GWFactions, warRng.stream("factions"));
          var teamsRng = warRng.stream("teams");
          var loreRng = warRng.stream("lore");
          // Shuffled per war, not at module load. Consumed in order by onPopulated.
          var neutralLore = loreRng.shuffle(gwoLore.neutralSystems);
          var aiLore = loreRng.shuffle(gwoLore.aiSystems);

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
          aiFactions.splice(playerFactionIndex(), 1);
          if (model.gwoDifficultySettings.factionScaling()) {
            var numFactions = model.newGameSizeIndex() + 1;
            aiFactions = teamsRng.sample(aiFactions, numFactions);
          }
          var playerCount = game.coopPlayers();
          var largePlanets = model.gwoDifficultySettings.largePlanets();
          var startCard = model.activeStartCard();
          var conquestMode =
            model.gwoDifficultySettings.warMode() === "conquest";

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
            .setTag("global", "playerFaction", playerFactionIndex());
          game.inventory().setTag("global", "playerColor", model.playerColor());

          var buildGalaxy = loadSystemBrackets().then(
            function (systemBrackets) {
              return game.galaxy().build({
                seed: model.newGameSeed(),
                gwoRng: warRng.stream("galaxy"),
                size: size,
                difficultyIndex: selectedDifficulty,
                systemTemplates: systemTemplates,
                content: game.content(),
                coopPlayersForSystemGeneration: playerCount,
                minStarDistance: 2,
                maxStarDistance: 4,
                maxConnections: 4,
                minimumDistanceBonus: 8, // this is inert
                largePlanets: largePlanets,
                gwoSystemBrackets: systemBrackets,
              });
            }
          );

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

            aiFactions = teamsRng.shuffle(aiFactions);
            // Wrapped, not passed by reference: _.map would hand getTeam's rng
            // parameter the array index.
            var teams = _.map(aiFactions, function (faction) {
              return gwoTeams.getTeam(faction, teamsRng);
            });
            if (model.gwoDifficultySettings.ai() === "Queller") {
              // Filter before anything is sampled, so an incompatible minion
              // can never be spread onto the galaxy as a worker AI.
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

            // Ordered rather than keyed: the spread loop is synchronous and the
            // _.remove below mutates remainingMinions, so order is load-bearing.
            var workersRng = warRng.stream("workers");

            // gwo_teams.js deliberately omits makeWorker; this replaces it so
            // _.cloneDeep() preserves personality_tags.
            var makeWorker = function (team, ai) {
              if (team.workers) {
                _.assign(ai, _.cloneDeep(workersRng.pick(team.workers)));
              } else if (team.remainingMinions) {
                var minion = workersRng.pick(
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
              // Conquest keeps the spawn star's procedural system: without
              // systemTemplate, makeBoss still merges the boss and its card.
              var team = conquestMode
                ? _.omit(teams[ai.team], "systemTemplate")
                : teams[ai.team];
              return gwoTeams
                .makeBoss(
                  star,
                  ai,
                  team,
                  systemTemplates,
                  // Keyed by team: makeBoss generates a system, so these resolve out of
                  // order. Stock omits the seed entirely.
                  warRng.stream("boss", ai.team).int(0, 2147483647)
                )
                .then(onBossMade.bind(null, ai));
            };

            var returnTeamInfo = function () {
              return teamInfo;
            };

            // Conquest bosses keep their spawn star all war, so their spacing
            // from the player and each other is optimised rather than greedy.
            var conquestSpawns;
            if (conquestMode) {
              conquestSpawns = gwoConquestSetup.spawnStars({
                gates: game.galaxy().gates(),
                starCount: game.galaxy().stars().length,
                originIndex: game.galaxy().origin(),
                aiCount: teams.length,
                rng: warRng.stream("conquest_spawns"),
              });
            }

            return gwoBreeder
              .populate({
                galaxy: game.galaxy(),
                teams: teams,
                neutralStars: neutralStars,
                orderedSpawn: false,
                // Picks each faction's spawn star and shuffles the spawn order.
                rng: warRng.stream("breeder"),
                spawns: conquestSpawns,
                spawn: function () {},
                // Refusing every spread leaves each faction its spawn star
                // only; the breeder still drains its queues and still marks
                // every spawn as the boss.
                canSpread: _.constant(!conquestMode),
                spread: handleSpread,
                boss: handleBoss,
                breedToOrigin: game.isTutorial(),
              })
              .then(returnTeamInfo);
          };

          var populate = moveIn.then(onMovedIn);

          var setupPlanetForAI = function (ai, planet) {
            planet.generator.shuffleLandingZones = true;
            if (
              sharedSystemsForGalacticWarActive === false &&
              ai.faction === foundationFaction &&
              !ai.boss
            ) {
              planet.generator.waterHeight = 50;
            }
          };

          // Winning the Guardians clears star.ai(), so the star has to be
          // identified by index for the loadout offer to survive the fight.
          var treasurePlanetStar;
          // Assigned in onPopulated; the Conquest snapshot reads it later.
          var maxDist;

          var onPopulated = function (teamInfo) {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            maxDist = _.reduce(
              game.galaxy().stars(),
              function (value, star) {
                return Math.max(star.distance(), value);
              },
              0
            );

            var startCardBreaksAllies = startCardAllyCompatibility(game);

            _.forEach(teamInfo, function (info, teamIndex) {
              var boss = info.boss;
              // Keyed, so an AI's rolls do not depend on what earlier AIs drew.
              var teamRng = warRng.stream("ai", teamIndex);
              var bossRng = teamRng.stream("boss");

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
                // A no-op for the built-in factions, which the pre-filter above
                // covers. Catches a modded faction populating team.workers.
                workerPool = gwoAI.quellerCompatibleMinions(workerPool);
                minionPool = gwoAI.quellerCompatibleMinions(minionPool);
              }

              // A Conquest boss is born at the fair-share tier for its one
              // owned star and rescales as its faction grows; a War boss is
              // always scaled to the galaxy rim.
              var bossDist = conquestMode
                ? gwoScaling.conquestBossTier(
                    1,
                    teamInfo.length,
                    maxDist,
                    game.galaxy().stars().length
                  )
                : maxDist;

              setAIPersonality(bossRng, boss, difficulty, boss.faction);
              boss.econ_rate = aiEconRate(bossRng, bossDist);
              var bossCommanders = bossCommanderCount(difficulty, playerCount);
              boss.bossCommanders = bossCommanders;

              boss.inventory = [];

              if (boss.isCluster === true) {
                boss.inventory = gwoCluster.clusterCommanderMods;
              }

              var factionTechHandicap = Number.parseFloat(
                difficulty.factionTechHandicap()
              );
              var bossBuffs = gwoScaling.buffs(
                bossRng,
                bossDist,
                factionTechHandicap
              );
              boss.typeOfBuffs = bossBuffs; // for intelligence reports
              boss.inventory = gwoScaling.applyTech(
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
              var numMinions = gwoScaling.countMinions(
                mandatoryMinions,
                minionMod,
                bossDist
              );
              var totalMinions = numMinions;

              if (numMinions > 0) {
                boss.minions = [];

                if (boss.isCluster === true) {
                  clusterType = "Security";
                  totalMinions = 1;
                }

                _.times(totalMinions, function (minionIndex) {
                  var minionRng = bossRng.stream("minion", minionIndex);
                  var minion = selectMinion(
                    minionRng,
                    minionPool,
                    boss.faction,
                    clusterType
                  );
                  if (!minion) {
                    return;
                  }
                  setAIPersonality(minionRng, minion, difficulty, boss.faction);
                  minion.econ_rate = aiEconRate(
                    minionRng,
                    bossDist,
                    playerCount
                  );
                  if (boss.isCluster === true) {
                    minion.commanderCount = numMinions;
                  }
                  boss.minions.push(minion);
                });
              }

              if (conquestMode) {
                boss.capturedTurn = 1;
                boss.appliedTier = bossDist;
              }

              _.forEach(workerPool, function (worker, workerIndex) {
                var ai = worker.ai;
                var aiRng = teamRng.stream("worker", workerIndex);

                ai.landAnywhere = gwoScaling.gameModeEnabled(
                  aiRng,
                  difficulty.landAnywhereChance()
                );
                ai.suddenDeath = gwoScaling.gameModeEnabled(
                  aiRng,
                  difficulty.suddenDeathChance()
                );
                ai.bountyMode = gwoScaling.gameModeEnabled(
                  aiRng,
                  difficulty.bountyModeChance()
                );
                ai.bountyModeValue = Number.parseFloat(
                  difficulty.bountyModeValue()
                );
                ai.eradicationMode = gwoScaling.gameModeEnabled(
                  aiRng,
                  difficulty.eradicationModeChance()
                );
                gwoScaling.enableEradicationModeTypes(aiRng, ai);

                var dist = worker.star.distance();

                numMinions = gwoScaling.countMinions(
                  mandatoryMinions,
                  minionMod,
                  dist
                );

                setAIPersonality(aiRng, ai, difficulty, ai.faction);
                ai.econ_rate = aiEconRate(aiRng, dist, playerCount);

                ai.inventory = [];

                if (ai.isCluster === true) {
                  ai.inventory = gwoCluster.clusterCommanderMods;
                }

                var workerBuffs = gwoScaling.buffs(
                  aiRng,
                  dist,
                  factionTechHandicap
                );
                ai.typeOfBuffs = workerBuffs; // for intelligence reports
                ai.inventory = gwoScaling.applyTech(
                  workerBuffs,
                  ai.inventory,
                  ai.faction,
                  gwoTech.factionTechs
                );

                if (numMinions > 0) {
                  ai.minions = [];

                  totalMinions = numMinions;
                  var clusterWorkers = 0;
                  if (ai.isCluster === true) {
                    clusterType = "Worker";
                    clusterWorkers = gwoScaling.clusterCommanderCount(
                      numMinions,
                      bossCommanders
                    );
                    totalMinions = 1;
                  }

                  // Cluster Workers get additional commanders in place of minions
                  if (ai.name === "Worker") {
                    ai.commanderCount = Math.max(clusterWorkers, 2);
                  } else {
                    _.times(totalMinions, function (minionIndex) {
                      var minionRng = aiRng.stream("minion", minionIndex);
                      var minion = selectMinion(
                        minionRng,
                        minionPool,
                        ai.faction,
                        clusterType
                      );
                      if (!minion) {
                        return;
                      }
                      setAIPersonality(
                        minionRng,
                        minion,
                        difficulty,
                        ai.faction
                      );
                      minion.econ_rate = aiEconRate(
                        minionRng,
                        dist,
                        playerCount
                      );
                      if (ai.isCluster === true) {
                        minion.commanderCount = clusterWorkers;
                      }
                      ai.minions.push(minion);
                    });
                  }
                }

                var availableFactions = _.without(aiFactions, ai.faction);
                _.times(availableFactions.length, function (foeIndex) {
                  var foeRng = aiRng.stream("foe", foeIndex);
                  if (
                    gwoScaling.gameModeEnabled(foeRng, difficulty.ffaChance())
                  ) {
                    if (!ai.foes) {
                      ai.foes = [];
                    }

                    availableFactions = foeRng.shuffle(availableFactions);
                    var foeFaction = availableFactions.shift();
                    var foeMinions = GWFactions[foeFaction].minions;
                    if (difficulty.ai() === "Queller") {
                      foeMinions = gwoAI.quellerCompatibleMinions(foeMinions);
                    }
                    var foeCommander = selectMinion(
                      foeRng,
                      foeMinions,
                      foeFaction
                    );
                    if (!foeCommander) {
                      return;
                    }
                    foeCommander.faction = foeFaction;
                    setAIPersonality(
                      foeRng,
                      foeCommander,
                      difficulty,
                      foeCommander.faction
                    );
                    foeCommander.econ_rate = aiEconRate(
                      foeRng,
                      dist,
                      playerCount
                    );
                    var numFoes = Math.round((numMinions + 1) / 2);
                    // Cluster Workers get additional commanders in place of armies
                    if (foeCommander.name === "Worker") {
                      numFoes = gwoScaling.clusterCommanderCount(
                        numMinions,
                        bossCommanders
                      );
                    }
                    foeCommander.commanderCount = numFoes;

                    foeCommander.inventory = [];
                    if (foeCommander.isCluster === true) {
                      foeCommander.inventory = gwoCluster.clusterCommanderMods;
                    }

                    foeCommander.inventory = gwoScaling.applyTech(
                      workerBuffs,
                      foeCommander.inventory,
                      foeCommander.faction,
                      gwoTech.factionTechs
                    );

                    ai.foes.push(foeCommander);
                  }
                });

                var allyRng = aiRng.stream("ally");
                if (
                  !startCardBreaksAllies &&
                  gwoScaling.gameModeEnabled(
                    allyRng,
                    difficulty.alliedCommanderChance()
                  )
                ) {
                  var playerFaction = playerFactionIndex();
                  var allyMinions = GWFactions[playerFaction].minions;
                  if (difficulty.aiAlly() === "Queller") {
                    allyMinions = gwoAI.quellerCompatibleMinions(allyMinions);
                  }
                  var allyCommander = selectMinion(
                    allyRng,
                    allyMinions,
                    playerFaction
                  );
                  if (allyCommander) {
                    allyCommander.faction = playerFaction;
                    ai.ally = allyCommander;
                    if (difficulty.aiAlly() === "Penchant") {
                      gwoScaling.applyPenchant(
                        allyRng,
                        ai.ally,
                        undefined,
                        gwoAI.penchants
                      );
                    }
                  }
                }

                if (difficulty.ai() === "Queller" && ai.foes) {
                  gwoScaling.applyQuellerFFATags(ai);
                  gwoScaling.applyQuellerFFATags(ai.minions);
                  gwoScaling.applyQuellerFFATags(ai.foes);
                  gwoScaling.applyQuellerFFATags(ai.ally);
                }
              });
            });

            var treasurePlanetSetup = false;
            var loreEntry = 0;
            var optionalLoreEntry = 0;
            var treasureRng = warRng.stream("treasure");

            // Placed before the sweep so the treasure star reads as an AI star
            // there: planets prepared, no lore, no stock conversion.
            if (conquestMode) {
              var candidates = gwoConquestSetup.guardiansCandidates(
                game.galaxy().stars(),
                game.galaxy().origin()
              );
              if (candidates.length) {
                treasurePlanetStar = treasureRng.pick(candidates);
                var treasureStar = game.galaxy().stars()[treasurePlanetStar];
                treasureStar.ai(
                  gwoConquestSetup.buildGuardiansAi(
                    aiEconRate(treasureRng, maxDist),
                    bossCommanderCount(model.gwoDifficultySettings, playerCount)
                  )
                );
                // The loadout itself is derived per player at exploration -
                // see gw_play/treasure_loadouts.js.
                treasureStar.system().description =
                  gwoConquestSetup.treasureDescription;
              } else {
                console.warn("No unowned star available for the Guardians");
              }
            }

            _.forEach(game.galaxy().stars(), function (star, starIndex) {
              var ai = star.ai();
              var system = star.system();
              if (ai) {
                _.forEach(
                  star.system().planets,
                  setupPlanetForAI.bind(null, ai)
                );

                if (!ai.bossCommanders) {
                  var difficulty = model.gwoDifficultySettings;

                  if (treasurePlanetSetup === false) {
                    treasurePlanetSetup = true;
                    treasurePlanetStar = starIndex;
                    delete ai.commanderCount;
                    delete ai.minions;
                    delete ai.foes;
                    delete ai.ally;
                    delete ai.team;
                    delete ai.penchantName;
                    _.assign(
                      ai,
                      gwoConquestSetup.buildGuardiansAi(
                        aiEconRate(treasureRng, maxDist),
                        bossCommanderCount(difficulty, playerCount)
                      )
                    );
                    // The loadout itself is derived per player at exploration -
                    // see gw_play/treasure_loadouts.js.
                    system.description = gwoConquestSetup.treasureDescription;
                  } else if (difficulty.paLore() && aiLore[optionalLoreEntry]) {
                    system.description = aiLore[optionalLoreEntry];
                    optionalLoreEntry += 1;
                  }
                }
              } else if (neutralLore[loreEntry]) {
                system.name = neutralLore[loreEntry].name;
                system.description = neutralLore[loreEntry].description;
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
            originSystem.gwaio.version = gwoVersion;
            // Re-entering this in the lobby rebuilds this war.
            originSystem.gwaio.seed = model.newGameSeed();
            originSystem.gwaio.difficulty =
              gwoDifficulty.difficulties[selectedDifficulty].difficultyName;
            originSystem.gwaio.galaxySize =
              galaxySizeNames[model.newGameSizeIndex()] || "!LOC:Unknown";
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
            // This war never pre-dealt a treasure loadout to strip
            originSystem.gwaio.treasureLoadoutDerived = true;
            originSystem.gwaio.treasureStar = treasurePlanetStar;
            originSystem.gwaio.coopPlayerScalingCount = playerCount;
            if (conquestMode) {
              var difficulty = model.gwoDifficultySettings;
              originSystem.gwaio.conquest = gwoConquestSetup.settings({
                maxDist: maxDist,
                playerCount: playerCount,
                factions: aiFactions,
                difficulty: {
                  econBase: Number.parseFloat(difficulty.econBase()),
                  econRatePerDist: Number.parseFloat(
                    difficulty.econRatePerDist()
                  ),
                  mandatoryMinions: difficulty.mandatoryMinions(),
                  minionMod: Number.parseFloat(difficulty.minionMod()),
                  factionTechHandicap: Number.parseFloat(
                    difficulty.factionTechHandicap()
                  ),
                  ffaChance: difficulty.ffaChance(),
                  alliedCommanderChance: difficulty.alliedCommanderChance(),
                  bossCommanders: difficulty.bossCommanders(),
                },
                personality: personalitySettings(),
                gameModes: {
                  landAnywhereChance: difficulty.landAnywhereChance(),
                  suddenDeathChance: difficulty.suddenDeathChance(),
                  bountyModeChance: difficulty.bountyModeChance(),
                  bountyModeValue: Number.parseFloat(
                    difficulty.bountyModeValue()
                  ),
                  eradicationModeChance: difficulty.eradicationModeChance(),
                },
              });
            }
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

            // Defensive: success navigates away, but keeps the count per-war if
            // gw_start is ever re-entered without a page load.
            warGenerationAttempts = 0;

            saveDifficultySettings();

            console.log(
              "War created successfully using Galactic War Overhaul v" +
                gwoVersion
            );

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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoSetup();
