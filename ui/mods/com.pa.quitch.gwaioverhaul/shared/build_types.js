// PA's unit-type expression language, evaluated against a unit's tags, and
// the build reach it gives. matches is the ES5 twin of
// scripts/lib/build-types.js. See races.md, "Capability cells".
define(function () {
  // Expressions compiled for reuse; older ones are dropped.
  var MAX_COMPILED = 1024;

  var tokenize = function (expression) {
    return String(expression).match(/\w+|[()&|-]/g) || [];
  };

  var never = function () {
    return false;
  };

  var tag = function (name) {
    return function (tags) {
      return tags[name] === true;
    };
  };

  var both = function (left, right) {
    return function (tags) {
      return left(tags) && right(tags);
    };
  };

  var butNot = function (left, right) {
    return function (tags) {
      return left(tags) && !right(tags);
    };
  };

  var either = function (left, right) {
    return function (tags) {
      return left(tags) || right(tags);
    };
  };

  // A predicate over a tag set ({ tag: true }). Read left to right: an
  // unclosed bracket closes at the end, and what follows a complete
  // expression is ignored.
  var compile = function (expression) {
    var tokens = tokenize(expression);
    var index = 0;

    var parseAtom = function () {
      var token = tokens[index++];
      if (token === "(") {
        var value = parseOr();
        if (tokens[index] === ")") {
          index++;
        }
        return value;
      }
      return !!token && /^\w+$/.test(token) ? tag(token) : never;
    };

    var parseAnd = function () {
      var value = parseAtom();
      while (tokens[index] === "&" || tokens[index] === "-") {
        var combine = tokens[index++] === "&" ? both : butNot;
        value = combine(value, parseAtom());
      }
      return value;
    };

    var parseOr = function () {
      var value = parseAnd();
      while (tokens[index] === "|") {
        index++;
        value = either(value, parseAnd());
      }
      return value;
    };

    return tokens.length ? parseOr() : never;
  };

  var compiled = {};
  // Keys in the order they were compiled, oldest first.
  var compiledOrder = [];
  var predicateOf = function (expression) {
    var cacheKey = String(expression);
    if (!Object.prototype.hasOwnProperty.call(compiled, cacheKey)) {
      compiled[cacheKey] = compile(expression);
      compiledOrder.push(cacheKey);
      if (compiledOrder.length > MAX_COMPILED) {
        delete compiled[compiledOrder.shift()];
      }
    }
    return compiled[cacheKey];
  };

  var tagSet = function (tags) {
    var set = {};
    _.forEach(tags || [], function (name) {
      set[name] = true;
    });
    return set;
  };

  var matches = function (expression, tags) {
    return predicateOf(expression)(tagSet(tags));
  };

  // { unit: true } for each of `candidates` that `builders` can build, and
  // that what they build can build in turn. A builder is not reached unless
  // something builds it. `buildableOf(unit)` gives a unit's build list and
  // `tagsOf(unit)` its tags; each distinct build list is evaluated once, and
  // each candidate's tags read once.
  var reach = function (builders, candidates, buildableOf, tagsOf) {
    var reached = {};
    var evaluated = {};
    var sets = {};
    var setOf = function (unit) {
      if (!Object.prototype.hasOwnProperty.call(sets, unit)) {
        sets[unit] = tagSet(tagsOf(unit));
      }
      return sets[unit];
    };
    var current = builders;

    while (current.length) {
      var next = [];
      _.forEach(current, function (builder) {
        var buildable = buildableOf(builder);
        if (!buildable || evaluated[buildable]) {
          return;
        }
        evaluated[buildable] = true;
        var builds = predicateOf(buildable);
        _.forEach(candidates, function (unit) {
          if (!reached[unit] && builds(setOf(unit))) {
            reached[unit] = true;
            next.push(unit);
          }
        });
      });
      current = next;
    }

    return reached;
  };

  return { matches: matches, reach: reach };
});
