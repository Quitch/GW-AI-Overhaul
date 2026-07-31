"use strict";

// Evaluates PA's `buildable_types` expression language - the string on a builder's spec
// that decides which units it may produce, matched against the target's `unit_types`
// (with the UNITTYPE_ prefix dropped).
//
// Grammar, as read off the base game's own expressions:
//   or   := and ("|" and)*
//   and  := atom (("&" | "-") atom)*        `-` is and-not
//   atom := IDENT | "(" or ")"
// `|` is the lowest precedence; `&` and `-` share the next level and associate
// left-to-right. That is what makes the Unit Cannon's "Mobile - NoBuild" mean
// "any mobile unit except a NoBuild one", and fabrication_bot_adv's
// "Land & Structure & Advanced - Factory| Factory & Advanced & Bot & Land | ..."
// exclude Factory from only the first alternative.
//
// Unknown tokens are simply absent from the tag set, so a typo'd tag reads as false
// rather than throwing - the same way the engine treats one.

// Whitespace is insignificant; every operator is a single character, so tokenizing is
// "identifiers or one of ()&|-", and anything else in the string is ignored.
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

  // Function declarations rather than consts: the three are mutually recursive
  // (parseAtom recurses into parseOr for a parenthesised group), so one of them is
  // always referenced before its definition is reached.
  function parseOr() {
    let value = parseAnd();
    while (peek() === "|") {
      take();
      // Evaluate before OR-ing so the parse always consumes the whole alternative,
      // rather than short-circuiting and leaving tokens behind.
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
    // An empty or malformed expression lands here with token === undefined, which is
    // not a tag anyone holds - false, the same answer the engine gives.
    return token !== undefined && has(token);
  }

  return parseOr();
}

module.exports = { matches: matches };
