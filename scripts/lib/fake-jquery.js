"use strict";

// Covers exactly the $/api subset the shipped referee and co-op code uses - not a
// general polyfill.

// The Promise itself, augmented, rather than a wrapper - so `.then` stays the
// inherited Promise.prototype.then rather than a hand-rolled look-alike. What
// `.then` returns is augmented in the same way, as jQuery's is: setup.js chains
// .fail() off a .then(), and $.when reads the result of one.
function decorate(promise) {
  var chain = promise.then.bind(promise);

  promise.promise = function () {
    return promise;
  };
  promise.always = function (fn) {
    chain(fn, fn);
    return promise;
  };
  promise.done = function (fn) {
    chain(fn);
    return promise;
  };
  promise.fail = function (fn) {
    chain(undefined, fn);
    return promise;
  };
  promise.then = function (onDone, onFail) {
    return decorate(chain(onDone, onFail));
  };

  return promise;
}

function makeDeferred() {
  var resolveFn;
  var rejectFn;
  var deferred = decorate(
    new Promise(function (resolve, reject) {
      resolveFn = resolve;
      rejectFn = reject;
    })
  );

  deferred.resolve = function (value) {
    resolveFn(value);
    return this;
  };
  deferred.reject = function (value) {
    rejectFn(value);
    return this;
  };

  return deferred;
}

// What every api.* call hands back: `then` and nothing jQuery recognises. Hold
// one pending to prove the code under test waits for it.
function enginePromise() {
  var handlers = [];
  var settled;

  var fire = function () {
    handlers.forEach(function (pair) {
      var fn = settled.ok ? pair[0] : pair[1];
      if (fn) {
        fn(settled.value);
      }
    });
    handlers = [];
  };

  return {
    then: function (onDone, onFail) {
      handlers.push([onDone, onFail]);
      if (settled) {
        fire();
      }
    },
    resolve: function (value) {
      settled = { ok: true, value: value };
      fire();
    },
    reject: function (value) {
      settled = { ok: false, value: value };
      fire();
    },
  };
}

// A settled jQuery promise, for a fixture standing in for code that returns one.
function resolved(value) {
  return makeDeferred().resolve(value).promise();
}

function rejected(reason) {
  return makeDeferred().reject(reason).promise();
}

// jQuery 2 identifies a promise by a `promise` method, not by `then`, so an
// engine promise handed to $.when is read as a plain value and never waited
// for. Modelled here so a shipped file that does that fails a test.
function isJqueryPromise(value) {
  return !!value && typeof value.promise === "function";
}

// jQuery 2's $.when: waits on a jQuery promise and passes everything else
// through. One argument resolves to that value; several to the array of them.
// The result carries `.always`, as jQuery's does - a caller that only wants to
// know the wait is over uses it rather than .then.
//
// Built by hand rather than off a native promise, because resolving one with a
// thenable adopts it: a passed-through engine promise would be waited for after
// all, which is the whole thing this models.
function when() {
  var args = Array.prototype.slice.call(arguments);
  var values = args.slice();
  var waits = [];

  args.forEach(function (arg, index) {
    if (!isJqueryPromise(arg)) {
      return;
    }
    waits.push(
      arg.promise().then(function (value) {
        values[index] = value;
      })
    );
  });

  var settled = Promise.all(waits);
  var self = {};

  var chain = function (onDone, onFail) {
    return decorate(
      settled.then(
        onDone &&
          function () {
            return onDone(args.length === 1 ? values[0] : values);
          },
        onFail
      )
    );
  };

  self.promise = function () {
    return self;
  };
  self.then = chain;
  self.done = function (fn) {
    chain(fn);
    return self;
  };
  self.fail = function (fn) {
    chain(undefined, fn);
    return self;
  };
  self.always = function (fn) {
    chain(fn, fn);
    return self;
  };

  return self;
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
  enginePromise: enginePromise,
  resolved: resolved,
  rejected: rejected,
  createFakeJQuery: createFakeJQuery,
  createFakeApi: createFakeApi,
  installFakeJQuery: installFakeJQuery,
  when: when,
};
