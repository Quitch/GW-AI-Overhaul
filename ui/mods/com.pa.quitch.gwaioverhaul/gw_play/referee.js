var gwoRefereeChangesLoaded;

function gwoRefereeChanges() {
  if (gwoRefereeChangesLoaded || model.game().isTutorial()) {
    return;
  }

  gwoRefereeChangesLoaded = true;

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

        // The stamp is only mounted to read from and cooked into the files every
        // client gets. The server-facing mount happens in mountFiles, after the
        // unmount there.
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
            gwoBiomeMods.mount(mods).always(() => {
              gwoBiomeMods.cook(mods).then((result) => {
                self.files(Object.assign({}, self.files(), result.files));
                self.biomeMods = result.mods;
                self.biomeServed = result.served;
                done.resolve();
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
          }

          stripSystems() {
            // remove the systems from the galaxy
            const gw = this.config().gw;
            GW.Game.saveSystems(gw);
          }

          // Returns a $.Deferred promise: stock gw_play.js fight() calls
          // .always() on it, which a native promise does not have.
          mountFiles() {
            const deferred = $.Deferred();

            const allFiles = _.cloneDeep(this.files());
            // The player unit list needs to be the superset of units for proper UI behavior
            const unitList = "/pa/units/unit_list.json";
            const playerUnits = allFiles[`${unitList}.player`];

            if (playerUnits) {
              const allUnits = _.cloneDeep(playerUnits);
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
          // Native-first so each step's return value is assimilated whether it
          // is a native promise or a jQuery deferred - jQuery 2.x's own .then
          // would treat a returned native promise as a plain value.
          const generated = Promise.resolve()
            .then(() => gwoGenerateGameFiles.call(ref))
            .then(() => gwoGenerateAI.call(ref))
            .then(() => gwoGenerateBiomes.call(ref))
            .then(() => gwoGenerateConfig.call(ref));

          // Stock gw_play.js fight() collects this through $.when, which does
          // not await native promises - the deferred is the compatibility
          // boundary.
          const hired = $.Deferred();
          generated.then(
            () => hired.resolve(ref),
            (error) => hired.reject(error),
          );
          return hired.promise();
        };
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoRefereeChanges();
