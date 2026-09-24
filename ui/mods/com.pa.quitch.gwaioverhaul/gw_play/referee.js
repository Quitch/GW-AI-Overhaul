(function () {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    var gwoReferee = function (game) {
      var self = this;

      self.game = ko.observable(game);
      self.files = ko.observable();
      self.localFiles = ko.observable();
      self.config = ko.observable();
      // Which hire of this launch built it: a co-op host hires twice.
      self.pass = 0;
    };

    requireGW(
      [
        "shared/gw_common",
        "pages/gw_play/gw_referee",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_files.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_biomes.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
      ],
      function (
        GW,
        GWReferee,
        gwoGenerateGameFiles,
        gwoGenerateAI,
        gwoGenerateConfig,
        gwoGenerateBiomes,
        gwoBiomeMods,
        raceMods,
        gameFilePaths,
        gwoPromise
      ) {
        var hiresThisLaunch = 0;
        // The AI tree cache lives one launch: a co-op host's two hires share
        // it, the next Fight starts a new one. See ai-pipeline.md.
        var treeCache = null;
        // Set by stock fight before it hires, so this resets first.
        model.launchingFight.subscribe(function (launching) {
          if (launching) {
            hiresThisLaunch = 0;
            treeCache = null;
          }
        });

        // A co-op host hires a clean shared referee and then its own, so each
        // pass is labelled while it runs. See architecture.md.
        gwoReferee.prototype.stage = function (key) {
          var progress = model.gwoLaunchProgress;
          if (!progress || !_.isFunction(progress.stage)) {
            return;
          }
          var text = loc(key);
          if (this.pass && model.gwCampaignActive() && model.isCampaignHost()) {
            text =
              loc(
                this.pass === 1
                  ? "!LOC:Co-op shared setup"
                  : "!LOC:Co-op host setup"
              ) +
              ": " +
              text;
          }
          progress.stage(text);
        };

        gwoReferee.prototype.stripSystems = function () {
          var self = this;

          // saveSystems deletes each star's generated system from the config
          // and returns them; the config is what the battle carries, so this
          // is the strip, and the return value is not needed.
          var gw = self.config().gw;
          GW.Game.saveSystems(gw);
        };

        gwoReferee.prototype.mountFiles = function () {
          var self = this;

          var deferred = $.Deferred();

          // GWO - shallow: keys are added below and no value is changed.
          var allFiles = _.assign({}, self.files());
          // The player unit list needs to be the superset of units for proper UI behavior
          var unitList = "/pa/units/unit_list.json";
          var playerUnits = allFiles[unitList + ".player"];

          if (playerUnits) {
            var allUnits = _.assign({}, playerUnits); // GWO - units is replaced, not appended to
            // AI factions are tagged .ai0, .ai1, .ai2, ... (never a bare .ai),
            // so every matching key needs to be folded in, not just one fixed tag.
            _.forEach(allFiles, function (value, key) {
              if (
                _.startsWith(key, unitList + ".ai") &&
                value &&
                value.units &&
                allUnits.units
              ) {
                allUnits.units = allUnits.units.concat(value.units);
              }
            });
            allFiles[unitList] = allUnits;
          }

          if (self.localFiles()) {
            _.assign(allFiles, self.localFiles());
          }

          var cookedFiles = _.mapValues(allFiles, function (value) {
            if (_.isString(value)) {
              return value;
            } else {
              return JSON.stringify(value);
            }
          });

          // community mods will hook unmountAllMemoryFiles to remount client mods
          api.file.unmountAllMemoryFiles().always(function () {
            self.stage("!LOC:Mounting game files");
            api.file.mountMemoryFiles(cookedFiles).then(function () {
              gwoBiomeMods.mount(self.biomeMods).always(function () {
                deferred.resolve();
              });
            });
          });

          return deferred.promise();
        };

        gwoReferee.prototype.tagGame = function () {
          api.game.setUnitSpecTag(".player");
        };

        GWReferee.hire = function (game) {
          var ref = new gwoReferee(game);
          hiresThisLaunch += 1;
          ref.pass = hiresThisLaunch;
          treeCache = treeCache || gwoGenerateAI.createTreeCache();
          ref.treeCache = treeCache;
          // installedRaces activates the add-ons whose mods are enabled, so a
          // hire never depends on scene-load ordering. It resolves at once
          // without GW Server Mods, and rejects if the installed races cannot
          // be read.
          return gwoPromise
            .steps(raceMods.installedRaces(), [
              _.bind(gwoGenerateGameFiles, ref),
              function () {
                ref.stage("!LOC:Processing AI mods");
              },
              _.bind(gwoGenerateAI, ref),
              _.bind(gwoGenerateBiomes, ref),
              function () {
                ref.stage("!LOC:Processing game config");
              },
              _.bind(gwoGenerateConfig, ref),
              function () {
                // Later stages (mountFiles) belong to the launch, not a pass.
                ref.pass = 0;
                return ref;
              },
            ])
            .then(null, function (error) {
              // Stock waits on the hire with no fail handler, so a rejected
              // one would leave launchingFight set and the Fight button dead.
              console.error(
                "Galactic War Overhaul (GWO): battle preparation failed: " +
                  gameFilePaths.describeError(error)
              );
              model.launchingFight(false);
              return $.Deferred().reject(error).promise();
            });
        };
      },
      // Stock's referee stays hired, so battles are fought without GWO's
      // game files.
      function (err) {
        console.error(
          "Galactic War Overhaul (GWO): referee modules not loaded: " +
            err.requireModules +
            ": " +
            (err.stack || err.message || err)
        );
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
