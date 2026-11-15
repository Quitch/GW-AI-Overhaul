"use strict";

// shared/gwo_promise.js: settled, the adapter that turns an engine promise
// into one jQuery waits for, steps, a chain that a step's synchronous throw
// rejects, within, a promise raced against a timeout, later, which runs a step
// in a task of its own, inSeries, which runs one item per task, and soon,
// which runs a function in a MessageChannel message. See constraints.md.

const {
  describe,
  it,
  beforeEach,
  afterEach,
  after,
  mock,
} = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  enginePromise,
  installFakeJQuery,
} = require("../scripts/lib/fake-jquery.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");
const {
  installFakeMessageChannel,
  soonTasks,
} = require("../scripts/lib/fake-message-channel.js");

const gwoPromise = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js"
);

const stubs = createGlobalStubs();

// soon() keeps the channel it makes first, so one fake serves every test.
const channelStubs = createGlobalStubs();
const channel = installFakeMessageChannel(channelStubs.setGlobal);
let channelsMade = 0;
const FakeMessageChannel = global.MessageChannel;
channelStubs.setGlobal("MessageChannel", function () {
  channelsMade += 1;
  return new FakeMessageChannel();
});
after(() => channelStubs.restoreGlobals());

// $.when settles through Promise.all, so a checkpoint waits for the queue to
// drain rather than a fixed number of ticks.
const flush = () => new Promise((resolve) => setImmediate(resolve));
let $;

beforeEach(() => {
  $ = installFakeJQuery(stubs);
});

afterEach(() => {
  stubs.restoreGlobals();
});

describe("settled", () => {
  it("resolves with what the engine promise gave", async () => {
    const engine = enginePromise();
    const waiting = gwoPromise.settled(engine);

    engine.resolve("mounted");

    assert.equal(await waiting, "mounted");
  });

  it("resolves with onFailure()'s value rather than rejecting", async () => {
    const engine = enginePromise();
    const waiting = gwoPromise.settled(engine, () => "fallback");

    engine.reject(new Error("no"));

    assert.equal(await waiting, "fallback");
  });

  // So a caller can log why, as dealing the AI stars' cards does.
  it("hands onFailure the reason the call failed", async () => {
    const reasons = [];
    const failed = Promise.reject(new Error("refresh failed"));

    await gwoPromise.settled(failed, (reason) => {
      reasons.push(reason.message);
    });

    assert.deepEqual(reasons, ["refresh failed"]);
  });

  it("resolves undefined when a failure has nothing to fall back on", async () => {
    const engine = enginePromise();
    const waiting = gwoPromise.settled(engine);

    engine.reject(new Error("no"));

    assert.equal(await waiting, undefined);
  });

  // The point of the module: $.when identifies a promise by a `promise`
  // method, which an engine promise has not got, so it never waits for one.
  it("hands back a promise $.when waits for, where the engine promise is not", async () => {
    const engine = enginePromise();
    const waited = [];

    $.when(engine).always(() => waited.push("engine"));
    $.when(gwoPromise.settled(engine)).always(() => waited.push("adapted"));

    await flush();
    assert.deepEqual(waited, ["engine"]);

    engine.resolve(true);
    await flush();
    assert.deepEqual(waited, ["engine", "adapted"]);
  });
});

// steps exists for jQuery 2.1.4's Deferred, so it is pinned against the fake
// that models it: callbacks run inside resolve(), a throw escapes through it,
// and the Deferred is stuck afterwards.
describe("steps under jQuery 2's Deferred", () => {
  beforeEach(() => {
    $ = installFakeJQuery(stubs, { sync: true });
  });

  it("models the trap: without steps, a throw leaves the fail handler unrun", () => {
    const start = $.Deferred();
    let failed = false;

    start
      .promise()
      .then(() => {
        throw new Error("step broke");
      })
      .then(null, () => {
        failed = true;
      });

    assert.throws(() => start.resolve(), /step broke/);
    assert.equal(failed, false);

    // And the Deferred is stuck: a consumer attached now never runs.
    let later = false;
    start.done(() => {
      later = true;
    });
    assert.equal(later, false);
  });

  it("rejects with the first step's synchronous throw and skips the rest", () => {
    const start = $.Deferred();
    const ran = [];
    let reason;

    gwoPromise
      .steps(start.promise(), [
        () => {
          throw new Error("first broke");
        },
        () => ran.push("second"),
      ])
      .then(null, (e) => {
        reason = e;
      });

    start.resolve();

    assert.deepEqual(ran, []);
    assert.equal(reason.message, "first broke");
  });

  it("rejects the same way for a step later than the first", () => {
    const start = $.Deferred();
    let reason;

    gwoPromise
      .steps(start.promise(), [
        () => "one",
        () => "two",
        () => "three",
        () => {
          throw new Error("fourth broke");
        },
      ])
      .then(null, (e) => {
        reason = e;
      });

    start.resolve();

    assert.equal(reason.message, "fourth broke");
  });

  it("hands each step the previous step's value and resolves with the last", () => {
    const start = $.Deferred();
    const seen = [];
    let result;

    gwoPromise
      .steps(start.promise(), [
        (value) => {
          seen.push(value);
          return value + 1;
        },
        (value) => {
          seen.push(value);
          return value + 1;
        },
      ])
      .done((value) => {
        result = value;
      });

    start.resolve(1);

    assert.deepEqual(seen, [1, 2]);
    assert.equal(result, 3);
  });

  it("waits for a step's promise before the next step", () => {
    const start = $.Deferred();
    const slow = $.Deferred();
    const ran = [];

    gwoPromise.steps(start.promise(), [
      () => slow.promise(),
      (value) => ran.push(value),
    ]);

    start.resolve();
    assert.deepEqual(ran, []);

    slow.resolve("slow done");
    assert.deepEqual(ran, ["slow done"]);
  });

  it("rejects when the start rejects, running no step", () => {
    const start = $.Deferred();
    const ran = [];
    let reason;

    gwoPromise
      .steps(start.promise(), [() => ran.push("step")])
      .then(null, (e) => {
        reason = e;
      });

    start.reject(new Error("no races"));

    assert.deepEqual(ran, []);
    assert.equal(reason.message, "no races");
  });
});

