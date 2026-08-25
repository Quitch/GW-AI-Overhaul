"use strict";

// Unit tests for live_game/win_conditions_text.js, the measured half of the
// in-battle win conditions bar.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const buildText = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/live_game/win_conditions_text.js",
);

const loc = (key) => key.replace("!LOC:", "");

const gwOptions = (overrides) =>
  Object.assign({ game_type: "Galactic War" }, overrides);

describe("gating", () => {
  it("returns nothing without options", () => {
    assert.equal(buildText(undefined, loc), "");
  });

  it("returns nothing outside Galactic War, whatever the flags say", () => {
    assert.equal(
      buildText(
        {
          game_type: "FreeForAll",
          eradication_mode: true,
          bounty_mode: true,
          sudden_death_mode: true,
        },
        loc,
      ),
      "",
    );
  });

  it("returns nothing for a Galactic War battle with no modifiers", () => {
    assert.equal(buildText(gwOptions({}), loc), "");
  });
});

describe("eradication", () => {
  it("always lists the Commander, even with every sub-flag unset", () => {
    assert.equal(
      buildText(gwOptions({ eradication_mode: true }), loc),
      "Eradicate: Commander",
    );
  });

  it("appends each rolled category in a fixed order", () => {
    assert.equal(
      buildText(
        gwOptions({
          eradication_mode: true,
          eradication_mode_sub_commanders: true,
          eradication_mode_factories: true,
          eradication_mode_fabricators: true,
        }),
        loc,
      ),
      "Eradicate: Commander, Colonel, Factory, Fabber",
    );
  });

  it("lists only the categories that are set", () => {
    assert.equal(
      buildText(
        gwOptions({
          eradication_mode: true,
          eradication_mode_fabricators: true,
        }),
        loc,
      ),
      "Eradicate: Commander, Fabber",
    );
  });

  it("ignores category flags while eradication itself is off", () => {
    assert.equal(
      buildText(gwOptions({ eradication_mode_factories: true }), loc),
      "",
    );
  });
});

describe("sudden death", () => {
  it("is reported alone", () => {
    assert.equal(
      buildText(gwOptions({ sudden_death_mode: true }), loc),
      "Sudden Death",
    );
  });

  it("replaces the eradication list, mirroring the server's priority", () => {
    assert.equal(
      buildText(
        gwOptions({
          sudden_death_mode: true,
          eradication_mode: true,
          eradication_mode_factories: true,
        }),
        loc,
      ),
      "Sudden Death",
    );
  });
});

describe("bounties", () => {
  it("includes the multiplier when the value is numeric", () => {
    assert.equal(
      buildText(gwOptions({ bounty_mode: true, bounty_value: 0.5 }), loc),
      "Bounties x0.5",
    );
  });

  it("omits the multiplier when no value is present", () => {
    assert.equal(buildText(gwOptions({ bounty_mode: true }), loc), "Bounties");
  });
});

describe("composition", () => {
  it("joins eradication and bounties with a pipe", () => {
    assert.equal(
      buildText(
        gwOptions({
          eradication_mode: true,
          eradication_mode_factories: true,
          bounty_mode: true,
          bounty_value: 0.3,
        }),
        loc,
      ),
      "Eradicate: Commander, Factory | Bounties x0.3",
    );
  });

  it("joins sudden death and bounties with a pipe", () => {
    assert.equal(
      buildText(gwOptions({ sudden_death_mode: true, bounty_mode: true }), loc),
      "Sudden Death | Bounties",
    );
  });
});
