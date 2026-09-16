// Engine glue for shared/gwo_biomes.js: the enabled server mods whose biomes a
// Galactic War battle can be given. See galaxy.md, "Biome mods in a GW battle".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
], (gwoBiomes, gwoUrl, gwoPromise) => {
  const modRecord = gwoBiomes.recordFrom;

  const manifest = () => {
    const gwsm = window.GwServerMods;
    return gwsm && gwsm.manifest && _.isFunction(gwsm.manifest.load)
      ? gwsm.manifest
      : undefined;
  };

  const isZipMod = (mod) => !!(mod && !mod.fileSystem && mod.installedPath);

  const byPriority = (mods) =>
    _.sortBy(mods, (mod) => -(Number(mod.priority) || 0));

  const settled = gwoPromise.settled;

  // GW Server Mods' manifest lists what it will mount, in mount order, in
  // every scene it is loaded in. Otherwise gw_play loads the Community Mods
  // manager; gw_start does not, so there the manager's own IndexedDB store is
  // read through the stock `db` extender. The extender writes back on change
  // and creates the record when the key is missing, so the observable is
  // never written and never created here.
  const enabledServerZipMods = () => {
    const manager = window.CommunityModsManager;
    const mfst = manifest();
    const done = $.Deferred();

    if (mfst) {
      $.when(mfst.load()).always(() => {
        done.resolve(
          _.map(_.filter(mfst.activeServerMods(), isZipMod), modRecord),
        );
      });
      return done.promise();
    }

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
  // With GW Server Mods present a mod it must serve is a provider too.
  const providers = () => {
    const done = $.Deferred();
    const gwsm = !!manifest();

    enabledServerZipMods().then((mods) => {
      if (!mods.length) {
        done.resolve({});
        return;
      }
      $.when.apply($, _.map(mods, catalogOf)).then(function () {
        done.resolve(gwoBiomes.providersFrom(_.toArray(arguments), gwsm));
      });
    });
    return done.promise();
  };

  // What GW Server Mods will mount of the stamped mods it serves: `served` in
  // the providers() shape for those it lists as active, `missing` the
  // identifiers of the rest, whose biomes referee_config then finds no
  // provider for and sends to earth. The stamp's installedPath is stale after
  // a reinstall, so the live row is catalogued. Never rejects.
  const serve = (mods) => {
    const done = $.Deferred();
    const mfst = manifest();
    const wanted = _.filter(mods || [], gwoBiomes.isGwsmServed);
    const missing = [];
    const live = [];

    if (!wanted.length) {
      return done.resolve({ served: {}, missing: [] }).promise();
    }

    $.when(mfst ? mfst.load() : undefined).always(() => {
      _.forEach(wanted, (mod) => {
        const row = mfst && mfst.serverModInfo(mod.identifier);

        if (!isZipMod(row)) {
          console.warn(
            `gwoBiomeMods: ${mod.identifier} is not active under GW Server Mods; its biomes fall back to ${gwoBiomes.FALLBACK_BIOME}`,
          );
          missing.push(mod.identifier);
          return;
        }
        live.push(modRecord(row));
      });

      if (!live.length) {
        done.resolve({ served: {}, missing });
        return;
      }
      $.when.apply($, _.map(live, catalogOf)).then(function () {
        done.resolve({
          served: gwoBiomes.providersFrom(_.toArray(arguments), true),
          missing,
        });
      });
    });
    return done.promise();
  };

  // Resolves { mods, known, gwsm } for the resume check: every server zip mod
  // GW Server Mods has active, whether that list could be read at all, and
  // whether GW Server Mods is here to mount them - the answers
  // race_mods.installedRaces gives, for the same reasons. See races.md.
  const installedBiomeMods = () => {
    const done = $.Deferred();
    const mfst = manifest();

    if (!mfst) {
      return done.resolve({ mods: [], known: true, gwsm: false }).promise();
    }

    $.when(mfst.load()).always(() => {
      const known = !_.isFunction(mfst.listed) || !!mfst.listed();

      done.resolve({
        mods: _.map(_.filter(mfst.activeServerMods(), isZipMod), (mod) => ({
          identifier: mod.identifier,
          displayName: mod.displayName || mod.identifier,
          version: mod.version,
        })),
        known,
        gwsm: true,
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

  // Resolves { files, mods, served } for the cooked mods whose every file was
  // read; `served` is what those mods provide, in the providers() shape. A mod
  // GW Server Mods serves is passed over - see serve(). Never rejects.
  const cook = (mods) => {
    const done = $.Deferred();
    const cooked = _.reject(mods || [], gwoBiomes.isGwsmServed);

    if (!cooked.length) {
      return done.resolve({ files: {}, mods: [], served: {} }).promise();
    }
    $.when.apply($, _.map(cooked, cookMod)).then(function () {
      const infos = _.compact(_.toArray(arguments));
      done.resolve({
        files: _.assign.apply(_, [{}].concat(_.map(infos, "cooked"))),
        mods: _.map(infos, "mod"),
        served: gwoBiomes.providersFrom(infos, false),
      });
    });
    return done.promise();
  };

  return {
    enabledServerZipMods,
    providers,
    serve,
    installedBiomeMods,
    mount,
    cook,
  };
});
