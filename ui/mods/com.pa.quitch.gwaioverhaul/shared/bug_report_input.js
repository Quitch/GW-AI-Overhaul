// Engine glue for shared/bug_report.js: what every scene's bug report shares.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwsm.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
], function (gwsm, gwoVersion) {
  // Every server mod GW Server Mods has active, folders included: the war's
  // race and add-on mods were recorded from the same list.
  var serverMods = function () {
    var done = $.Deferred();
    var manifest = gwsm.manifest();

    if (!manifest) {
      return done.resolve({ mods: [], known: true, gwsm: false }).promise();
    }
    $.when(manifest.load()).always(function () {
      try {
        done.resolve({
          mods: _.map(manifest.activeServerMods(), function (mod) {
            return {
              identifier: mod.identifier,
              displayName: mod.displayName || mod.identifier,
              version: mod.version,
            };
          }),
          known: !_.isFunction(manifest.listed) || !!manifest.listed(),
          gwsm: true,
        });
      } catch (e) {
        done.resolve({ mods: [], known: false, gwsm: true });
      }
    });
    return done.promise();
  };

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
      serverMods().always(function (server) {
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
