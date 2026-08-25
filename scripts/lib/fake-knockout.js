"use strict";

// Enough knockout for the observables shipped code reads, writes, subscribes to
// and marks mutated: no dependency tracking, and a computed is just its function,
// re-evaluated on every read. `hooks` lets a test watch writes (onChange) and
// valueHasMutated calls (onMutate) without a subscription of its own.

function makeObservable(initial, hooks) {
  const opts = hooks || {};
  const subscribers = [];
  let value = initial;

  const notify = () => subscribers.forEach((fn) => fn(value));

  const observable = function () {
    if (arguments.length) {
      value = arguments[0];
      if (opts.onChange) {
        opts.onChange(value);
      }
      notify();
      return undefined;
    }
    return value;
  };
  observable.subscribe = (fn) => {
    subscribers.push(fn);
    return {
      dispose: () => {
        const at = subscribers.indexOf(fn);
        if (at !== -1) {
          subscribers.splice(at, 1);
        }
      },
    };
  };
  observable.extend = () => observable;
  observable.valueHasMutated = () => {
    if (opts.onMutate) {
      opts.onMutate(value);
    }
    notify();
  };
  return observable;
}

// A subscription that never fires. shared/bank.js subscribes to its own
// startCards at define time and the callback reaches api.tally, so a sweep that
// runs loadout cards' buff() must not deliver it.
function makeInertObservable(initial) {
  const observable = makeObservable(initial);
  observable.subscribe = () => ({ dispose: () => {} });
  return observable;
}

// push replaces the array rather than mutating it, which is all the module can
// observe. remove() drops every equal item, which is what GWO's removeUnits
// relies on to clear multiple copies of a unit.
function makeObservableArray(initial, hooks) {
  const observable = makeObservable(initial || [], hooks);
  observable.push = (item) => observable(observable().concat([item]));
  observable.remove = (item) =>
    observable(observable().filter((entry) => entry !== item));
  return observable;
}

const computed = (fn) => fn;

// Overrides replace whole ko members, e.g. `{ observableArray: makeInertObservable }`.
function installFakeKnockout(overrides) {
  global.ko = Object.assign(
    {
      observable: makeObservable,
      observableArray: makeObservableArray,
      computed,
    },
    overrides
  );
  return global.ko;
}

module.exports = {
  computed,
  installFakeKnockout,
  makeInertObservable,
  makeObservable,
  makeObservableArray,
};
