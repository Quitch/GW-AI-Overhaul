"use strict";

// Covers exactly the $/api subset the shipped referee and co-op code uses - not a
// general polyfill.

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

// jQuery 2's $.when: waits on anything thenable and passes everything else
// through. One argument resolves to that value; several to the array of them.
// The result carries `.always`, as jQuery's does - a caller that only wants to
// know the wait is over uses it rather than .then. Always a fresh promise, so
// attaching that never mutates what was passed in.
function when() {
  var args = Array.prototype.slice.call(arguments);
  var settled = args.map(function (arg) {
    return arg && typeof arg.then === "function" ? arg : Promise.resolve(arg);
  });
  var result = Promise.all(settled).then(function (values) {
    return args.length === 1 ? values[0] : values;
  });

  result.always = function (fn) {
    result.then(fn, fn);
    return result;
  };

  return result;
}

// Requesting a URL with no configured resolver rejects, so a test's fixtures can't
// silently drift from what the code under test actually asks for.
function createFakeJQuery(options) {
  var opts = options || {};

  return {
    Deferred: makeDeferred,
    when: when,
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

// A callable `$` carrying the fake's members, installed through the stubs so
// the suite's own restore puts the previous global back.
function installFakeJQuery(stubs, options) {
  var $ = function () {};
  Object.assign($, createFakeJQuery(options));
  stubs.setGlobal("$", $);
  return $;
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
  installFakeJQuery: installFakeJQuery,
  when: when,
};
