"use strict";

// Covers exactly the $/api subset referee_ai.js uses - not a general polyfill.

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

// Requesting a URL with no configured resolver rejects, so a test's fixtures can't
// silently drift from what the code under test actually asks for.
function createFakeJQuery(options) {
  var opts = options || {};

  return {
    Deferred: makeDeferred,
    getJSON: function (url) {
      return Promise.resolve()
        .then(function () {
          if (!opts.getJSON) {
            throw new Error(
              "fake-jquery: no getJSON resolver configured for " + url
            );
          }
          return opts.getJSON(url);
        })
        .then(undefined, function (err) {
          throw err;
        });
    },
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
