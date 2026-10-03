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
      '<div class="gwo-favourite-btn gwo-tip" data-bind="' +
        "click: function () { model.gwoToggleFavourite($data); }, " +
        "clickBubble: false, " +
        "css: { on: model.gwoIsFavourite($data) }, " +
        "click_sound: 'default', rollover_sound: 'default', " +
        "tooltip: '!LOC:Toggle Favourite'" +
        '"></div>'
    );

    // Prevent changes to settings causing creation of new galaxies
    model.makeGame = function () {};

    // Not stock's makeGameBusy: under Shared Systems for Galactic War, stock's
    // own first makeGame fails and never clears it.
    var generatingWar = ko.observable(false);
    var systemSourceChosen = ko.observable(true);
    var gwoReady = ko.observable(false); // the modules below have loaded
    var sharedSystemsForGalacticWarActive = false;
    var defaultNewGameName = model.newGameName();
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
        !generatingWar() &&
        systemSourceChosen() &&
        !!activeCard &&
        !activeCard.gwoRaceLocked
      );
    });

    var onSelectedNamesChanged = function (names) {
      systemSourceChosen(!_.isEmpty(names));
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/favourite_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_selection.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/favourites.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/gw_system_brackets.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_seed.js",
        "main/game/galactic_war/shared/js/systems/template-loader",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/galaxy_build.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/war_generation_failure.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/war_generation.js",
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
        gwoGenerationFailure,
        gwoWarGeneration
      ) {
        // Replaces GWGalaxy.prototype.build, which war generation calls.
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

        var warGeneration = gwoWarGeneration(
          {
            GW: GW,
            GWFactions: GWFactions,
            gwoBreeder: gwoBreeder,
            gwoTeams: gwoTeams,
            gwoLore: gwoLore,
            gwoPopulation: gwoPopulation,
            gwoWarRecord: gwoWarRecord,
            gwoDifficulty: gwoDifficulty,
            gwoAI: gwoAI,
            gwoVersion: gwoVersion,
            gwoSystemBrackets: gwoSystemBrackets,
            gwoRng: gwoRng,
            gwoFactionSeed: gwoFactionSeed,
            chooseStarSystemTemplates: chooseStarSystemTemplates,
            gwoBiomeMods: gwoBiomeMods,
            gwoRaces: gwoRaces,
            gwoPromise: gwoPromise,
            generationFailure: gwoGenerationFailure,
          },
          {
            generatingWar: generatingWar,
            sharedSystemsActive: function () {
              return sharedSystemsForGalacticWarActive;
            },
            modsMounted: modsMounted,
            defaultNewGameName: defaultNewGameName,
            startCardsLoaded: loaded,
            processedStartCards: processedStartCards,
            syncPickedTags: syncPickedTags,
            saveDifficultySettings: saveDifficultySettings,
          }
        );

        // replicates the functionality of model.makeGame() but
        // only generates the galaxy once the player clicks Go To War
        model.navToNewGame = function () {
          if (!model.ready()) {
            return;
          }
          // Before generation, so a war that fails to generate still logs it.
          if (_.isFunction(model.gwoLogBugReport)) {
            model.gwoLogBugReport("Go To War clicked");
          }
          warGeneration.start();
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
