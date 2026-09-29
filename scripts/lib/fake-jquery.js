"use strict";

// Covers exactly the $/api subset the shipped referee and co-op code uses - not a
// general polyfill.

// jQuery 2's .then waits for what a callback returns only if it has a
// `promise` method; an engine or native promise is passed on unwaited. The
// native .then below would wait for one, so the test fails instead - out of
// band too, so a .fail() further down the chain cannot swallow it.
function thenCallback(fn) {
  if (typeof fn !== "function") {
    return fn;
  }
  return function (...args) {
    var returned = fn(...args);
    if (
      returned &&
      typeof returned.then === "function" &&
      !isJqueryPromise(returned)
    ) {
      var error = new Error(
        "fake-jquery: a .then callback returned a thenable with no promise() " +
          "method, which jQuery 2 passes on unwaited - adapt it with " +
          "shared/gwo_promise.js"
      );
      process.nextTick(function () {
        throw error;
      });
      throw error;
    }
    return returned;
  };
}

// The Promise itself, augmented, rather than a wrapper - so `.then` chains on
// the inherited Promise.prototype.then rather than a hand-rolled look-alike.
// What `.then` returns is augmented in the same way, as jQuery's is: setup.js
// chains .fail() off a .then(), and $.when reads the result of one.
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
    return decorate(chain(thenCallback(onDone), thenCallback(onFail)));
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

// jQuery 2.1.4's own Deferred, for code whose behaviour depends on it: callbacks
// run inside resolve() and reject(), so a callback's throw escapes through the
// call that settled it, and .then does not turn a throw into a rejection. After
// a throw the Deferred is stuck, as 2.1.4's is (Callbacks.fire never clears
// `firing`, so add() only queues): the callbacks after the thrower never run,
// and neither does one attached later. It differs from 2.1.4 in two ways: a
// callback added while the list fires runs at once rather than after the rest,
// and promise() returns the Deferred itself, resolve() included.
function makeSyncDeferred() {
  var state = "pending";
  var stuck = false;
  var values = [];
  var lists = { resolved: [], rejected: [] };

  var settle = function (to, settledValues) {
    if (state !== "pending") {
      return;
    }
    state = to;
    values = settledValues;
    var list = lists[to];
    lists = { resolved: [], rejected: [] };
    for (const callback of list) {
      try {
        callback(...values);
      } catch (e) {
        stuck = true;
        throw e;
      }
    }
  };

  var on = function (when, fn) {
    if (stuck) {
      return;
    }
    if (state === when) {
      try {
        fn(...values);
      } catch (e) {
        stuck = true;
        throw e;
      }
    } else if (state === "pending") {
      lists[when].push(fn);
    }
  };

  var deferred = {
    resolve: function (...resolvedValues) {
      settle("resolved", resolvedValues);
      return deferred;
    },
    reject: function (...reasons) {
      settle("rejected", reasons);
      return deferred;
    },
    done: function (fn) {
      on("resolved", fn);
      return deferred;
    },
    fail: function (fn) {
      on("rejected", fn);
      return deferred;
    },
    always: function (fn) {
      on("resolved", fn);
      on("rejected", fn);
      return deferred;
    },
    then: function (onDone, onFail) {
      var next = makeSyncDeferred();
      var forward = function (fn, settleNext) {
        return function (...settledValues) {
          if (!fn) {
            settleNext(...settledValues);
            return;
          }
          var returned = fn(...settledValues);
          if (returned && typeof returned.promise === "function") {
            returned.promise().done(next.resolve).fail(next.reject);
          } else {
            settleNext(returned);
          }
        };
      };
      on("resolved", forward(onDone, next.resolve));
      on("rejected", forward(onFail, next.reject));
      return next.promise();
    },
    promise: function () {
      return deferred;
    },
  };

  return deferred;
}

