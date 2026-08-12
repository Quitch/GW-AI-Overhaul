"use strict";

// shared/gwo_url.js. Pins the scheme adapter the CEF migration leans on: the
// helpers must produce today's literal URL forms exactly, and the shipped
// constant must match the Node-side one the test harness resolves with, since
// neither can import the other. See cef-migration.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { UI_SCHEME } = require("../scripts/lib/scheme.js");

const gwoUrl = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js"
);

describe("gwo_url", () => {
  it("matches the Node-side scheme constant", () => {
    assert.equal(gwoUrl.uiScheme, UI_SCHEME);
  });

  it("builds a ui URL from a scheme-relative path", () => {
    assert.equal(
      gwoUrl.ui("ui/main/game/galactic_war/gw_play/gw_play.html"),
      "coui://ui/main/game/galactic_war/gw_play/gw_play.html"
    );
  });

  it("builds a game-file URL from an absolute game-data path", () => {
    assert.equal(
      gwoUrl.gameFile("/pa/ai/unit_maps/ai_unit_map.json"),
      "coui://pa/ai/unit_maps/ai_unit_map.json"
    );
  });
});
