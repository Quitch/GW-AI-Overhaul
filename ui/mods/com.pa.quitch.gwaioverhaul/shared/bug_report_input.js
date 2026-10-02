// Engine glue for shared/bug_report.js: what every scene's bug report shares.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
], function (gwoBiomeMods, gwoVersion) {
  // An empty list means GW Server Mods cannot tell.
  var hostServerMods = function () {
    var gwsm = window.GwServerMods;
    if (!gwsm || !_.isFunction(gwsm.hostServerMods)) {
      return undefined;
    }
    try {
      return gwsm.hostServerMods();
    } catch (e) {
      return undefined;
    }
  };

  // Resolves the scene's own input plus the version, language and mod lists.
  // Never rejects.
  var gather = function (sceneInput, isViewer) {
    var done = $.Deferred();
    var input = _.assign(
      {
        running: gwoVersion,
        language: api.settings.value("ui", "language"),
        hostServer: isViewer ? hostServerMods() : undefined,
      },
      sceneInput
    );
    var withServerMods = function () {
      gwoBiomeMods.installedBiomeMods().always(function (server) {
        input.server = server;
        done.resolve(input);
      });
    };

    api.mods.getMounted("client").then(function (mods) {
      input.client = mods;
      withServerMods();
    }, withServerMods);
    return done.promise();
  };

  return {
    gather: gather,
  };
});
