var gwoRefereeChangesLoaded;

function gwoRefereeChanges() {
  if (gwoRefereeChangesLoaded || model.game().isTutorial()) {
    return;
  }

  gwoRefereeChangesLoaded = true;

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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
      ],
      function (
        GW,
        GWReferee,
        gwoGenerateGameFiles,
        gwoGenerateAI,
        gwoGenerateConfig,
        gwoBiomeMods,
        gwoBiomes
      ) {
        var hiresThisLaunch = 0;
        // Set by stock fight before it hires, so this resets first.
        model.launchingFight.subscribe(function (launching) {
          if (launching) {
            hiresThisLaunch = 0;
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

        // A war saved before the stamp existed resolves it here instead, once,
        // and writes it onto the star's system so later launches read it.
        var stampedMods = function (system) {
          var done = $.Deferred();

          if (!system) {
            return done.resolve([]).promise();
          }
          if (system.gwoBiomeMods || !gwoBiomes.unservableBiome(system)) {
            return done.resolve(system.gwoBiomeMods || []).promise();
          }
          gwoBiomeMods.providers().then(function (providers) {
            var mods = gwoBiomes.modsFor(system, providers);
            if (mods.length) {
              system.gwoBiomeMods = mods;
            }
            done.resolve(mods);
          });
          return done.promise();
        };

        // The stamp is only mounted to read from and cooked into the files every
        // client gets. The server-facing mount happens in mountFiles, after the
        // unmount there.
        var gwoGenerateBiomes = function () {
          var self = this;
          var done = $.Deferred();
          var game = self.game();
          var system = game.galaxy().stars()[game.currentStar()].system();

          self.biomeMods = [];
          self.biomeServed = {};
          stampedMods(system).then(function (mods) {
            if (!mods.length) {
              done.resolve();
              return;
            }
            self.stage("!LOC:Processing biome mods");
            gwoBiomeMods.mount(mods).always(function () {
              gwoBiomeMods.cook(mods).then(function (result) {
                self.files(_.assign({}, self.files(), result.files));
                self.biomeMods = result.mods;
                self.biomeServed = result.served;
                done.resolve();
              });
            });
          });
          return done.promise();
        };

        gwoReferee.prototype.stripSystems = function () {
          var self = this;

          // remove the systems from the galaxy
          var gw = self.config().gw;
          GW.Game.saveSystems(gw);
        };

        gwoReferee.prototype.mountFiles = function () {
          var self = this;

          var deferred = $.Deferred();

          var allFiles = _.cloneDeep(self.files());
          // The player unit list needs to be the superset of units for proper UI behavior
          var unitList = "/pa/units/unit_list.json";
          var playerUnits = allFiles[unitList + ".player"];

          if (playerUnits) {
            var allUnits = _.cloneDeep(playerUnits);
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
          return _.bind(gwoGenerateGameFiles, ref)()
            .then(function () {
              ref.stage("!LOC:Processing AI mods");
            })
            .then(_.bind(gwoGenerateAI, ref))
            .then(_.bind(gwoGenerateBiomes, ref))
            .then(function () {
              ref.stage("!LOC:Processing game config");
            })
            .then(_.bind(gwoGenerateConfig, ref))
            .then(function () {
              // Later stages (mountFiles) belong to the launch, not a pass.
              ref.pass = 0;
              return ref;
            })
            .then(null, function (error) {
              // Stock waits on the hire with no fail handler, so a rejected
              // one would leave launchingFight set and the Fight button dead.
              console.error(
                "Galactic War Overhaul (GWO): battle preparation failed: " +
                  ((error && (error.stack || error.message)) || error)
              );
              model.launchingFight(false);
              return $.Deferred().reject(error).promise();
            });
        };
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoRefereeChanges();