describe("within", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout"] });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it("settles as the promise does while there is time", async () => {
    assert.equal(
      await gwoPromise.within(Promise.resolve("built"), 50, "AI build"),
      "built"
    );
    await assert.rejects(
      gwoPromise.within(Promise.reject(new Error("broke")), 50, "AI build"),
      (error) => error.message === "broke" && !error.gwoTimedOut
    );
  });

  // The co-op AI driver tells a timeout from a failure by gwoTimedOut.
  it("rejects once the time runs out, naming what timed out", async () => {
    const raced = gwoPromise.within(new Promise(() => {}), 50, "write");
    let settled = false;
    raced.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );

    mock.timers.tick(49);
    await flush();
    assert.equal(settled, false);

    mock.timers.tick(1);
    await assert.rejects(
      raced,
      (error) =>
        error.message === "write timed out after 50ms" &&
        error.gwoTimedOut === true
    );
  });

  it("drops a result that lands after the time ran out", async () => {
    let land;
    const raced = gwoPromise.within(
      new Promise((resolve) => {
        land = resolve;
      }),
      50,
      "AI build"
    );

    const rejected = assert.rejects(raced, /AI build timed out after 50ms/);

    mock.timers.tick(50);
    land("too late");
    await flush();

    await rejected;
  });
});

describe("later", () => {
  let timers;
  let tasks;

  beforeEach(() => {
    timers = installFakeLodashTimers();
    tasks = soonTasks(timers, channel);
  });

  afterEach(() => {
    timers.restore();
  });

  it("runs step in the task schedule starts, resolving with its result", async () => {
    const scheduled = [];
    let ran = false;

    const result = gwoPromise.later(
      () => {
        ran = true;
        return "done";
      },
      (fn) => scheduled.push(fn)
    );

    await flush();
    assert.equal(ran, false);
    assert.equal(scheduled.length, 1);
    assert.equal(tasks.pending(), 0);

    scheduled[0]();
    assert.equal(await result, "done");
    assert.equal(ran, true);
  });

  it("rejects with step's throw", async () => {
    const result = gwoPromise.later(
      () => {
        throw new Error("step threw");
      },
      (fn) => fn()
    );

    await assert.rejects(result, /step threw/);
  });

  it("goes through soon without a schedule", async () => {
    const result = gwoPromise.later(() => "done");

    assert.equal(tasks.pending(), 1);

    tasks.runNext();
    assert.equal(await result, "done");
  });
});

