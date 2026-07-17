"use strict";

// A Proxy that answers any property access or call with another instance of itself,
// recursively, without ever throwing. Used to stand in for the real `inventory`
// object passed to a card's buff()/dull() when we only care about one or two specific
// calls it makes (e.g. addAIMods) and want to tolerate whatever else it does
// (inventory.units(), inventory.maxCards(x), inventory.minions.push(x), ...) without
// having to hand-mock every method every card happens to touch.
function stubTarget() {
  // Never actually invoked - Proxy's `apply` trap intercepts calls before this body
  // would run. It only needs to exist so `typeof` and the Proxy's function-ness hold.
}

function createAutoStub() {
  return new Proxy(stubTarget, {
    get(obj, prop) {
      // Without these, arithmetic/string-concat on a stubbed value (e.g.
      // `inventory.maxCards() + 1`) throws instead of silently producing garbage -
      // and garbage is fine here, since we only care about reaching the specific
      // call (e.g. addAIMods) we're actually inspecting.
      if (prop === Symbol.toPrimitive) {
        return function (hint) {
          return hint === "number" ? 0 : "";
        };
      }
      if (prop === "valueOf") {
        return function () {
          return 0;
        };
      }
      if (prop === "toString") {
        return function () {
          return "";
        };
      }
      if (typeof prop === "symbol" || prop === "then") {
        return undefined;
      }
      return createAutoStub();
    },
    apply() {
      return createAutoStub();
    },
  });
}

module.exports = { createAutoStub: createAutoStub };
