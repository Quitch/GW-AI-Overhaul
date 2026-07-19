"use strict";

// Minimal $/api stand-ins covering exactly the subset referee_ai.js's default
// exported function uses ($.Deferred(), $.getJSON(url), api.file.list(path,
// recursive)) - not a general jQuery/game-API polyfill. Both are Promise-backed
// under the hood; `.then`/`.always` are exposed because production code calls
// them directly on the values these return.

// Returns the Promise itself (augmented with resolve/reject/promise/always) rather than
// a separate plain object wrapping it, so `.then` stays the real, inherited
// Promise.prototype.then instead of a hand-rolled look-alike (the shape SonarLint's
// "objects should not have a then property" rule warns about).
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

// createFakeJQuery(options) -> $-like object
//   options.getJSON: (url) => value | Promise<value>, the resolver behind $.getJSON.
//   Throws (as a rejected promise) if a URL is requested with no resolver configured,
//   so a test's fixture data staying in sync with what the code under test actually
//   requests is enforced rather than silently masked.
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

// createFakeApi(overrides) -> api-like object
//   overrides.file.list: (path, recursive) => string[] | Promise<string[]>
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
