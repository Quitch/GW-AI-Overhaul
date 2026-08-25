// Engine glue for shared/gwo_biomes.js: the enabled server mods whose biomes a
// Galactic War battle can be given. See galaxy.md, "System brackets".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
], function (gwoBiomes) {
  var serverModsRoot = "/server_mods/";

  var modRecord = function (mod) {
    return {
      identifier: mod.identifier,
      installedPath: mod.installedPath,
      mountPath: mod.mountPath || serverModsRoot + mod.identifier + "/",
    };
  };

  var byPriority = function (mods) {
    return _.sortBy(mods, function (mod) {
      return -(Number(mod.priority) || 0);
    });
  };

  // gw_play loads the Community Mods manager; gw_start does not, so there the
  // manager's own IndexedDB store is read through the stock `db` extender. The
  // extender writes back on change and creates the record when the key is
  // missing, so the observable is never written and never created here.
  var enabledServerZipMods = function () {
    var manager = window.CommunityModsManager;
    var done = $.Deferred();

    if (manager && _.isFunction(manager.ready)) {
      manager.ready().always(function () {
        done.resolve(_.map(manager.activeServerZipMods(), modRecord));
      });
      return done.promise();
    }

    if (!window.localStorage || !window.localStorage.installedModsDB) {
      return done.resolve([]).promise();
    }
    var installed = ko.observableArray([]).extend({
      db: { local_name: "installedModsDB", db_name: "installed_mods" },
    });
    $.when(installed.ready).always(function (mods) {
      var zipMods = _.filter(_.isArray(mods) ? mods : [], function (mod) {
        return (
          mod &&
          mod.context === "server" &&
          mod.enabled &&
          !mod.fileSystem &&
          mod.installedPath
        );
      });
      done.resolve(_.map(byPriority(zipMods), modRecord));
    });
    return done.promise();
  };

  var catalogOf = function (mod) {
    var done = $.Deferred();

    api.file.zip.catalog(mod.installedPath).then(
      function (catalog) {
        done.resolve(
          gwoBiomes.catalogInfo(mod, gwoBiomes.catalogEntries(catalog))
        );
      },
      function () {
        console.warn(
          "gwoBiomeMods: could not read " +
            mod.installedPath +
            "; skipping " +
            mod.identifier
        );
        done.resolve(undefined);
      }
    );
    return done.promise();
  };

  // Never rejects: with nothing readable the caller keeps the stock biomes.
  var providers = function () {
    var done = $.Deferred();

    enabledServerZipMods().then(function (mods) {
      if (!mods.length) {
        done.resolve({});
        return;
      }
      $.when.apply($, _.map(mods, catalogOf)).then(function () {
        done.resolve(gwoBiomes.providersFrom(_.toArray(arguments)));
      });
    });
    return done.promise();
  };

  return {
    enabledServerZipMods: enabledServerZipMods,
    providers: providers,
  };
});
