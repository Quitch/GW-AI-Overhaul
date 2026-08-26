// Per-player tech in co-op. GWO extracts the validation to the measured
// gw_play/per_player_tech.js (see testing.md), and continues viewers'
// subcommanders along the player-faction colour sequence where stock leaves them
// on colliding raw faction colours. Glue only. See shadowing.md.
define([
  "shared/gw_common",
  "shared/gw_inventory",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js",
], function (
  GW,
  GWInventory,
  gwoUnit,
  gwoAI,
  refereeCoop,
  subcommanderTech,
  refereeAIPaths,
  gwoSpecs,
  gwoColour,
  perPlayerTech
) {
  var getPlayerTagGivenIndex = perPlayerTech.getPlayerTagGivenIndex;
  var stripKnownSpecTag = perPlayerTech.stripKnownSpecTag;
  var getViewerSubcommanderAiPath = perPlayerTech.getViewerSubcommanderAiPath;
  var buildViewerSubcommanderArmies =
    perPlayerTech.buildViewerSubcommanderArmies;
  var validatePerPlayerTechInputs = perPlayerTech.validatePerPlayerTechInputs;

  // Files not assigned by default that we wish to mod - global for modder
  // compatibility, New-GW-Cards pushes here - see tech-cards.md. Seeded with
  // GWO's own list by gw_play/referee_game_files.js, which loads first.
  model.gwoSpecs = _.isArray(model.gwoSpecs) ? model.gwoSpecs : [];

  var loadInventoryFromRecord = function (record) {
    var inventory = new GWInventory();
    inventory.load(_.cloneDeep(record.inventory));
    return inventory;
  };

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
          // Only viewers reach here - apply() generates from index 1 - so the
          // host's .player files are never built by this path.
          var playerScopedPath = getViewerSubcommanderAiPath(
            refereeAIPaths,
            subcommanderTech,
            gwoAI.aiInUse("subcommander"),
            inventory,
            playerTag
          );
          var playerFilesClassic = {};
          var playerFilesX1 = {};
          playerFilesClassic[
            playerScopedPath + "unit_maps/ai_unit_map.json" + playerTag
          ] = playerAIUnitMap;
          if (titans) {
            playerFilesX1[
              playerScopedPath + "unit_maps/ai_unit_map_x1.json" + playerTag
            ] = playerX1AIUnitMap;
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

  // Runs after the co-op referee, which leaves config.armies holding one non-AI
  // army per connected client. Writes each army's spec_tag, commander and
  // player_config, plus the per_player_tech_ready/_tags later launch steps read.
  // The input contract lives in validatePerPlayerTechInputs.
  var apply = function (referee, options) {
    var done = $.Deferred();

    var validation = validatePerPlayerTechInputs(referee, options);
    if (!validation.ok) {
      // Only writeFailure is a genuine failure. The rest are benign no-ops that
      // still resolve success.
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

    // A failure here fails the whole referee: a fight where some player is
    // missing their tech is not worth launching.

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

      for (var element of thisPlayersFiles) {
        _.assign(generatedFiles, element);
      }

      var mergedFiles = _.assign({}, files, generatedFiles);

      referee.files(mergedFiles);
      config.files = mergedFiles;

      // Viewers' subcommanders continue the colour sequence the main referee
      // started. Without this they take their raw faction colour and collide.
      var playerFaction = inventory.getTag("global", "playerFaction");
      var colourPosition = inventory.minions().length;

      _.forEach(humanArmies, function (army, index) {
        army.spec_tag = playerTags[index];

        // Safe only because per-player tech forces unshared armies, so each
        // army has exactly one commander.
        army.commander = playerCommanders[index] + playerTags[index];
        army.player_config = _.assign({}, player, {
          commander: army.commander,
        });

        var thisPlayersInventory = playerInventories[index];
        var viewerAiPath = getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          gwoAI.aiInUse("subcommander"),
          thisPlayersInventory,
          playerTags[index]
        );
        var viewerSubcommanders = buildViewerSubcommanderArmies({
          subcommanderTech: subcommanderTech,
          gwoColour: gwoColour,
          refereeCoop: refereeCoop,
          playerInventory: thisPlayersInventory,
          playerTag: playerTags[index],
          playerCommander: playerCommanders[index],
          playerFaction: playerFaction,
          playerColor: playerColor,
          viewerAiPath: viewerAiPath,
          subcommanderEconRate: gwoAI.subcommanderEconRate,
          colourPosition: colourPosition,
        });
        colourPosition = viewerSubcommanders.colourPosition;
        _.forEach(viewerSubcommanders.armies, function (subcommanderArmy) {
          config.armies.push(subcommanderArmy);
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
