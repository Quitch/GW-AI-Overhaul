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

  // Spec arrays are complete lists, so a derived array replaces the base's
  // outright. _.merge would splice them index-by-index. See specs.md.
  function replaceArrays(destVal, srcVal) {
    if (_.isArray(srcVal)) {
      return _.cloneDeep(srcVal);
    }
    // Undefined falls through to _.merge's default, so objects still merge
    // key-by-key, which is what `events` and `audio` want.
  }

  var flattenBaseSpecs = function (spec, specs, tag) {
    var visited = {};

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

      // No cloneDeep needed: _.merge does not mutate its arguments, and
      // replaceArrays clones every array it returns.
      return _.merge({}, flattenedSpec, specCopy, replaceArrays);
    }

    return resolve(spec);
  };

  function isNullish(value) {
    return value === undefined || value === null;
  }

  // "+" appends, a numeric string indexes. See specs.md, "Path segments".
  function isIndexLike(segment) {
    return (
      segment === "+" || (segment !== "" && !Number.isNaN(Number(segment)))
    );
  }

  // An empty navigation object marks a structure as mobile. See specs.md.
  function pruneEmptyNavigation(spec) {
    if (!_.isPlainObject(spec) || !_.isPlainObject(spec.navigation)) {
      return;
    }
    // JSON serialisation drops undefined values, so only a surviving one counts.
    var hasSerialisableValue = _.some(spec.navigation, function (value) {
      return value !== undefined;
    });
    if (!hasSerialisableValue) {
      delete spec.navigation;
    }
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
          if (!_.isPlainObject(attribute)) {
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
          // Rewrites the suffix rather than appending one. The op ordering
          // leaves no `replace` between two cards' `tag`s on a shared path,
          // so the second sees a value the first already tagged. See specs.md.
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
        // GWO addition: substitutes within a string spec value, which the base ops
        // cannot do - they replace the whole value. Takes [from, to]; a bare value
        // means "delete every occurrence".
        wipe: function (attribute, value) {
          if (!_.isString(attribute)) {
            attribute = isNullish(attribute) ? "" : attribute.toString();
          }
          if (!_.isArray(value)) {
            value = [value, ""];
          }
          return attribute.split(value[0]).join(value[1]);
        },
        // GWO addition, the counterpart to the base game's append. Order matters for
        // buildable_types and build lists, where the engine takes the first match.
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

      // Ops that mutate in place or write to `specs`. Every other op only returns
      // a value, so a pathless mod for it is a no-op. See specs.md.
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
          return console.error("Invalid operation in mod", mod);
        }

        // Captured before the path walk reassigns `spec` to a nested container.
        // pruneEmptyNavigation needs the file's top-level spec.
        var rootSpec = spec;

        var originalPath = (mod.path || "").split(".");
        var path = originalPath.slice().reverse();

        var reportError = function (error, step) {
          console.error(
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

        // Not cloned: opDefaults is fresh per applyMod call, and only the leaf
        // reads it, so two spec locations can never alias one object.
        var opDefaults = {
          push: [],
          pull: [],
          merge: {}, // merge's own check treats {} as a valid empty base
        };

        // A missing intermediate segment needs a traversable container: an
        // array when the next segment indexes into it, otherwise a plain object.
        var traversableFor = function (nextSegment) {
          return isIndexLike(nextSegment) ? [] : {};
        };

        var cookArrayStep = function (step, op) {
          if (step === "+") {
            spec.push({});
            return spec.length - 1;
          }
          step = Number(step);
          // An index into an array with no element there yet.
          if (
            !op &&
            !Number.isNaN(step) &&
            !Object.prototype.hasOwnProperty.call(spec, step)
          ) {
            spec[step] = traversableFor(path[path.length - 1]);
          }
          return step;
        };

        var cookObjectStep = function (step, op) {
          if (
            !path.length ||
            Object.prototype.hasOwnProperty.call(spec, step)
          ) {
            return step;
          }
          // Intermediate segments (op undefined) always need a container. The
          // leaf must instead see a real "missing" signal, so multiplyOrCreate
          // and friends can tell absent from present.
          if (!op) {
            spec[step] = traversableFor(path[path.length - 1]);
          } else if (Object.prototype.hasOwnProperty.call(opDefaults, op)) {
            spec[step] = opDefaults[op];
          } else {
            spec[step] = undefined;
          }
          return step;
        };

        var cookStep = function (step, op) {
          return _.isArray(spec)
            ? cookArrayStep(step, op)
            : cookObjectStep(step, op);
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
          console.error(
            "Invalid mod: op '" +
              mod.op +
              "' requires a path, but none was given",
            mod
          );
        }

        if (originalPath[0] === "navigation") {
          pruneEmptyNavigation(rootSpec);
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
    // Files a card lends to a unit that does not already reference them. Without
    // an entry here the tagged copy never exists, so the card's `tag` op would
    // point at a missing spec. See specs.md.
    additionalSpecs: [
      gwoUnit.artemisWeapon,
      gwoUnit.boomWeapon,
      gwoUnit.bumblebeeWeapon,
      gwoUnit.colonelWeapon,
      gwoUnit.fireflyAmmo,
      gwoUnit.fireflyWeapon,
      gwoUnit.flakWeapon,
      gwoUnit.gilEBeam,
      gwoUnit.holkinsWeapon,
      gwoUnit.mendBuildArm,
      gwoUnit.orcaTorpedo,
      gwoUnit.orcaTorpedoAmmo,
      gwoUnit.skitterAmmo,
      gwoUnit.skitterWeapon,
      gwoUnit.stitchBuildArm,
      gwoUnit.stormWeapon,
      gwoUnit.sxxWeapon,
      gwoUnit.typhoonWeapon,
      gwoUnit.umbrellaBeam,
    ],
  };
});
