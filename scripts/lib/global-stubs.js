"use strict";

// Save/restore for the engine globals (model/window/$/api) that shipped code reads at
// call time. Each test installs what it needs and the recorded restores put the
// process back exactly as it was, so no test can leak a stub into the next one.
//
// createGlobalStubs() returns its own restore stack, so two test files - or two
// suites in one file - never share state.

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
