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

  // Mirror of base-game gw_specs.js:tagSpec - keep the reference list below in
  // sync with it. Mutates `spec`; returns the untagged references it found.
  const tagSpec = (specId, tag, spec) => {
    const moreWork = [];
    if (typeof spec !== "object") {
      return moreWork;
    }
    const applyTag = (obj, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === "string") {
          moreWork.push(obj[key]);
          obj[key] = obj[key] + tag;
        } else if (_.isArray(obj[key])) {
          obj[key] = _.map(obj[key], (value) => {
            moreWork.push(value);
            return value + tag;
          });
        }
      }
    };

    applyTag(spec, "base_spec");
    if (spec.tools) {
      _.forEach(spec.tools, (tool) => {
        applyTag(tool, "spec_id");
      });
    }
    applyTag(spec, "replaceable_units");
    applyTag(spec, "buildable_projectiles");
    if (spec.factory && _.isString(spec.factory.initial_build_spec)) {
      applyTag(spec.factory, "initial_build_spec");
    }

    if (spec.ammo_id) {
      if (_.isString(spec.ammo_id)) {
        applyTag(spec, "ammo_id");
      } else {
        _.forEach(spec.ammo_id, (ammo) => {
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
                const newWork = tagSpec(item, tag, data);
                work = work.concat(newWork);
                results[item + tag] = data;
              },
              (error) => {
                console.log("error loading spec:", item, error);
              }
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

    // Test-only: lets tests assert fetch counts in isolation.
    clearCache: function () {
      rawCache = {};
    },
  };
});
