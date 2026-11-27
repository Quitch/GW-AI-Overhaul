"use strict";

// GWO #709: Bluehawk Upgrade Tech pushes two launchers onto the Bluehawk's
// two stock tools and must tag both. It tagged tools.3 and tools.4, which
// left the first pushed launcher on the stock file. See specs.md, "Writing a
// spec reference".

const { describe, it, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { loadAllCards } = require("../scripts/lib/card-probe.js");
const {
  createCapturingInventory,
  recordInto,
} = require("../scripts/lib/capturing-inventory.js");

const cards = loadAllCards().byFile;
const specs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/specs.js"
);
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);

const TAG = ".player";
const DIR = "/pa/units/land/bot_tactical_missile/";

afterEach(() => {
  mock.restoreAll();
});

// The stock Bluehawk's tools as genUnitSpecs leaves them: two, both tagged.
function stockSpecs() {
  return {
    [gwoUnit.bluehawk + TAG]: {
      tools: [
        { spec_id: DIR + "bot_tactical_missile_tool_weapon.json" + TAG },
        { spec_id: DIR + "bot_tactical_missile_tool_orbital.json" + TAG },
      ],
    },
  };
}

function cookedTools() {
  const mods = [];
  cards
    .get("gwaio_upgrade_bluehawk.js")
    .buff(createCapturingInventory({ capture: { addMods: recordInto(mods) } }));
  const data = stockSpecs();
  specs.mod(data, mods, TAG);
  return data[gwoUnit.bluehawk + TAG].tools;
}

describe("Bluehawk Upgrade Tech", () => {
  it("tags both launchers it pushes", () => {
    const tools = cookedTools();
    assert.equal(tools.length, 4);
    for (const tool of tools) {
      assert.ok(tool.spec_id.endsWith(".json" + TAG), tool.spec_id);
    }
  });

  it("tags no index the unit lacks", () => {
    const warn = mock.method(console, "warn", () => {});
    cookedTools();
    assert.equal(warn.mock.callCount(), 0);
  });
});
