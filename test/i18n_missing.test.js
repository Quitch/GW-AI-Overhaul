"use strict";

// scripts/i18n/missing.js: its command line, and the work lists it writes.
// Neither needs the PA install or the catalog.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseArgs, writeChunks } = require("../scripts/i18n/missing.js");

describe("parseArgs", () => {
  it("reads --all as --out that writes every key", () => {
    assert.deepEqual(parseArgs(["--all"]), {
      out: true,
      all: true,
      report: false,
      chunk: 100,
    });
    assert.deepEqual(parseArgs(["--out", "--chunk", "25"]), {
      out: true,
      all: false,
      report: false,
      chunk: 25,
    });
  });

  it("refuses a --chunk that is not a whole number above 0", () => {
    for (const value of ["0", "-5", "2.5", "many", "--all"]) {
      assert.throws(() => parseArgs(["--out", "--chunk", value]), {
        message: "--chunk takes a whole number above 0, not " + value,
      });
    }
  });
});

describe("writeChunks", () => {
  it("replaces the locale's earlier work lists and leaves the rest", (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-i18n-out-"));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    for (const name of [
      "missing.de.3.json",
      "missing.de-AT.1.json",
      "missing.fr.1.json",
      "glossary.de.md",
      "de.json",
    ]) {
      fs.writeFileSync(path.join(dir, name), "{}\n");
    }

    const entries = { A: { message: "" }, B: { message: "" } };
    assert.equal(writeChunks(dir, "de", entries, 1), 2);

    assert.deepEqual(fs.readdirSync(dir).sort(), [
      "de.json",
      "glossary.de.md",
      "missing.de-AT.1.json",
      "missing.de.1.json",
      "missing.de.2.json",
      "missing.fr.1.json",
    ]);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(dir, "missing.de.2.json"), "utf8")),
      { B: { message: "" } }
    );
  });
});
