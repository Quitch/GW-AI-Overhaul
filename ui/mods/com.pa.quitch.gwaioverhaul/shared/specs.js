define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], (
  gwoUnit
) => {
  const orderOfOperations = (mods) => {
    const operationsContainer = {};
    operationsContainer.otherOperations = [];
    // clone leads because it is the only op that creates a spec id, so every
    // other op has to be able to name the result. See specs.md.
    const orderedOperations = [
      "clone",
      "replace",
      "multiplyOrCreate",
      "multiply",
      "add",
    ];

    _.forEach(mods, (mod) => {
      const operationName = mod.op;
      const isOrderedOperation = _.includes(orderedOperations, operationName);

      if (!operationsContainer[operationName] && isOrderedOperation) {
        operationsContainer[operationName] = [];
      }

      if (isOrderedOperation) {
        operationsContainer[operationName].push(mod);
      } else {
        operationsContainer.otherOperations.push(mod);
      }
    });

    let orderedMods = [];
    _.forEach(orderedOperations, (operation) => {
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
    if (Array.isArray(srcVal)) {
      return _.cloneDeep(srcVal);
    }
    // Undefined falls through to _.merge's default, so objects still merge
    // key-by-key, which is what `events` and `audio` want.
  }

  const flattenBaseSpecs = (spec, specs, tag) => {
    const visited = {};

    function resolve(spec) {
      if (!Object.prototype.hasOwnProperty.call(spec, "base_spec")) {
        return _.cloneDeep(spec);
      }

      let baseKey = spec.base_spec + tag;
      let base = specs[baseKey];
      if (!base) {
        baseKey = spec.base_spec;
        base = specs[baseKey];
        if (!base) {
          console.warn(
            `flattenBaseSpecs: base_spec "${spec.base_spec}" not found in specs (checked "${spec.base_spec}${tag}" and "${spec.base_spec}") - dropping base_spec reference and returning spec as-is.`
          );
          return _.cloneDeep(_.omit(spec, "base_spec"));
        }
      }

      if (visited[baseKey]) {
        console.warn(
          `flattenBaseSpecs: circular base_spec reference detected at "${baseKey}" - stopping inheritance here.`
        );
        return _.cloneDeep(_.omit(spec, "base_spec"));
      }
      visited[baseKey] = true;

      const specCopy = _.omit(spec, "base_spec");
      const flattenedSpec = resolve(base);

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
    const hasSerialisableValue = _.some(
      spec.navigation,
      (value) => value !== undefined
    );
    if (!hasSerialisableValue) {
      delete spec.navigation;
    }
  }

  return {
    mod: function (specs, mods, specTag) {
      const load = (specId) => {
        let taggedId = specId;
        if (!Object.prototype.hasOwnProperty.call(specs, taggedId)) {
          taggedId = specId + specTag;
          if (!Object.prototype.hasOwnProperty.call(specs, taggedId)) {
            return;
          }
        }
        let result = specs[taggedId];
        if (
          result &&
          Object.prototype.hasOwnProperty.call(result, "base_spec")
        ) {
          specs[taggedId] = result = flattenBaseSpecs(result, specs, specTag);
        }
        return result;
      };

      const ops = {
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
          return Object.assign({}, attribute, value);
        },
        push: function (attribute, value) {
          if (!Array.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          if (Array.isArray(value)) {
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
          let loaded = _.isString(attribute) ? load(attribute) : attribute;
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
          const jsonIndex = attribute.lastIndexOf(".json");
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
          const cleanAttribute = attribute.slice(0, jsonIndex + 5);
          return cleanAttribute + specTag;
        },
        pull: function (attribute, value) {
          if (!Array.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          let args = [attribute, value];
          if (Array.isArray(value)) {
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
          if (!Array.isArray(value)) {
            value = [value, ""];
          }
          return attribute.split(value[0]).join(value[1]);
        },
        // GWO addition, the counterpart to the base game's append. Order matters for
        // buildable_types and build lists, where the engine takes the first match.
        prepend: function (attribute, value) {
          if (!Array.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          if (Array.isArray(value)) {
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
      const opsWithoutPath = {
        eval: true,
        clone: true,
      };

      const applyMod = (mod) => {
        let spec = load(mod.file);
        if (!spec) {
          return console.warn("Warning: File not found in mod", mod);
        }
        if (!Object.prototype.hasOwnProperty.call(ops, mod.op)) {
          return console.error("Invalid operation in mod", mod);
        }

        // Captured before the path walk reassigns `spec` to a nested container.
        // pruneEmptyNavigation needs the file's top-level spec.
        const rootSpec = spec;

        const originalPath = (mod.path || "").split(".");
        const path = originalPath.slice().reverse();

        const reportError = (error, step) => {
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
        const opDefaults = {
          push: [],
          pull: [],
          merge: {}, // merge's own check treats {} as a valid empty base
        };

        // A missing intermediate segment needs a traversable container: an
        // array when the next segment indexes into it, otherwise a plain object.
        const traversableFor = (nextSegment) =>
          isIndexLike(nextSegment) ? [] : {};

        const cookArrayStep = (step, op) => {
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

        const cookObjectStep = (step, op) => {
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

        const cookStep = (step, op) =>
          Array.isArray(spec)
            ? cookArrayStep(step, op)
            : cookObjectStep(step, op);

        while (path.length > 1) {
          const level = cookStep(path.pop());

          if (_.isString(spec[level])) {
            const newSpec = load(spec[level]);
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
          const leaf = cookStep(path[0], mod.op);
          spec[leaf] = ops[mod.op](spec[leaf], mod.value);
        } else if (opsWithoutPath[mod.op]) {
          ops[mod.op](spec, mod.value);
        } else {
          console.error(
            `Invalid mod: op '${mod.op}' requires a path, but none was given`,
            mod
          );
        }

        if (originalPath[0] === "navigation") {
          pruneEmptyNavigation(rootSpec);
        }
      };

      const orderedMods = orderOfOperations(mods);
      _.forEach(orderedMods, (mod) => {
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
