// Cross-tag unit-spec fetch/parse cache.
//
// Galactic War game start calls the base game's GW.specs.genUnitSpecs(units, tag)
// once per AI faction AND once for the player. Each call walks the whole unit-spec
// dependency graph and re-fetches + re-parses every reachable spec file over
// coui://. The raw file contents are identical across every call - only the per-tag
// reference renaming differs - so a multi-foe game fetches+parses the entire spec
// tree several times over.
//
// This module reimplements genUnitSpecs's breadth-first walk faithfully (see base
// game media/ui/main/game/galactic_war/shared/js/gw_specs.js), but fetches each raw
// spec file at most once per session and reuses the parsed result across every tag,
// deep-cloning before tagging so the cached pristine copy is never mutated. Output is
// intended to be identical to the base implementation - only the redundant fetch/parse
// work is removed.
//
// The reference-tagging list in tagSpec() below MIRRORS base-game gw_specs.js:tagSpec
// and must be kept in sync with it if the base game adds new spec reference fields.

define(function () {
  // Untagged spec id -> Promise of the pristine parsed JSON. Module-level so the
  // cache is shared across every genUnitSpecs() call (all factions + player, and
  // across successive battles in a session). Unit specs are static game data, so a
  // session-lifetime cache is safe.
  var rawCache = {};

  // Returns a Promise of the pristine parsed spec for `item`, fetching (via the
  // injected deps.fetch) at most once. A rejected fetch is not left cached, so a later
  // tag can retry rather than inheriting a permanent failure.
  var getRaw = function (item, deps) {
    if (!Object.prototype.hasOwnProperty.call(rawCache, item)) {
      rawCache[item] = Promise.resolve(deps.fetch(item)).then(
        null,
        function (error) {
          delete rawCache[item];
          throw error;
        }
      );
    }
    return rawCache[item];
  };

  // Mirror of base-game gw_specs.js:tagSpec. Appends `tag` to every spec reference
  // inside `spec` (mutating it in place) and returns the list of untagged references
  // it discovered, so the caller can enqueue them for tagging too. Closes over nothing
  // from the factory (only its own params + global `_`), which Sonar S7721 flags as
  // hoistable - but in PA's RequireJS runtime a file-top-level declaration is a window
  // global, so GWO deliberately keeps such helpers module-private inside define() and
  // accepts S7721 here. See CONTRIBUTING.md ("Function scoping in shipped UI code").
  var tagSpec = function (specId, tag, spec) {
    var moreWork = [];
    if (typeof spec !== "object") {
      return moreWork;
    }
    var applyTag = function (obj, key) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === "string") {
          moreWork.push(obj[key]);
          obj[key] = obj[key] + tag;
        } else if (_.isArray(obj[key])) {
          obj[key] = _.map(obj[key], function (value) {
            moreWork.push(value);
            return value + tag;
          });
        }
      }
    };

    // Units
    applyTag(spec, "base_spec");
    if (spec.tools) {
      _.forEach(spec.tools, function (tool) {
        applyTag(tool, "spec_id");
      });
    }
    applyTag(spec, "replaceable_units");
    applyTag(spec, "buildable_projectiles");
    if (spec.factory && _.isString(spec.factory.initial_build_spec)) {
      applyTag(spec.factory, "initial_build_spec");
    }

    // Tools
    if (spec.ammo_id) {
      if (_.isString(spec.ammo_id)) {
        applyTag(spec, "ammo_id");
      } else {
        _.forEach(spec.ammo_id, function (ammo) {
          applyTag(ammo, "id");
        });
      }
    }

    if (spec.death_weapon) {
      if (_.isString(spec.death_weapon.ground_ammo_spec)) {
        applyTag(spec.death_weapon, "ground_ammo_spec");
      }
      if (_.isString(spec.death_weapon.air_ammo_spec)) {
        applyTag(spec.death_weapon, "air_ammo_spec");
      }
    }

    // Projectiles such as Lob ammo can spawn units when they expire.
    if (_.isString(spec.spawn_unit_on_death)) {
      applyTag(spec, "spawn_unit_on_death");
    }

    return moreWork;
  };

  return {
    // Faithful port of base-game GW.specs.genUnitSpecs, with per-file fetch/parse
    // caching. `deps.fetch(item)` returns a thenable of the parsed spec for an
    // untagged spec id. Resolves to a { "specId.tag": spec } map (including the
    // trailing "/pa/units/unit_list.json.tag" entry); returns undefined when no tag
    // is given, matching the base implementation.
    genUnitSpecs: function (units, tag, deps) {
      if (!tag) {
        return undefined;
      }

      return new Promise(function (resolve) {
        var results = {};
        var work = units.slice(0);
        var pending = 0;

        var finish = _.once(function () {
          results["/pa/units/unit_list.json" + tag] = {
            units: _.map(units, function (unit) {
              return unit + tag;
            }),
          };
          resolve(results);
        });

        var step = function () {
          while (work.length) {
            var item = work.pop();
            if (Object.prototype.hasOwnProperty.call(results, item + tag)) {
              continue;
            }
            ++pending;
            fetch(item);
          }
          if (!pending) {
            finish();
          }
        };

        var fetch = function (item) {
          getRaw(item, deps)
            .then(
              function (raw) {
                // Tag a clone, never the cached pristine copy.
                var data = _.cloneDeep(raw);
                var newWork = tagSpec(item, tag, data);
                work = work.concat(newWork);
                results[item + tag] = data;
              },
              function (error) {
                console.log("error loading spec:", item, error);
              }
            )
            .then(function () {
              --pending;
              if (!pending) {
                step();
              }
            });
        };

        step();
      });
    },

    // Test-only: drops the shared fetch cache so tests can assert fetch counts in
    // isolation. Harmless (and unused) in the game runtime.
    clearCache: function () {
      rawCache = {};
    },
  };
});
