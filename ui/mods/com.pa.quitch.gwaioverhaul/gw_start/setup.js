var gwoSetupLoaded;

function gwoSetup() {
  if (gwoSetupLoaded) {
    return;
  }

  gwoSetupLoaded = true;

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
          cardId
        )
      );

      // Reordering moves the active card, so reselect by id, not stale index.
      if (activeId) {
        const newIndex = _.findIndex(
          model.startCards(),
          (c) => cardId(c) === activeId
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
        '"></div>'
    );

    model.makeGame = () => {}; // Prevent changes to settings causing creation of new galaxies

    const enableGoToWar = ko.observable(true);
    let sharedSystemsForGalacticWarActive = false;
    const defaultNewGameName = model.newGameName();
    let warGenerationFailed;

    // We change how we monitor model.ready() to prevent
    // Shared Systems for Galactic War breaking our new lobby
    model.ready = ko.computed(
      () => enableGoToWar() && !!model.activeStartCard()
    );

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
    // tech was removed; see the note by setupAITech5 there.
    const aiBuffType = {
      cost: 0,
      damage: 1,
      health: 2,
      speed: 3,
      build: 4,
      combat: 6,
      cooldown: 7,
    };

    const getQuellerAITag = (faction) => {
      const quellerTag = "queller";
      const legonisMachinaTags = ["tank", quellerTag];
      const foundationTags = ["air", quellerTag];
      const synchronousTags = ["bot", quellerTag];
      const revenantsTags = ["orbital", quellerTag];
      const clusterTags = ["land", quellerTag];

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
          // The caller concats this into personality_tags before the abort
          // lands, so undefined would append a literal undefined tag.
          return [];
      }
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

    const aiTech = (buffs, inventory, faction, tech) => {
      _.times(buffs.length, (n) => {
        inventory = inventory.concat(tech[faction][buffs[n]]);
      });
      return inventory;
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
            })
          )
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
      minionStep
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
          minionStep
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
      if (_.isArray(model.gwoStarCardsWhichBreakAllies)) {
        gwoStarCardsWhichBreakAllies = gwoStarCardsWhichBreakAllies.concat(
          model.gwoStarCardsWhichBreakAllies
        );
      }
      return _.some(
        gwoStarCardsWhichBreakAllies,
        (card) => card === game.inventory().cards()[0].id
      );
    };

    const setupQuellerFFATag = (ais) => {
      if (!ais) {
        return;
      }

      const ffa = ["ffa", "platoon"];

      if (_.isArray(ais)) {
        _.forEach(ais, (ai) => {
          ai.personality.personality_tags =
            ai.personality.personality_tags.concat(ffa);
        });
      } else {
        ais.personality.personality_tags =
          ais.personality.personality_tags.concat(ffa);
      }
    };

    const saveDifficultySettings = () => {
      const settings = model.gwoDifficultySettings;

      // The personality picker has no data-bind, so its value only reaches the
      // snapshot if pushed back here. Write once at save time, not per AI.
      const pickedTags = $("#gwo-personality-picker").val() || [];
      if (!_.isEqual(pickedTags, settings.personalityTags())) {
        settings.personalityTags(pickedTags);
      }

      const settingNames = _.keys(settings);
      _.pull(settingNames, "previousSettings");
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
      difficulties
    ) => {
      const difficultyName = loc(
        difficulties[selectedDifficulty].difficultyName
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
        "main/shared/js/star_system_templates",
        "main/game/galactic_war/shared/js/gw_easy_star_systems",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/lore.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourite_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourites.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_system_brackets.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_seed.js",
        "main/game/galactic_war/shared/js/systems/template-loader",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
      ],
      (
        GW,
        GWFactions,
        gwoBreeder,
        gwoTeams,
        // window.star_system_templates is set instead
        normalSystemTemplates,
        easySystemTemplates,
        gwoCluster,
        gwoTech,
        gwoLore,
        gwoDifficulty,
        gwoAI,
        loadouts,
        gwoLoadoutBanks,
        favouriteLoadoutsModule,
        favouritesModule,
        gwoVersion,
        gwoSystemBrackets,
        gwoRng,
        gwoFactionSeed,
        chooseStarSystemTemplates,
        gwoUrl
      ) => {
        gwoFavouriteLoadouts = favouriteLoadoutsModule;
        gwoFavourites = favouritesModule;

        // Resolved before the list is built so a mod loadout the player has
        // earned shows as unlocked rather than as a locked hint.
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
          model.startCards(
            gwoFavouriteLoadouts.sortCardsByFavourite(
              loadouts.startCards(),
              gwoFavourites.ids(),
              cardId
            )
          );
        });
        const processedStartCards = {};
        let loadCount = loadouts.allCards.length;
        const loaded = $.Deferred();

        _.forEach(loadouts.allCards, (card) => {
          requireGW([`cards/${card.id}`], (cardFile) => {
            cardFile.id = card.id;
            processedStartCards[card.id] = cardFile;
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
            const context =
              card.getContext &&
              card.getContext(params.galaxy, params.inventory);
            const deal = card.deal && card.deal(params.star, context);
            const product = { id: params.id };
            const cardParams = deal && deal.params;
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
        const setupPenchantAI = (rng, ai, titansAITags) => {
          const penchantValues = gwoAI.penchants(rng);
          ai.personality.personality_tags =
            ai.personality.personality_tags.concat(
              penchantValues.penchants,
              titansAITags || []
            );
          ai.penchantName = penchantValues.penchantName;
        };

        const setAIPersonality = (rng, ai, difficulty, faction) => {
          const personalityId = "#gwo-personality-picker";
          const personality = ai.personality;

          personality.micro_type = difficulty.microType();
          // .raw unwraps the stringBoolean extender, which reads back "true"/"false"
          // for the dropdowns. The AI personality contract needs real booleans.
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
          // Read only; saveDifficultySettings owns the write back.
          personality.personality_tags =
            $(personalityId).val() === null ? [] : $(personalityId).val();
          // 0 means unset, leaving the AI to examine the spawn zone radius.
          if (difficulty.startingLocationEvaluationRadius() > 0) {
            personality.starting_location_evaluation_radius =
              difficulty.startingLocationEvaluationRadius();
          }

          const titansAITags = ["Default"];

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

        // Must wrap, as stock's playerFaction computed does: gw_factions.js
        // appends Cluster only under Titans, so a stored index of 4 can be
        // restored into a session where it addresses nothing.
        const playerFactionIndex = () =>
          model.playerFactionIndex() % GWFactions.length;

        // Never rejects - every failure resolves undefined. Rejecting would spend
        // warGenerationFailure's retries on a condition no reseed can change.
        const loadSystemBrackets = () => {
          const ready = $.Deferred();

          const withoutBrackets = () => {
            ready.resolve(undefined);
          };

          const onSystemsLoaded = function () {
            // $.when hands back one array per source.
            const built = gwoSystemBrackets.bracketsFrom(
              _.flatten(_.toArray(arguments))
            );
            ready.resolve(built.length ? built : undefined);
          };

          const onOptionsLoaded = (options) => {
            const loading = [];
            _.forEach(model.selectedNames(), (name) => {
              const option = _.find(options, "name", name);
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

          $.when(modsMounted).always(() => {
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
            game.perPlayerTechCards() ? false : model.newGameSharedByDefault()
          );

          const selectedDifficulty =
            model.gwoDifficultySettings.difficultyLevel();
          const systemTemplates = model.gwoDifficultySettings.simpleSystems()
            ? easySystemTemplates
            : star_system_templates;
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

          const buildGalaxy = loadSystemBrackets().then((systemBrackets) =>
            game.galaxy().build({
              seed: model.newGameSeed(),
              gwoRng: warRng.stream("galaxy"),
              size,
              difficultyIndex: selectedDifficulty,
              systemTemplates,
              content: game.content(),
              coopPlayersForSystemGeneration: playerCount,
              minStarDistance: 2,
              maxStarDistance: 4,
              maxConnections: 4,
              minimumDistanceBonus: 8, // this is inert
              largePlanets,
              gwoSystemBrackets: systemBrackets,
            })
          );

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
            // Wrapped, not passed by reference: _.map would hand getTeam's rng
            // parameter the array index.
            const teams = _.map(aiFactions, (faction) =>
              gwoTeams.getTeam(faction, teamsRng)
            );
            if (model.gwoDifficultySettings.ai() === "Queller") {
              // Filter before anything is sampled, so an incompatible minion
              // can never be spread onto the galaxy as a worker AI.
              _.forEach(teams, (team) => {
                team.remainingMinions = gwoAI.quellerCompatibleMinions(
                  team.remainingMinions
                );
                team.faction = _.assign({}, team.faction, {
                  minions: gwoAI.quellerCompatibleMinions(team.faction.minions),
                });
              });
            }
            const teamInfo = _.map(teams, (team, teamIndex) => ({
              team,
              workers: [],
              faction: aiFactions[teamIndex],
            }));

            let neutralStars = 2;
            if (model.gwoDifficultySettings.easierStart()) {
              neutralStars = 4;
            }

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
                    : team.faction.minions
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
              teamInfo[ai.team].workers.push({
                ai,
                star,
              });
            };

            const onBossMade = (ai) => {
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].boss = ai;
            };

            const handleSpread = (star, ai) => {
              const team = teams[ai.team];
              return makeWorker(team, ai).then(
                onWorkerMade.bind(null, team, ai, star)
              );
            };

            const handleBoss = (star, ai) =>
              gwoTeams
                .makeBoss(
                  star,
                  ai,
                  teams[ai.team],
                  systemTemplates,
                  // Keyed by team: makeBoss generates a system, so these resolve out of
                  // order. Stock omits the seed entirely.
                  warRng.stream("boss", ai.team).int(0, 2147483647)
                )
                .then(onBossMade.bind(null, ai));

            const returnTeamInfo = () => teamInfo;

            return gwoBreeder
              .populate({
                galaxy: game.galaxy(),
                teams,
                neutralStars,
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
              0
            );

            const startCardBreaksAllies = startCardAllyCompatibility(game);

            _.forEach(teamInfo, (info, teamIndex) => {
              const boss = info.boss;
              // Keyed, so an AI's rolls do not depend on what earlier AIs drew.
              const teamRng = warRng.stream("ai", teamIndex);
              const bossRng = teamRng.stream("boss");

              if (!boss) {
                console.error(
                  `No AI boss found for faction ${info.faction}, terminating war generation`
                );
                warGenerationFailed = true;
                return;
              }

              const difficulty = model.gwoDifficultySettings;
              let workerPool = info.workers;
              let minionPool = GWFactions[info.faction].minions;
              if (difficulty.ai() === "Queller") {
                // A no-op for the built-in factions, which the pre-filter above
                // covers. Catches a modded faction populating team.workers.
                workerPool = gwoAI.quellerCompatibleMinions(workerPool);
                minionPool = gwoAI.quellerCompatibleMinions(minionPool);
              }

              setAIPersonality(bossRng, boss, difficulty, boss.faction);
              boss.econ_rate = aiEconRate(bossRng, maxDist);
              const bossCommanders = bossCommanderCount(
                difficulty,
                playerCount
              );
              boss.bossCommanders = bossCommanders;

              boss.inventory = [];

              if (boss.isCluster === true) {
                boss.inventory = gwoCluster.clusterCommanderMods;
              }

              const factionTechHandicap = Number.parseFloat(
                difficulty.factionTechHandicap()
              );
              const bossBuffs = setupAIBuffs(
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

              const mandatoryMinions =
                difficulty.mandatoryMinions() * playerCount;
              const minionMod =
                Number.parseFloat(difficulty.minionMod()) * playerCount;
              let clusterType = "";
              let numMinions = countMinions(
                mandatoryMinions,
                minionMod,
                maxDist
              );
              let totalMinions = numMinions;

              if (numMinions > 0) {
                boss.minions = [];

                if (boss.isCluster === true) {
                  clusterType = "Security";
                  totalMinions = 1;
                }

                _.times(totalMinions, (minionIndex) => {
                  const minionRng = bossRng.stream("minion", minionIndex);
                  const minion = selectMinion(
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

              _.forEach(workerPool, (worker, workerIndex) => {
                const ai = worker.ai;
                const aiRng = teamRng.stream("worker", workerIndex);

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

                const dist = worker.star.distance();

                numMinions = countMinions(mandatoryMinions, minionMod, dist);

                setAIPersonality(aiRng, ai, difficulty, ai.faction);
                ai.econ_rate = aiEconRate(aiRng, dist, playerCount);

                ai.inventory = [];

                if (ai.isCluster === true) {
                  ai.inventory = gwoCluster.clusterCommanderMods;
                }

                const workerBuffs = setupAIBuffs(
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
                  let clusterWorkers = 0;
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
                    _.times(totalMinions, (minionIndex) => {
                      const minionRng = aiRng.stream("minion", minionIndex);
                      const minion = selectMinion(
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

                let availableFactions = _.without(aiFactions, ai.faction);
                _.times(availableFactions.length, (foeIndex) => {
                  const foeRng = aiRng.stream("foe", foeIndex);
                  if (gameModeEnabled(foeRng, difficulty.ffaChance())) {
                    if (!ai.foes) {
                      ai.foes = [];
                    }

                    availableFactions = foeRng.shuffle(availableFactions);
                    const foeFaction = availableFactions.shift();
                    let foeMinions = GWFactions[foeFaction].minions;
                    if (difficulty.ai() === "Queller") {
                      foeMinions = gwoAI.quellerCompatibleMinions(foeMinions);
                    }
                    const foeCommander = selectMinion(
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
                    let numFoes = Math.round((numMinions + 1) / 2);
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

                const allyRng = aiRng.stream("ally");
                if (
                  !startCardBreaksAllies &&
                  gameModeEnabled(allyRng, difficulty.alliedCommanderChance())
                ) {
                  const playerFaction = playerFactionIndex();
                  let allyMinions = GWFactions[playerFaction].minions;
                  if (difficulty.aiAlly() === "Queller") {
                    allyMinions = gwoAI.quellerCompatibleMinions(allyMinions);
                  }
                  const allyCommander = selectMinion(
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
                  setupPlanetForAI.bind(null, ai)
                );

                if (!ai.bossCommanders) {
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
            const galaxy = game.galaxy();
            const originSystem = galaxy.stars()[galaxy.origin()].system();
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
              gwoUrl.ui("ui/main/game/galactic_war/gw_start/gw_start.html")
            );
            window.location.href = gwoUrl.ui(
              "ui/main/game/galactic_war/gw_play/gw_play.html"
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
              `War created successfully using Galactic War Overhaul v${gwoVersion}`
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
      }
    );
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoSetup();
