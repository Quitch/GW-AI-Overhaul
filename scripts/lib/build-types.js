"use strict";

// Evaluates PA's `buildable_types` expression language against a target's
// `unit_types`. The Node twin of shared/build_types.js. See races.md,
// "Capability cells".

// Every operator is one character, so anything but an identifier or ()&|- is noise.
function tokenize(expression) {
  return String(expression).match(/\w+|[()&|-]/g) || [];
}

function matches(expression, tags) {
  const tokens = tokenize(expression);
  const has = (tag) =>
    tags instanceof Set ? tags.has(tag) : tags.includes(tag);
  let position = 0;

  const peek = () => tokens[position];
  const take = () => tokens[position++];

  // Declarations, not consts: these three are mutually recursive, so one is
  // always referenced before its definition.
  function parseOr() {
    let value = parseAnd();
    while (peek() === "|") {
      take();
      // Evaluate before OR-ing, or short-circuiting leaves tokens unconsumed.
      const right = parseAnd();
      value = value || right;
    }
    return value;
  }

  function parseAnd() {
    let value = parseAtom();
    while (peek() === "&" || peek() === "-") {
      const operator = take();
      const right = parseAtom();
      value = operator === "&" ? value && right : value && !right;
    }
    return value;
  }

  function parseAtom() {
    const token = take();
    if (token === "(") {
      const value = parseOr();
      if (peek() === ")") {
        take();
      }
      return value;
    }
    // An empty or malformed expression arrives as undefined, which no unit holds.
    return token !== undefined && has(token);
  }

  return parseOr();
}

module.exports = { matches: matches };
