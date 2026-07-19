"use strict";

// Minimal $/api stand-ins covering exactly the subset referee_ai.js's default
// exported function uses ($.Deferred(), $.getJSON(url), api.file.list(path,
// recursive)) - not a general jQuery/game-API polyfill. Both are Promise-backed
// under the hood; `.then`/`.always` are exposed because production code calls
// them directly on the values these return.

function makeDeferred() {
  var resolveFn;
  var rejectFn;
  var promise = new Promise(function (resolve, reject) {
    resolveFn = resolve;
    rejectFn = reject;
  });

  return {
    resolve: function (value) {
      resolveFn(value);
      return this;
    },
    reject: function (value) {
      rejectFn(value);
      return this;
    },
    promise: function () {
      return promise;
    },
    then: function (onFulfilled, onRejected) {
      return promise.then(onFulfilled, onRejected);
    },
    always: function (fn) {
      promise.then(fn, fn);
      return this;
    },
  };
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
