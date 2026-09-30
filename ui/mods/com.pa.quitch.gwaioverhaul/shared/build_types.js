// PA's unit-type expression language, evaluated against a unit's tags, and
// the build reach it gives. matches is the ES5 twin of
// scripts/lib/build-types.js. See races.md, "Capability cells".
define(function () {
  var tokenize = function (expression) {
    return String(expression).match(/\w+|[()&|-]/g) || [];
  };

  var matches = function (expression, tags) {
    var tokens = tokenize(expression);
    var index = 0;
    var has = function (tag) {
      return _.includes(tags, tag);
    };

    var parseAtom = function () {
      var token = tokens[index++];
      if (token === "(") {
        var value = parseOr();
        if (tokens[index] === ")") {
          index++;
        }
        return value;
      }
      return !!token && /^\w+$/.test(token) && has(token);
    };

    var parseAnd = function () {
      var value = parseAtom();
      while (tokens[index] === "&" || tokens[index] === "-") {
        var op = tokens[index++];
        var right = parseAtom();
        value = op === "&" ? value && right : value && !right;
      }
      return value;
    };

    var parseOr = function () {
      var value = parseAnd();
      while (tokens[index] === "|") {
        index++;
        var right = parseAnd();
        value = value || right;
      }
      return value;
    };

    if (!tokens.length) {
      return false;
    }
    return parseOr();
  };

  // { unit: true } for each of `candidates` that `builders` can build, and
  // that what they build can build in turn. A builder is not reached unless
  // something builds it. `buildableOf(unit)` gives a unit's build list and
  // `tagsOf(unit)` its tags; each distinct build list is evaluated once.
  var reach = function (builders, candidates, buildableOf, tagsOf) {
    var reached = {};
    var evaluated = {};
    var current = builders;

    while (current.length) {
      var next = [];
      _.forEach(current, function (builder) {
        var buildable = buildableOf(builder);
        if (!buildable || evaluated[buildable]) {
          return;
        }
        evaluated[buildable] = true;
        _.forEach(candidates, function (unit) {
          if (!reached[unit] && matches(buildable, tagsOf(unit))) {
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
