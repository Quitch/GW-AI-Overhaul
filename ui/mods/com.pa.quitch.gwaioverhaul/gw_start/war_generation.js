// War generation, from Go To War to the gw_play scene, as steps over one
// object per run. gw_start/setup.js hands it the scene's modules and state.
// See galaxy.md, "Generation order".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/galaxy_sizes.js",
], function (galaxySizeNames) {
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
    var startCardSummary = loc(startCard.summary());

    return _.compact([
      difficultyName,
      players,
      sizeName,
      startCardSummary,
    ]).join(" - ");
  };

  var startCardAllyCompatibility = function (game) {
    var gwoStarCardsWhichBreakAllies = [
      "nem_start_deepspace",
      "gwaio_start_tourist",
    ];
    // global for modder compatibility - merge in any modder-added ids.
    // GWO never creates this one, so the mod's loader has to
    if (_.isArray(model.gwoStarCardsWhichBreakAllies)) {
      gwoStarCardsWhichBreakAllies = gwoStarCardsWhichBreakAllies.concat(
        model.gwoStarCardsWhichBreakAllies
      );
    }
    return _.some(gwoStarCardsWhichBreakAllies, function (card) {
      return card === game.inventory().cards()[0].id;
    });
  };

  var onGameSaved = function () {
    model.lastSceneUrl(
      "coui://ui/main/game/galactic_war/gw_start/gw_start.html"
    );
    window.location.href =
      "coui://ui/main/game/galactic_war/gw_play/gw_play.html";
  };

  return function (modules, scene) {
    var GW = modules.GW;
    var GWFactions = modules.GWFactions;
    var gwoBreeder = modules.gwoBreeder;
    var gwoTeams = modules.gwoTeams;
    var gwoLore = modules.gwoLore;
    var gwoPopulation = modules.gwoPopulation;
    var gwoWarRecord = modules.gwoWarRecord;
    var gwoDifficulty = modules.gwoDifficulty;
    var gwoAI = modules.gwoAI;
    var gwoVersion = modules.gwoVersion;
    var gwoSystemBrackets = modules.gwoSystemBrackets;
    var gwoRng = modules.gwoRng;
    var gwoFactionSeed = modules.gwoFactionSeed;
    var chooseStarSystemTemplates = modules.chooseStarSystemTemplates;
    var gwoBiomeMods = modules.gwoBiomeMods;
    var gwoRaces = modules.gwoRaces;
    var gwoPromise = modules.gwoPromise;
    var generationFailure = modules.generationFailure;

    var warGenerationAttempts = 0;
    // The seed the player actually asked for, captured on the first attempt.
    var warGenerationBaseSeed;

    var warGenerationFailure = function (cause) {
      model.makeGameBusy(false);
      scene.generatingWar(false);
      if (generationFailure.shouldRetry(cause, warGenerationAttempts)) {
        // Derived, not re-rolled, so an entered seed reproduces the whole retry chain.
        model.newGameSeed(warGenerationBaseSeed + "-" + warGenerationAttempts);
        model.navToNewGame();
      } else {
        warGenerationAttempts = 0;
        // Put back, so the next click starts from the seed the player asked
        // for rather than from the last retry's.
        model.newGameSeed(warGenerationBaseSeed);
        model.gwoWarGenerationError(
          generationFailure.message(cause, warGenerationBaseSeed)
        );
        console.error("Failed to generate valid war: " + (cause || "error"));
      }
    };

    var gwoDealStartCard = function (run, params) {
      var result = $.Deferred();

      var onCardsLoaded = function () {
        var card = _.find(scene.processedStartCards, { id: params.id });
        if (!card) {
          console.error("No matching start card ID found");
          run.failed = true;
          // Must reject, not fall through: a throw inside a jQuery deferred
          // callback escapes .fail() instead of rejecting, and hangs Go To
          // War with no seed retry.
          result.reject("no matching start card ID: " + params.id);
          return;
        }
        var product = { id: params.id };
        var deal;
        // Same reasoning as the missing-card branch above: a third-party
        // loadout that throws must reject rather than escape the deferred.
        try {
          var context =
            card.getContext && card.getContext(params.galaxy, params.inventory);
          deal = card.deal && card.deal(params.star, context);
          var cardParams = deal && deal.params;
          if (_.isPlainObject(cardParams)) {
            _.assign(product, cardParams);
          }
          card.keep && card.keep(deal, context);
          card.releaseContext && card.releaseContext(context);
        } catch (e) {
          console.error(
            "Start card threw while being dealt: " +
              params.id +
              ": " +
              ((e && e.stack) || e)
          );
          run.failed = true;
          result.reject("start card threw: " + params.id);
          return;
        }
        result.resolve(product, deal);
      };

      scene.startCardsLoaded.then(onCardsLoaded);
      return result;
    };

    var warBrains = function () {
      var settings = model.gwoDifficultySettings;
      return {
        aiByRace: settings.aiByRace(),
        ai: settings.ai(),
        aiAlly: settings.aiAlly(),
        aiCoop: settings.aiCoop(),
      };
    };

    // Resolves the brackets, or undefined without them. Rejects with
    // SYSTEM_SOURCES when no source gave a system, or one failed and none
    // gave a bracket. See galaxy.md, "Shared Systems for Galactic War".
    var loadSystemBrackets = function () {
      var ready = $.Deferred();
      var sourceFailed = false;

      var withoutBrackets = function () {
        ready.resolve(undefined);
      };

      var sourcesUnavailable = function () {
        ready.reject(generationFailure.SYSTEM_SOURCES);
      };

      var onSystemsLoaded = function () {
        // $.when hands back one array per source.
        var systems = _.flatten(_.toArray(arguments));
        gwoBiomeMods.providers().then(function (providers) {
          var built = gwoSystemBrackets.bracketsFrom(systems, providers);
          if (built.length) {
            ready.resolve({ brackets: built, providers: providers });
          } else if (sourceFailed || _.isEmpty(systems)) {
            sourcesUnavailable();
          } else {
            withoutBrackets();
          }
        });
      };

      // Each source settles on its own: $.when rejects at the first
      // failure, so one dead source would drop every other's systems.
      var sourceSystems = function (name, loading) {
        var settled = $.Deferred();
        $.when(loading).then(
          function (systems) {
            settled.resolve(systems);
          },
          function () {
            console.error("System source failed to load: " + name);
            sourceFailed = true;
            settled.resolve([]);
          }
        );
        return settled.promise();
      };

      var onOptionsLoaded = function (options) {
        var loading = [];
        _.forEach(model.selectedNames(), function (name) {
          var option = _.find(options, "name", name);
          if (option) {
            // load() caches per source. Its loading/selected observables
            // drive Shared Systems' own spinner - leave them alone.
            // It belongs to another mod, so a throw here would escape the
            // deferred callback and leave Go To War waiting on `ready`.
            try {
              loading.push(sourceSystems(name, option.load()));
            } catch (e) {
              console.error(
                "System source failed to load: " +
                  name +
                  ": " +
                  ((e && e.stack) || e)
              );
              sourceFailed = true;
            }
          }
        });
        // With nothing loading, this resolves at once with no systems.
        $.when.apply($, loading).then(onSystemsLoaded);
      };

      var loadOptions = function () {
        // Capability rather than the mod identifier: the identifier changes on a
        // dev build of Shared Systems, this does not.
        if (
          !scene.sharedSystemsActive() ||
          !_.isFunction(chooseStarSystemTemplates.loadOptions) ||
          !_.isFunction(model.selectedNames)
        ) {
          withoutBrackets();
          return;
        }
        // Shared Systems' own call, guarded as option.load() is above.
        try {
          chooseStarSystemTemplates
            .loadOptions()
            .then(onOptionsLoaded, function () {
              console.error("System sources failed to load");
              sourcesUnavailable();
            });
        } catch (e) {
          console.error(
            "System sources failed to load: " + ((e && e.stack) || e)
          );
          sourcesUnavailable();
        }
      };

      // modsMounted is an engine promise, which $.when does not wait for.
      gwoPromise.settled(scene.modsMounted).then(loadOptions);

      return ready.promise();
    };

    // The current settings in a named tier's shape, keyed as
    // difficulty_levels.js keys them. A numeric select reads back as a string;
    // the string booleans stay strings, as the tiers hold them. See galaxy.md.
    var tierSnapshot = function () {
      scene.syncPickedTags();
      var settings = model.gwoDifficultySettings;
      var snapshot = {};
      _.forEach(gwoDifficulty.tierSettings, function (setting) {
        var value = settings[setting.name]();
        snapshot[setting.key] =
          _.isString(value) && value !== "" && !_.isNaN(Number(value))
            ? Number(value)
            : value;
      });
      return snapshot;
    };

    var begin = function () {
      scene.generatingWar(true);
      var run = {
        failed: false,
        // Set only when an enemy faction found no home system, the one
        // failure a new seed can fix.
        spawnShortage: false,
      };
      model.gwoWarGenerationError("");
      // Read once: Shared Systems for Galactic War rerolls the seed when a
      // source is toggled, which the player can do while this war generates.
      run.seed = model.newGameSeed();
      run.sizeIndex = model.newGameSizeIndex();
      run.brains = warBrains();
      warGenerationAttempts++;
      if (warGenerationAttempts === 1) {
        warGenerationBaseSeed = run.seed;
      }

      run.token = {};
      model.makeGameBusy(run.token);
      return run;
    };

    var seedWar = function (run) {
      // Everything random about this war hangs off here. See galaxy.md.
      var warRng = gwoRng.create(run.seed);
      run.rng = warRng;
      // Must precede every read of GWFactions: getTeam below shallow-copies a team,
      // snapshotting systemDescription by value.
      gwoFactionSeed.reseed(GWFactions, warRng.stream("factions"));
      run.teamsRng = warRng.stream("teams");
      var loreRng = warRng.stream("lore");
      run.raceInfo = model.gwoRaceInfo();
      run.installedRaces = _.pluck(run.raceInfo.races, "id");
      run.playerRace = _.includes(
        run.installedRaces,
        model.gwoDifficultySettings.playerRace()
      )
        ? model.gwoDifficultySettings.playerRace()
        : gwoRaces.MLA_ID;
      // Every installed race: to leave one out, disable its mod. See
      // galaxy.md.
      run.enemyRacePool = _.uniq([gwoRaces.MLA_ID].concat(run.installedRaces));
      run.raceByFaction = {};
      // Shuffled per war, not at module load. Consumed in order by populateAis.
      run.neutralLore = loreRng.shuffle(gwoLore.neutralSystems);
      run.aiLore = loreRng.shuffle(gwoLore.aiSystems);
    };

    var createGame = function (run) {
      var game = new GW.Game();
      run.game = game;
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
    };

    var planWar = function (run) {
      var game = run.game;
      var sizeIndex = run.sizeIndex;
      var selectedDifficulty = model.gwoDifficultySettings.difficultyLevel();
      // The tier every AI's personality is built from; Custom's is the
      // snapshot the war records. See galaxy.md, "Difficulty".
      var selectedTier = gwoDifficulty.difficulties[selectedDifficulty];
      run.selectedTier = selectedTier;
      run.warTierData = selectedTier.customDifficulty
        ? tierSnapshot()
        : selectedTier;
      var sizes = GW.balance.numberOfSystems;
      run.size = sizes[sizeIndex] || 40;
      var aiFactions = _.range(GWFactions.length);
      aiFactions.splice(model.playerFactionIndex(), 1);
      if (model.gwoDifficultySettings.factionScaling()) {
        var numFactions = sizeIndex + 1;
        aiFactions = run.teamsRng.sample(aiFactions, numFactions);
      }
      run.aiFactions = aiFactions;
      run.playerCount = game.coopPlayers();
      run.largePlanets = model.gwoDifficultySettings.largePlanets();
      run.startCard = model.activeStartCard();

      if (model.newGameName() === scene.defaultNewGameName) {
        model.newGameName(
          generatedWarName(
            selectedDifficulty,
            run.playerCount,
            sizeIndex,
            run.startCard,
            gwoDifficulty.difficulties
          )
        );
      }
      game.name(model.newGameName());

      game
        .inventory()
        .setTag("global", "playerFaction", model.playerFactionIndex());
      game.inventory().setTag("global", "playerColor", model.playerColor());
      game.inventory().setTag("global", "playerRace", run.playerRace);
    };

    var buildGalaxy = function (run, systemBrackets) {
      systemBrackets = systemBrackets || {};
      return run.game.galaxy().build({
        seed: run.seed,
        gwoRng: run.rng.stream("galaxy"),
        size: run.size,
        useEasierSystemTemplate: model.gwoDifficultySettings.simpleSystems(),
        content: run.game.content(),
        coopPlayersForSystemGeneration: run.playerCount,
        minStarDistance: 2,
        maxStarDistance: 4,
        maxConnections: 4,
        largePlanets: run.largePlanets,
        gwoSystemBrackets: systemBrackets.brackets,
        gwoBiomeProviders: systemBrackets.providers,
      });
    };

    var onStartCardDealt = function (run, startCardProduct) {
      run.game.inventory().cards.push(startCardProduct);
    };

    var dealStartCard = function (run, galaxy) {
      if (model.makeGameBusy() !== run.token) {
        return;
      }

      return gwoDealStartCard(run, {
        id: run.startCard.id(),
        inventory: run.game.inventory(),
        galaxy: galaxy,
        star: galaxy.stars()[galaxy.origin()],
      }).then(onStartCardDealt.bind(null, run));
    };

    var moveIn = function (run) {
      if (model.makeGameBusy() !== run.token) {
        return;
      }
      var game = run.game;
      var galaxy = game.galaxy();
      game.move(galaxy.origin());
      var star = galaxy.stars()[game.currentStar()];
      star.explored(true);
      game.gameState(GW.Game.gameStates.active);
    };

    // gwo_teams.js deliberately omits makeWorker; this replaces it so
    // _.cloneDeep() preserves personality_tags.
    var makeWorker = function (run, team, ai) {
      if (team.workers) {
        _.assign(ai, _.cloneDeep(run.workersRng.pick(team.workers)));
      } else if (team.remainingMinions) {
        var minion = run.workersRng.pick(
          team.remainingMinions.length
            ? team.remainingMinions
            : team.faction.minions
        );
        _.assign(ai, _.cloneDeep(minion));
        _.remove(team.remainingMinions, { name: ai.name });
      }
      return $.when(ai);
    };

    var onWorkerMade = function (run, team, ai, star) {
      var teamInfo = run.teamInfo;
      if (team.workers) {
        _.remove(team.workers, { name: ai.name });
      }
      ai.faction = teamInfo[ai.team].faction;
      // Keyed per team by spawn order, which the synchronous spread
      // keeps deterministic. See galaxy.md.
      gwoPopulation.giveRace(
        run.rng
          .stream("race", ai.faction)
          .stream("worker", teamInfo[ai.team].workers.length),
        ai,
        run.raceByFaction[ai.faction],
        false
      );
      teamInfo[ai.team].workers.push({
        ai: ai,
        star: star,
      });
    };

    var onBossMade = function (run, ai) {
      var teamInfo = run.teamInfo;
      ai.faction = teamInfo[ai.team].faction;
      gwoPopulation.giveRace(
        run.rng.stream("race", ai.faction),
        ai,
        run.raceByFaction[ai.faction],
        true
      );
      teamInfo[ai.team].boss = ai;
    };

    var handleSpread = function (run, star, ai) {
      var team = run.teams[ai.team];
      return makeWorker(run, team, ai).then(
        onWorkerMade.bind(null, run, team, ai, star)
      );
    };

    var handleBoss = function (run, star, ai) {
      return gwoTeams
        .makeBoss(
          star,
          ai,
          run.teams[ai.team],
          undefined, // stock's sst parameter, which makeBoss never reads
          // Keyed by team: makeBoss generates a system, so these resolve out of
          // order. Stock omits the seed entirely.
          run.rng.stream("boss", ai.team).int(0, 2147483647)
        )
        .then(onBossMade.bind(null, run, ai));
    };

    var placeAis = function (run) {
      if (model.makeGameBusy() !== run.token) {
        return;
      }

      var aiFactions = run.teamsRng.shuffle(run.aiFactions);
      run.aiFactions = aiFactions;
      // One race per faction, Cluster included; each takes a Unique
      // Races slot, as does the player's race. See races.md.
      var raceByFaction = gwoRaces.assign(
        run.teamsRng.stream("races"),
        aiFactions,
        run.enemyRacePool,
        {
          unique: model.gwoDifficultySettings.uniqueRaces(),
          taken: [run.playerRace],
        }
      );
      run.raceByFaction = raceByFaction;
      // Wrapped, not passed by reference: _.map would hand getTeam's rng
      // parameter the array index.
      var teams = _.map(aiFactions, function (faction) {
        return gwoTeams.getTeam(faction, run.teamsRng);
      });
      // Filter before anything is sampled, so an incompatible minion
      // can never be spread onto the galaxy as a worker AI. Keyed per
      // team: each faction's race decides whether its AIs run Queller.
      _.forEach(teams, function (team, teamIndex) {
        var race = raceByFaction[aiFactions[teamIndex]];
        if (
          gwoPopulation.brainForRace(run.brains, race, "enemy") !== "Queller"
        ) {
          return;
        }
        team.remainingMinions = gwoAI.quellerCompatibleMinions(
          team.remainingMinions
        );
        team.faction = _.assign({}, team.faction, {
          minions: gwoAI.quellerCompatibleMinions(team.faction.minions),
        });
      });
      var teamInfo = _.map(teams, function (team, teamIndex) {
        return {
          team: team,
          workers: [],
          faction: aiFactions[teamIndex],
        };
      });
      run.teams = teams;
      run.teamInfo = teamInfo;

      // Ordered rather than keyed: the spread loop is synchronous and
      // makeWorker's _.remove mutates remainingMinions, so order is
      // load-bearing.
      run.workersRng = run.rng.stream("workers");

      return gwoBreeder
        .populate({
          galaxy: run.game.galaxy(),
          teams: teams,
          neutralStars: 4,
          orderedSpawn: false,
          // Picks each faction's spawn star and shuffles the spawn order.
          rng: run.rng.stream("breeder"),
          spawn: function () {},
          canSpread: _.constant(true),
          spread: handleSpread.bind(null, run),
          boss: handleBoss.bind(null, run),
          breedToOrigin: run.game.isTutorial(),
        })
        .then(_.constant(teamInfo));
    };

    var populateAis = function (run, teamInfo) {
      if (model.makeGameBusy() !== run.token) {
        return;
      }

      var outcome = gwoPopulation.populate(
        {
          galaxy: run.game.galaxy(),
          factions: GWFactions,
          aiFactions: run.aiFactions,
          raceByFaction: run.raceByFaction,
          playerRace: run.playerRace,
          playerFaction: model.playerFactionIndex(),
          playerCount: run.playerCount,
          settings: model.gwoDifficultySettings,
          tier: run.warTierData,
          brains: run.brains,
          rng: run.rng,
          lore: { neutral: run.neutralLore, ai: run.aiLore },
          startCardBreaksAllies: startCardAllyCompatibility(run.game),
          sharedSystems: scene.sharedSystemsActive(),
        },
        teamInfo
      );
      if (outcome.failed) {
        run.failed = true;
      }
      if (outcome.spawnShortage) {
        run.spawnShortage = true;
      }
      run.treasureStar = outcome.treasureStar;
    };

    var recordWar = function (run) {
      if (model.makeGameBusy() !== run.token || run.failed === true) {
        return;
      }

      // Hacky way to store war information for the gw_play scene
      gwoAI.originSystem(run.game).gwaio = gwoWarRecord.build({
        seed: run.seed,
        tier: run.selectedTier,
        tierData: run.warTierData,
        galaxySize: galaxySizeNames[run.sizeIndex] || "!LOC:Unknown",
        settings: model.gwoDifficultySettings,
        devMode: model.devMode(),
        brains: run.brains,
        installedRaces: run.installedRaces,
        treasureStar: run.treasureStar,
        playerCount: run.playerCount,
        playerRace: run.playerRace,
        raceByFaction: run.raceByFaction,
        raceInfo: run.raceInfo,
        perPlayerTechCards: model.newGamePerPlayerTechCards(),
        uniqueAiLoadouts:
          !!model.gwoUniqueAiLoadouts && model.gwoUniqueAiLoadouts(),
        galaxy: run.game.galaxy(),
      });
    };

    var storeWar = function (run) {
      if (model.makeGameBusy() !== run.token || run.failed === true) {
        return;
      }

      var game = run.game;
      model.newGame(game);
      model.updateCommander();
      if (game.perPlayerTechCards()) {
        var displayName = ko.observable().extend({ session: "displayName" });
        game.upsertCoopPlayerInventoryData({
          playerId: model.uberId(),
          playerName: displayName(),
          commander: model.selectedCommander(),
          loadoutCardId: run.startCard.id(),
          inventory: game.inventory().save(),
          techCardDealCount: 0,
          updatedAt: _.now(),
        });
      }
      return game;
    };

    var finish = function (run) {
      if (model.makeGameBusy() !== run.token) {
        return;
      }
      if (run.failed === true) {
        warGenerationFailure(
          run.spawnShortage ? generationFailure.SPAWN_SHORTAGE : undefined
        );
        return;
      }
      // Cleared last, as stock clears it, so every step before this one
      // can tell that another run has taken over.
      model.makeGameBusy(false);

      // Defensive: success navigates away, but keeps the count per-war if
      // gw_start is ever re-entered without a page load.
      warGenerationAttempts = 0;

      scene.saveDifficultySettings();

      console.log(
        "War created successfully using Galactic War Overhaul v" + gwoVersion
      );

      var save = GW.manifest.saveGame(model.newGame());
      model.activeGameId(model.newGame().id);
      save.then(onGameSaved);
    };

    var onWarGenerationError = function (run, err) {
      console.error((err && err.stack) || err);
      if (model.makeGameBusy() !== run.token) {
        return;
      }
      warGenerationFailure(err);
    };

    var generate = function (run) {
      var finishSetup = gwoPromise.steps(
        loadSystemBrackets(),
        _.map(
          [
            buildGalaxy,
            dealStartCard,
            moveIn,
            placeAis,
            populateAis,
            recordWar,
            storeWar,
          ],
          function (step) {
            return step.bind(null, run);
          }
        )
      );

      finishSetup
        .then(finish.bind(null, run))
        .fail(onWarGenerationError.bind(null, run));
    };

    return {
      start: function () {
        var run = begin();
        seedWar(run);
        createGame(run);
        planWar(run);
        generate(run);
      },
    };
  };
});
