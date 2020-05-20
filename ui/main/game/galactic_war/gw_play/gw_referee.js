define(["shared/gw_common"], function (GW) {
  var GWReferee = function (game) {
    var self = this;

    self.game = ko.observable(game);

    self.files = ko.observable();
    self.localFiles = ko.observable();
    self.config = ko.observable();
  };

  var generateGameFiles = function () {
    var self = this;

    // Game file generation cannot use previously mounted files.  That would be bad.
    var done = $.Deferred();

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      var titans = api.content.usingTitans();

      var aiFileGen = $.Deferred();
      var playerFileGen = $.Deferred();
      var unitsLoad = $.get("spec://pa/units/unit_list.json");
      var aiMapLoad = $.get("spec://pa/ai/unit_maps/ai_unit_map.json");
      var aiX1MapLoad = titans
        ? $.get("spec://pa/ai/unit_maps/ai_unit_map_x1.json")
        : {};
      $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(function (
        unitsGet,
        aiMapGet,
        aiX1MapGet
      ) {
        var units = parse(unitsGet[0]).units;

        var aiUnitMap = parse(aiMapGet[0]);
        var aiX1UnitMap = parse(aiX1MapGet[0]);

        var enemyAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, ".ai");
        var enemyX1AIUnitMap = GW.specs.genAIUnitMap(aiX1UnitMap, ".ai");

        GW.specs.genUnitSpecs(units, ".ai").then(function (aiSpecFiles) {
          var aiFilesClassic = _.assign(
            { "/pa/ai/unit_maps/ai_unit_map.json.ai": enemyAIUnitMap },
            aiSpecFiles
          );
          var aiFilesX1 = titans
            ? _.assign(
                { "/pa/ai/unit_maps/ai_unit_map_x1.json.ai": enemyX1AIUnitMap },
                aiSpecFiles
              )
            : {};
          var aiFiles = _.assign({}, aiFilesClassic, aiFilesX1);
          aiFileGen.resolve(aiFiles);
        });

        var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, ".player");
        var playerX1AIUnitMap = titans
          ? GW.specs.genAIUnitMap(aiX1UnitMap, ".player")
          : {};

        var inventory = self.game().inventory();

        GW.specs
          .genUnitSpecs(inventory.units(), ".player")
          .then(function (playerSpecFiles) {
            var playerFilesClassic = _.assign(
              { "/pa/ai/unit_maps/ai_unit_map.json.player": playerAIUnitMap },
              playerSpecFiles
            );
            var playerFilesX1 = titans
              ? _.assign(
                  {
                    "/pa/ai/unit_maps/ai_unit_map_x1.json.player": playerX1AIUnitMap,
                  },
                  playerSpecFiles
                )
              : {};
            var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
            GW.specs.modSpecs(playerFiles, inventory.mods(), ".player");
            playerFileGen.resolve(playerFiles);
          });
      });
      $.when(aiFileGen, playerFileGen).then(function (aiFiles, playerFiles) {
        var files = _.assign({}, aiFiles, playerFiles);
        self.files(files);
        done.resolve();
      });
    });
    return done.promise();
  };

  // The commanders changed from an object notation to a string.  In order to
  // process old save games properly, we need to patch up the commander spec
  // before sending to the server.
  var fixupCommander = function (commander) {
    if (_.isObject(commander) && _.isString(commander.UnitSpec))
      return commander.UnitSpec;
    return commander;
  };

  var generateConfig = function () {
    var self = this;

    var game = self.game();
    var galaxy = game.galaxy();
    var battleGround = galaxy.stars()[game.currentStar()];
    var system = battleGround.system();
    var ai = battleGround.ai();
    var inventory = game.inventory();
    var playerColor = inventory.getTag("global", "playerColor");
    var playerCommander = inventory.getTag("global", "commander");
    var armies = [];
    var slotsArray = [];
    var aiLandingOptions = [
      "off_player_planet",
      "on_player_planet",
      "no_restriction",
    ];

    var setupPlayerArmy = function () {
      var setupPlayer = function () {
        console.debug("Setup player");
        armies.push({
          slots: [{ name: "Player" }],
          color: playerColor,
          econ_rate: 1,
          spec_tag: ".player",
          alliance_group: 1,
        });
      };
      var setupSubCommander = function (minion) {
        console.debug("Setup Sub Commander");
        armies.push({
          slots: [
            {
              ai: true,
              name: minion.name || "Sub Commander",
              commander: fixupCommander(minion.commander || playerCommander),
              landing_policy: _.sample(aiLandingOptions),
            },
          ],
          color: minion.color || [playerColor[1], playerColor[0]],
          econ_rate: 1,
          personality: minion.personality,
          spec_tag: ".player",
          alliance_group: 1,
        });
        subCommander += 1;
      };
      var playerArmies = [setupPlayer];
      var subCommander = 0;
      _.forEach(inventory.minions(), function () {
        playerArmies.push(setupSubCommander);
      });
      playerArmies = _.shuffle(playerArmies);
      console.debug(playerArmies);
      _.forEach(playerArmies, function (playerArmy) {
        if (playerArmy === setupSubCommander)
          playerArmy(inventory.minions()[subCommander]);
        else playerArmy();
      });
    };

    var setupAIFactionArmy = function () {
      if (ai.character === "Boss") {
        if (ai.bossCommanders) {
          for (var i = 0; i < ai.bossCommanders; i++) {
            slotsArray.push({
              ai: true,
              name: ai.name,
              commander: fixupCommander(ai.commander),
              landing_policy: _.sample(aiLandingOptions),
            });
          }
        } else {
          // Support GWAIO v2.0.4 and earlier
          for (i = 0; i < ai.landing_policy.length; i++) {
            slotsArray.push({
              ai: true,
              name: ai.name,
              commander: fixupCommander(ai.commander),
              landing_policy: _.sample(aiLandingOptions),
            });
          }
        }
      } else {
        slotsArray.push({
          ai: true,
          name: ai.name,
          commander: fixupCommander(ai.commander),
          landing_policy: _.sample(aiLandingOptions),
        });
      }
      armies.push({
        slots: slotsArray,
        color: ai.color,
        econ_rate: ai.econ_rate,
        personality: ai.personality,
        spec_tag: ".ai",
        alliance_group: 2,
      });
      _.forEach(ai.minions, function (minion) {
        // Ensure the AI doesn't have a weak early game due to eco boosts
        minion.personality.adv_eco_mod =
          minion.personality.adv_eco_mod * (minion.econ_rate || ai.econ_rate);
        minion.personality.adv_eco_mod_alone =
          minion.personality.adv_eco_mod_alone *
          (minion.econ_rate || ai.econ_rate);
        armies.push({
          slots: [
            {
              ai: true,
              name: minion.name || "Minion",
              commander: fixupCommander(minion.commander || ai.commander),
              landing_policy: _.sample(aiLandingOptions),
            },
          ],
          color: minion.color,
          econ_rate: minion.econ_rate || ai.econ_rate,
          personality: minion.personality,
          spec_tag: ".ai",
          alliance_group: 2,
        });
      });
    };

    var setupAdditionalFactionArmy = function (foe) {
      var slotsArrayFoes = [];
      // Ensure the AI doesn't have a weak early game due to eco boosts
      foe.personality.adv_eco_mod =
        foe.personality.adv_eco_mod * (foe.econ_rate || ai.econ_rate);
      foe.personality.adv_eco_mod_alone =
        foe.personality.adv_eco_mod_alone * (foe.econ_rate || ai.econ_rate);
      if (foe.commanderCount) {
        for (var i = 0; i < foe.commanderCount; i++) {
          slotsArrayFoes.push({
            ai: true,
            name: foe.name || "Foe",
            commander: fixupCommander(foe.commander || ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          });
        }
      } else if (foe.landing_policy) {
        // Support GWAIO v1.2.0 - v2.0.4
        for (i = 0; i < foe.landing_policy.length; i++) {
          slotsArrayFoes.push({
            ai: true,
            name: foe.name || "Foe",
            commander: fixupCommander(foe.commander || ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          });
        }
      } else {
        // Support GWAIO v1.1.0 and earlier
        slotsArrayFoes.push({
          ai: true,
          name: foe.name || "Foe",
          commander: fixupCommander(foe.commander || ai.commander),
          landing_policy: _.sample(aiLandingOptions),
        });
      }
      armies.push({
        slots: slotsArrayFoes,
        color: foe.color,
        econ_rate: foe.econ_rate || ai.econ_rate,
        personality: foe.personality,
        spec_tag: ".ai",
        alliance_group: allianceGroup,
      });
      foeArmy = 1;
      allianceGroup += 1;
    };

    // Ensure the AI doesn't have a weak early game due to eco boosts
    ai.personality.adv_eco_mod = ai.personality.adv_eco_mod * ai.econ_rate;
    ai.personality.adv_eco_mod_alone =
      ai.personality.adv_eco_mod_alone * ai.econ_rate;

    // Spawn the teams (not armies) in a random order
    var foeArmy = 0;
    var allianceGroup = 3;
    var spawnOrder = [setupPlayerArmy, setupAIFactionArmy];
    if (ai.foes) {
      ai.foes = _.shuffle(ai.foes);
      for (var i = 0; i < ai.foes.length; i++)
        spawnOrder.push(setupAdditionalFactionArmy);
    }
    spawnOrder = _.shuffle(spawnOrder);
    for (i = 0; i < spawnOrder.length; i++) {
      if (spawnOrder[i] === setupAdditionalFactionArmy)
        spawnOrder[i](ai.foes[foeArmy]);
      else spawnOrder[i]();
    }

    var config = {
      files: self.files(),
      armies: armies,
      player: {
        commander: fixupCommander(playerCommander),
      },
      system: system,
    };
    _.forEach(config.armies, function (army) {
      _.forEach(army.slots, function (slot) {
        if (slot.ai)
          slot.commander += army.alliance_group === 1 ? ".player" : ".ai";
      });
    });
    config.player.commander += ".player";
    // Store the game in the config for diagnostic purposes.
    config.gw = game.save();
    self.config(config);
  };

  GWReferee.prototype.stripSystems = function () {
    var self = this;

    // remove the systems from the galaxy
    var gw = self.config().gw;
    GW.Game.saveSystems(gw);
  };

  GWReferee.prototype.mountFiles = function () {
    var self = this;

    var deferred = $.Deferred();

    var allFiles = _.cloneDeep(self.files());
    // The player unit list needs to be the superset of units for proper UI behavior
    var playerUnits = allFiles["/pa/units/unit_list.json.player"];
    var aiUnits = allFiles["/pa/units/unit_list.json.ai"];
    if (playerUnits) {
      var allUnits = _.cloneDeep(playerUnits);
      if (aiUnits && allUnits.units) {
        allUnits.units = allUnits.units.concat(aiUnits.units);
      }
      allFiles["/pa/units/unit_list.json"] = allUnits;
    }

    if (self.localFiles()) {
      _.extend(allFiles, self.localFiles());
    }

    var cookedFiles = _.mapValues(allFiles, function (value) {
      if (typeof value !== "string") return JSON.stringify(value);
      else return value;
    });

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      api.file.mountMemoryFiles(cookedFiles).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  GWReferee.prototype.tagGame = function () {
    api.game.setUnitSpecTag(".player");
  };

  loadScript("coui://download/community-mods-gw_referee.js");

  return {
    hire: function (game) {
      var ref = new GWReferee(game);
      return _.bind(generateGameFiles, ref)()
        .then(_.bind(generateConfig, ref))
        .then(function () {
          return ref;
        });
    },
  };
});
