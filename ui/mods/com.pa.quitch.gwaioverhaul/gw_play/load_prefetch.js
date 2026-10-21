// Reads every AI file a `load` can name into a launch's tree cache before a
// co-op host's Fight. Stock's shared hire runs with only galacticWarMod mods
// mounted, so a file from a host-only mod would be unreadable there. See
// coop.md, "Host-only load files".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_ai_mods.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
], function (raceAiMods, gwoPromise, gameFilePaths) {
  var READ_LIMIT_MS = 10000;

  // Never rejects: an unread file is left to the hire, as before.
  var prime = function (treeCache) {
    var reads = treeCache
      .list(raceAiMods.AI_TECH_PATH)
      .then(function (fileList) {
        var jsonFiles = _.filter(fileList, function (filePath) {
          return _.endsWith(filePath, ".json");
        });
        return Promise.all(
          _.map(jsonFiles, function (filePath) {
            return treeCache.getJSON(filePath).then(_.noop, _.noop);
          })
        );
      });

    return gwoPromise
      .within(reads, READ_LIMIT_MS, "AI load file read")
      .then(_.noop, function (error) {
        console.error(
          "Galactic War Overhaul (GWO): AI load files not read before the battle: " +
            gameFilePaths.describeError(error)
        );
      });
  };

  return {
    prime: prime,
  };
});
