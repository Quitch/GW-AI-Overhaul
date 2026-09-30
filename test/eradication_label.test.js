"use strict";

// shared/eradication_label.js: the eradication modifier as the intelligence
// panel and the battle's win-conditions line both show it.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");

const eradicationLabel = loadCouiModule(
  MOD_ROOT + "/shared/eradication_label.js"
);

const loc = (key) => key.replace("!LOC:", "");

describe("eradicationLabel", () => {
  it("names the commander alone when no other target is set", () => {
    assert.equal(eradicationLabel({}, loc), "Eradicate: Commander");
  });

  it("lists every target, the commander first, in a fixed order", () => {
    assert.equal(
      eradicationLabel(
        { fabbers: true, factories: true, subCommanders: true },
        loc
      ),
      "Eradicate: Commander, Colonel, Factory, Fabber"
    );
  });

  it("lists only the targets that are set", () => {
    assert.equal(
      eradicationLabel({ subCommanders: true, fabbers: true }, loc),
      "Eradicate: Commander, Colonel, Fabber"
    );
  });

  it("translates each word, and adds the punctuation itself", () => {
    const marked = (key) => "<" + key.replace("!LOC:", "") + ">";

    assert.equal(
      eradicationLabel(
        { subCommanders: true, factories: true, fabbers: true },
        marked
      ),
      "<Eradicate>: <Commander>, <Colonel>, <Factory>, <Fabber>"
    );
  });
});
