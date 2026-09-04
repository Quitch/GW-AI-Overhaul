"use strict";

// shared/biome_check.js: whether a saved war can still load its map packs. A
// missing one blocks; a version change is only said out loud; an unreadable
// mod list decides nothing. See galaxy.md, "Biome mods in a GW battle".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const biomeCheck = loadCouiModule(MOD_ROOT + "/shared/biome_check.js");

const ALIEN_ID = "com.pa.alienworlds.server";

const alien = (overrides) =>
  Object.assign(
    {
      identifier: ALIEN_ID,
      displayName: "Alien Worlds",
      version: "2.0.0",
      served: "gwsm",
    },
    overrides
  );

const needed = () => [
  { identifier: ALIEN_ID, displayName: "Alien Worlds", version: "2.0.0" },
];

const installed = (overrides) =>
  Object.assign(
    {
      mods: [
        { identifier: ALIEN_ID, displayName: "Alien Worlds", version: "2.0.0" },
      ],
      known: true,
      gwsm: true,
    },
    overrides
  );

describe("warBiomeMods", () => {
  it("gathers each GW Server Mods-served stamp once across the stars", () => {
    const found = biomeCheck.warBiomeMods(undefined, [
      { gwoBiomeMods: [alien(), { identifier: "uk.pa.tetctree.server" }] },
      undefined,
      {},
      { gwoBiomeMods: [alien({ identifier: "COM.pa.alienworlds.server" })] },
    ]);

    assert.deepEqual(found, needed());
  });

  it("adds a recorded mod no stamp names, after the stamped ones", () => {
    const found = biomeCheck.warBiomeMods(
      [
        { identifier: ALIEN_ID, displayName: "Alien Worlds", version: "2.0.0" },
        { identifier: "com.example.other", displayName: "Other", version: "1" },
      ],
      [{ gwoBiomeMods: [alien({ version: "2.1.0" })] }]
    );

    assert.deepEqual(found, [
      { identifier: ALIEN_ID, displayName: "Alien Worlds", version: "2.1.0" },
      { identifier: "com.example.other", displayName: "Other", version: "1" },
    ]);
  });

  it("passes over cooked stamps, legacy stamps and empty input", () => {
    assert.deepEqual(
      biomeCheck.warBiomeMods(
        [],
        [
          { gwoBiomeMods: [{ identifier: "a", served: "cook" }] },
          { gwoBiomeMods: [{ identifier: "b" }] },
        ]
      ),
      []
    );
    assert.deepEqual(biomeCheck.warBiomeMods(undefined, undefined), []);
  });

  it("names a recorded mod with no display name by its identifier", () => {
    assert.deepEqual(biomeCheck.warBiomeMods([{ identifier: "A.B" }], []), [
      { identifier: "a.b", displayName: "a.b", version: undefined },
    ]);
  });
});

describe("evaluate", () => {
  it("passes a war whose map pack is still active", () => {
    assert.deepEqual(biomeCheck.evaluate(needed(), installed()), {
      blocked: [],
      warnings: [],
    });
  });

  it("decides nothing for a war that needs no map pack", () => {
    assert.deepEqual(biomeCheck.evaluate([], installed({ gwsm: false })), {
      blocked: [],
      warnings: [],
    });
    assert.deepEqual(biomeCheck.evaluate(undefined, undefined), {
      blocked: [],
      warnings: [],
    });
  });

  it("blames GW Server Mods once when it is the piece that is gone", () => {
    const two = needed().concat([
      { identifier: "com.example.other", displayName: "Other", version: "1" },
    ]);
    const result = biomeCheck.evaluate(
      two,
      installed({ mods: [], gwsm: false })
    );

    assert.deepEqual(result, {
      blocked: [{ reason: "gwServerMods" }],
      warnings: [],
    });
  });

  it("decides nothing when the mod list cannot be read", () => {
    assert.deepEqual(
      biomeCheck.evaluate(needed(), installed({ known: false, mods: [] })),
      { blocked: [], warnings: [] }
    );
    assert.deepEqual(biomeCheck.evaluate(needed(), undefined), {
      blocked: [],
      warnings: [],
    });
  });

  it("blocks a map pack that is no longer active, by display name", () => {
    const result = biomeCheck.evaluate(needed(), installed({ mods: [] }));

    assert.deepEqual(result, {
      blocked: [
        { reason: "serverMod", identifier: ALIEN_ID, name: "Alien Worlds" },
      ],
      warnings: [],
    });
  });

  it("matches the active list across identifier case", () => {
    const result = biomeCheck.evaluate(
      needed(),
      installed({
        mods: [{ identifier: "COM.pa.alienworlds.server", version: "2.0.0" }],
      })
    );

    assert.deepEqual(result, { blocked: [], warnings: [] });
  });

  it("warns about a version change without blocking", () => {
    const result = biomeCheck.evaluate(
      needed(),
      installed({
        mods: [
          {
            identifier: ALIEN_ID,
            displayName: "Alien Worlds",
            version: "2.1.0",
          },
        ],
      })
    );

    assert.deepEqual(result, {
      blocked: [],
      warnings: [
        {
          reason: "version",
          identifier: ALIEN_ID,
          name: "Alien Worlds",
          from: "2.0.0",
          to: "2.1.0",
        },
      ],
    });
  });

  it("names each missing map pack when GW Server Mods is there", () => {
    const two = needed().concat([
      { identifier: "com.example.other", displayName: "Other", version: "1" },
    ]);
    const result = biomeCheck.evaluate(two, installed({ mods: [] }));

    assert.deepEqual(_.pluck(result.blocked, "name"), [
      "Alien Worlds",
      "Other",
    ]);
  });
});
