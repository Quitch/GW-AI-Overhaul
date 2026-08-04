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

    // Set once shared/favourites.js and shared/favourite_loadouts.js finish
    // loading (see the requireGW call below) - kept as plain closure
    // variables (not per-card properties) so model.gwoIsFavourite/
    // model.gwoToggleFavourite are safe to bind against immediately, rather
    // than depending on Knockout's foreach clone/bind timing lining up with
    // an async module load.
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

      // Reordering can move the active card to a new index; keep the same
      // loadout selected (by id, not stale index).
      if (activeId) {
        var newIndex = _.findIndex(model.startCards(), function (c) {
          return cardId(c) === activeId;
        });
        if (newIndex !== -1) {
          model.activeStartCardIndex(newIndex);
        }
      }
    };

    // Injected into the still-unbound #start-cards .card template before
    // ko.applyBindings(model) runs (loadMods always executes before
    // applyBindings, in the same document.ready flow in gw_start.js), so
    // Knockout's foreach clones this markup, correctly bound per-card, for
    // every unlocked loadout automatically. Targets only .card, never
    // .card_locked, so locked loadouts structurally never get the button.
    // Routed through model.gwoToggleFavourite/model.gwoIsFavourite (always
    // defined, above) rather than a per-card toggleFavourite/isFavourite
    // property, so this binding never depends on per-card attachment timing.
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

    // Held so the galaxy build can wait on it: this resolves asynchronously and nothing
    // stops the player clicking Go To War first.
    var modsMounted = api.mods.getMounted("client", true).then(onModsMounted);

    var foundationFaction = 1;

    // Index into ai_tech.js's factionTechs[faction][n]. 5 is absent because that
    // tech was removed; see the note by setupAITech5 there.
    var aiBuffType = {
      cost: 0,
      damage: 1,
      health: 2,
      speed: 3,
      build: 4,
      combat: 6,
      cooldown: 7,
    };

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
          // warGenerationFailed aborts the run, but the caller concats this
          // result straight into personality_tags first - returning undefined
          // there would append a literal undefined tag.
          return [];
      }
    };

    // Helpers that draw take an rng (shared/gwo_rng.js) as their first parameter rather
    // than closing over one: the war's seed is only known inside navToNewGame, below.
    // See galaxy.md, "Determinism and the war seed".
    var selectAIBuffs = function (rng, numberOfBuffs) {
      return rng.sample(_.values(aiBuffType), numberOfBuffs);
    };

    var setupAIBuffs = function (rng, distance, buffDistanceDelay) {
      // Negative near the origin once a tech handicap applies; rng.sample clamps to [].
      var numberBuffs = Math.floor(distance / 2 - buffDistanceDelay);
      return selectAIBuffs(rng, numberBuffs);
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

    var selectMinion = function (rng, minions, faction, minionName) {
      var isCluster = minionName === "Worker" || minionName === "Security";
      var selectedMinion;
      if (isCluster) {
        selectedMinion = _.cloneDeep(
          rng.pick(
            _.filter(minions, {
              name: minionName,
            })
          )
        );
      } else {
        selectedMinion = _.cloneDeep(rng.pick(minions));
      }
      // Returns undefined on failure. Every call site must check before using the
      // result: these run inside jQuery deferred callbacks, where a throw is not
      // converted into a rejection, so a TypeError here escapes
      // .fail(onWarGenerationError) entirely - no seed retry, and Go To War hangs.
      if (_.isUndefined(selectedMinion)) {
        console.error("No minion found for faction " + faction);
        warGenerationFailed = true;
      }
      return selectedMinion;
    };

    var randomPercentageAdjustment = function (rng, min, max) {
      return rng.float(min, max);
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
    var aiEconRate = function (rng, distance, playerCount) {
      var difficulty = model.gwoDifficultySettings;
      var ecoBase = Number.parseFloat(difficulty.econBase());
      var ecoStep = Number.parseFloat(difficulty.econRatePerDist());
      var eco =
        (ecoBase + distance * ecoStep) *
        randomPercentageAdjustment(rng, 0.9, 1.1);

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

    // Both bounds are inclusive, so rng.int(0, 100) would have 101 outcomes and a 0%
    // chance would still fire about once per hundred rolls. Hence starting at 1.
    var gameModeEnabled = function (rng, gameModeChance) {
      return rng.int(1, 100) <= gameModeChance;
    };

    var enableAnEradicationModeTypes = function (rng, ai) {
      var numberOfModes = rng.int(1, 3);
      var modes = ["SubCommanders", "Factories", "Fabbers"];

      _.forEach(rng.sample(modes, numberOfModes), function (mode) {
        ai["eradicationMode" + mode] = true;
      });
    };

    var startCardAllyCompatibility = function (game) {
      var gwoStarCardsWhichBreakAllies = [
        "nem_start_deepspace",
        "gwaio_start_tourist",
      ];
      // global for modder compatibility - merge in any modder-added ids
      if (_.isArray(model.gwoStarCardsWhichBreakAllies)) {
        gwoStarCardsWhichBreakAllies = gwoStarCardsWhichBreakAllies.concat(
          model.gwoStarCardsWhichBreakAllies
        );
      }
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

      // The personality picker has no data-bind, so its value only reaches the
      // snapshot below if we push it back - otherwise a Custom difficulty player's
      // modifier picks revert to the last preset's on the next scene load.
      //
      // Do it here, once, and only when it actually changed. Writing it from
      // setAIPersonality instead - which runs per AI, per minion, per foe and per
      // ally - added ten seconds to Go To War back when personalityTags was a
      // dependency of the difficulty computed in gw_start/ui.js, so each write
      // re-rendered every dropdown on the page. That computed no longer reads the
      // observable it writes, but a single write at save time is still the right
      // shape: the picker has no binding to keep it in step with per-AI churn.
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
        loadouts,
        favouriteLoadoutsModule,
        favouritesModule,
        gwoVersion,
        gwoSystemBrackets,
        gwoRng,
        gwoFactionSeed,
        chooseStarSystemTemplates
      ) {
        // Assign the outer closure vars (declared at the top of gwoSetup(),
        // where model.gwoIsFavourite/model.gwoToggleFavourite are defined)
        // now that these async dependencies have actually loaded.
        gwoFavouriteLoadouts = favouriteLoadoutsModule;
        gwoFavourites = favouritesModule;

        model.startCards(
          gwoFavouriteLoadouts.sortCardsByFavourite(
            loadouts.startCards,
            gwoFavourites.ids(),
            cardId
          )
        );
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

        // titansAITags is optional: concat would otherwise append a literal undefined
        // to personality_tags, which the save round-trips back as null.
        var setupPenchantAI = function (rng, ai, titansAITags) {
          var penchantValues = gwoAI.penchants(rng);
          ai.personality.personality_tags =
            ai.personality.personality_tags.concat(
              penchantValues.penchants,
              titansAITags || []
            );
          ai.penchantName = penchantValues.penchantName;
        };

        var setAIPersonality = function (rng, ai, difficulty, faction) {
          var personalityId = "#gwo-personality-picker";
          var personality = ai.personality;

          personality.micro_type = difficulty.microType();
          // The stringBoolean extender reads back "true"/"false" strings so the
          // dropdowns can bind to it; the AI personality contract is real booleans
          // (see referee_subcommander_tech.js and the base game's gw_balance.js).
          // .raw is the underlying observable the extender wraps.
          personality.go_for_the_kill = difficulty.goForKill.raw();
          personality.priority_scout_metal_spots =
            difficulty.priorityScoutMetalSpots.raw();
          personality.factory_build_delay_min =
            difficulty.factoryBuildDelayMin();
          personality.factory_build_delay_max =
            difficulty.factoryBuildDelayMax();
          personality.unable_to_expand_delay = difficulty.unableToExpandDelay();
          personality.enable_commander_danger_responses =
            difficulty.enableCommanderDangerResponses.raw();
          personality.per_expansion_delay = difficulty.perExpansionDelay();
          personality.max_basic_fabbers = difficulty.maxBasicFabbers();
          personality.max_advanced_fabbers = difficulty.maxAdvancedFabbers();
          // Read only. The write back into gwoDifficultySettings.personalityTags
          // happens once in saveDifficultySettings - see the note there.
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
              setupPenchantAI(rng, ai, titansAITags);
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

        // model.playerFactionIndex is a raw observable; the base game only ever
        // resolves a faction from it through its playerFaction computed, which
        // wraps with % GWFactions.length (gw_start.js). That was academic in
        // vanilla, where GWFactions is always four entries, but this mod's
        // gw_factions.js appends Cluster only under Titans - so an index of 4
        // saved while playing as Cluster can be restored (gw_start/ui.js's
        // restorePreviousSettings, out of localStorage) into a session running
        // classic PA content, where it addresses nothing.
        //
        // Unwrapped, that index makes aiFactions.splice() remove no faction at
        // all - the player's own faction becomes an enemy and the war gets a
        // full four enemy factions instead of three - and makes
        // GWFactions[playerFaction] undefined when an allied commander is
        // rolled, which throws inside a jQuery deferred callback and so escapes
        // .fail(onWarGenerationError) entirely (see selectMinion's note above).
        var playerFactionIndex = function () {
          return model.playerFactionIndex() % GWFactions.length;
        };

        // Never rejects: every failure - no ticked sources, a dead sharing server,
        // nothing derivable - resolves undefined and leaves the galaxy on Shared Systems'
        // own pick. Rejecting would spend warGenerationFailure's five reseeded retries on
        // a condition no seed can change.
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
                // load() caches per source, so this costs nothing when Shared Systems
                // asks for the same pool later. Its loading/selected observables drive
                // that mod's own spinner - leave them alone.
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

          console.log("War created using Galactic War Overhaul v" + gwoVersion);

          // Everything random about this war hangs off here. See galaxy.md,
          // "Determinism and the war seed", for the stream layout.
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

            // Scatter some AIs
            aiFactions = teamsRng.shuffle(aiFactions);
            // Wrapped, not passed by reference: _.map would hand getTeam's rng
            // parameter the array index.
            var teams = _.map(aiFactions, function (faction) {
              return GWTeams.getTeam(faction, teamsRng);
            });
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

            // Ordered rather than keyed: the breeder's spread loop is synchronous, and
            // the _.remove below mutates remainingMinions so order is load-bearing.
            // See galaxy.md.
            var workersRng = warRng.stream("workers");

            // GWTeams.makeWorker() replaced to allow use of _.cloneDeep()
            // to preserve personality_tags. Defined here (a sibling of handleSpread
            // below) rather than nested inside it, taking team/ai/star as explicit
            // params, so the promise callbacks don't sit six function-levels deep.
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
              return GWTeams.makeBoss(
                star,
                ai,
                teams[ai.team],
                systemTemplates,
                // Keyed by team: makeBoss generates a system, so these resolve out of
                // order. Stock omits the seed entirely.
                warRng.stream("boss", ai.team).int(0, 2147483647)
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
              // Picks each faction's spawn star and shuffles the spawn order.
              rng: warRng.stream("breeder"),
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
            if (
              sharedSystemsForGalacticWarActive === false &&
              ai.faction === foundationFaction &&
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

              setAIPersonality(bossRng, boss, difficulty, boss.faction);
              boss.econ_rate = aiEconRate(bossRng, maxDist);
              var bossCommanders = bossCommanderCount(difficulty, playerCount);
              boss.bossCommanders = bossCommanders;

              boss.inventory = [];

              if (boss.isCluster === true) {
                boss.inventory = gwoCluster.clusterCommanderMods;
              }

              var factionTechHandicap = Number.parseFloat(
                difficulty.factionTechHandicap()
              );
              var bossBuffs = setupAIBuffs(
                bossRng,
                maxDist,
                factionTechHandicap
              );
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
                    maxDist,
                    playerCount
                  );
                  if (boss.isCluster === true) {
                    minion.commanderCount = numMinions;
                  }
                  boss.minions.push(minion);
                });
              }

              _.forEach(workerPool, function (worker, workerIndex) {
                var ai = worker.ai;
                var aiRng = teamRng.stream("worker", workerIndex);

                ai.landAnywhere = gameModeEnabled(
                  aiRng,
                  difficulty.landAnywhereChance()
                );
                ai.suddenDeath = gameModeEnabled(
                  aiRng,
                  difficulty.suddenDeathChance()
                );
                ai.bountyMode = gameModeEnabled(
                  aiRng,
                  difficulty.bountyModeChance()
                );
                ai.bountyModeValue = Number.parseFloat(
                  difficulty.bountyModeValue()
                );
                ai.eradicationMode = gameModeEnabled(
                  aiRng,
                  difficulty.eradicationModeChance()
                );
                enableAnEradicationModeTypes(aiRng, ai);

                var dist = worker.star.distance();

                numMinions = countMinions(mandatoryMinions, minionMod, dist);

                setAIPersonality(aiRng, ai, difficulty, ai.faction);
                ai.econ_rate = aiEconRate(aiRng, dist, playerCount);

                ai.inventory = [];

                if (ai.isCluster === true) {
                  ai.inventory = gwoCluster.clusterCommanderMods;
                }

                var workerBuffs = setupAIBuffs(
                  aiRng,
                  dist,
                  factionTechHandicap
                );
                ai.typeOfBuffs = workerBuffs; // for intelligence reports
                ai.inventory = aiTech(
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
                  if (gameModeEnabled(foeRng, difficulty.ffaChance())) {
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
                      numFoes = clusterCommanderCount(
                        numMinions,
                        bossCommanders
                      );
                    }
                    foeCommander.commanderCount = numFoes;

                    foeCommander.inventory = [];
                    if (foeCommander.isCluster === true) {
                      foeCommander.inventory = gwoCluster.clusterCommanderMods;
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

                var allyRng = aiRng.stream("ally");
                if (
                  !startCardBreaksAllies &&
                  gameModeEnabled(allyRng, difficulty.alliedCommanderChance())
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
                      setupPenchantAI(allyRng, ai.ally);
                    }
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
            var treasureRng = warRng.stream("treasure");
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
                    ai.econ_rate = aiEconRate(treasureRng, maxDist);
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

                    if (!_.isEmpty(lockedStartCards)) {
                      var treasurePlanetCard =
                        treasureRng.pick(lockedStartCards);
                      _.assign(treasurePlanetCard, { allowOverflow: true });
                      star.cardList().push(treasurePlanetCard);
                      system.description =
                        "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.";
                    }
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

            // Without this the counter never returns to 0, so warGenerationFailure's
            // five retries are cumulative across the session rather than per war.
            warGenerationAttempts = 0;

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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoSetup();
