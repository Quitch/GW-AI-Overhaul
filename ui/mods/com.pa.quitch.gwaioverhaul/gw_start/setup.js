(function () {
  try {
    var cardId = function (card) {
      return card.id();
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
    var gwoReady = ko.observable(false); // the modules below have loaded
    var sharedSystemsForGalacticWarActive = false;
    var defaultNewGameName = model.newGameName();
    var warGenerationFailed;
    // Set only when an enemy faction found no home system, the one failure a
    // new seed can fix.
    var spawnShortage;
    // Shown above Go To War once generation gives up.
    model.gwoWarGenerationError = ko.observable("");

    // War generation reads model.gwoRaceInfo, which race_picker.js fills
    // once the installed races resolve, so an earlier Go To War would
    // generate an MLA-only war. race_picker.js loads after this file; if it
    // failed to install, the war stays blocked rather than going MLA-only.
    var racesResolved = function () {
      return (
        ko.isObservable(model.gwoRaceInfo) &&
        model.gwoRaceInfo().races.length > 0
      );
    };

    // We change how we monitor model.ready() to prevent
    // Shared Systems for Galactic War breaking our new lobby
    model.ready = ko.computed(function () {
      var activeCard = model.activeStartCard();
      return (
        gwoReady() &&
        racesResolved() &&
        enableGoToWar() &&
        !!activeCard &&
        !activeCard.gwoRaceLocked
      );
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

    // The personality picker has no data-bind, so its value only reaches the
    // settings if pushed back here.
    var syncPickedTags = function () {
      var settings = model.gwoDifficultySettings;
      var pickedTags = $("#gwo-personality-picker").val() || [];
      if (!_.isEqual(pickedTags, settings.personalityTags())) {
        settings.personalityTags(pickedTags);
      }
    };

    var saveDifficultySettings = function () {
      var settings = model.gwoDifficultySettings;
      syncPickedTags();

      var settingNames = _.without(_.keys(settings), "previousSettings");
      var snapshot = {};
      _.forEach(settingNames, function (name) {
        snapshot[name] = settings[name]();
      });
      settings.previousSettings(snapshot);
    };

    var warGenerationAttempts = 0;
    // The seed the player actually asked for, captured on the first attempt of a run.
    var warGenerationBaseSeed;
    // gw_start/war_generation_failure.js, set once the modules below load. Only
    // navToNewGame, which is defined there too, can fail.
    var generationFailure;

    var warGenerationFailure = function (cause) {
      model.makeGameBusy(false);
      enableGoToWar(true);
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
      var startCardSummary = loc(startCard.summary());

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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_population.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/war_record.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/difficulty_levels.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourite_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_selection.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourites.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_system_brackets.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_seed.js",
        "main/game/galactic_war/shared/js/systems/template-loader",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/galaxy_build.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/war_generation_failure.js",
      ],
      function (
        GW,
        GWFactions,
        gwoBreeder,
        gwoTeams,
        gwoLore,
        gwoPopulation,
        gwoWarRecord,
        gwoDifficulty,
        gwoAI,
        loadouts,
        gwoLoadoutBanks,
        favouriteLoadoutsModule,
        loadoutSelection,
        favouritesModule,
        gwoVersion,
        gwoSystemBrackets,
        gwoRng,
        gwoFactionSeed,
        chooseStarSystemTemplates,
        gwoBiomeMods,
        gwoGalaxyBuild,
        gwoRaces,
        gwoPromise,
        gwoGenerationFailure
      ) {
        generationFailure = gwoGenerationFailure;
        // Replaces GWGalaxy.prototype.build, which navToNewGame below calls.
        gwoGalaxyBuild.install();
        gwoFavouriteLoadouts = favouriteLoadoutsModule;
        gwoFavourites = favouritesModule;

        // Resolved before the list is built so a mod loadout the player has
        // earned shows as unlocked rather than as a locked hint.
        // Also re-run by the race picker: a race player's MLA-only loadouts
        // are locked, so a selection resting on one moves. See races.md.
        // Peeked, not read, so a caller inside a ko.computed does not come
        // to depend on the selection.
        var isRaceLocked = function (card) {
          return !!card.gwoRaceLocked;
        };

        // ui.js swaps activeStartCardIndex for the remembered setting, but
        // stock's activeStartCard computed still tracks the observable it was
        // built on, so until the list first changes it peeks stock card 0.
        // The first build therefore resolves the id from the new list at the
        // remembered index; later builds preserve the id already selected.
        var built = false;
        model.gwoRebuildStartCards = function () {
          var savedIndex = model.activeStartCardIndex.peek();
          var activeCard = model.activeStartCard.peek();
          var previousId = built && activeCard ? cardId(activeCard) : undefined;
          model.startCards(
            gwoFavouriteLoadouts.sortCardsByFavourite(
              loadouts.startCards(),
              gwoFavourites.ids(),
              cardId
            )
          );
          var cards = model.startCards.peek();
          var activeId =
            previousId || (cards[savedIndex] && cardId(cards[savedIndex]));
          var index = loadoutSelection.selectableIndex(
            cards,
            activeId,
            cardId,
            isRaceLocked
          );
          if (index !== -1) {
            model.activeStartCardIndex(index);
          }
          built = true;
        };
        gwoLoadoutBanks.load().then(function () {
          model.gwoRebuildStartCards();
        });
        var processedStartCards = {};
        var loadCount = loadouts.allCards.length;
        var loaded = $.Deferred();

        _.forEach(loadouts.allCards, function (card) {
          // A third-party loadout whose module fails to load or returns nothing
          // still has to count towards the tally, or `loaded` never resolves
          // and Go To War spins with no reseed.
          // No timeout (waitSeconds: 0), and an errback can fire twice.
          var count = _.once(function () {
            --loadCount;
            if (loadCount === 0) {
              loaded.resolve();
            }
          });

          requireGW(
            ["cards/" + card.id],
            function (cardFile) {
              if (cardFile) {
                cardFile.id = card.id;
                processedStartCards[card.id] = cardFile;
              } else {
                console.error(
                  "Start card loaded but returned nothing: " + card.id
                );
              }
              count();
            },
            function () {
              console.error("Start card failed to load: " + card.id);
              count();
            }
          );
        });

        var gwoDealStartCard = function (params) {
          var result = $.Deferred();

          var onCardsLoaded = function () {
            var card = _.find(processedStartCards, { id: params.id });
            if (!card) {
              console.error("No matching start card ID found");
              warGenerationFailed = true;
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
                card.getContext &&
                card.getContext(params.galaxy, params.inventory);
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
              warGenerationFailed = true;
              result.reject("start card threw: " + params.id);
              return;
            }
            result.resolve(product, deal);
          };

          loaded.then(onCardsLoaded);
          return result;
        };

        var warBrains = function () {
          var settings = model.gwoDifficultySettings;
          return {
            aiByRace: settings.aiByRace(),
            ai: settings.ai(),
            aiAlly: settings.aiAlly(),
          };
        };

        // Never rejects - every failure resolves undefined. Rejecting would fail
        // the war over brackets it can do without.
        var loadSystemBrackets = function () {
          var ready = $.Deferred();

          var withoutBrackets = function () {
            ready.resolve(undefined);
          };

          var onSystemsLoaded = function () {
            // $.when hands back one array per source.
            var systems = _.flatten(_.toArray(arguments));
            gwoBiomeMods.providers().then(function (providers) {
              var built = gwoSystemBrackets.bracketsFrom(systems, providers);
              ready.resolve(
                built.length
                  ? { brackets: built, providers: providers }
                  : undefined
              );
            });
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
                  loading.push(option.load());
                } catch (e) {
                  console.error(
                    "System source failed to load: " +
                      name +
                      ": " +
                      ((e && e.stack) || e)
                  );
                }
              }
            });
            if (_.isEmpty(loading)) {
              withoutBrackets();
              return;
            }
            $.when.apply($, loading).then(onSystemsLoaded, withoutBrackets);
          };

          // modsMounted is an engine promise, which $.when does not wait for.
          gwoPromise.settled(modsMounted).then(function () {
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

        // The current settings in a named tier's shape, keyed as
        // difficulty_levels.js keys them. A numeric select reads back as a string;
        // the string booleans stay strings, as the tiers hold them. See galaxy.md.
        var tierSnapshot = function () {
          syncPickedTags();
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

        // replicates the functionality of model.makeGame() but
        // only generates the galaxy once the player clicks Go To War
        model.navToNewGame = function () {
          if (!model.ready()) {
            return;
          }

          enableGoToWar(false);
          warGenerationFailed = false;
          spawnShortage = false;
          model.gwoWarGenerationError("");
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
          var raceInfo = model.gwoRaceInfo();
          var installedRaces = _.pluck(raceInfo.races, "id");
          var playerRace = _.includes(
            installedRaces,
            model.gwoDifficultySettings.playerRace()
          )
            ? model.gwoDifficultySettings.playerRace()
            : gwoRaces.MLA_ID;
          // Every installed race: to leave one out, disable its mod. See
          // galaxy.md.
          var enemyRacePool = _.uniq([gwoRaces.MLA_ID].concat(installedRaces));
          var raceByFaction = {};
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
          // The tier every AI's personality is built from; Custom's is the
          // snapshot the war records. See galaxy.md, "Difficulty".
          var selectedTier = gwoDifficulty.difficulties[selectedDifficulty];
          var warTierData = selectedTier.customDifficulty
            ? tierSnapshot()
            : selectedTier;
          var sizes = GW.balance.numberOfSystems;
          var size = sizes[model.newGameSizeIndex()] || 40;
          var aiFactions = _.range(GWFactions.length);
          aiFactions.splice(model.playerFactionIndex(), 1);
          if (model.gwoDifficultySettings.factionScaling()) {
            var numFactions = model.newGameSizeIndex() + 1;
            aiFactions = teamsRng.sample(aiFactions, numFactions);
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
          game.inventory().setTag("global", "playerRace", playerRace);

          var buildGalaxy = loadSystemBrackets().then(
            function (systemBrackets) {
              systemBrackets = systemBrackets || {};
              return game.galaxy().build({
                seed: model.newGameSeed(),
                gwoRng: warRng.stream("galaxy"),
                size: size,
                useEasierSystemTemplate:
                  model.gwoDifficultySettings.simpleSystems(),
                content: game.content(),
                coopPlayersForSystemGeneration: playerCount,
                minStarDistance: 2,
                maxStarDistance: 4,
                maxConnections: 4,
                largePlanets: largePlanets,
                gwoSystemBrackets: systemBrackets.brackets,
                gwoBiomeProviders: systemBrackets.providers,
              });
            }
          );

          var onStartCardDealt = function (startCardProduct) {
            game.inventory().cards.push(startCardProduct);
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
            // One race per faction, Cluster included; each takes a Unique
            // Races slot, as does the player's race. See races.md.
            raceByFaction = gwoRaces.assign(
              teamsRng.stream("races"),
              aiFactions,
              enemyRacePool,
              {
                unique: model.gwoDifficultySettings.uniqueRaces(),
                taken: [playerRace],
              }
            );
            // Wrapped, not passed by reference: _.map would hand getTeam's rng
            // parameter the array index.
            var teams = _.map(aiFactions, function (faction) {
              return gwoTeams.getTeam(faction, teamsRng);
            });
            // Filter before anything is sampled, so an incompatible minion
            // can never be spread onto the galaxy as a worker AI. Keyed per
            // team: each faction's race decides whether its AIs run Queller.
            _.forEach(teams, function (team, teamIndex) {
              var race = raceByFaction[aiFactions[teamIndex]];
              if (
                gwoPopulation.brainForRace(warBrains(), race, "enemy") !==
                "Queller"
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
              // Keyed per team by spawn order, which the synchronous spread
              // keeps deterministic. See galaxy.md.
              gwoPopulation.giveRace(
                warRng
                  .stream("race", ai.faction)
                  .stream("worker", teamInfo[ai.team].workers.length),
                ai,
                raceByFaction[ai.faction],
                false
              );
              teamInfo[ai.team].workers.push({
                ai: ai,
                star: star,
              });
            };

            var onBossMade = function (ai) {
              ai.faction = teamInfo[ai.team].faction;
              gwoPopulation.giveRace(
                warRng.stream("race", ai.faction),
                ai,
                raceByFaction[ai.faction],
                true
              );
              teamInfo[ai.team].boss = ai;
            };

            var handleSpread = function (star, ai) {
              var team = teams[ai.team];
              return makeWorker(team, ai).then(
                onWorkerMade.bind(null, team, ai, star)
              );
            };

            var handleBoss = function (star, ai) {
              return gwoTeams
                .makeBoss(
                  star,
                  ai,
                  teams[ai.team],
                  undefined, // stock's sst parameter, which makeBoss never reads
                  // Keyed by team: makeBoss generates a system, so these resolve out of
                  // order. Stock omits the seed entirely.
                  warRng.stream("boss", ai.team).int(0, 2147483647)
                )
                .then(onBossMade.bind(null, ai));
            };

            var returnTeamInfo = function () {
              return teamInfo;
            };

            return gwoBreeder
              .populate({
                galaxy: game.galaxy(),
                teams: teams,
                neutralStars: 4,
                orderedSpawn: false,
                // Picks each faction's spawn star and shuffles the spawn order.
                rng: warRng.stream("breeder"),
                spawn: function () {},
                canSpread: _.constant(true),
                spread: handleSpread,
                boss: handleBoss,
                breedToOrigin: game.isTutorial(),
              })
              .then(returnTeamInfo);
          };

          var populate = moveIn.then(onMovedIn);

          var treasurePlanetStar;

          var onPopulated = function (teamInfo) {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            var outcome = gwoPopulation.populate(
              {
                galaxy: game.galaxy(),
                factions: GWFactions,
                aiFactions: aiFactions,
                raceByFaction: raceByFaction,
                playerRace: playerRace,
                playerFaction: model.playerFactionIndex(),
                playerCount: playerCount,
                settings: model.gwoDifficultySettings,
                tier: warTierData,
                brains: warBrains(),
                rng: warRng,
                lore: { neutral: neutralLore, ai: aiLore },
                startCardBreaksAllies: startCardAllyCompatibility(game),
                sharedSystems: sharedSystemsForGalacticWarActive,
              },
              teamInfo
            );
            if (outcome.failed) {
              warGenerationFailed = true;
            }
            if (outcome.spawnShortage) {
              spawnShortage = true;
            }
            treasurePlanetStar = outcome.treasureStar;
          };

          var finishAis = populate.then(onPopulated);

          var onAisFinished = function () {
            if (warGenerationFailed === true) {
              return;
            }

            // Hacky way to store war information for the gw_play scene
            gwoAI.originSystem(game).gwaio = gwoWarRecord.build({
              seed: model.newGameSeed(),
              tier: selectedTier,
              tierData: warTierData,
              galaxySize:
                galaxySizeNames[model.newGameSizeIndex()] || "!LOC:Unknown",
              settings: model.gwoDifficultySettings,
              devMode: model.devMode(),
              brains: warBrains(),
              installedRaces: installedRaces,
              treasureStar: treasurePlanetStar,
              playerCount: playerCount,
              playerRace: playerRace,
              raceByFaction: raceByFaction,
              raceInfo: raceInfo,
              perPlayerTechCards: model.newGamePerPlayerTechCards(),
              galaxy: game.galaxy(),
            });
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
              warGenerationFailure(
                spawnShortage ? generationFailure.SPAWN_SHORTAGE : undefined
              );
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
        gwoReady(true);
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
