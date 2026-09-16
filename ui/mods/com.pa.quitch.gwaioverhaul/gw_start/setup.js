(() => {
  try {
    const cardId = (card) => (card && card.id ? card.id() : undefined);

    // Closure vars, not per-card properties, so the model.gwo* functions below
    // are bindable before the requireGW call sets these.
    let gwoFavourites;
    let gwoFavouriteLoadouts;

    model.gwoIsFavourite = (card) =>
      !!gwoFavourites && gwoFavourites.has(cardId(card));

    model.gwoToggleFavourite = (card) => {
      if (!gwoFavourites) {
        return;
      }

      const activeCard = model.activeStartCard();
      const activeId = activeCard && cardId(activeCard);

      gwoFavourites.toggle(cardId(card));

      model.startCards(
        gwoFavouriteLoadouts.sortCardsByFavourite(
          model.startCards(),
          gwoFavourites.ids(),
          cardId,
        ),
      );

      // Reordering moves the active card, so reselect by id, not stale index.
      if (activeId) {
        const newIndex = _.findIndex(
          model.startCards(),
          (c) => cardId(c) === activeId,
        );
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
        '"></div>',
    );

    model.makeGame = () => {}; // Prevent changes to settings causing creation of new galaxies

    const enableGoToWar = ko.observable(true);
    const gwoReady = ko.observable(false); // the modules below have loaded
    let sharedSystemsForGalacticWarActive = false;
    const defaultNewGameName = model.newGameName();
    let warGenerationFailed;

    // We change how we monitor model.ready() to prevent
    // Shared Systems for Galactic War breaking our new lobby
    model.ready = ko.computed(() => {
      const activeCard = model.activeStartCard();
      return (
        gwoReady() &&
        enableGoToWar() &&
        !!activeCard &&
        !activeCard.gwoRaceLocked
      );
    });

    const onSelectedNamesChanged = (names) => {
      if (_.isEmpty(names)) {
        enableGoToWar(false);
      } else {
        enableGoToWar(true);
      }
    };

    const onModsMounted = (mods) => {
      const modMounted = (modIdentifier) =>
        _.some(mods, { identifier: modIdentifier });
      if (modMounted("com.wondible.pa.gw_shared_systems")) {
        sharedSystemsForGalacticWarActive = true;
        model.selectedNames.subscribe(onSelectedNamesChanged);
      }
    };

    // Held so the galaxy build can wait on it - nothing stops the player
    // clicking Go To War before this resolves.
    const modsMounted = api.mods.getMounted("client", true).then(onModsMounted);

    const foundationFaction = 1;

    // Index into ai_tech.js's factionTechs[faction][n]. 5 is absent because that
    // tech was removed; see the note in ai_tech.js where the setupAITech*
    // functions are called.
    const aiBuffType = {
      cost: 0,
      damage: 1,
      health: 2,
      speed: 3,
      build: 4,
      combat: 6,
      cooldown: 7,
    };

    // Drawing helpers take an rng parameter rather than closing over one: the
    // seed is only known inside navToNewGame. See galaxy.md.
    const selectAIBuffs = (rng, numberOfBuffs) =>
      rng.sample(_.values(aiBuffType), numberOfBuffs);

    const setupAIBuffs = (rng, distance, buffDistanceDelay) => {
      // Negative near the origin once a tech handicap applies; rng.sample clamps to [].
      const numberBuffs = Math.floor(distance / 2 - buffDistanceDelay);
      return selectAIBuffs(rng, numberBuffs);
    };

    const countMinions = (minionBase, minionStep, distance) =>
      Math.floor(minionBase + distance * minionStep);

    const clusterCommanderCount = (minionCount, bossCommanders) =>
      minionCount + Math.floor(bossCommanders / 2);

    const selectMinion = (rng, minions, faction, minionName) => {
      const isCluster = minionName === "Worker" || minionName === "Security";
      let selectedMinion;
      if (isCluster) {
        selectedMinion = _.cloneDeep(
          rng.pick(
            _.filter(minions, {
              name: minionName,
            }),
          ),
        );
      } else {
        selectedMinion = _.cloneDeep(rng.pick(minions));
      }
      // Call sites must check the result. These run inside jQuery deferred
      // callbacks, where a throw escapes .fail() instead of rejecting, so a
      // TypeError here hangs Go To War with no seed retry.
      if (_.isUndefined(selectedMinion)) {
        console.error(`No minion found for faction ${faction}`);
        warGenerationFailed = true;
      }
      return selectedMinion;
    };

    const randomPercentageAdjustment = (rng, min, max) => rng.float(min, max);

    const aiEcoMinionReduction = (
      eco,
      ecoStep,
      distance,
      minionBase,
      minionStep,
    ) => {
      let minions = 0;
      let previousMinions = 0;

      if (distance > 0) {
        minions = countMinions(minionBase, minionStep, distance);
        previousMinions = countMinions(minionBase, minionStep, distance - 1);
      }

      if (minions > previousMinions) {
        return eco - ecoStep;
      }

      return eco;
    };

    // Omitting playerCount skips the minion-count reduction (e.g. a boss's own rate).
    const aiEconRate = (rng, distance, playerCount) => {
      const difficulty = model.gwoDifficultySettings;
      const ecoBase = Number.parseFloat(difficulty.econBase());
      const ecoStep = Number.parseFloat(difficulty.econRatePerDist());
      let eco =
        (ecoBase + distance * ecoStep) *
        randomPercentageAdjustment(rng, 0.9, 1.1);

      if (playerCount) {
        const minionBase = difficulty.mandatoryMinions() * playerCount;
        const minionStep =
          Number.parseFloat(difficulty.minionMod()) * playerCount;
        eco = aiEcoMinionReduction(
          eco,
          ecoStep,
          distance,
          minionBase,
          minionStep,
        );
      }

      return Math.max(ecoBase, eco);
    };

    // rng.int bounds are inclusive - from 0, a 0% chance would still fire 1 in 101.
    const gameModeEnabled = (rng, gameModeChance) =>
      rng.int(1, 100) <= gameModeChance;

    const enableAnEradicationModeTypes = (rng, ai) => {
      const numberOfModes = rng.int(1, 3);
      const modes = ["SubCommanders", "Factories", "Fabbers"];

      _.forEach(rng.sample(modes, numberOfModes), (mode) => {
        ai[`eradicationMode${mode}`] = true;
      });
    };

    const startCardAllyCompatibility = (game) => {
      let gwoStarCardsWhichBreakAllies = [
        "nem_start_deepspace",
        "gwaio_start_tourist",
      ];
      // global for modder compatibility - merge in any modder-added ids.
      // GWO never creates this one, so the mod's loader has to
      if (Array.isArray(model.gwoStarCardsWhichBreakAllies)) {
        gwoStarCardsWhichBreakAllies = gwoStarCardsWhichBreakAllies.concat(
          model.gwoStarCardsWhichBreakAllies,
        );
      }
      return _.some(
        gwoStarCardsWhichBreakAllies,
        (card) => card === game.inventory().cards()[0].id,
      );
    };

    const setupQuellerFFATag = (ais) => {
      if (!ais) {
        return;
      }

      const ffa = ["ffa", "platoon"];

      if (Array.isArray(ais)) {
        _.forEach(ais, (ai) => {
          ai.personality.personality_tags =
            ai.personality.personality_tags.concat(ffa);
        });
      } else {
        ais.personality.personality_tags =
          ais.personality.personality_tags.concat(ffa);
      }
    };

    // The personality picker has no data-bind, so its value only reaches the
    // settings if pushed back here.
    const syncPickedTags = () => {
      const settings = model.gwoDifficultySettings;
      const pickedTags = $("#gwo-personality-picker").val() || [];
      if (!_.isEqual(pickedTags, settings.personalityTags())) {
        settings.personalityTags(pickedTags);
      }
    };

    const saveDifficultySettings = () => {
      const settings = model.gwoDifficultySettings;
      syncPickedTags();

      const settingNames = _.without(_.keys(settings), "previousSettings");
      const snapshot = {};
      _.forEach(settingNames, (name) => {
        snapshot[name] = settings[name]();
      });
      settings.previousSettings(snapshot);
    };

    let warGenerationAttempts = 0;
    // The seed the player actually asked for, captured on the first attempt of a run.
    let warGenerationBaseSeed;

    const warGenerationFailure = () => {
      model.makeGameBusy(false);
      enableGoToWar(true);
      if (warGenerationAttempts < 5) {
        // Derived, not re-rolled, so an entered seed reproduces the whole retry chain.
        model.newGameSeed(`${warGenerationBaseSeed}-${warGenerationAttempts}`);
        model.navToNewGame();
      } else {
        warGenerationAttempts = 0;
        console.error("Failed to generate valid war");
      }
    };

    const bossCommanderCount = (difficulty, playerCount) =>
      difficulty.bossCommanders() * playerCount;

    const galaxySizeNames = [
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

    const generatedWarName = (
      selectedDifficulty,
      playerCount,
      sizeIndex,
      startCard,
      difficulties,
    ) => {
      const difficultyName = loc(
        difficulties[selectedDifficulty].difficultyName,
      );
      const players = `${playerCount} ${loc("!LOC:Players")}`;
      const sizeName = loc(galaxySizeNames[sizeIndex] || "!LOC:Unknown");
      const startCardSummary =
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/galaxy_build.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
      ],
      (
        GW,
        GWFactions,
        gwoBreeder,
        gwoTeams,
        gwoLore,
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
        gwoBiomes,
        gwoGalaxyBuild,
        gwoRaces,
        gwoPromise,
        gwoBrainTable,
        gwoPersonality,
        gwoUrl,
      ) => {
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
        const isRaceLocked = (card) => !!card.gwoRaceLocked;

        // ui.js swaps activeStartCardIndex for the remembered setting, but
        // stock's activeStartCard computed still tracks the observable it was
        // built on, so until the list first changes it peeks stock card 0.
        // The first build therefore resolves the id from the new list at the
        // remembered index; later builds preserve the id already selected.
        let built = false;
        model.gwoRebuildStartCards = () => {
          const savedIndex = model.activeStartCardIndex.peek();
          const previousId = built
            ? cardId(model.activeStartCard.peek())
            : undefined;
          model.startCards(
            gwoFavouriteLoadouts.sortCardsByFavourite(
              loadouts.startCards(),
              gwoFavourites.ids(),
              cardId,
            ),
          );
          const cards = model.startCards.peek();
          const activeId =
            previousId || (cards[savedIndex] && cardId(cards[savedIndex]));
          const index = loadoutSelection.selectableIndex(
            cards,
            activeId,
            cardId,
            isRaceLocked,
          );
          if (index !== -1) {
            model.activeStartCardIndex(index);
          }
          built = true;
        };
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
          model.gwoRebuildStartCards();
        });
        const processedStartCards = {};
        let loadCount = loadouts.allCards.length;
        const loaded = $.Deferred();

        _.forEach(loadouts.allCards, (card) => {
          requireGW([`cards/${card.id}`], (cardFile) => {
            // A third-party loadout whose module returns nothing still has to
            // count towards the tally, or `loaded` never resolves and Go To War
            // spins with no reseed - see selectMinion's note below.
            if (cardFile) {
              cardFile.id = card.id;
              processedStartCards[card.id] = cardFile;
            } else {
              console.error("Start card loaded but returned nothing:", card.id);
            }
            --loadCount;
            if (loadCount === 0) {
              loaded.resolve();
            }
          });
        });

        const gwoDealStartCard = (params) => {
          const result = $.Deferred();

          const onCardsLoaded = () => {
            const card = _.find(processedStartCards, { id: params.id });
            if (!card) {
              console.error("No matching start card ID found");
              warGenerationFailed = true;
              // Must reject, not fall through - see selectMinion's note on throws
              // inside jQuery deferred callbacks.
              result.reject(`no matching start card ID: ${params.id}`);
              return;
            }
            const product = { id: params.id };
            let deal;
            // Same reasoning as the missing-card branch above: a third-party
            // loadout that throws must reject rather than escape the deferred.
            try {
              const context =
                card.getContext &&
                card.getContext(params.galaxy, params.inventory);
              deal = card.deal && card.deal(params.star, context);
              const cardParams = deal && deal.params;
              if (cardParams && _.isPlainObject(cardParams)) {
                _.assign(product, cardParams);
              }
              card.keep && card.keep(deal, context);
              card.releaseContext && card.releaseContext(context);
            } catch (e) {
              console.error(
                "Start card threw while being dealt:",
                params.id,
                e,
              );
              warGenerationFailed = true;
              result.reject(`start card threw: ${params.id}`);
              return;
            }
            result.resolve(product, deal);
          };

          loaded.then(onCardsLoaded);
          return result;
        };

        // The brain an AI of this race runs on that side: the per-race table
        // with the war-wide dropdowns as its fallback. See races.md.
        const brainForRace = (race, side) => {
          const settings = model.gwoDifficultySettings;
          return gwoBrainTable.resolve(
            settings.aiByRace(),
            settings.ai(),
            settings.aiAlly(),
            side,
            race,
          );
        };

        // The AI's race is assigned before any personality, so the brain its
        // race actually runs is known here; a Penchant AI draws one penchant
        // from its own stream. The personality is built fresh from the
        // template's id, never edited on the template: stock's own makeGame
        // writes into the templates. See galaxy.md.
        const setAIPersonality = (rng, ai, tier, faction) => {
          const brain = brainForRace(ai.race, "enemy");
          if (brain === "Penchant") {
            ai.penchantName = gwoAI.penchants(rng).penchantName;
          } else if (brain !== "Queller" && brain !== "Titans") {
            console.error("Undefined AI type:", brain);
            warGenerationFailed = true;
          }
          if (brain === "Queller" && !gwoPersonality.FACTION_IDS[faction]) {
            console.error("Undefined faction:", faction);
            warGenerationFailed = true;
          }
          ai.personality = gwoPersonality.resolve(ai, {
            side: "enemy",
            faction,
            tier,
            brain,
            penchantTags: gwoAI.penchantTags(ai.penchantName),
          });
        };

        // Must wrap, as stock's playerFaction computed does: gw_factions.js
        // appends Cluster only under Titans, so a stored index of 4 can be
        // restored into a session where it addresses nothing.
        const playerFactionIndex = () =>
          model.playerFactionIndex() % GWFactions.length;

        // Bosses keep their commander and are retagged at launch; every other AI
        // of a race fields one of the race's own commanders. See races.md.
        const giveRace = (rng, ai, race, keepCommander) => {
          ai.race = gwoRaces.isMla(race) ? gwoRaces.MLA_ID : race;
          if (!keepCommander && !gwoRaces.isMla(race)) {
            const commander = gwoRaces.commanderFor(
              rng.stream("commander"),
              race,
            );
            if (commander) {
              ai.commander = commander;
            }
          }
          return ai;
        };

        // Never rejects - every failure resolves undefined. Rejecting would spend
        // warGenerationFailure's retries on a condition no reseed can change.
        const loadSystemBrackets = () => {
          const ready = $.Deferred();

          const withoutBrackets = () => {
            ready.resolve(undefined);
          };

          const onSystemsLoaded = function () {
            // $.when hands back one array per source.
            const systems = _.flatten(_.toArray(arguments));
            gwoBiomeMods.providers().then((providers) => {
              const built = gwoSystemBrackets.bracketsFrom(systems, providers);
              ready.resolve(
                built.length ? { brackets: built, providers } : undefined,
              );
            });
          };

          const onOptionsLoaded = (options) => {
            const loading = [];
            _.forEach(model.selectedNames(), (name) => {
              const option = _.find(options, "name", name);
              if (option) {
                // load() caches per source. Its loading/selected observables
                // drive Shared Systems' own spinner - leave them alone.
                // It belongs to another mod, so a throw here would escape the
                // deferred callback and leave Go To War waiting on `ready`.
                try {
                  loading.push(option.load());
                } catch (e) {
                  console.error("System source failed to load:", name, e);
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
          gwoPromise.settled(modsMounted).then(() => {
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
        const tierSnapshot = () => {
          syncPickedTags();
          const settings = model.gwoDifficultySettings;
          const snapshot = {};
          _.forEach(gwoDifficulty.tierSettings, (setting) => {
            const value = settings[setting.name]();
            snapshot[setting.key] =
              _.isString(value) && value !== "" && !_.isNaN(Number(value))
                ? Number(value)
                : value;
          });
          return snapshot;
        };

        // replicates the functionality of model.makeGame() but
        // only generates the galaxy once the player clicks Go To War
        model.navToNewGame = () => {
          if (!model.ready()) {
            return;
          }

          enableGoToWar(false);
          warGenerationFailed = false;
          warGenerationAttempts++;
          if (warGenerationAttempts === 1) {
            warGenerationBaseSeed = model.newGameSeed();
          }

          const busyToken = {};
          model.makeGameBusy(busyToken);

          // Everything random about this war hangs off here. See galaxy.md.
          const warRng = gwoRng.create(model.newGameSeed());
          // Must precede every read of GWFactions: getTeam below shallow-copies a team,
          // snapshotting systemDescription by value.
          gwoFactionSeed.reseed(GWFactions, warRng.stream("factions"));
          const teamsRng = warRng.stream("teams");
          const loreRng = warRng.stream("lore");
          const raceInfo = (model.gwoRaceInfo && model.gwoRaceInfo()) || {
            races: [],
            mods: [],
            addonMods: [],
          };
          const installedRaces = _.map(raceInfo.races, "id");
          const playerRace = installedRaces.includes(
            model.gwoDifficultySettings.playerRace(),
          )
            ? model.gwoDifficultySettings.playerRace()
            : gwoRaces.MLA_ID;
          // Every installed race: to leave one out, disable its mod. See
          // galaxy.md.
          const enemyRacePool = _.uniq(
            [gwoRaces.MLA_ID].concat(installedRaces),
          );
          let raceByFaction = {};
          // Shuffled per war, not at module load. Consumed in order by onPopulated.
          const neutralLore = loreRng.shuffle(gwoLore.neutralSystems);
          const aiLore = loreRng.shuffle(gwoLore.aiSystems);

          const game = new GW.Game();
          game.mode(model.mode());
          game.hardcore(model.newGameHardcore());
          game.content(api.content.activeContent());
          game.coopPlayers(model.normalizedNewGameCoopPlayers());
          game.coopPlayersSpecified(true);
          game.lockCoopPlayers(model.newGameLockCoopPlayers());
          game.perPlayerTechCards(model.newGamePerPlayerTechCards());
          game.sharedByDefault(
            game.perPlayerTechCards() ? false : model.newGameSharedByDefault(),
          );

          const selectedDifficulty =
            model.gwoDifficultySettings.difficultyLevel();
          // The tier every AI's personality is built from; Custom's is the
          // snapshot the war records. See galaxy.md, "Difficulty".
          const selectedTier = gwoDifficulty.difficulties[selectedDifficulty];
          const warTierData = selectedTier.customDifficulty
            ? tierSnapshot()
            : selectedTier;
          const sizes = GW.balance.numberOfSystems;
          const size = sizes[model.newGameSizeIndex()] || 40;
          let aiFactions = _.range(GWFactions.length);
          aiFactions.splice(playerFactionIndex(), 1);
          if (model.gwoDifficultySettings.factionScaling()) {
            const numFactions = model.newGameSizeIndex() + 1;
            aiFactions = teamsRng.sample(aiFactions, numFactions);
          }
          const playerCount = game.coopPlayers();
          const largePlanets = model.gwoDifficultySettings.largePlanets();
          const startCard = model.activeStartCard();

          if (model.newGameName() === defaultNewGameName) {
            model.newGameName(
              generatedWarName(
                selectedDifficulty,
                playerCount,
                model.newGameSizeIndex(),
                startCard,
                gwoDifficulty.difficulties,
              ),
            );
          }
          game.name(model.newGameName());

          model.updateCommander();
          game
            .inventory()
            .setTag("global", "playerFaction", playerFactionIndex());
          game.inventory().setTag("global", "playerColor", model.playerColor());
          game.inventory().setTag("global", "playerRace", playerRace);

          const buildGalaxy = loadSystemBrackets().then((systemBrackets) => {
            systemBrackets = systemBrackets || {};
            return game.galaxy().build({
              seed: model.newGameSeed(),
              gwoRng: warRng.stream("galaxy"),
              size,
              useEasierSystemTemplate:
                model.gwoDifficultySettings.simpleSystems(),
              content: game.content(),
              coopPlayersForSystemGeneration: playerCount,
              minStarDistance: 2,
              maxStarDistance: 4,
              maxConnections: 4,
              minimumDistanceBonus: 8, // this is inert
              largePlanets,
              gwoSystemBrackets: systemBrackets.brackets,
              gwoBiomeProviders: systemBrackets.providers,
            });
          });

          const onStartCardDealt = (startCardProduct) => {
            game
              .inventory()
              .cards.push(startCardProduct || { id: startCard.id() });
          };

          const onGalaxyBuilt = (galaxy) => {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            return gwoDealStartCard({
              id: startCard.id(),
              inventory: game.inventory(),
              galaxy,
              star: galaxy.stars()[galaxy.origin()],
            }).then(onStartCardDealt);
          };

          const dealStartCard = buildGalaxy.then(onGalaxyBuilt);

          const onStartCardApplied = () => {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }
            const galaxy = game.galaxy();
            game.move(galaxy.origin());
            const star = galaxy.stars()[game.currentStar()];
            star.explored(true);
            game.gameState(GW.Game.gameStates.active);
          };

          const moveIn = dealStartCard.then(onStartCardApplied);

          const onMovedIn = () => {
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
              },
            );
            // Wrapped, not passed by reference: _.map would hand getTeam's rng
            // parameter the array index.
            const teams = _.map(aiFactions, (faction) =>
              gwoTeams.getTeam(faction, teamsRng),
            );
            // Filter before anything is sampled, so an incompatible minion
            // can never be spread onto the galaxy as a worker AI. Keyed per
            // team: each faction's race decides whether its AIs run Queller.
            _.forEach(teams, (team, teamIndex) => {
              const race = raceByFaction[aiFactions[teamIndex]];
              if (brainForRace(race, "enemy") !== "Queller") {
                return;
              }
              team.remainingMinions = gwoAI.quellerCompatibleMinions(
                team.remainingMinions,
              );
              team.faction = Object.assign({}, team.faction, {
                minions: gwoAI.quellerCompatibleMinions(team.faction.minions),
              });
            });
            const teamInfo = _.map(teams, (team, teamIndex) => ({
              team,
              workers: [],
              faction: aiFactions[teamIndex],
            }));

            // Ordered rather than keyed: the spread loop is synchronous and the
            // _.remove below mutates remainingMinions, so order is load-bearing.
            const workersRng = warRng.stream("workers");

            // gwo_teams.js deliberately omits makeWorker; this replaces it so
            // _.cloneDeep() preserves personality_tags.
            const makeWorker = (team, ai) => {
              if (team.workers) {
                _.assign(ai, _.cloneDeep(workersRng.pick(team.workers)));
              } else if (team.remainingMinions) {
                const minion = workersRng.pick(
                  team.remainingMinions.length
                    ? team.remainingMinions
                    : team.faction.minions,
                );
                _.assign(ai, _.cloneDeep(minion));
                _.remove(team.remainingMinions, { name: ai.name });
              }
              return $.when(ai);
            };

            const onWorkerMade = (team, ai, star) => {
              if (team.workers) {
                _.remove(team.workers, { name: ai.name });
              }
              ai.faction = teamInfo[ai.team].faction;
              // Keyed per team by spawn order, which the synchronous spread
              // keeps deterministic. See galaxy.md.
              giveRace(
                warRng
                  .stream("race", ai.faction)
                  .stream("worker", teamInfo[ai.team].workers.length),
                ai,
                raceByFaction[ai.faction],
                false,
              );
              teamInfo[ai.team].workers.push({
                ai,
                star,
              });
            };

            const onBossMade = (ai) => {
              ai.faction = teamInfo[ai.team].faction;
              giveRace(
                warRng.stream("race", ai.faction),
                ai,
                raceByFaction[ai.faction],
                true,
              );
              teamInfo[ai.team].boss = ai;
            };

            const handleSpread = (star, ai) => {
              const team = teams[ai.team];
              return makeWorker(team, ai).then(
                onWorkerMade.bind(null, team, ai, star),
              );
            };

            const handleBoss = (star, ai) =>
              gwoTeams
                .makeBoss(
                  star,
                  ai,
                  teams[ai.team],
                  undefined, // stock's sst parameter, which makeBoss never reads
                  // Keyed by team: makeBoss generates a system, so these resolve out of
                  // order. Stock omits the seed entirely.
                  warRng.stream("boss", ai.team).int(0, 2147483647),
                )
                .then(onBossMade.bind(null, ai));

            const returnTeamInfo = () => teamInfo;

            return gwoBreeder
              .populate({
                galaxy: game.galaxy(),
                teams,
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

          const populate = moveIn.then(onMovedIn);

          const setupPlanetForAI = (ai, planet) => {
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
          let treasurePlanetStar;

          const onPopulated = (teamInfo) => {
            if (model.makeGameBusy() !== busyToken) {
              return;
            }

            const maxDist = _.reduce(
              game.galaxy().stars(),
              (value, star) => Math.max(star.distance(), value),
              0,
            );

            const startCardBreaksAllies = startCardAllyCompatibility(game);

            // Queller has no build orders for some minions, so a pool drawn
            // from under that brain is filtered first.
            const quellerPool = (pool, brain) =>
              brain === "Queller" ? gwoAI.quellerCompatibleMinions(pool) : pool;

            _.forEach(teamInfo, (info, teamIndex) => {
              const boss = info.boss;
              // Keyed, so an AI's rolls do not depend on what earlier AIs drew.
              const teamRng = warRng.stream("ai", teamIndex);
              const bossRng = teamRng.stream("boss");

              if (!boss) {
                console.error(
                  `No AI boss found for faction ${info.faction}, terminating war generation`,
                );
                warGenerationFailed = true;
                return;
              }

              const difficulty = model.gwoDifficultySettings;
              const teamBrain = brainForRace(
                raceByFaction[info.faction],
                "enemy",
              );
              // The team pre-filter above covers the built-in factions; this
              // catches a modded faction populating team.workers.
              const workerPool = quellerPool(info.workers, teamBrain);
              const minionPool = quellerPool(
                GWFactions[info.faction].minions,
                teamBrain,
              );

              // One minion per stream index off the parent's rng. An MLA
              // Cluster AI takes one minion carrying commanderCount commanders
              // instead.
              const addMinions = (
                parent,
                parentRng,
                count,
                dist,
                commanderCount,
              ) => {
                parent.minions = [];
                _.times(count, (minionIndex) => {
                  const minionRng = parentRng.stream("minion", minionIndex);
                  const minion = selectMinion(
                    minionRng,
                    minionPool,
                    parent.faction,
                    clusterType,
                  );
                  if (!minion) {
                    return;
                  }
                  giveRace(minionRng, minion, parent.race, false);
                  setAIPersonality(
                    minionRng,
                    minion,
                    warTierData,
                    parent.faction,
                  );
                  minion.econ_rate = aiEconRate(minionRng, dist, playerCount);
                  if (gwoAI.isCluster(parent)) {
                    minion.commanderCount = commanderCount;
                  }
                  parent.minions.push(minion);
                });
              };
              setAIPersonality(bossRng, boss, warTierData, boss.faction);
              boss.econ_rate = aiEconRate(bossRng, maxDist);
              const bossCommanders = bossCommanderCount(
                difficulty,
                playerCount,
              );

              const factionTechHandicap = Number.parseFloat(
                difficulty.factionTechHandicap(),
              );
              const bossBuffs = setupAIBuffs(
                bossRng,
                maxDist,
                factionTechHandicap,
              );
              boss.typeOfBuffs = bossBuffs;

              const mandatoryMinions =
                difficulty.mandatoryMinions() * playerCount;
              const minionMod =
                Number.parseFloat(difficulty.minionMod()) * playerCount;
              var clusterType = "";
              let numMinions = countMinions(
                mandatoryMinions,
                minionMod,
                maxDist,
              );
              let totalMinions = numMinions;

              if (numMinions > 0) {
                if (gwoAI.isCluster(boss)) {
                  clusterType = "Security";
                  totalMinions = 1;
                }
                addMinions(boss, bossRng, totalMinions, maxDist, numMinions);
              }

              _.forEach(workerPool, (worker, workerIndex) => {
                const ai = worker.ai;
                const aiRng = teamRng.stream("worker", workerIndex);

                ai.landAnywhere = gameModeEnabled(
                  aiRng,
                  difficulty.landAnywhereChance(),
                );
                ai.suddenDeath = gameModeEnabled(
                  aiRng,
                  difficulty.suddenDeathChance(),
                );
                ai.bountyMode = gameModeEnabled(
                  aiRng,
                  difficulty.bountyModeChance(),
                );
                ai.eradicationMode = gameModeEnabled(
                  aiRng,
                  difficulty.eradicationModeChance(),
                );
                enableAnEradicationModeTypes(aiRng, ai);

                const dist = worker.star.distance();

                numMinions = countMinions(mandatoryMinions, minionMod, dist);

                setAIPersonality(aiRng, ai, warTierData, ai.faction);
                ai.econ_rate = aiEconRate(aiRng, dist, playerCount);

                const workerBuffs = setupAIBuffs(
                  aiRng,
                  dist,
                  factionTechHandicap,
                );
                ai.typeOfBuffs = workerBuffs;

                if (numMinions > 0) {
                  ai.minions = [];

                  totalMinions = numMinions;
                  let clusterWorkers = 0;
                  if (gwoAI.isCluster(ai)) {
                    clusterType = "Worker";
                    clusterWorkers = clusterCommanderCount(
                      numMinions,
                      bossCommanders,
                    );
                    totalMinions = 1;
                  }

                  // MLA Cluster Workers get additional commanders in place of
                  // minions
                  if (gwoAI.isCluster(ai) && ai.name === "Worker") {
                    ai.commanderCount = Math.max(clusterWorkers, 2);
                  } else {
                    addMinions(ai, aiRng, totalMinions, dist, clusterWorkers);
                  }
                }

                let availableFactions = _.without(aiFactions, ai.faction);
                _.times(availableFactions.length, (foeIndex) => {
                  const foeRng = aiRng.stream("foe", foeIndex);
                  if (gameModeEnabled(foeRng, difficulty.ffaChance())) {
                    if (!ai.foes) {
                      ai.foes = [];
                    }

                    availableFactions = foeRng.shuffle(availableFactions);
                    const foeFaction = availableFactions.shift();
                    const foeMinions = quellerPool(
                      GWFactions[foeFaction].minions,
                      brainForRace(raceByFaction[foeFaction], "enemy"),
                    );
                    const foeCommander = selectMinion(
                      foeRng,
                      foeMinions,
                      foeFaction,
                    );
                    if (!foeCommander) {
                      return;
                    }
                    foeCommander.faction = foeFaction;
                    giveRace(
                      foeRng,
                      foeCommander,
                      raceByFaction[foeFaction],
                      false,
                    );
                    setAIPersonality(
                      foeRng,
                      foeCommander,
                      warTierData,
                      foeCommander.faction,
                    );
                    foeCommander.econ_rate = aiEconRate(
                      foeRng,
                      dist,
                      playerCount,
                    );
                    let numFoes = Math.round((numMinions + 1) / 2);
                    // MLA Cluster Workers get additional commanders in place of
                    // armies
                    if (
                      gwoAI.isCluster(foeCommander) &&
                      foeCommander.name === "Worker"
                    ) {
                      numFoes = clusterCommanderCount(
                        numMinions,
                        bossCommanders,
                      );
                    }
                    foeCommander.commanderCount = numFoes;

                    // A foe fields its worker's tech. Recorded here; the
                    // spec mods are built from it at launch.
                    foeCommander.typeOfBuffs = workerBuffs;

                    ai.foes.push(foeCommander);
                  }
                });

                const allyRng = aiRng.stream("ally");
                if (
                  !startCardBreaksAllies &&
                  gameModeEnabled(allyRng, difficulty.alliedCommanderChance())
                ) {
                  const playerFaction = playerFactionIndex();
                  // The ally fights as the player's race, so its brain is
                  // that race's ally cell.
                  const allyBrain = brainForRace(playerRace, "ally");
                  const allyMinions = quellerPool(
                    GWFactions[playerFaction].minions,
                    allyBrain,
                  );
                  const allyCommander = selectMinion(
                    allyRng,
                    allyMinions,
                    playerFaction,
                  );
                  if (allyCommander) {
                    allyCommander.faction = playerFaction;
                    giveRace(allyRng, allyCommander, playerRace, false);
                    // Every reader gives an ally the Sub Commander rate, so
                    // the save carries no rate the template may hold.
                    delete allyCommander.econ_rate;
                    if (allyBrain === "Penchant") {
                      allyCommander.penchantName =
                        gwoAI.penchants(allyRng).penchantName;
                    }
                    allyCommander.personality = gwoPersonality.resolve(
                      allyCommander,
                      {
                        side: "ally",
                        faction: playerFaction,
                        penchantTags: gwoAI.penchantTags(
                          allyCommander.penchantName,
                        ),
                      },
                    );
                    ai.ally = allyCommander;
                  }
                }

                if (ai.foes) {
                  // Tagged per entity: in a mixed-race FFA only the armies
                  // actually running Queller take its FFA tags.
                  const tagIfQueller = (entities, brain) => {
                    if (brain === "Queller") {
                      setupQuellerFFATag(entities);
                    }
                  };
                  const workerBrain = brainForRace(ai.race, "enemy");
                  tagIfQueller(ai, workerBrain);
                  tagIfQueller(ai.minions, workerBrain);
                  _.forEach(ai.foes, (foe) => {
                    tagIfQueller(foe, brainForRace(foe.race, "enemy"));
                  });
                  tagIfQueller(ai.ally, brainForRace(playerRace, "ally"));
                }
              });
            });

            let treasurePlanetSetup = false;
            let loreEntry = 0;
            let optionalLoreEntry = 0;
            const treasureRng = warRng.stream("treasure");
            _.forEach(game.galaxy().stars(), (star, starIndex) => {
              const ai = star.ai();
              const system = star.system();
              if (ai) {
                _.forEach(
                  star.system().planets,
                  setupPlanetForAI.bind(null, ai),
                );

                if (!ai.boss) {
                  const difficulty = model.gwoDifficultySettings;

                  if (treasurePlanetSetup === false) {
                    treasurePlanetSetup = true;
                    treasurePlanetStar = starIndex;
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
                    ai.name = "The Guardians";
                    ai.character = "!LOC:Unknown";
                    ai.color = [
                      [255, 255, 255],
                      [255, 192, 203],
                    ];
                    ai.commander =
                      "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";
                    // Mirrors the player, race included; keeps the Unicorn.
                    giveRace(treasureRng, ai, playerRace, true);
                    // The loadout itself is derived per player at exploration -
                    // see gw_play/treasure_loadouts.js.
                    system.description =
                      "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.";
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

          const finishAis = populate.then(onPopulated);

          const onAisFinished = () => {
            if (warGenerationFailed === true) {
              return;
            }

            // Hacky way to store war information for the gw_play scene
            const originSystem = gwoAI.originSystem(game);
            originSystem.gwaio = {};
            originSystem.gwaio.version = gwoVersion;
            // Re-entering this in the lobby rebuilds this war.
            originSystem.gwaio.seed = model.newGameSeed();
            originSystem.gwaio.difficulty =
              gwoDifficulty.difficulties[selectedDifficulty].difficultyName;
            // A named tier is looked up live at launch; Custom's values live
            // nowhere else, so the war records them.
            if (selectedTier.customDifficulty) {
              originSystem.gwaio.customDifficulty = warTierData;
            }
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
            // One coerced row per installed race, so the save never carries a
            // brain a race cannot run and co-op viewers read the same answers.
            originSystem.gwaio.aiByRace = gwoBrainTable.recordFor(
              model.gwoDifficultySettings.aiByRace(),
              installedRaces,
              model.gwoDifficultySettings.ai(),
              model.gwoDifficultySettings.aiAlly(),
            );
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
            originSystem.gwaio.races = {
              player: playerRace,
              byFaction: raceByFaction,
              unique: model.gwoDifficultySettings.uniqueRaces(),
              mods: raceInfo.mods,
              // The add-on server mods active at creation, so a resume can
              // say which are gone. See races.md, "Add-ons".
              addons: raceInfo.addonMods || [],
              // Only the per-player tech referee reads a viewer's own race, so
              // a war without it never claims one. See coop.md.
              perPlayerRace:
                model.gwoDifficultySettings.perPlayerRace() &&
                !!model.newGamePerPlayerTechCards(),
            };
            // The map packs GW Server Mods must mount for this war. The
            // resume check reads the stars' own stamps first; this stands in
            // for a star whose system lost its stamp. See galaxy.md, "Biome
            // mods in a GW battle".
            originSystem.gwaio.biomeMods = gwoBiomes.gwsmMods(
              _.map(game.galaxy().stars(), (star) => {
                const system = star.system();
                return system && system.gwoBiomeMods;
              }),
            );
          };

          const warInfo = finishAis.then(onAisFinished);

          const onWarInfoStored = () => {
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
              const displayName = ko
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

          const finishSetup = warInfo.then(onWarInfoStored);

          const onGameSaved = () => {
            model.lastSceneUrl(
              gwoUrl.ui("ui/main/game/galactic_war/gw_start/gw_start.html"),
            );
            window.location.href = gwoUrl.ui(
              "ui/main/game/galactic_war/gw_play/gw_play.html",
            );
          };

          const onSetupFinished = () => {
            if (warGenerationFailed === true) {
              warGenerationFailure();
              return;
            }

            // Defensive: success navigates away, but keeps the count per-war if
            // gw_start is ever re-entered without a page load.
            warGenerationAttempts = 0;

            saveDifficultySettings();

            console.log(
              `War created successfully using Galactic War Overhaul v${gwoVersion}`,
            );

            const save = GW.manifest.saveGame(model.newGame());
            model.activeGameId(model.newGame().id);
            save.then(onGameSaved);
          };

          const onWarGenerationError = (err) => {
            console.error(err);
            warGenerationFailure();
          };

          finishSetup.then(onSetupFinished).fail(onWarGenerationError);
        };
        gwoReady(true);
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
