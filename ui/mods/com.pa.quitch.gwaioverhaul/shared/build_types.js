// PA's unit-type expression language, evaluated against a unit's tags. The ES5
// twin of scripts/lib/build-types.js. See races.md, "Capability cells".
define(function () {
  var tokenize = function (expression) {
    return String(expression || "").match(/\w+|[()&|-]/g) || [];
  };

  var matches = function (expression, tags) {
    var tokens = tokenize(expression);
    var index = 0;
    var has = function (tag) {
      return _.contains(tags || [], tag);
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

  return { matches: matches };
});
