var gwoRefereeChangesLoaded;

if (!gwoRefereeChangesLoaded) {
  gwoRefereeChangesLoaded = true;

  function gwoRefereeChanges() {
    try {
      requireGW(
        [
          "shared/gw_common",
          "pages/gw_play/gw_referee",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_files.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js",
        ],
        function (
          GW,
          GWReferee,
          gwoGenerateGameFiles,
          gwoGenerateAI,
          gwoGenerateConfig
        ) {
          var gwoReferee = function (game) {
            var self = this;

            self.game = ko.observable(game);
            self.files = ko.observable();
            self.localFiles = ko.observable();
            self.config = ko.observable();
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
            var aiUnits = allFiles[unitList + ".ai"];
            if (playerUnits) {
              var allUnits = _.cloneDeep(playerUnits);
              if (aiUnits && allUnits.units) {
                allUnits.units = allUnits.units.concat(aiUnits.units);
              }
              allFiles[unitList] = allUnits;
            }

            if (self.localFiles()) {
              _.assign(allFiles, self.localFiles());
            }

            var cookedFiles = _.mapValues(allFiles, function (value) {
              if (!_.isString(value)) {
                return JSON.stringify(value);
              } else {
                return value;
              }
            });

            // community mods will hook unmountAllMemoryFiles to remount client mods
            api.file.unmountAllMemoryFiles().always(function () {
              api.file.mountMemoryFiles(cookedFiles).then(function () {
                deferred.resolve();
              });
            });

            return deferred.promise();
          };

          gwoReferee.prototype.tagGame = function () {
            api.game.setUnitSpecTag(".player");
          };

          GWReferee.hire = function (game) {
            // call our own gw_referee implementation
            var ref = new gwoReferee(game);
            return _.bind(gwoGenerateGameFiles, ref)()
              .then(_.bind(gwoGenerateAI, ref))
              .then(_.bind(gwoGenerateConfig, ref))
              .then(function () {
                return ref;
              });
          };
        }
      );
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoRefereeChanges();
}
