// Cross-tag unit-spec fetch/parse cache: a drop-in for the base game's
// GW.specs.genUnitSpecs, whose output it must reproduce exactly. Ported from
// media/ui/main/game/galactic_war/shared/js/gw_specs.js. See specs.md.

define(function () {
  // Untagged spec id -> Promise of the pristine parsed JSON. Module-level, so it
  // is shared across every call and every battle in a session.
  var rawCache = {};

  // A rejected fetch is not left cached, so a later tag can retry rather than
  // inheriting a permanent failure.
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

  // Mirror of base-game gw_specs.js:tagSpec's field list - keep it in sync
  // with it. Calls visit(obj, key) for every field of `spec` that names other
  // specs, whether as one string or an array of them.
  var forEachReference = function (spec, visit) {
    if (typeof spec !== "object") {
      return;
    }
    var field = function (obj, key) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        (typeof obj[key] === "string" || _.isArray(obj[key]))
      ) {
        visit(obj, key);
      }
    };

    field(spec, "base_spec");
    if (spec.tools) {
      _.forEach(spec.tools, function (tool) {
        field(tool, "spec_id");
      });
    }
    field(spec, "replaceable_units");
    field(spec, "buildable_projectiles");
    if (spec.factory && _.isString(spec.factory.initial_build_spec)) {
      field(spec.factory, "initial_build_spec");
    }

    if (spec.ammo_id) {
      if (_.isString(spec.ammo_id)) {
        field(spec, "ammo_id");
      } else {
        _.forEach(spec.ammo_id, function (ammo) {
          field(ammo, "id");
        });
      }
    }

    if (spec.death_weapon) {
      if (_.isString(spec.death_weapon.ground_ammo_spec)) {
        field(spec.death_weapon, "ground_ammo_spec");
      }
      if (_.isString(spec.death_weapon.air_ammo_spec)) {
        field(spec.death_weapon, "air_ammo_spec");
      }
    }

    // Projectiles such as Lob ammo can spawn units when they expire.
    if (_.isString(spec.spawn_unit_on_death)) {
      field(spec, "spawn_unit_on_death");
    }
  };

  // The untagged references a spec makes, in the order tagSpec finds them.
  var references = function (spec) {
    var found = [];
    forEachReference(spec, function (obj, key) {
      found = found.concat(obj[key]);
    });
    return found;
  };

  // Mutates `spec`; returns the untagged references it found.
  var tagSpec = function (tag, spec) {
    var found = [];
    forEachReference(spec, function (obj, key) {
      var value = obj[key];
      found = found.concat(value);
      obj[key] = _.isArray(value)
        ? _.map(value, function (item) {
            return item + tag;
          })
        : value + tag;
    });
    return found;
  };

  return {
    // Resolves to a { "specId.tag": spec } map, including the trailing
    // "/pa/units/unit_list.json.tag" entry. No tag gives undefined, as in stock.
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
                var newWork = tagSpec(tag, data);
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

    // The pristine parsed spec, through the same cache genUnitSpecs fills, so
    // a caller reading specs ahead of it costs the launch no second fetch.
    fetchRaw: function (item, deps) {
      return getRaw(item, deps);
    },

    // The untagged references a spec makes, without touching it.
    references: references,

    // Test-only: lets tests assert fetch counts in isolation.
    clearCache: function () {
      rawCache = {};
    },
  };
});
