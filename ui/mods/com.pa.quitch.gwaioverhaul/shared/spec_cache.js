// Cross-tag unit-spec fetch/parse cache: a drop-in for the base game's
// GW.specs.genUnitSpecs, whose output it must reproduce exactly. Ported from
// media/ui/main/game/galactic_war/shared/js/gw_specs.js. See specs.md.

define(() => {
  // Untagged spec id -> Promise of the pristine parsed JSON. Module-level, so it
  // is shared across every call and every battle in a session.
  let rawCache = {};

  // A rejected fetch is not left cached, so a later tag can retry rather than
  // inheriting a permanent failure.
  const getRaw = (item, deps) => {
    if (!Object.prototype.hasOwnProperty.call(rawCache, item)) {
      rawCache[item] = Promise.resolve(deps.fetch(item)).then(null, (error) => {
        delete rawCache[item];
        throw error;
      });
    }
    return rawCache[item];
  };

  // Mirror of base-game gw_specs.js:tagSpec's field list - keep it in sync
  // with it. Calls visit(obj, key) for every field of `spec` that names other
  // specs, whether as one string or an array of them.
  const forEachReference = (spec, visit) => {
    if (typeof spec !== "object") {
      return;
    }
    const field = (obj, key) => {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        (typeof obj[key] === "string" || Array.isArray(obj[key]))
      ) {
        visit(obj, key);
      }
    };

    field(spec, "base_spec");
    if (spec.tools) {
      _.forEach(spec.tools, (tool) => {
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
        _.forEach(spec.ammo_id, (ammo) => {
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
  const references = (spec) => {
    let found = [];
    forEachReference(spec, (obj, key) => {
      found = found.concat(obj[key]);
    });
    return found;
  };

  // Mutates `spec`; returns the untagged references it found.
  const tagSpec = (tag, spec) => {
    let found = [];
    forEachReference(spec, (obj, key) => {
      const value = obj[key];
      found = found.concat(value);
      obj[key] = Array.isArray(value)
        ? _.map(value, (item) => item + tag)
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

      return new Promise((resolve) => {
        const results = {};
        let work = units.slice(0);
        let pending = 0;

        const finish = _.once(() => {
          results[`/pa/units/unit_list.json${tag}`] = {
            units: _.map(units, (unit) => unit + tag),
          };
          resolve(results);
        });

        const step = () => {
          while (work.length) {
            const item = work.pop();
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

        const fetch = (item) => {
          getRaw(item, deps)
            .then(
              (raw) => {
                // Tag a clone, never the cached pristine copy.
                const data = _.cloneDeep(raw);
                const newWork = tagSpec(tag, data);
                work = work.concat(newWork);
                results[item + tag] = data;
              },
              (error) => {
                console.log("error loading spec:", item, error);
              },
            )
            .then(() => {
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
    references,

    // Test-only: lets tests assert fetch counts in isolation.
    clearCache: function () {
      rawCache = {};
    },
  };
});
