"use strict";

// Covers exactly the $/api subset the deliberately-still-jQuery deal/cards
// subsystem's tests use (see cef-migration.md) - not a general polyfill.

// The Promise itself, augmented, rather than a wrapper - so `.then` stays the
// inherited Promise.prototype.then rather than a hand-rolled look-alike.
function makeDeferred() {
  var resolveFn;
  var rejectFn;
  var deferred = new Promise(function (resolve, reject) {
    resolveFn = resolve;
    rejectFn = reject;
  });

  deferred.resolve = function (value) {
    resolveFn(value);
    return this;
  };
  deferred.reject = function (value) {
    rejectFn(value);
    return this;
  };
  deferred.promise = function () {
    return deferred;
  };
  deferred.always = function (fn) {
    deferred.then(fn, fn);
    return this;
  };

  return deferred;
}

function createFakeJQuery() {
  return {
    Deferred: makeDeferred,
  };
}

function createFakeApi(overrides) {
  var opts = overrides || {};
  var defaultFile = {
    list: function () {
      return Promise.resolve([]);
    },
  };

  return Object.assign({}, opts, {
    file: Object.assign({}, defaultFile, opts.file),
  });
}

module.exports = {
  makeDeferred: makeDeferred,
  createFakeJQuery: createFakeJQuery,
  createFakeApi: createFakeApi,
};