// jQuery 2.1.4's $.when, for makeSyncDeferred: it waits on every argument with
// a promise method, without a tick, and passes the rest through. Several
// arguments reach the callbacks as arguments of their own, and an argument
// settled with several values as an array of them.
function syncWhen(...args) {
  if (args.length === 1 && isJqueryPromise(args[0])) {
    return args[0].promise();
  }
  var master = makeSyncDeferred();
  var values = args.slice();
  var remaining = args.length;
  var settleOne = function (i) {
    return function (...settled) {
      values[i] = settled.length > 1 ? settled : settled[0];
      remaining--;
      if (!remaining) {
        master.resolve(...values);
      }
    };
  };
  args.forEach(function (arg, i) {
    if (isJqueryPromise(arg)) {
      arg.promise().done(settleOne(i)).fail(master.reject);
    } else {
      remaining--;
    }
  });
  if (!remaining) {
    master.resolve(...values);
  }
  return master.promise();
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

// A failed api.* call, chained as PA's coherent.js chains one: a .then given
// an error callback gets the failure, and fails the promise it returns with
// what that callback returned or threw. The promise a .then given no error
// callback returns never settles, because the engine's default handler merges
// rather than rejects. api.file.list fails this way for a path it cannot list.
// Measured against the game's own coherent.js.
function failedEngineCall(reason) {
  return {
    then: function (onDone, onFail) {
      if (!onFail) {
        return neverSettles();
      }
      var failure;
      try {
        failure = onFail(reason);
      } catch (e) {
        failure = e;
      }
      return failedEngineCall(failure);
    },
  };
}

function neverSettles() {
  return {
    then: function () {
      return neverSettles();
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
// engine promise handed to $.when, or returned from a .then callback, is read
// as a plain value and never waited for. Modelled here so a shipped file that
// does that fails a test.
function isJqueryPromise(value) {
  return !!value && typeof value.promise === "function";
}

// jQuery 2's $.when: waits on a jQuery promise and passes everything else
// through. The callbacks get each argument's value as an argument of its own,
// and an argument settled with several values as an array of them. One jQuery
// promise comes back as itself, as jQuery's does.
// The result carries `.always`, as jQuery's does - a caller that only wants to
// know the wait is over uses it rather than .then.
//
// Built by hand rather than off a native promise, because resolving one with a
// thenable adopts it: a passed-through engine promise would be waited for after
// all, which is the whole thing this models.
function when() {
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 1 && isJqueryPromise(args[0])) {
    return args[0].promise();
  }
  var values = args.slice();
  var waits = [];

  args.forEach(function (arg, index) {
    if (!isJqueryPromise(arg)) {
      return;
    }
    waits.push(
      arg.promise().then(function (...settled) {
        values[index] = settled.length > 1 ? settled : settled[0];
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
            return onDone(...values);
          },
        onFail
      )
    );
  };

  self.promise = function () {
    return self;
  };
  self.then = function (onDone, onFail) {
    return chain(thenCallback(onDone), thenCallback(onFail));
  };
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
// silently drift from what the code under test actually asks for. `sync` swaps
// in makeSyncDeferred and syncWhen.
function createFakeJQuery(options) {
  var opts = options || {};

  return {
    Deferred: opts.sync ? makeSyncDeferred : makeDeferred,
    when: opts.sync ? syncWhen : when,
    getJSON: function (url) {
      return decorate(
        Promise.resolve()
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
          })
      );
    },
  };
}

// A callable `$` carrying the fake's members, installed through the stubs so
// the suite's own restore puts the previous global back.
function installFakeJQuery(stubs, options) {
  // A fresh shell per install, so one suite's members never linger on the
  // next; nothing under test calls `$()` itself, only its members.
  var $ = Object.assign(function () {
    // Deliberately a no-op: the members assigned below are the fake.
  }, createFakeJQuery(options));
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
  failedEngineCall: failedEngineCall,
  resolved: resolved,
  rejected: rejected,
  createFakeJQuery: createFakeJQuery,
  createFakeApi: createFakeApi,
  installFakeJQuery: installFakeJQuery,
  when: when,
};
