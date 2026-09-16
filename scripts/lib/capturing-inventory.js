"use strict";

// The inventory a card sweep hands to buff()/dull(). `answers` are the explicit
// replies that steer a card down the branch under test, `capture` maps a method
// name to a recorder for the calls the sweep is collecting, and everything else
// is auto-stubbed so a call a card starts making later needs no fixture update.

const { createAutoStub } = require("./auto-stub.js");

function createCapturingInventory({ answers, capture }) {
  const target = Object.assign({}, answers);
  for (const [name, record] of Object.entries(capture || {})) {
    target[name] = function () {
      record.apply(null, arguments);
      return createAutoStub();
    };
  }
  return new Proxy(target, {
    get(obj, prop) {
      return prop in obj ? obj[prop] : createAutoStub();
    },
  });
}

// addMods/addAIMods/addUnits concat, so they take a bare descriptor as readily as
// an array. push.apply on a non-array captures nothing, hence the fork.
function recordInto(list) {
  return function (value) {
    if (Array.isArray(value)) {
      list.push(...value);
    } else if (value) {
      list.push(value);
    }
  };
}

module.exports = { createCapturingInventory, recordInto };
