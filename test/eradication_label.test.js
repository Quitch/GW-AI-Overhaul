"use strict";

// shared/eradication_label.js: the eradication modifier as the intelligence
// panel and the battle's win-conditions line both show it.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const eradicationLabel = loadCouiModule(
  MOD_ROOT + "/shared/eradication_label.js"
);

const stubs = createGlobalStubs();

beforeEach(() => stubs.setGlobal("loc", (key) => key.replace("!LOC:", "")));
afterEach(() => stubs.restoreGlobals());

describe("eradicationLabel", () => {
  it("names the commander alone when no other target is set", () => {
    assert.equal(eradicationLabel({}), "Eradicate: Commander");
  });

  it("lists every target, the commander first, in a fixed order", () => {
    assert.equal(
      eradicationLabel({ fabbers: true, factories: true, subCommanders: true }),
      "Eradicate: Commander, Colonel, Factory, Fabber"
    );
  });

  it("lists only the targets that are set", () => {
    assert.equal(
      eradicationLabel({ subCommanders: true, fabbers: true }),
      "Eradicate: Commander, Colonel, Fabber"
    );
  });

  it("translates each word, and adds the punctuation itself", () => {
    stubs.setGlobal("loc", (key) => "<" + key.replace("!LOC:", "") + ">");

    assert.equal(
      eradicationLabel({ subCommanders: true, factories: true, fabbers: true }),
      "<Eradicate>: <Commander>, <Colonel>, <Factory>, <Fabber>"
    );
  });
});
