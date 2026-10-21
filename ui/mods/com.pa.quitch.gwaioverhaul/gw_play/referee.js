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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/race_cells.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_hires.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/load_prefetch.js",
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
        gwoPromise,
        coopAiRoster,
        refereeCoop,
        raceCells,
        launchHires,
        loadPrefetch
      ) {
        var hiresThisLaunch = 0;
        var latestHire = null;
        // The AI tree cache lives one launch: a co-op host's two hires share
        // it, the next Fight starts a new one. See ai-pipeline.md.
        var treeCache = null;
        var primedTreeCache = null;
        var priming = null;
        var firstHireClientKeys = null;
        // Set by stock fight before it hires, so this resets first.
        model.launchingFight.subscribe(function (launching) {
          if (launching) {
            hiresThisLaunch = 0;
            latestHire = null;
            treeCache = primedTreeCache;
            primedTreeCache = null;
            firstHireClientKeys = null;
            // Stock's own test for a co-op host's two hires.
            launchHires.begin(
              model.gwCampaignActive() && model.isCampaignHost() ? 2 : 1
            );
          }
        });

        // A co-op host's load files are read before stock fight restricts
        // the client mods. See coop.md, "Host-only load files".
        var previousFight = model.fight;
        model.fight = function (viewModel, event, cheat) {
          var fight = _.bind(
            previousFight.apply,
            previousFight,
            this,
            arguments
          );
          primedTreeCache = null;
          if (
            cheat === true ||
            model.launchingFight() ||
            !model.gwCampaignActive() ||
            !model.isCampaignHost()
          ) {
            return fight();
          }
          if (priming) {
            return priming;
          }
          var cache = gwoGenerateAI.createTreeCache();
          priming = gwoPromise
            .settled(loadPrefetch.prime(cache))
            .then(function () {
              priming = null;
              primedTreeCache = cache;
              return fight();
            });
          return priming;
        };

        // A co-op host hires a clean shared referee and then its own, so each
        // pass is labelled while it runs. See architecture.md.
        gwoReferee.prototype.stage = function (key) {
          var progress = model.gwoLaunchProgress;
          if (!progress) {
            return;
          }
          var source = { key: key };
          var text = loc(key);
          if (this.pass && model.gwCampaignActive() && model.isCampaignHost()) {
            source.prefix =
              this.pass === 1
                ? "!LOC:Co-op shared setup"
                : "!LOC:Co-op host setup";
            text = loc(source.prefix) + ": " + text;
          }
          progress.stage(text, source);
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
          // A battle needs no kept list, so its read never holds the mount.
          var keepUntagged = gwoPromise
            .within(raceCells.untaggedListFile(), 10000, "unit list read")
            .then(null, function (error) {
              console.error(
                "gwoRaces: no untagged unit list kept: " +
                  gameFilePaths.describeError(error)
              );
              return {};
            });

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

          var cookedFiles = gameFilePaths.cookFiles(allFiles);
          var resolveMounted = function () {
            deferred.resolve();
          };

          var mountWithKept = function (kept) {
            return api.file.mountMemoryFiles(
              _.assign({}, cookedFiles, gameFilePaths.cookFiles(kept))
            );
          };
          var mountBiomes = function () {
            gwoBiomeMods.mount(self.biomeMods).always(resolveMounted);
          };

          var mountCooked = function () {
            self.stage("!LOC:Mounting game files");
            keepUntagged.then(mountWithKept).then(mountBiomes);
          };

          // See architecture.md, "Battle launch, end to end".
          if (latestHire && !latestHire.cookedStampsMounted) {
            mountCooked();
          } else {
            // community mods will hook unmountAllMemoryFiles to remount client mods
            api.file.unmountAllMemoryFiles().always(mountCooked);
          }

          return deferred.promise();
        };

        gwoReferee.prototype.tagGame = function () {
          api.game.setUnitSpecTag(".player");
        };

        GWReferee.hire = function (game) {
          var ref = new gwoReferee(game);
          var stockEndsLaunch = launchHires.restoresAfterNext();
          hiresThisLaunch += 1;
          ref.pass = hiresThisLaunch;
          latestHire = ref;
          treeCache = treeCache || gwoGenerateAI.createTreeCache();
          ref.treeCache = treeCache;
          // installedRaces activates the add-ons whose mods are enabled, so a
          // hire never depends on scene-load ordering. It resolves at once
          // without GW Server Mods, and rejects if the installed races cannot
          // be read.
          var hire = gwoPromise
            .steps(raceMods.installedRaces(), [
              // The co-op AI players this battle fields, and the clients that
              // number their tags and the viewer trees, fixed for the hire. A
              // throw fails the hire: a battle is not fought without the AI
              // players its session has. See coop.md.
              function () {
                ref.hireClients = _.clone(refereeCoop.getConnectedClients());
                if (model.gwoCoopAi) {
                  ref.coopAis = model.gwoCoopAi.launchRoster(ref.hireClients);
                  return;
                }
                if (
                  model.gwCampaignActive() &&
                  coopAiRoster.aiRecords(game.coopPlayerInventoryData()).length
                ) {
                  throw new Error("co-op AI players are not loaded");
                }
                ref.coopAis = [];
              },
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
                // Both hires write viewer trees by position, and the
                // per-player referee checks only the first's list.
                if (ref.pass === 1) {
                  firstHireClientKeys = ref.hireClientKeys;
                } else if (
                  ref.pass === 2 &&
                  game.perPlayerTechCards() &&
                  !_.isEqual(ref.hireClientKeys, firstHireClientKeys)
                ) {
                  throw new Error(
                    "connected players changed between the co-op hires"
                  );
                }
                // A co-op host's own pass is mounted on this client alone, and
                // stock deep-clones its files first. lodash 3's cloneDeep is
                // quadratic in the objects it copies, so they go as JSON text.
                // See coop.md, "The two referees".
                if (
                  ref.pass === 2 &&
                  model.launchingFight() &&
                  model.gwCampaignActive() &&
                  model.isCampaignHost()
                ) {
                  ref.files(gameFilePaths.cookFiles(ref.files()));
                }
                // Later stages (mountFiles) belong to the launch, not a pass.
                ref.pass = 0;
                return ref;
              },
            ])
            .then(null, function (error) {
              // Stock waits on the hire with no fail handler, so a rejected
              // one would leave launchingFight set and the Fight button dead.
              // After a co-op host's first hire, stock clears it itself once
              // its restore remount ends. See architecture.md.
              console.error(
                "Galactic War Overhaul (GWO): battle preparation failed: " +
                  gameFilePaths.describeError(error)
              );
              if (!stockEndsLaunch) {
                model.launchingFight(false);
              }
              return $.Deferred().reject(error).promise();
            });
          launchHires.track(hire);
          return hire;
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
