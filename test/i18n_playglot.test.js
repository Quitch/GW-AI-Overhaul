"use strict";

// scripts/i18n/playglot.js: the rows it builds and the CSV it writes. Neither
// needs the PA install or the catalog.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  buildRows,
  csvField,
  header,
  outFile,
  toCsv,
} = require("../scripts/i18n/playglot.js");

describe("buildRows", () => {
  it("takes GWO's entry, else the game's text, else nothing", () => {
    const catalog = {
      Both: { message: "Both", description: "In both." },
      Game: { message: "Game", description: "Game only." },
      None: { message: "None" },
    };
    const byLocale = {
      de: {
        gwo: { Both: { message: "GWO de" } },
        game: {
          Both: { message: "Spiel de", file: "de/a.json" },
          Game: { message: "Spiel", file: "de/a.json" },
        },
      },
      "zh-TW": { gwo: {}, game: {} },
    };

    assert.deepEqual(buildRows(catalog, ["de", "zh-TW"], byLocale), [
      [
        "Key",
        "English(en)",
        "Shared Comments",
        "German(de)",
        "Traditional Chinese(zh-TW)",
      ],
      ["Both", "Both", "In both.", "GWO de", ""],
      ["Game", "Game", "Game only.", "Spiel", ""],
      ["None", "None", "", "", ""],
    ]);
  });
});

describe("header", () => {
  it("drops the region Playglot does not use for Spanish and Polish", () => {
    assert.equal(header("es-ES"), "Spanish(es)");
    assert.equal(header("pl-PL"), "Polish(pl)");
    assert.equal(header("zh-CN"), "Simplified Chinese(zh-CN)");
  });

  it("refuses a locale with no Playglot language", () => {
    assert.throws(() => header("xx"), {
      message: "no Playglot language for xx",
    });
  });
});

describe("toCsv", () => {
  it("quotes every field and doubles quotes inside one", () => {
    assert.equal(
      csvField('Say "hi", then\nleave'),
      '"Say ""hi"", then\nleave"'
    );
    assert.equal(toCsv([["a", "b"], ["c"]]), '"a","b"\r\n"c"\r\n');
  });
});

describe("outFile", () => {
  it("resolves --out and refuses one with no path", () => {
    assert.equal(outFile(["--out", "x.csv"]), path.resolve("x.csv"));
    assert.equal(path.basename(outFile([])), "gw-ai-overhaul-playglot.csv");
    for (const argv of [["--out"], ["--out", "--pa"]]) {
      assert.throws(() => outFile(argv), {
        message: "--out takes a file path",
      });
    }
  });
});
