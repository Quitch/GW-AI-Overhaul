// Engine glue for shared/gwo_biomes.js: the enabled server mods whose biomes a
// Galactic War battle can be given. See galaxy.md, "Biome mods in a GW battle".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
], (gwoBiomes, gwoUrl) => {
  const serverModsRoot = "/server_mods/";

  const modRecord = (mod) => ({
    identifier: mod.identifier,
    installedPath: mod.installedPath,
    mountPath: mod.mountPath || `${serverModsRoot + mod.identifier}/`,
  });

  const byPriority = (mods) =>
    _.sortBy(mods, (mod) => -(Number(mod.priority) || 0));

  // Engine promises are not jQuery promises: $.when treats one as a plain value.
  const settled = (enginePromise, onFailure) => {
    const done = $.Deferred();

    enginePromise.then(
      (result) => {
        done.resolve(result);
      },
      () => {
        done.resolve(onFailure());
      },
    );
    return done.promise();
  };

  // gw_play loads the Community Mods manager; gw_start does not, so there the
  // manager's own IndexedDB store is read through the stock `db` extender. The
  // extender writes back on change and creates the record when the key is
  // missing, so the observable is never written and never created here.
  const enabledServerZipMods = () => {
    const manager = window.CommunityModsManager;
    const done = $.Deferred();

    if (manager && _.isFunction(manager.ready)) {
      manager.ready().always(() => {
        done.resolve(_.map(manager.activeServerZipMods(), modRecord));
      });
      return done.promise();
    }

    if (!window.localStorage || !window.localStorage.installedModsDB) {
      return done.resolve([]).promise();
    }
    const installed = ko.observableArray([]).extend({
      db: { local_name: "installedModsDB", db_name: "installed_mods" },
    });
    $.when(installed.ready).always((mods) => {
      const zipMods = _.filter(
        Array.isArray(mods) ? mods : [],
        (mod) =>
          mod &&
          mod.context === "server" &&
          mod.enabled &&
          !mod.fileSystem &&
          mod.installedPath,
      );
      done.resolve(_.map(byPriority(zipMods), modRecord));
    });
    return done.promise();
  };

  const catalogOf = (mod) =>
    settled(api.file.zip.catalog(mod.installedPath), () => {
      console.warn(
        `gwoBiomeMods: could not read ${mod.installedPath}; skipping ${mod.identifier}`,
      );
      return undefined;
    }).then((catalog) =>
      catalog
        ? gwoBiomes.catalogInfo(mod, gwoBiomes.catalogEntries(catalog))
        : undefined,
    );

  // Never rejects: with nothing readable the caller keeps the stock biomes.
  const providers = () => {
    const done = $.Deferred();

    enabledServerZipMods().then((mods) => {
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
  const mount = (mods) => {
    const zips = _.map(mods || [], (mod) => ({
      path: mod.installedPath,
      root: mod.mountPath,
    }));
    const failed = () => {
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
      _.map(zips, (zip) =>
        settled(api.file.zip.mount(zip.path, zip.root, false), failed),
      ),
    );
  };

  // Only spec: resolves a /server_mods/ mount client-side. Text, so the cooked
  // copy is byte-for-byte what the mod ships.
  const readEntry = (mod, entry) =>
    settled(
      $.ajax({ url: gwoUrl.specFile(mod.mountPath + entry), dataType: "text" }),
      () => undefined,
    ).then((text) => ({
      entry,
      text,
    }));

  const cookMod = (mod) =>
    catalogOf(mod).then((info) => {
      if (!info) {
        return undefined;
      }
      const entries = gwoBiomes.jsonEntries(info.files);
      return $.when
        .apply($, _.map(entries, _.partial(readEntry, mod)))
        .then(function () {
          const reads = _.toArray(arguments);
          const missing = _.find(reads, (read) => !_.isString(read.text));
          if (missing) {
            console.warn(
              `gwoBiomeMods: could not read ${missing.entry} from ${mod.identifier}; skipping it`,
            );
            return undefined;
          }
          info.cooked = Object.fromEntries(
            _.map(reads, (read) => [`/${read.entry}`, read.text]),
          );
          return info;
        });
    });

  // Resolves { files, mods, served } for the mods whose every file was read;
  // `served` is what those mods provide, in the providers() shape. Never rejects.
  const cook = (mods) => {
    const done = $.Deferred();

    if (!mods || !mods.length) {
      return done.resolve({ files: {}, mods: [], served: {} }).promise();
    }
    $.when.apply($, _.map(mods, cookMod)).then(function () {
      const infos = _.compact(_.toArray(arguments));
      done.resolve({
        files: _.assign.apply(_, [{}].concat(_.map(infos, "cooked"))),
        mods: _.map(infos, "mod"),
        served: gwoBiomes.providersFrom(infos),
      });
    });
    return done.promise();
  };

  return {
    enabledServerZipMods,
    providers,
    mount,
    cook,
  };
});
