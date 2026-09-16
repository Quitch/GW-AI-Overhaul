// Glue. The testable half is gw_play/referee_game_file_paths.js - see testing.md.
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js",
], (
  GW,
  gwoAI,
  gwoSpecs,
  refereeCoop,
  gwoSpecCache,
  gameFilePaths,
  gwoRaces,
  gwoRaceCells,
  unitCells,
  gwoTech,
) => {
  const getAIUnitMapPath = gameFilePaths.getAIUnitMapPath;
  const getAIUnitMapDestinationPath = gameFilePaths.getAIUnitMapDestinationPath;
  const mergeUnitMaps = gameFilePaths.mergeUnitMaps;
  const resolveAiUnitMapPaths = gameFilePaths.resolveAiUnitMapPaths;
  const buildPlayerFiles = gameFilePaths.buildPlayerFiles;
  const specFetch = gameFilePaths.specFetch;
  const loadMap = gameFilePaths.loadMap;
  // Drop-in for GW.specs.genUnitSpecs, fetching each spec file at most once.
  const genUnitSpecs = (units, tag) =>
    gwoSpecCache.genUnitSpecs(units, tag, { fetch: specFetch });

  const guardianMods = (game, hostMods) => {
    // Without per-player tech every viewer draws from the host's inventory.
    if (!game.perPlayerTechCards()) {
      return hostMods;
    }

    let mods = hostMods;
    _.forEach(refereeCoop.getConnectedViewerInventories(game), (viewer) => {
      mods = mods.concat(viewer.inventory.mods);
    });

    return mods;
  };

  const buildAiFactionFiles = (params) => {
    const currentCount = params.currentCount;
    const ai = params.ai;
    const aiTag = params.aiTag;
    const aiUnitMap = params.aiUnitMap;
    const aiX1UnitMap = params.aiX1UnitMap;
    const aiSpecs = params.aiSpecs;
    const aiUnitMapDestinationPath = params.aiUnitMapDestinationPath;
    const aiUnitMapTitansDestinationPath =
      params.aiUnitMapTitansDestinationPath;
    const clusterUnitMapPath = params.clusterUnitMapPath;
    const clusterUnitMapTitansPath = params.clusterUnitMapTitansPath;
    const titans = params.titans;
    const game = params.game;
    const inventory = params.inventory;
    const aiFactionDeferred = params.aiFactionDeferred;

    const race = params.race;
    const cells = params.cells;
    const commanders = params.commanders || [];

    const enemyAIUnitMap = GW.specs.genAIUnitMap(
      aiUnitMap,
      aiTag[currentCount],
    );
    const enemyX1AIUnitMap = GW.specs.genAIUnitMap(
      aiX1UnitMap,
      aiTag[currentCount],
    );

    return genUnitSpecs(aiSpecs, aiTag[currentCount]).then((aiSpecFiles) => {
      const resolvedPaths = resolveAiUnitMapPaths(
        ai,
        currentCount,
        {
          unitMapPath: aiUnitMapDestinationPath,
          unitMapTitansPath: aiUnitMapTitansDestinationPath,
        },
        {
          unitMapPath: clusterUnitMapPath,
          unitMapTitansPath: clusterUnitMapTitansPath,
        },
        gwoAI.isCluster,
      );
      const unitMapPath = resolvedPaths.unitMapPath;
      const unitMapTitansPath = resolvedPaths.unitMapTitansPath;

      const enemyAIUnitMapFile = unitMapPath + aiTag[currentCount];
      const enemyAIUnitMapPair = {};
      enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
      const enemyX1AIUnitMapFile = unitMapTitansPath + aiTag[currentCount];
      const enemyX1AIUnitMapPair = {};
      enemyX1AIUnitMapPair[enemyX1AIUnitMapFile] = enemyX1AIUnitMap;
      const aiFilesClassic = _.assign(enemyAIUnitMapPair, aiSpecFiles);
      const aiFilesX1 = titans
        ? _.assign(enemyX1AIUnitMapPair, aiSpecFiles)
        : {};
      const aiFiles = Object.assign({}, aiFilesClassic, aiFilesX1);

      let aiInventory = gameFilePaths.armyInventory(
        currentCount === 0 ? ai : ai.foes[currentCount - 1],
        gwoTech.loadoutFor,
        gwoAI.factionIndex,
        gwoAI.isCluster,
      );
      const guardians = ai.mirrorMode;
      if (guardians) {
        aiInventory = aiInventory.concat(guardianMods(game, inventory.mods()));
      }
      // The AI's tech names vanilla files; a race army's land on the race
      // files of the same cell too, and an MLA army's on the add-on files.
      // Its spec set holds every listed unit, so the originals stay as
      // well. See races.md.
      if (cells) {
        aiInventory = unitCells.expandMods(
          aiInventory,
          cells.vanilla,
          cells.race,
          (file) =>
            Object.prototype.hasOwnProperty.call(
              aiSpecFiles,
              file + aiTag[currentCount],
            ),
        );
      }
      _.forEach(commanders, (commander) => {
        aiInventory = aiInventory.concat(
          gwoRaces.commanderModsFor(race, commander),
        );
      });
      if (aiInventory.length) {
        gwoSpecs.mod(aiFiles, aiInventory, aiTag[currentCount]);
      }
      aiFactionDeferred.resolve(aiFiles);
    });
  };

  // Files not assigned by default that we wish to mod - global for modder
  // compatibility, New-GW-Cards pushes here - see tech-cards.md
  model.gwoSpecs = Array.isArray(model.gwoSpecs) ? model.gwoSpecs : [];
  model.gwoSpecs = model.gwoSpecs.concat(gwoSpecs.additionalSpecs);

  return function () {
    const self = this;

    // The previous battle's cooked specs are still mounted; read as the base,
    // they would be modded a second time.
    const done = $.Deferred();
    // A throw inside a deferred callback is a hang, not a rejection (see
    // constraints.md), so every path below that can fail rejects here instead.
    const fail = (error) => {
      done.reject(error);
    };

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(() => {
      try {
        self.stage("!LOC:Processing tech cards");
        const titans = api.content.usingTitans();

        const game = self.game();
        const ai = gwoAI.currentStarAi(game);
        const aiTag = gwoAI.aiTags(ai);
        const aiFactionCount = aiTag.length;
        const aiFactions = _.map(aiTag, () => $.Deferred());

        const playerFileGen = $.Deferred();
        const filesToProcess = [playerFileGen];

        const inventory = game.inventory();
        const playerRace = gwoRaces.raceOf(inventory);
        const enemyAI = gwoAI.aiInUse("enemy");
        const aiUnitMapSourcePath = getAIUnitMapPath(false, enemyAI);
        const aiUnitMapTitansSourcePath = getAIUnitMapPath(true, enemyAI);

        // A race army reads the brain that carries its race (or Titans) from
        // that brain's own map with the race's maps laid over it, at the race's
        // tree; a vanilla spec_id the race maps left falls back to a race unit
        // of its cell. Guardians mirror the player, race included. See races.md.
        const armyOf = (n) => (n === 0 ? ai : ai.foes[n - 1]);
        const raceOfArmy = (n) =>
          ai.mirrorMode ? playerRace : gwoRaces.raceOf(armyOf(n));
        const armyMaps = (type, race, cells) => {
          const brain = gwoAI.aiInUse(type, race);
          const source = gwoAI.getAIPathSource(type, race);
          const raceMaps = gwoRaces.unitMapsFor(race, brain, source);
          const loads = [
            loadMap(getAIUnitMapPath(false, brain)),
            titans ? loadMap(getAIUnitMapPath(true, brain)) : null,
          ].concat(_.map(raceMaps, loadMap));
          // A key the race maps left falls back to a race unit of its cell,
          // preferring one the race's own AI data knows over an add-on's.
          const merge = (base, extra) => {
            const merged = mergeUnitMaps(base, extra);
            return cells
              ? unitCells.unitMapFallback(
                  merged,
                  extra,
                  cells.vanilla,
                  cells.race,
                  gwoRaces.addonUnitPaths(),
                )
              : merged;
          };

          return $.when.apply($, loads).then(function () {
            const maps = _.toArray(arguments);
            const extra = maps.slice(2);
            return {
              classic: merge(maps[0], extra),
              x1: titans ? merge(maps[1], extra) : {},
            };
          });
        };

        const unitsLoad = $.get("spec://pa/units/unit_list.json");
        const aiMapLoad = loadMap(aiUnitMapSourcePath);
        const aiX1MapLoad = titans ? loadMap(aiUnitMapTitansSourcePath) : {};
        // Native from here on: a jQuery callback that throws hangs the launch,
        // a native one rejects, and every chain below ends in fail. A jQuery
        // promise adopted by a native one hands over its first argument only,
        // so the three loads are gathered into one first.
        const loads = $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
          (unitsGet, aiUnitMap, aiX1UnitMap) => [
            unitsGet,
            aiUnitMap,
            aiX1UnitMap,
          ],
        );
        Promise.resolve(loads)
          .then((loaded) => {
            const units = parse(loaded[0][0]).units;
            const aiUnitMap = loaded[1];
            const aiX1UnitMap = loaded[2];
            const clusterUnitMapPath =
              "/pa/ai_cluster/unit_maps/ai_unit_map.json";
            const clusterUnitMapTitansPath =
              "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
            // Identical for every faction - build it once rather than per iteration.
            const aiSpecs = units.concat(model.gwoSpecs);
            // A race's capability cells, from the same specs genUnitSpecs will
            // fetch. MLA's are its add-on cells, and undefined while no
            // add-on is mounted. See races.md, "Add-ons".
            const cellsFor = (race) => gwoRaceCells.indexFor(race, units);
            _.times(aiFactionCount, (n) => {
              const army = armyOf(n);
              const race = raceOfArmy(n);
              const destination = gwoAI.getAIPathDestination("enemy", {
                race,
              });

              cellsFor(race)
                .then((cells) => {
                  const maps = gwoRaces.isMla(race)
                    ? { classic: aiUnitMap, x1: aiX1UnitMap }
                    : armyMaps("enemy", race, cells);

                  return Promise.resolve(maps).then((unitMaps) =>
                    buildAiFactionFiles({
                      currentCount: n,
                      ai,
                      aiTag,
                      race,
                      cells,
                      commanders: [army.commander].concat(
                        n === 0 ? _.map(ai.minions || [], "commander") : [],
                      ),
                      aiUnitMap: unitMaps.classic,
                      aiX1UnitMap: unitMaps.x1,
                      aiSpecs,
                      aiUnitMapDestinationPath: getAIUnitMapDestinationPath(
                        false,
                        destination,
                      ),
                      aiUnitMapTitansDestinationPath:
                        getAIUnitMapDestinationPath(true, destination),
                      clusterUnitMapPath,
                      clusterUnitMapTitansPath,
                      titans,
                      game,
                      inventory,
                      aiFactionDeferred: aiFactions[n],
                    }),
                  );
                })
                .then(null, fail);
            });

            const playerTag = ".player";
            const additionalPlayerSpecs = _.isUndefined(ai.ally)
              ? model.gwoSpecs
              : model.gwoSpecs.concat(ai.ally.commander);
            const held = inventory.units().concat(additionalPlayerSpecs);
            const playerCommanders = [inventory.getTag("global", "commander")]
              .concat(_.map(inventory.minions(), "commander"))
              .concat(_.isUndefined(ai.ally) ? [] : [ai.ally.commander]);

            const playerIsMla = gwoRaces.isMla(playerRace);

            cellsFor(playerRace)
              .then((cells) => {
                // A race player fields the race's units of the cells the
                // vanilla ones held occupy; a kept vanilla unit (the Colonel)
                // is retagged so the race can build it. An MLA player keeps
                // everything held and gains the add-on units of those cells.
                // See races.md.
                let playerSpecs = held;
                if (cells) {
                  playerSpecs = (
                    playerIsMla
                      ? unitCells.addonUnitsFor
                      : unitCells.raceUnitsFor
                  )(held, cells.vanilla, cells.race);
                }
                const keptVanilla =
                  cells && !playerIsMla
                    ? _.difference(
                        unitCells.heldCommanderUnits(held, cells.vanilla),
                        playerCommanders,
                      )
                    : [];
                const playerExtraMods = _.flatten(
                  _.map(playerCommanders, (commander) =>
                    gwoRaces.commanderModsFor(playerRace, commander),
                  ).concat(
                    _.map(keptVanilla, (unit) =>
                      gwoRaces.unitRetagMods(playerRace, unit),
                    ),
                  ),
                );
                // MLA keeps the enemy brain's map for the player, as it always has.
                const playerMaps = gwoRaces.isMla(playerRace)
                  ? { classic: aiUnitMap, x1: aiX1UnitMap }
                  : armyMaps("subcommander", playerRace, cells);

                return Promise.resolve(playerMaps).then((unitMaps) =>
                  genUnitSpecs(playerSpecs, playerTag).then(
                    (playerSpecFiles) => {
                      const has = (file) =>
                        Object.prototype.hasOwnProperty.call(
                          playerSpecFiles,
                          file + playerTag,
                        );
                      const playerMods = cells
                        ? unitCells.expandMods(
                            inventory.mods(),
                            cells.vanilla,
                            cells.race,
                            has,
                          )
                        : inventory.mods();
                      playerFileGen.resolve(
                        buildPlayerFiles(
                          {
                            playerAIUnitMap: GW.specs.genAIUnitMap(
                              unitMaps.classic,
                              playerTag,
                            ),
                            playerX1AIUnitMap: titans
                              ? GW.specs.genAIUnitMap(unitMaps.x1, playerTag)
                              : {},
                            playerSpecFiles,
                            inventory,
                            titans,
                            race: playerRace,
                            mods: playerMods,
                            extraMods: playerExtraMods,
                          },
                          gwoAI,
                          gwoSpecs,
                        ),
                      );
                    },
                  ),
                );
              })
              .then(null, fail);
          })
          .then(null, fail);

        _.times(aiFactionCount, (n) => {
          filesToProcess.push(aiFactions[n]);
        });

        $.when.apply($, filesToProcess).then(function () {
          self.files(_.assign.apply(_, arguments));
          done.resolve();
        }, fail);
      } catch (error) {
        fail(error);
      }
    });
    return done.promise();
  };
});
