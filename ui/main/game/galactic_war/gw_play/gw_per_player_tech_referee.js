// The per-player-tech referee's testable pure helpers live in
// gw_play/per_player_tech.js (a plain define() over lodash only), so they stay
// coverage-measured and directly unit-tested
// (test/gw_per_player_tech_referee_ai_paths.test.js, ..._validate.test.js). This
// shadowed referee file depends on the unshipped shared/gw_common and so cannot load
// under the Node AMD harness; it is coverage-excluded as untestable glue.
define([
  "shared/gw_common",
  "shared/gw_inventory",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js",
], function (
  GW,
  GWInventory,
  gwoUnit,
  gwoAI,
  subcommanderTech,
  refereeAIPaths,
  gwoSpecs,
  perPlayerTech
) {
  var getPlayerTagGivenIndex = perPlayerTech.getPlayerTagGivenIndex;
  var stripKnownSpecTag = perPlayerTech.stripKnownSpecTag;
  var getViewerSubcommanderAiPath = perPlayerTech.getViewerSubcommanderAiPath;
  var validatePerPlayerTechInputs = perPlayerTech.validatePerPlayerTechInputs;
  // Files not assigned by default that we wish to mod - global for modder compatibility
  model.gwoSpecs = _.isArray(model.gwoSpecs) ? model.gwoSpecs : [];
  model.gwoSpecs = model.gwoSpecs.concat(gwoSpecs.additionalSpecs);

  var loadInventoryFromRecord = function (record) {
    var inventory = new GWInventory();
    inventory.load(_.cloneDeep(record.inventory));
    return inventory;
  };

  // Helper function which takes in a player's inventory and their tag,
  // and generates the appropriate unit specs.
  var generateUnitSpecsForPlayer = function (inventory, playerTag) {
    var done = $.Deferred();
    var titans = api.content.usingTitans();
    var aiMapLoad = $.get("spec://pa/ai/unit_maps/ai_unit_map.json");
    var aiX1MapLoad = titans
      ? $.get("spec://pa/ai/unit_maps/ai_unit_map_x1.json")
      : {};
    $.when(aiMapLoad, aiX1MapLoad).then(function (aiMapGet, aiX1MapGet) {
      var aiUnitMap = parse(aiMapGet[0]);
      var aiX1UnitMap = parse(aiX1MapGet[0]);

      var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, playerTag);
      var playerX1AIUnitMap = titans
        ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag)
        : {};
      var playerSpecs = inventory.units().concat(model.gwoSpecs);

      GW.specs
        .genUnitSpecs(playerSpecs, playerTag)
        .then(function (playerSpecFiles) {
          var playerFilesClassic = {};
          var playerFilesX1 = {};
          if (playerTag === ".player") {
            playerFilesClassic["/pa/ai/unit_maps/ai_unit_map.json.player"] =
              playerAIUnitMap;
            if (titans) {
              playerFilesX1["/pa/ai/unit_maps/ai_unit_map_x1.json.player"] =
                playerX1AIUnitMap;
            }
          } else {
            var playerScopedPath = getViewerSubcommanderAiPath(
              refereeAIPaths,
              subcommanderTech,
              gwoAI.aiInUse("subcommander"),
              inventory,
              playerTag
            );

            playerFilesClassic[
              playerScopedPath + "unit_maps/ai_unit_map.json" + playerTag
            ] = playerAIUnitMap;
            if (titans) {
              playerFilesX1[
                playerScopedPath + "unit_maps/ai_unit_map_x1.json" + playerTag
              ] = playerX1AIUnitMap;
            }
          }

          var playerFiles = _.assign(
            {},
            playerFilesClassic,
            playerFilesX1,
            playerSpecFiles
          );
          gwoSpecs.mod(playerFiles, inventory.mods(), playerTag);
          done.resolve(playerFiles);
        });
    });

    return done.promise();
  };

  // This referee should be applied after the co-op referee has done its work.
  // If per-player tech is enabled, this referee will generate the appropriate config
  // handling each player's
  //
  // Parameters:
  // - Referee: the already-hired GW referee object. This function expects it to expose:
  //       * config: an observable where referee.config() reads the generated battle config
  //             and referee.config(config) writes the mutated config back for later launch
  //             steps. Expected config fields used here are:
  //             - armies: an array of army objects already prepared by gw_coop_referee.
  //                   Per-player tech requires one non-AI human army for each connected
  //                   client.
  //             - armies[*].spec_tag: overwritten with .player, .player0, .player1, etc.
  //             - armies[*].commander: written with that player's tagged commander spec.
  //             - armies[*].player_config: written so gw_lobby can assign the matching
  //                   commander to the connected client mapped into that army.
  //             - player.commander: the host/default commander generated by gw_referee.
  //             - per_player_tech_ready: written true or false to record whether this
  //                   referee successfully prepared all per-player files and armies.
  //             - per_player_tech_tags: written with the player tags when preparation
  //                   succeeds.
  //       * files: an observable where referee.files() reads the generated mounted file map
  //             and referee.files(files) writes the merged host plus per-player tagged files.
  //       * game: an observable where referee.game() reads the GW.Game instance. This referee
  //             uses game.inventory() for the host and game.findCoopPlayerInventoryData()
  //             for joining players.
  //
  // - Options: a map/object describing the current launch context. Expected fields are:
  //       * active: true when this is a co-op Galactic War campaign fight; false for normal
  //             single-player GW, where this referee should do nothing and succeed.
  //       * sharedControl: true when all connected humans should share one army; false when
  //             each connected human should get a separate allied army.
  //       * perPlayerTechCards: true when per-player tech/loadouts are enabled. If false,
  //             this referee should do nothing and succeed.
  //       * connectedClients: an array of connected campaign clients for this fight. Its
  //             length must match the number of prepared human armies.
  //             Each client object within the array has an id, name, role ('host' or 'viewer')
  //             and loading status (loading = true or loading = false).
  var apply = function (referee, options) {
    var done = $.Deferred();

    // ERROR CHECKING
    // ==============

    var validation = validatePerPlayerTechInputs(referee, options);
    if (!validation.ok) {
      // writeFailure marks a genuine failure that has to disable per-player tech;
      // the remaining rejections (no co-op / feature disabled) are benign no-ops
      // that still resolve success, so log those at warning level instead.
      if (validation.writeFailure) {
        console.error(validation.message);
        validation.config.per_player_tech_ready = false;
        referee.config(validation.config);
      } else {
        console.warn(validation.message);
      }
      done.resolve(validation.resolveValue);
      return done.promise();
    }

    // ERROR CHECKING DONE
    // ===================

    var context = validation.context;
    var config = context.config;
    var connectedClients = context.connectedClients;
    var humanArmies = context.humanArmies;
    var files = context.files;
    var game = context.game;
    var inventory = context.inventory;
    var player = context.player;
    var playerColor = context.playerColor;
    var playerCount = context.playerCount;

    var playerTags = _.map(_.range(0, playerCount), getPlayerTagGivenIndex);

    var baseCommander = context.baseCommander;

    var playerInventories = [];
    var playerCommanders = [];
    playerInventories[0] = inventory;
    playerCommanders[0] = baseCommander;

    // For each co-op player, we need to find their stored inventory data, load it,
    // and generate tagged specs for their commander, units, and mods.
    // If any of that fails, we fail the whole referee since we can't guarantee
    // a fun fight without all players having their tech.

    for (
      var clientIndex = 1;
      clientIndex < connectedClients.length;
      clientIndex++
    ) {
      var connectedClient = connectedClients[clientIndex];
      var inventoryDataRecord =
        _.isFunction(game.findCoopPlayerInventoryData) &&
        game.findCoopPlayerInventoryData(connectedClient);

      if (!inventoryDataRecord) {
        console.error(
          "[GW COOP] Missing co-op player inventory data for client " +
            JSON.stringify(connectedClient)
        );
        config.per_player_tech_ready = false;
        referee.config(config);
        done.resolve(false);
        return done.promise();
      }

      if (
        !_.isString(inventoryDataRecord.commander) ||
        !inventoryDataRecord.inventory
      ) {
        console.error(
          "[GW COOP] Invalid co-op player inventory data for client " +
            JSON.stringify(connectedClient)
        );
        config.per_player_tech_ready = false;
        referee.config(config);
        done.resolve(false);
        return done.promise();
      }

      var loadedInventory = loadInventoryFromRecord(inventoryDataRecord);
      if (
        !_.isFunction(loadedInventory.units) ||
        !_.isFunction(loadedInventory.mods) ||
        !_.isFunction(loadedInventory.minions)
      ) {
        console.error(
          "[GW COOP] Invalid co-op player inventory for client " +
            JSON.stringify(connectedClient)
        );
        config.per_player_tech_ready = false;
        referee.config(config);
        done.resolve(false);
        return done.promise();
      }

      playerInventories[clientIndex] = loadedInventory;
      playerCommanders[clientIndex] = stripKnownSpecTag(
        inventoryDataRecord.commander
      );
    }

    // Keeps track of all the promises for generating player-specific specs.
    var playerSpecPromises = [];

    // We've already generated the .player tag, so we just need to generate subsequent tags.
    for (var i = 1; i < playerTags.length; i++) {
      var thisPlayersInventory = playerInventories[i];
      playerSpecPromises.push(
        generateUnitSpecsForPlayer(thisPlayersInventory, playerTags[i])
      );
    }

    $.when.apply($, playerSpecPromises).then(function () {
      var thisPlayersFiles = Array.prototype.slice.call(arguments);
      var generatedFiles = {};

      // Arguments is an array of the resolved values from the promises.
      for (var element of thisPlayersFiles) {
        _.assign(generatedFiles, element);
      }

      var mergedFiles = _.assign({}, files, generatedFiles);

      referee.files(mergedFiles);
      config.files = mergedFiles;

      _.forEach(humanArmies, function (army, index) {
        army.spec_tag = playerTags[index];

        // Per player tech cards requires that all armies are unshared,
        // thus each army only has one commander. So this is sensible.
        // If in the future we have multiple commanders, this will not be sensible.
        army.commander = playerCommanders[index] + playerTags[index];
        army.player_config = _.assign({}, player, {
          commander: army.commander,
        });

        // Now for each player we need to generate their minions and give those minions
        // this player's tag as well.

        var thisPlayersInventory = playerInventories[index];
        var viewerAiPath = getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          gwoAI.aiInUse("subcommander"),
          thisPlayersInventory,
          playerTags[index]
        );
        var minionCount = subcommanderTech.applySubcommanderDuplicationTech(
          thisPlayersInventory.cards()
        );
        _.forEach(thisPlayersInventory.minions(), function (minion) {
          // We skip the host's minions since those are already included in the config from the main referee.
          // We check if this is the host slot by seeing if the tag is .player, since the host is always .player.
          if (playerTags[index] === ".player") {
            return;
          }

          var minionPersonality = _.cloneDeep(minion.personality);
          subcommanderTech.applySubcommanderTacticsTech(
            minionPersonality,
            thisPlayersInventory.cards()
          );
          subcommanderTech.applySubcommanderFabberTech(
            minionPersonality,
            thisPlayersInventory.cards()
          );
          minionPersonality.ai_path = viewerAiPath;

          for (
            var duplicateIndex = 0;
            duplicateIndex < minionCount;
            duplicateIndex++
          ) {
            config.armies.push({
              slots: [
                {
                  ai: true,
                  name: minion.name || "Helper",
                  commander:
                    stripKnownSpecTag(
                      minion.commander || playerCommanders[index]
                    ) + playerTags[index],
                },
              ],
              color: minion.color || [playerColor[0], playerColor[1]],
              econ_rate: minion.econ_rate || 1,
              personality: minionPersonality,
              spec_tag: playerTags[index],
              alliance_group: 1,
            });
          }
        });
      });

      config.per_player_tech_ready = true;
      config.per_player_tech_tags = playerTags;
      referee.config(config);
      done.resolve(true);
    });
    return done.promise();
  };

  return {
    apply: apply,
  };
});
