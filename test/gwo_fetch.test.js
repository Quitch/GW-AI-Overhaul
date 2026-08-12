"use strict";

// shared/gwo_fetch.js. Pins the choke-point contract the stage-3 conversions
// rely on: a non-ok status becomes a rejection naming status and URL, rather
// than a resolved response the caller has to remember to check.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const gwoFetch = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_fetch.js",
);

const stubs = createGlobalStubs();
afterEach(() => stubs.restoreGlobals());

function stubFetch(response) {
  stubs.setGlobal("fetch", () => Promise.resolve(response));
}

describe("gwo_fetch", () => {
  it("parses JSON from an ok response", async () => {
    stubFetch({ ok: true, json: () => Promise.resolve({ a: 1 }) });
    assert.deepEqual(await gwoFetch.json("coui://pa/x.json"), { a: 1 });
  });

  it("returns text from an ok response", async () => {
    stubFetch({ ok: true, text: () => Promise.resolve("body") });
    assert.equal(await gwoFetch.text("coui://ui/x.html"), "body");
  });

  it("rejects a non-ok response with status and url", async () => {
    // One string for request and assertion, so a scheme rewrite of test/**
    // moves both together.
    const url = "coui://pa/missing.json";
    stubFetch({ ok: false, status: 404 });
    await assert.rejects(
      gwoFetch.json(url),
      (err) => err.message.includes("404") && err.message.includes(url),
    );
  });
});
