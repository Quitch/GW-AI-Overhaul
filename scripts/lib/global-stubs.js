"use strict";

// Save/restore for the engine globals shipped code reads at call time. A factory,
// not a singleton, so two suites never share a restore stack.

function createGlobalStubs() {
  const restores = [];

  function setGlobal(name, value) {
    const had = Object.prototype.hasOwnProperty.call(global, name);
    const previous = global[name];
    global[name] = value;
    restores.push(function () {
      if (had) {
        global[name] = previous;
      } else {
        delete global[name];
      }
    });
  }

  function restoreGlobals() {
    while (restores.length) {
      restores.pop()();
    }
  }

  return { setGlobal, restoreGlobals };
}

module.exports = { createGlobalStubs };
