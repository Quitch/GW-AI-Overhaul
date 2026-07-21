define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwoUnit
) {
  var orderOfOperations = function (mods) {
    var operationsContainer = {};
    operationsContainer.otherOperations = [];
    var orderedOperations = ["replace", "multiplyOrCreate", "multiply", "add"];

    _.forEach(mods, function (mod) {
      var operationName = mod.op;
      var isOrderedOperation = _.includes(orderedOperations, operationName);

      if (!operationsContainer[operationName] && isOrderedOperation) {
        operationsContainer[operationName] = [];
      }

      if (isOrderedOperation) {
        operationsContainer[operationName].push(mod);
      } else {
        operationsContainer.otherOperations.push(mod);
      }
    });

    var orderedMods = [];
    _.forEach(orderedOperations, function (operation) {
      if (operationsContainer[operation]) {
        orderedMods = orderedMods.concat(operationsContainer[operation]);
      }
    });
    orderedMods = orderedMods.concat(operationsContainer.otherOperations);

    return orderedMods;
  };

  // Arrays in specs represent complete lists (ammo layers, unit type tags,
  // target priorities, muzzle bones, recon items, etc). A derived spec's
  // array should fully replace the base's array rather than be merged
  // index-by-index, which is _.merge's default array behavior and the root
  // cause of the ammo_id string/array corruption this used to special-case
  // around (and which silently corrupts any other array field too, once the
  // base and child arrays differ in length).
  function replaceArrays(destVal, srcVal) {
    if (_.isArray(srcVal)) {
      return _.cloneDeep(srcVal);
    }
    // returning undefined falls through to _.merge's default behavior
    // for everything that isn't an array (objects still merge key-by-key,
    // which is the desired behavior for things like `events` and `audio`).
  }

  var flattenBaseSpecs = function (spec, specs, tag) {
    var visited = {}; // Use object as hash map

    function resolve(spec) {
      if (!Object.prototype.hasOwnProperty.call(spec, "base_spec")) {
        return _.cloneDeep(spec);
      }

      var baseKey = spec.base_spec + tag;
      var base = specs[baseKey];
      if (!base) {
        baseKey = spec.base_spec;
        base = specs[baseKey];
        if (!base) {
          console.warn(
            'flattenBaseSpecs: base_spec "' +
              spec.base_spec +
              '" not found in specs (checked "' +
              spec.base_spec +
              tag +
              '" and "' +
              spec.base_spec +
              '") - dropping base_spec reference and returning spec as-is.'
          );
          return _.cloneDeep(_.omit(spec, "base_spec"));
        }
      }

      if (visited[baseKey]) {
        console.warn(
          'flattenBaseSpecs: circular base_spec reference detected at "' +
            baseKey +
            '" - stopping inheritance here.'
        );
        return _.cloneDeep(_.omit(spec, "base_spec"));
      }
      visited[baseKey] = true;

      var specCopy = _.omit(spec, "base_spec");
      var flattenedSpec = resolve(base);

      // Specs contain only plain objects, arrays, and primitive values.
      // _.merge() creates a new object and does not mutate its arguments, and
      // replaceArrays() clones any array it returns, so no extra cloneDeep()
      // is needed here.
      return _.merge({}, flattenedSpec, specCopy, replaceArrays);
    }

    return resolve(spec);
  };

  function isNullish(value) {
    return value === undefined || value === null;
  }

  return {
    mod: function (specs, mods, specTag) {
      var load = function (specId) {
        var taggedId = specId;
        if (!Object.prototype.hasOwnProperty.call(specs, taggedId)) {
          taggedId = specId + specTag;
          if (!Object.prototype.hasOwnProperty.call(specs, taggedId)) {
            return;
          }
        }
        var result = specs[taggedId];
        if (
          result &&
          Object.prototype.hasOwnProperty.call(result, "base_spec")
        ) {
          specs[taggedId] = result = flattenBaseSpecs(result, specs, specTag);
        }
        return result;
      };

      var ops = {
        multiply: function (attribute, value) {
          if (!_.isNumber(attribute)) {
            console.warn(
              "multiply: attribute is not a number. Leaving unchanged:",
              attribute
            );
            return attribute;
          }
          return attribute * value;
        },
        add: function (attribute, value) {
          if (
            !_.isNumber(attribute) &&
            !_.isString(attribute) &&
            !isNullish(attribute)
          ) {
            console.warn(
              "add: attribute is not a number, string, or nullish. Leaving unchanged:",
              attribute
            );
            return attribute;
          } else if (isNullish(attribute)) {
            return value;
          }
          return attribute + value;
        },
        replace: function (attribute, value) {
          return value;
        },
        merge: function (attribute, value) {
          if (!_.isObject(attribute)) {
            console.warn(
              "merge: attribute is not an object. Leaving unchanged:",
              attribute
            );
            return attribute;
          }
          return _.assign({}, attribute, value);
        },
        push: function (attribute, value) {
          if (!_.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          if (_.isArray(value)) {
            attribute = attribute.concat(value);
          } else {
            attribute.push(value);
          }
          return attribute;
        },
        // theoretically unsafe, but mods can run whatever code they want anyway, so the risk is meaningless
        eval: function (attribute, value) {
          return new Function("attribute", value)(attribute);
        },
        clone: function (attribute, value) {
          var loaded = _.isString(attribute) ? load(attribute) : attribute;
          if (loaded) {
            loaded = _.cloneDeep(loaded);
          }
          specs[value + specTag] = loaded !== undefined ? loaded : attribute;
          return attribute;
        },

        tag: function (attribute) {
          if (!_.isString(attribute)) {
            console.warn(
              "tag: attribute is not a string. Leaving unchanged:",
              attribute
            );
            return attribute;
          }
          var jsonIndex = attribute.lastIndexOf(".json");
          if (jsonIndex === -1) {
            console.warn(
              "tag: attribute does not contain '.json'. Leaving unchanged:",
              attribute
            );
            return attribute;
          }
          // hack fix for mirrorMode due to the fact that
          // `attribute` was retaining the previous `specTag`s
          // and I couldn't track down why
          var cleanAttribute = attribute.slice(0, jsonIndex + 5);
          return cleanAttribute + specTag;
        },
        pull: function (attribute, value) {
          if (!_.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          var args = [attribute, value];
          if (_.isArray(value)) {
            args = [attribute].concat(value);
          }
          return _.pull.apply(null, args);
        },
        // New op to remove text in a string
        wipe: function (attribute, value) {
          if (!_.isString(attribute)) {
            attribute = isNullish(attribute) ? "" : attribute.toString();
          }
          if (!_.isArray(value)) {
            value = [value, ""];
          }
          return attribute.split(value[0]).join(value[1]);
        },
        // New op to prepend to arrays
        prepend: function (attribute, value) {
          if (!_.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          if (_.isArray(value)) {
            return value.concat(attribute);
          }
          attribute.unshift(value);
          return attribute;
        },
        multiplyOrCreate: function (attribute, value) {
          if (!_.isNumber(attribute) && !isNullish(attribute)) {
            console.warn(
              "multiplyOrCreate: attribute is not a number or nullish. Leaving unchanged:",
              attribute
            );
            return attribute;
          }
          return _.isNumber(attribute) ? attribute * value : value;
        },
      };

      // Ops that mutate their target in place or write to `specs` directly, and so
      // still do something useful when applied to the whole spec with no path.
      // Every other op only returns a new value, so a pathless mod for it is a no-op.
      var opsWithoutPath = {
        eval: true,
        clone: true,
      };

      var applyMod = function (mod) {
        var spec = load(mod.file);
        if (!spec) {
          return console.warn("Warning: File not found in mod", mod);
        }
        if (!Object.prototype.hasOwnProperty.call(ops, mod.op)) {
          return console.warn("Invalid operation in mod", mod);
        }

        var originalPath = (mod.path || "").split(".");
        var path = originalPath.slice().reverse();

        var reportError = function (error, step) {
          console.warn(
            error,
            spec[step],
            "spec",
            spec,
            "mod",
            mod,
            "path",
            originalPath.slice(0, -path.length).join(".")
          );
        };

        // Handed out as-is (not cloned): opDefaults is fresh per applyMod call,
        // and only the leaf's cookStep call ever reads opDefaults[op], so no
        // two spec locations can ever alias the same array/object.
        var opDefaults = {
          push: [],
          pull: [],
          merge: {}, // merge's own check treats {} as a valid empty base
        };

        var cookStep = function (step, op) {
          if (_.isArray(spec)) {
            if (step === "+") {
              step = spec.length;
              spec.push({});
            } else {
              step = Number(step);
            }
          } else if (
            path.length &&
            !Object.prototype.hasOwnProperty.call(spec, step)
          ) {
            // Intermediate (non-leaf) segments always need a traversable {}
            // (op is undefined for those calls). The leaf segment should see
            // a real "missing" signal for any op without a listed default, so
            // ops like multiplyOrCreate/add can tell "absent" from "present"
            // and run their own create-on-missing behavior correctly.
            if (!op) {
              spec[step] = {};
            } else if (Object.prototype.hasOwnProperty.call(opDefaults, op)) {
              spec[step] = opDefaults[op];
            } else {
              spec[step] = undefined;
            }
          }
          return step;
        };

        while (path.length > 1) {
          var level = cookStep(path.pop());

          if (_.isString(spec[level])) {
            var newSpec = load(spec[level]);
            if (!newSpec) {
              reportError("Undefined mod spec encountered,", level);
              return;
            }
            spec = newSpec;
          } else if (_.isObject(spec[level])) {
            spec = spec[level];
          } else {
            reportError("Invalid attribute encountered,", level);
            return;
          }
        }

        if (path.length && path[0]) {
          var leaf = cookStep(path[0], mod.op);
          spec[leaf] = ops[mod.op](spec[leaf], mod.value);
        } else if (opsWithoutPath[mod.op]) {
          ops[mod.op](spec, mod.value);
        } else {
          console.warn(
            "Invalid mod: op '" +
              mod.op +
              "' requires a path, but none was given",
            mod
          );
        }
      };

      var orderedMods = orderOfOperations(mods);
      _.forEach(orderedMods, function (mod) {
        try {
          applyMod(mod);
        } catch (e) {
          console.error("specs.mod: applyMod threw, skipping mod", mod, e);
        }
      });
    },
    additionalSpecs: [
      gwoUnit.fireflyAmmo,
      gwoUnit.fireflyWeapon,
      gwoUnit.orcaTorpedo,
      gwoUnit.orcaTorpedoAmmo,
      gwoUnit.skitterAmmo,
      gwoUnit.skitterWeapon,
    ],
  };
});
