"use strict";

// shared/race_picker_options.js: the two decisions gw_start's race picker and
// the co-op loadout scene's make the same way. See races.md.

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
