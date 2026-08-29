// Engine glue for shared/races.js: which races' server mods GW Server Mods
// has active, and the root mount that makes their files readable. Every
// function copes with GW Server Mods being absent - then there are no races.
// See races.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], function (
  races
) {
  var manifest = function () {
    var gwsm = window.GwServerMods;
    return gwsm && gwsm.manifest && _.isFunction(gwsm.manifest.load)
      ? gwsm.manifest
      : undefined;
  };

  var gwsmActive = function () {
    return !!manifest();
  };

  // Whatever a mod pushed onto model.gwoRaces before this ran; GWO's own were
  // registered when races.js loaded. Adopted, never assigned over - see
  // tech-cards.md.
  var registerAll = function () {
    var registered = [];
    model.gwoRaces = _.isArray(model.gwoRaces) ? model.gwoRaces : [];

    _.forEach(model.gwoRaces, function (descriptor) {
      try {
        registered.push(races.register(descriptor));
      } catch (e) {
        console.error("gwoRaceMods: race not registered: " + (e.message || e));
      }
    });

    return registered;
  };

  // Resolves { races, mods }: the races whose server mod is active, and the
  // identifier and version of each such mod, for the war to record.
  var installedRaces = function () {
    var done = $.Deferred();
    var mfst = manifest();

    if (!mfst) {
      done.resolve({ races: races.detect([]), mods: [] });
      return done.promise();
    }

    $.when(mfst.load()).always(function () {
      var active = mfst.activeServerMods();
      var identifiers = _.map(active, function (mod) {
        return mod.identifier;
      });
      var detected = races.detect(identifiers);
      var wanted = _.flatten(_.pluck(detected, "serverMods"));

      done.resolve({
        races: detected,
        mods: _.map(
          _.filter(active, function (mod) {
            return _.contains(wanted, mod.identifier);
          }),
          function (mod) {
            return { identifier: mod.identifier, version: mod.version };
          }
        ),
      });
    });

    return done.promise();
  };

  // The server zips at the root, so a race's commander specs and portraits can
  // be read before a war exists. gw_start has no battle to prepare.
  var mountRoot = function () {
    var gwsm = window.GwServerMods;

    if (!gwsm || !gwsm.mount || !_.isFunction(gwsm.mount.run)) {
      return $.Deferred().resolve(false).promise();
    }

    return $.when(gwsm.mount.run({ rootOnly: true }));
  };

  return {
    gwsmActive: gwsmActive,
    registerAll: registerAll,
    installedRaces: installedRaces,
    mountRoot: mountRoot,
  };
});