describe("inSeries", () => {
  let timers;
  let tasks;

  beforeEach(() => {
    timers = installFakeLodashTimers();
    tasks = soonTasks(timers, channel);
  });

  afterEach(() => {
    timers.restore();
  });

  const drain = async () => {
    for (let tick = 0; tick < 20; tick += 1) {
      await Promise.resolve();
    }
  };

  // Runs one task, then lets its promise chain settle.
  const runTask = async () => {
    await drain();
    tasks.runNext();
    await drain();
  };

  it("runs each item in a task of its own, in order, resolving with their results", async () => {
    const ran = [];
    let result;

    gwoPromise
      .inSeries(["a", "b", "c"], (item) => {
        ran.push(item);
        return item.toUpperCase();
      })
      .then((value) => {
        result = value;
      });

    await drain();
    assert.deepEqual(ran, []);
    assert.equal(tasks.pending(), 1);

    await runTask();
    assert.deepEqual(ran, ["a"]);
    await runTask();
    assert.deepEqual(ran, ["a", "b"]);
    await runTask();
    assert.deepEqual(ran, ["a", "b", "c"]);

    assert.deepEqual(result, ["A", "B", "C"]);
    assert.equal(tasks.pending(), 0);
  });

  it("waits for an item's promise before the next item's task", async () => {
    const ran = [];
    let release;

    gwoPromise.inSeries([1, 2], (item) => {
      ran.push(item);
      return item === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : item;
    });

    await runTask();
    assert.deepEqual(ran, [1]);
    assert.equal(tasks.pending(), 0);

    release();
    await runTask();
    assert.deepEqual(ran, [1, 2]);
  });

  it("rejects with an item's throw and runs no item after it", async () => {
    const ran = [];
    let reason;

    gwoPromise
      .inSeries([1, 2, 3], (item) => {
        ran.push(item);
        if (item === 2) {
          throw new Error("item 2 threw");
        }
        return item;
      })
      .catch((error) => {
        reason = error.message;
      });

    await runTask();
    await runTask();
    await drain();

    assert.deepEqual(ran, [1, 2]);
    assert.equal(reason, "item 2 threw");
    assert.equal(tasks.pending(), 0);
  });

  it("resolves with no results, running nothing, for no items", async () => {
    const result = await gwoPromise.inSeries([], () => {
      throw new Error("ran");
    });

    assert.deepEqual(result, []);
    assert.equal(tasks.pending(), 0);
  });
});

describe("soon", () => {
  let clock = Date.now();
  let timers;

  // Each test starts well past the last timer turn, and spends it.
  beforeEach(() => {
    clock += 1000;
    timers = installFakeLodashTimers({ now: () => clock });
    gwoPromise.soon(() => {});
    timers.delayed.shift().fn();
  });

  afterEach(() => timers.restore());

  it("runs each fn in a message of its own, in order", () => {
    const ran = [];

    gwoPromise.soon(() => ran.push("a"));
    gwoPromise.soon(() => ran.push("b"));
    assert.deepEqual(ran, []);
    assert.equal(channel.posted.length, 2);
    assert.deepEqual(timers.delayed, []);

    channel.deliver();
    assert.deepEqual(ran, ["a"]);
    channel.deliver();
    assert.deepEqual(ran, ["a", "b"]);
  });

  it("keeps one channel, and a throw does not hold up later messages", () => {
    const ran = [];

    gwoPromise.soon(() => {
      throw new Error("boom");
    });
    gwoPromise.soon(() => ran.push("after"));

    assert.throws(channel.deliver, /boom/);
    channel.deliver();
    assert.deepEqual(ran, ["after"]);
    assert.equal(channelsMade, 1);
  });

  it("goes through a timer once 50 ms have passed since the last", () => {
    clock += 49;
    gwoPromise.soon(() => {});
    clock += 1;
    gwoPromise.soon(() => {});
    clock += 49;
    gwoPromise.soon(() => {});

    assert.equal(channel.posted.length, 2);
    assert.equal(timers.delayed.length, 1);
    timers.delayed.shift().fn();
    channel.deliver();
    channel.deliver();
  });

  it("runs calls in order, whether a message or the timer starts first", () => {
    const ran = [];

    gwoPromise.soon(() => ran.push("a"));
    clock += 50;
    gwoPromise.soon(() => ran.push("b"));
    gwoPromise.soon(() => ran.push("c"));

    assert.equal(channel.posted.length, 2);
    assert.equal(timers.delayed.length, 1);
    channel.deliver();
    assert.deepEqual(ran, ["a"]);
    timers.delayed.shift().fn();
    assert.deepEqual(ran, ["a", "b"]);
    channel.deliver();
    assert.deepEqual(ran, ["a", "b", "c"]);
  });

  it("runs the oldest call when the timer starts ahead of earlier messages", () => {
    const ran = [];

    gwoPromise.soon(() => ran.push("a"));
    clock += 50;
    gwoPromise.soon(() => ran.push("b"));

    timers.delayed.shift().fn();
    assert.deepEqual(ran, ["a"]);
    channel.deliver();
    assert.deepEqual(ran, ["a", "b"]);
  });

  it("carries a later() step in a message within a timer turn", async () => {
    const result = gwoPromise.later(() => "done");

    assert.equal(channel.posted.length, 1);
    assert.deepEqual(timers.delayed, []);
    channel.deliver();
    assert.equal(await result, "done");
  });

  it("carries each inSeries item in a message within a timer turn", async () => {
    const series = gwoPromise.inSeries([1, 2], (item) => item * 10);

    for (let item = 0; item < 2; item += 1) {
      await flush();
      assert.equal(channel.posted.length, 1);
      assert.deepEqual(timers.delayed, []);
      channel.deliver();
    }
    assert.deepEqual(await series, [10, 20]);
  });
});
