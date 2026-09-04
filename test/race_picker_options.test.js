"use strict";

// shared/race_picker_options.js: the decisions gw_start's race picker and the
// co-op loadout scene's make the same way. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const pickerOptions = loadCouiModule(
  MOD_ROOT + "/shared/race_picker_options.js"
);

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
});

afterEach(() => {
  races.reset();
});

describe("optionsHtml", () => {
  // The test loader's loc is a passthrough, so the !LOC: prefix survives here
  // where the engine would strip it - see testing.md.
  it("writes one option per race, valued by id and labelled by name", () => {
    assert.equal(
      pickerOptions.optionsHtml(races.all()),
      '<option value="mla">!LOC:MLA</option>' +
        '<option value="fixture">!LOC:Fixture</option>'
    );
  });

  it("is empty for an empty list", () => {
    assert.equal(pickerOptions.optionsHtml([]), "");
  });

  it("escapes a race name rather than letting it write markup", () => {
    assert.equal(
      pickerOptions.optionsHtml([{ id: "x", name: "<b>x</b>" }]),
      '<option value="x">&lt;b&gt;x&lt;/b&gt;</option>'
    );
  });
});

describe("commanderChoices", () => {
  const stock = ["/pa/units/commanders/stock/stock.json"];

  it("gives a race its own commanders", () => {
    assert.deepEqual(
      pickerOptions.commanderChoices(
        races.byId("fixture"),
        stock,
        races.MLA_ID
      ),
      [
        "/pa/units/commanders/fx_alpha/fx_alpha.json",
        "/pa/units/commanders/fx_beta/fx_beta.json",
      ]
    );
  });

  it("leaves MLA on the scene's own list", () => {
    assert.deepEqual(
      pickerOptions.commanderChoices(races.byId("mla"), stock, races.MLA_ID),
      stock
    );
  });

  it("falls back to the stock list for an unknown race or one with no commanders", () => {
    assert.deepEqual(
      pickerOptions.commanderChoices(undefined, stock, races.MLA_ID),
      stock
    );
    assert.deepEqual(
      pickerOptions.commanderChoices(
        { id: "empty", commanders: [] },
        stock,
        races.MLA_ID
      ),
      stock
    );
  });
});

describe("commanderTint", () => {
  // The art ships in MLA's blue (hue 210); the filter rotates from there to
  // the faction's hue.
  it("rotates the art's hue to the faction's", () => {
    assert.equal(
      pickerOptions.commanderTint([255, 0, 0], 210),
      "hue-rotate(-210deg)"
    );
    assert.equal(
      pickerOptions.commanderTint([0, 176, 255], 210),
      "hue-rotate(-11deg)"
    );
  });

  it("rotates from a race's own art hue", () => {
    assert.equal(
      pickerOptions.commanderTint([0, 176, 255], 0),
      "hue-rotate(199deg)"
    );
  });

  it("drains the colour for an achromatic faction, which has no hue", () => {
    assert.equal(
      pickerOptions.commanderTint([128, 128, 128], 210),
      "grayscale(1)"
    );
  });

  it("applies no filter when the war has no colour", () => {
    assert.equal(pickerOptions.commanderTint(undefined, 210), "");
    assert.equal(pickerOptions.commanderTint([1, 2], 210), "");
  });
});
