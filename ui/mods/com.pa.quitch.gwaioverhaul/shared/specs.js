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

  var flattenBaseSpecs = function (spec, specs, tag) {
    var visited = [];

    function resolve(spec) {
      if (!Object.prototype.hasOwnProperty.call(spec, "base_spec")) {
        return _.cloneDeep(spec);
      }

      var baseKey = spec.base_spec;
      var base = specs[baseKey];
      if (!base) {
        baseKey = spec.base_spec + tag;
        base = specs[baseKey];
        if (!base) {
          return _.cloneDeep(spec);
        }
      }

      if (visited.indexOf(baseKey) !== -1) {
        console.warn(
          'flattenBaseSpecs: circular base_spec reference detected at "' +
            baseKey +
            '" - stopping inheritance here.'
        );
        return _.cloneDeep(_.omit(spec, "base_spec"));
      }
      visited.push(baseKey);

      var specCopy = _.omit(spec, "base_spec");
      var flattenedSpec = resolve(base);

      if (_.isArray(specCopy.ammo_id) && flattenedSpec.ammo_id) {
        delete flattenedSpec.ammo_id;
      }

      return _.cloneDeep(_.merge({}, flattenedSpec, specCopy));
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
        if (result) {
          specs[taggedId] = result = flattenBaseSpecs(result, specs, specTag);
        }
        return result;
      };

      var ops = {
        multiply: function (attribute, value) {
          if (!_.isNumber(attribute)) {
            console.warn(
              "multiply op: attribute is not a number, leaving unchanged:",
              attribute
            );
            return attribute;
          }
          return attribute * value;
        },
        add: function (attribute, value) {
          if (!_.isNumber(attribute) && !_.isString(attribute)) {
            console.warn(
              "multiply add: attribute is not a number, string, or nullish, leaving unchanged:",
              attribute
            );
            return attribute;
          }
          if (isNullish(attribute)) {
            return value;
          }
          return attribute + value;
        },
        replace: function (attribute, value) {
          return value;
        },
        merge: function (attribute, value) {
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
        // unsafe, but mods can run whatever they want anyway, so this is just a convenience for them
        eval: function (attribute, value) {
          return new Function("attribute", value)(attribute);
        },
        clone: function (attribute, value) {
          var loaded = load(attribute);
          if (loaded) {
            loaded = _.cloneDeep(loaded);
          }
          specs[value + specTag] = loaded !== undefined ? loaded : attribute;
          return attribute;
        },
        tag: function (attribute) {
          var jsonIndex = attribute.lastIndexOf(".json");
          if (jsonIndex === -1) {
            console.error(
              "tag op: attribute does not contain '.json':",
              attribute
            );
            return attribute + specTag;
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
            attribute = attribute.toString();
          }
          if (!_.isArray(value)) {
            value = [value, ""];
          }
          return attribute.split(value[0]).join(value[1]);
        },
        // New op to prepend to arrays
        prepend: function prepend(attribute, value) {
          if (!_.isArray(attribute)) {
            attribute = isNullish(attribute) ? [] : [attribute];
          }
          attribute.unshift(value);
          if (_.isArray(value)) {
            attribute = _.flatten(attribute);
          }
          return attribute;
        },
        multiplyOrCreate: function (attribute, value) {
          return _.isNumber(attribute) ? attribute * value : value;
        },
      };

      var applyMod = function (mod) {
        var spec = load(mod.file);
        if (!spec) {
          return console.warn("Warning: File not found in mod", mod);
        }
        if (!Object.prototype.hasOwnProperty.call(ops, mod.op)) {
          return console.error("Invalid operation in mod", mod);
        }

        var originalPath = (mod.path || "").split(".");
        var path = originalPath.reverse();

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

        var opDefaults = {
          push: [],
          pull: [],
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
            spec[step] = op ? opDefaults[op] || {} : {};
          }
          return step;
        };

        while (path.length > 1) {
          var level = path.pop();
          cookStep(level);

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
        } else {
          ops[mod.op](spec, mod.value);
        }
      };

      var orderedMods = orderOfOperations(mods);
      _.forEach(orderedMods, applyMod);
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
