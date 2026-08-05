"use strict";

// A Proxy answering any property access or call with another instance of itself,
// so a caller inspecting one method of `inventory` need not mock the rest.
// See testing.md.
function stubTarget() {
  // Never invoked; the `apply` trap intercepts first. It exists so `typeof` holds.
}

function createAutoStub() {
  return new Proxy(stubTarget, {
    get(obj, prop) {
      // Arithmetic on a stubbed value should produce garbage, not throw.
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
