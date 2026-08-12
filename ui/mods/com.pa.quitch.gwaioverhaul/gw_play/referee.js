var gwoRefereeChangesLoaded;

function gwoRefereeChanges() {
  if (gwoRefereeChangesLoaded || model.game().isTutorial()) {
    return;
  }

  gwoRefereeChangesLoaded = true;

  try {
    const gwoReferee = function (game) {
      const self = this;

      self.game = ko.observable(game);
      self.files = ko.observable();
      self.localFiles = ko.observable();
      self.config = ko.observable();
    };

    requireGW(
      [
        "shared/gw_common",
        "pages/gw_play/gw_referee",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_files.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js",
      ],
      (
        GW,
        GWReferee,
        gwoGenerateGameFiles,
        gwoGenerateAI,
        gwoGenerateConfig
      ) => {
        gwoReferee.prototype.stripSystems = function () {
          const self = this;

          // remove the systems from the galaxy
          const gw = self.config().gw;
          GW.Game.saveSystems(gw);
        };

        gwoReferee.prototype.mountFiles = function () {
          const self = this;

          const deferred = $.Deferred();

          const allFiles = _.cloneDeep(self.files());
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

          if (self.localFiles()) {
            _.assign(allFiles, self.localFiles());
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
              deferred.resolve();
            });
          });

          return deferred.promise();
        };

        gwoReferee.prototype.tagGame = () => {
          api.game.setUnitSpecTag(".player");
        };

        GWReferee.hire = (game) => {
          const ref = new gwoReferee(game);
          return _.bind(gwoGenerateGameFiles, ref)()
            .then(_.bind(gwoGenerateAI, ref))
            .then(_.bind(gwoGenerateConfig, ref))
            .then(() => ref);
        };
      }
    );
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoRefereeChanges();
