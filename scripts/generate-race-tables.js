"use strict";

// Rewrites the units and unitNames tables of every race/ and addon/ file from
// test/fixtures/race_specs.json and scripts/lib/race-table-inputs.js.
// `--check` writes nothing and exits 1 when a file would change. See
// races.md, "Unit tables".

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT, generateAll } = require("./lib/race-tables.js");
const fixture = require("../test/fixtures/race_specs.json");

const read = (file) => fs.readFileSync(path.join(REPO_ROOT, file), "utf8");

async function main() {
  const check = process.argv.includes("--check");
  const files = await generateAll(fixture, read);
  const changed = Object.keys(files).filter(
    (file) => files[file] !== read(file)
  );
  if (!check) {
    for (const file of changed) {
      fs.writeFileSync(path.join(REPO_ROOT, file), files[file]);
    }
  }
  console.log(
    "generate-race-tables: " +
      Object.keys(files).length +
      " files, " +
      changed.length +
      (check ? " would change" : " written") +
      (changed.length ? ": " + changed.join(", ") : "")
  );
  if (check && changed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
