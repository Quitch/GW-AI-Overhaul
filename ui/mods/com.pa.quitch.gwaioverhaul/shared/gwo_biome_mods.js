// Engine glue for shared/gwo_biomes.js: the enabled server mods whose biomes a
// Galactic War battle can be given. See galaxy.md, "Biome mods in a GW battle".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
], function (gwoBiomes, gwoPromise) {
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

  var settled = gwoPromise.settled;

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
    return settled(api.file.zip.catalog(mod.installedPath), function () {
      console.warn(
        "gwoBiomeMods: could not read " +
          mod.installedPath +
          "; skipping " +
          mod.identifier
      );
      return undefined;
    }).then(function (catalog) {
      return catalog
        ? gwoBiomes.catalogInfo(mod, gwoBiomes.catalogEntries(catalog))
        : undefined;
    });
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

  // Mounted the way Community Mods mounts server mods for a skirmish, which the
  // local server inherits when it spawns. Never rejects.
  var mount = function (mods) {
    var zips = _.map(mods || [], function (mod) {
      return { path: mod.installedPath, root: mod.mountPath };
    });
    var failed = function () {
      console.warn("gwoBiomeMods: a biome mod failed to mount");
      return undefined;
    };

    if (!zips.length) {
      return $.Deferred().resolve().promise();
    }
    if (_.isFunction(api.file.zip.mountMany)) {
      return settled(api.file.zip.mountMany(zips), failed);
    }
    return $.when.apply(
      $,
      _.map(zips, function (zip) {
        return settled(api.file.zip.mount(zip.path, zip.root, false), failed);
      })
    );
  };

  // Only spec: resolves a /server_mods/ mount client-side. Text, so the cooked
  // copy is byte-for-byte what the mod ships.
  var readEntry = function (mod, entry) {
    return settled(
      $.ajax({ url: "spec:/" + mod.mountPath + entry, dataType: "text" }),
      function () {
        return undefined;
      }
    ).then(function (text) {
      return { entry: entry, text: text };
    });
  };

  var cookMod = function (mod) {
    return catalogOf(mod).then(function (info) {
      if (!info) {
        return undefined;
      }
      var entries = gwoBiomes.jsonEntries(info.files);
      return $.when
        .apply($, _.map(entries, _.partial(readEntry, mod)))
        .then(function () {
          var reads = _.toArray(arguments);
          var missing = _.find(reads, function (read) {
            return !_.isString(read.text);
          });
          if (missing) {
            console.warn(
              "gwoBiomeMods: could not read " +
                missing.entry +
                " from " +
                mod.identifier +
                "; skipping it"
            );
            return undefined;
          }
          info.cooked = _.zipObject(
            _.map(reads, function (read) {
              return ["/" + read.entry, read.text];
            })
          );
          return info;
        });
    });
  };

  // Resolves { files, mods, served } for the mods whose every file was read;
  // `served` is what those mods provide, in the providers() shape. Never rejects.
  var cook = function (mods) {
    var done = $.Deferred();

    if (!mods || !mods.length) {
      return done.resolve({ files: {}, mods: [], served: {} }).promise();
    }
    $.when.apply($, _.map(mods, cookMod)).then(function () {
      var infos = _.compact(_.toArray(arguments));
      done.resolve({
        files: _.assign.apply(_, [{}].concat(_.map(infos, "cooked"))),
        mods: _.map(infos, "mod"),
        served: gwoBiomes.providersFrom(infos),
      });
    });
    return done.promise();
  };

  return {
    enabledServerZipMods: enabledServerZipMods,
    providers: providers,
    mount: mount,
    cook: cook,
  };
});
