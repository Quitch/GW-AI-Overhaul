"use strict";

// Writes test/fixtures/unit_types.json: every unit the merged unit list names
// with its effective unit_types and buildable_types (base_spec chain
// resolved), from the PA install (pa_ex1 over pa) and the race and add-on
// server mods' zips under download/, later roots shadowing earlier ones as
// the runtime virtual filesystem does. `stock` holds the same from the PA
// install alone. CI has none of it, so the fixture is committed - re-run
// after a PA, race or add-on patch.
// See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { mediaDir } = require("./lib/pa-install.js");
const { folderRoot, modRoots } = require("./lib/mod-roots.js");
const { shippedServerMods } = require("./lib/server-mods.js");
const { harvestUnitTypes } = require("./lib/unit-types-harvest.js");
const { writeText } = require("./lib/write-text.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT =
  process.env.GWO_HARVEST_OUT ||
  path.join(REPO_ROOT, "test", "fixtures", "unit_types.json");

const MEDIA = mediaDir();

function main() {
  if (!fs.existsSync(path.join(MEDIA, "pa"))) {
    console.error("harvest-unit-types: no PA install at " + MEDIA);
    process.exit(1);
  }
  const stockRoots = [
    folderRoot(path.join(MEDIA, "pa")),
    folderRoot(path.join(MEDIA, "pa_ex1")),
  ];
  const serverModRoots = modRoots(shippedServerMods());
  const { fixture, shadows, missing } = harvestUnitTypes(
    stockRoots,
    serverModRoots
  );
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeText(OUT, JSON.stringify(fixture, null, 2) + "\n");
  console.log(
    "harvest-unit-types: " +
      Object.keys(fixture.units).length +
      " units from " +
      (stockRoots.length + serverModRoots.length) +
      " roots written to " +
      path.relative(REPO_ROOT, OUT) +
      (missing ? " (" + missing + " listed units have no spec)" : "")
  );
  for (const { unit, field } of shadows) {
    console.log("  a mod changes the stock " + field + " of " + unit);
  }
}

main();
