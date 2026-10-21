"use strict";

// gw_play/load_prefetch.js: a co-op host's Fight reads every /pa/ai_tech/ file
// into the launch's tree cache before stock restricts the client mods (issue
// #632). See coop.md, "Host-only load files".

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const loadPrefetch = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/load_prefetch.js"
);

afterEach(() => mock.restoreAll());

function fakeCache(listing, failing) {
  const cache = { listed: [], read: [] };
  cache.list = (path) => {
    cache.listed.push(path);
    return listing instanceof Error
      ? Promise.reject(listing)
      : Promise.resolve(listing.slice());
  };
  cache.getJSON = (path) => {
    cache.read.push(path);
    return (failing || []).includes(path)
      ? Promise.reject(new Error("HTTP 404 Error"))
      : Promise.resolve({ build_list: [] });
  };
  return cache;
}

describe("prime", () => {
  it("reads every JSON file under /pa/ai_tech/ through the cache", async () => {
    const cache = fakeCache([
      "/pa/ai_tech/fabber_builds/mym_card.json",
      "/pa/ai_tech/factory_builds/mym_other.json",
      "/pa/ai_tech/readme.txt",
    ]);

    await loadPrefetch.prime(cache);

    assert.deepEqual(cache.listed, ["/pa/ai_tech/"]);
    assert.deepEqual(cache.read, [
      "/pa/ai_tech/fabber_builds/mym_card.json",
      "/pa/ai_tech/factory_builds/mym_other.json",
    ]);
  });

  it("resolves when a file cannot be read, leaving it to the hire", async () => {
    const error = mock.method(console, "error", () => {});
    const cache = fakeCache(
      [
        "/pa/ai_tech/fabber_builds/broken.json",
        "/pa/ai_tech/fabber_builds/mym_card.json",
      ],
      ["/pa/ai_tech/fabber_builds/broken.json"]
    );

    await loadPrefetch.prime(cache);

    assert.equal(cache.read.length, 2);
    assert.equal(error.mock.callCount(), 0);
  });

  it("resolves and logs when the listing fails", async () => {
    const error = mock.method(console, "error", () => {});
    const cache = fakeCache(new Error("listing failed"));

    await loadPrefetch.prime(cache);

    assert.deepEqual(cache.read, []);
    assert.equal(error.mock.callCount(), 1);
    assert.match(
      error.mock.calls[0].arguments[0],
      /AI load files not read before the battle: .*listing failed/
    );
  });

  it("gives up after ten seconds so a stalled read cannot hold the launch", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const error = mock.method(console, "error", () => {});
    const cache = {
      list: () => Promise.resolve(["/pa/ai_tech/fabber_builds/slow.json"]),
      getJSON: () => new Promise(() => {}),
    };

    const primed = loadPrefetch.prime(cache);
    await Promise.resolve();
    await Promise.resolve();
    mock.timers.tick(10000);
    await primed;

    assert.equal(error.mock.callCount(), 1);
    assert.match(
      error.mock.calls[0].arguments[0],
      /AI load file read timed out after 10000ms/
    );
  });
});
