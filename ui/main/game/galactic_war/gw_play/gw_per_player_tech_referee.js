var armyHasAI = function (army) {
  return !!(army && _.isArray(army.slots) && _.any(army.slots, "ai"));
};

var getConnectedPlayerCount = function (options) {
  var connectedClients = options && options.connectedClients;
  if (_.isArray(connectedClients) && connectedClients.length) {
    return connectedClients.length;
  }

  console.error("[GW COOP] Per-player tech referee has no connected players.");
  return 0;
};

var collectHumanArmies = function (config) {
  var humanArmies = [];

  _.forEach(config.armies, function (army) {
    if (!armyHasAI(army)) {
      humanArmies.push(army);
    }
  });

  return humanArmies;
};

var getPlayerTagGivenIndex = function (index) {
  // Host is still .player, and then subsequent players are .player0, .player1, etc.
  if (index === 0) {
    return ".player";
  } else {
    return ".player" + (index - 1);
  }
};

var stringEndsWith = function (value, suffix) {
  return _.isString(value) && value.slice(-suffix.length) === suffix;
};

var stripKnownSpecTag = function (value) {
  if (!_.isString(value)) {
    return value;
  }

  if (stringEndsWith(value, ".player")) {
    return value.slice(0, -".player".length);
  }

  var match = value.match(/\.player\d+$/);
  if (match) {
    return value.slice(0, -match[0].length);
  }

  return value;
};

define([
  "shared/gw_common",
  "shared/gw_inventory",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
], function (
  GW,
  GWInventory,
  gwoUnit,
  gwoAI,
  subcommanderTech,
  refereeAIPaths,
  gwoSpecs
) {
  if (!model.gwoSpecs) {
    model.gwoSpecs = [];
  }
  // files not assigned by default that we wish to mod
  model.gwoSpecs.push(
    gwoUnit.fireflyAmmo,
    gwoUnit.fireflyWeapon,
    gwoUnit.orcaTorpedo,
    gwoUnit.orcaTorpedoAmmo,
    gwoUnit.skitterAmmo,
    gwoUnit.skitterWeapon
  );

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
            var aiInUse = gwoAI.aiInUse("subcommander");
            var playerScopedPath = refereeAIPaths.getAIPathDestination(
              "subcommander",
              aiInUse,
              {
                guardians: false,
                aiMods: inventory.aiMods(),
                scopeToken: playerTag,
              }
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

    var config = referee && _.isFunction(referee.config) && referee.config();

    if (!config || !_.isArray(config.armies)) {
      console.error(
        "[GW COOP] Per-player tech referee received invalid battle config."
      );
      done.resolve(false);
      return done.promise();
    }

    // No options means no co-op.
    if (!options || !options.active) {
      console.error(
        "[GW COOP] Per-player tech referee called without co-op options."
      );
      done.resolve(true);
      return done.promise();
    }

    // Likewise no per-player tech means this referee is out of a job.
    if (!options.perPlayerTechCards) {
      console.error(
        "[GW COOP] Per-player tech referee called without per-player tech enabled."
      );
      done.resolve(true);
      return done.promise();
    }

    var playerCount = getConnectedPlayerCount(options);
    if (playerCount < 1) {
      console.error(
        "[GW COOP] Per-player tech referee has no connected players."
      );
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var connectedClients = options.connectedClients;

    var sharedControl = !!options.sharedControl;
    if (sharedControl) {
      console.error(
        "[GW COOP] Per-player tech referee does not support shared control."
      );
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var humanArmies = collectHumanArmies(config);
    if (humanArmies.length < 1) {
      console.error("[GW COOP] Per-player tech referee has no human armies.");
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    if (playerCount !== humanArmies.length) {
      console.error(
        "[GW COOP] Per-player tech referee has a mismatch between connected players and human armies."
      );
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var files = _.isFunction(referee.files) && referee.files();

    if (!files || !_.isObject(files)) {
      console.error("[GW COOP] Per-player tech referee has no files.");
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var game = _.isFunction(referee.game) && referee.game();

    if (!game) {
      console.error("[GW COOP] Per-player tech referee has no game.");
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var inventory = _.isFunction(game.inventory) && game.inventory();

    if (!inventory) {
      console.error("[GW COOP] Per-player tech referee has no inventory.");
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    if (
      !_.isFunction(inventory.units) ||
      !_.isFunction(inventory.mods) ||
      !_.isFunction(inventory.minions)
    ) {
      console.error(
        "[GW COOP] Per-player tech referee has invalid inventory units, mods, or minions. Per-player tech game inventory is: " +
          JSON.stringify(inventory)
      );
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var player = config.player;

    if (!player || !_.isObject(player)) {
      console.error("[GW COOP] Per-player tech referee has no player.");
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var playerCommander = player.commander;

    if (!playerCommander || !_.isString(playerCommander)) {
      console.error(
        "[GW COOP] Per-player tech referee has no player commander."
      );
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    var playerColor = inventory.getTag("global", "playerColor");

    if (!_.isArray(playerColor) || playerColor.length < 2) {
      console.error("[GW COOP] Per-player tech referee has no player color.");
      config.per_player_tech_ready = false;
      referee.config(config);
      done.resolve(false);
      return done.promise();
    }

    // ERROR CHECKING DONE
    // ===================

    var playerTags = _.map(_.range(0, playerCount), getPlayerTagGivenIndex);

    var baseCommander = stripKnownSpecTag(playerCommander);

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
        var viewerAiPath = refereeAIPaths.getAIPathDestination(
          "subcommander",
          gwoAI.aiInUse("subcommander"),
          {
            guardians: false,
            aiMods: thisPlayersInventory.aiMods(),
            smartSubcommanders: _.some(thisPlayersInventory.cards(), {
              id: "gwaio_upgrade_subcommander_tactics",
            }),
            scopeToken:
              playerTags[index] === ".player" ? undefined : playerTags[index],
          }
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
