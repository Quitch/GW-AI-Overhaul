(() => {
  if (model.game().isTutorial()) {
    return;
  }

  try {
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
      (
        GW,
        GWReferee,
        gwoGenerateGameFiles,
        gwoGenerateAI,
        gwoGenerateConfig,
        gwoBiomeMods,
        gwoBiomes,
      ) => {
        let hiresThisLaunch = 0;
        // The AI tree cache lives one launch: a co-op host's two hires share
        // it, the next Fight starts a new one. See ai-pipeline.md.
        let treeCache = null;
        // Set by stock fight before it hires, so this resets first.
        model.launchingFight.subscribe((launching) => {
          if (launching) {
            hiresThisLaunch = 0;
            treeCache = null;
          }
        });

        // A war saved before the stamp existed resolves it here instead, once,
        // and writes it onto the star's system so later launches read it.
        const stampedMods = (system) => {
          const done = $.Deferred();

          if (!system) {
            return done.resolve([]).promise();
          }
          if (system.gwoBiomeMods || !gwoBiomes.unservableBiome(system)) {
            return done.resolve(system.gwoBiomeMods || []).promise();
          }
          gwoBiomeMods.providers().then((providers) => {
            const mods = gwoBiomes.modsFor(system, providers);
            if (mods.length) {
              system.gwoBiomeMods = mods;
            }
            done.resolve(mods);
          });
          return done.promise();
        };

        // A cooked stamp is mounted here only to read from; its server-facing
        // mount happens in mountFiles, after the unmount there. A stamp GW
        // Server Mods serves is already mounted, and only its biomes are
        // collected. See galaxy.md, "Biome mods in a GW battle".
        const gwoGenerateBiomes = function () {
          const self = this;
          const done = $.Deferred();
          const game = self.game();
          const system = game.galaxy().stars()[game.currentStar()].system();

          self.biomeMods = [];
          self.biomeServed = {};
          stampedMods(system).then((mods) => {
            if (!mods.length) {
              done.resolve();
              return;
            }
            const split = _.partition(mods, gwoBiomes.isGwsmServed);
            const cooked = split[1];

            self.stage("!LOC:Processing biome mods");
            gwoBiomeMods.mount(cooked).always(() => {
              gwoBiomeMods.cook(cooked).then((result) => {
                self.files(Object.assign({}, self.files(), result.files));
                self.biomeMods = result.mods;
                gwoBiomeMods.serve(split[0]).then((served) => {
                  self.biomeServed = Object.assign(
                    {},
                    result.served,
                    served.served,
                  );
                  done.resolve();
                });
              });
            });
          });
          return done.promise();
        };

        class GwoReferee {
          constructor(game) {
            this.game = ko.observable(game);
            this.files = ko.observable();
            this.localFiles = ko.observable();
            this.config = ko.observable();
            // Which hire of this launch built it: a co-op host hires twice.
            this.pass = 0;
          }

          // A co-op host hires a clean shared referee and then its own, so
          // each pass is labelled while it runs. See architecture.md.
          stage(key) {
            const progress = model.gwoLaunchProgress;
            if (!progress || !_.isFunction(progress.stage)) {
              return;
            }
            let text = loc(key);
            if (
              this.pass &&
              model.gwCampaignActive() &&
              model.isCampaignHost()
            ) {
              text = `${loc(
                this.pass === 1
                  ? "!LOC:Co-op shared setup"
                  : "!LOC:Co-op host setup",
              )}: ${text}`;
            }
            progress.stage(text);
          }

          stripSystems() {
            // saveSystems deletes each star's generated system from the config
            // and returns them; the config is what the battle carries, so this
            // is the strip, and the return value is not needed.
            const gw = this.config().gw;
            GW.Game.saveSystems(gw);
          }

          // Returns a $.Deferred promise: stock gw_play.js fight() calls
          // .always() on it, which a native promise does not have.
          mountFiles() {
            const deferred = $.Deferred();

            // GWO - shallow: keys are added below and no value is changed.
            const allFiles = Object.assign({}, this.files());
            // The player unit list needs to be the superset of units for proper UI behavior
            const unitList = "/pa/units/unit_list.json";
            const playerUnits = allFiles[`${unitList}.player`];

            if (playerUnits) {
              const allUnits = Object.assign({}, playerUnits); // GWO - units is replaced, not appended to
              // AI factions are tagged .ai0, .ai1, .ai2, ... (never a bare .ai),
              // so every matching key needs to be folded in, not just one fixed tag.
              _.forEach(allFiles, (value, key) => {
                if (
                  _.startsWith(key, `${unitList}.ai`) &&
                  value &&
                  value.units &&
                  allUnits.units
                ) {
                  allUnits.units = allUnits.units.concat(value.units);
                }
              });
              allFiles[unitList] = allUnits;
            }

            if (this.localFiles()) {
              _.assign(allFiles, this.localFiles());
            }

            const cookedFiles = _.mapValues(allFiles, (value) => {
              if (_.isString(value)) {
                return value;
              } else {
                return JSON.stringify(value);
              }
            });

            // community mods will hook unmountAllMemoryFiles to remount client mods
            api.file.unmountAllMemoryFiles().always(() => {
              this.stage("!LOC:Mounting game files");
              api.file.mountMemoryFiles(cookedFiles).then(() => {
                gwoBiomeMods.mount(this.biomeMods).always(() => {
                  deferred.resolve();
                });
              });
            });

            return deferred.promise();
          }

          tagGame() {
            api.game.setUnitSpecTag(".player");
          }
        }

        GWReferee.hire = (game) => {
          const ref = new GwoReferee(game);
          hiresThisLaunch += 1;
          ref.pass = hiresThisLaunch;
          treeCache = treeCache || gwoGenerateAI.createTreeCache();
          ref.treeCache = treeCache;

          // Native-first so each step's return value is assimilated whether it
          // is a native promise or a jQuery deferred - jQuery 2.x's own .then
          // would treat a returned native promise as a plain value.
          const generated = Promise.resolve()
            .then(() => gwoGenerateGameFiles.call(ref))
            .then(() => ref.stage("!LOC:Processing AI mods"))
            .then(() => gwoGenerateAI.call(ref))
            .then(() => gwoGenerateBiomes.call(ref))
            .then(() => ref.stage("!LOC:Processing game config"))
            .then(() => gwoGenerateConfig.call(ref))
            .then(() => {
              // Later stages (mountFiles) belong to the launch, not a pass.
              ref.pass = 0;
            });

          // Stock gw_play.js fight() collects this through $.when, which does
          // not await native promises - the deferred is the compatibility
          // boundary.
          const hired = $.Deferred();
          generated.then(
            () => hired.resolve(ref),
            (error) => {
              // Stock waits on the hire with no fail handler, so a rejected
              // one would leave launchingFight set and the Fight button dead.
              console.error(
                `Galactic War Overhaul (GWO): battle preparation failed: ${(error && (error.stack || error.message)) || error}`,
              );
              model.launchingFight(false);
              hired.reject(error);
            },
          );
          return hired.promise();
        };
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
