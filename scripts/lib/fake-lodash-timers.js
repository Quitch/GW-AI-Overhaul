"use strict";

// _.delay and _.debounce fire on the setTimeout lodash 3 bound once, at load, so
// node:test's timer mocks cannot reach them. The global lodash is swapped for a
// context bound to a recording setTimeout instead, and restore() puts the real
// one back. Left real, a delayed callback fires into a torn-down stub.
//
// `now` also swaps the context's Date for a clock the test drives. lodash 3's
// now() rejects a non-native Date.now and falls back to `new Date().getTime()`,
// so the stand-in has to be constructible.
function installFakeLodashTimers(options) {
  const opts = options || {};
  const realLodash = global._;
  const delayed = [];
  const context = {
    setTimeout: (fn, wait) => delayed.push({ fn, wait }),
  };
  if (opts.now) {
    context.Date = function FakeDate() {
      this.getTime = () => opts.now();
    };
  }
  global._ = realLodash.runInContext(context);

  return {
    delayed,
    restore: () => {
      global._ = realLodash;
    },
  };
}

module.exports = { installFakeLodashTimers };
