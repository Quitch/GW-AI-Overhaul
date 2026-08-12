"use strict";

// scripts/migrate/rewrite-scheme.js. The CEF migration's remediation for a
// different real scheme is "one command" (cef-migration.md), so these pin the
// properties that promise rests on: full coverage of the four categories,
// idempotence, and docs staying untouched.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  rewriteScheme,
  parseArgs,
} = require("../scripts/migrate/rewrite-scheme.js");

const PAIRS = [
  { from: "coui://", to: "cef://" },
  { from: "spec://", to: "sfx://" },
];

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-rewrite-"));
  const write = (rel, content) => {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };

  write(
    "modinfo.json",
    JSON.stringify({ scenes: { start: ["coui://ui/mods/x/menu.js"] } })
  );
  write(
    "ui/mods/x/menu.js",
    'define(["coui://ui/mods/x/dep.js"], function (dep) {\n' +
      '  var icon = "coui://ui/mods/x/img/icon.png";\n' +
      '  var map = "spec://pa/units/unit_list.json";\n' +
      "});\n"
  );
  write("ui/mods/x/menu.css", 'a { background: url("coui://ui/x.png"); }\n');
  write("scripts/lib/scheme.js", 'const UI_SCHEME = "coui://";\n');
  write("test/menu.test.js", 'const p = "coui://ui/mods/x/menu.js";\n');
  write("docs/cef-migration.md", "The old scheme was coui://.\n");
  write("ui/mods/x/readme.txt", "coui:// in a non-code file stays.\n");
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("rewrite-scheme", () => {
  it("rewrites every category and reports counts", () => {
    const counts = rewriteScheme(root, PAIRS);

    assert.deepEqual(counts, {
      "modinfo.json": { files: 1, occurrences: 1 },
      ui: { files: 2, occurrences: 4 },
      scripts: { files: 1, occurrences: 1 },
      test: { files: 1, occurrences: 1 },
    });

    const menu = fs.readFileSync(path.join(root, "ui/mods/x/menu.js"), "utf8");
    assert.match(menu, /cef:\/\/ui\/mods\/x\/dep\.js/);
    assert.match(menu, /sfx:\/\/pa\/units\/unit_list\.json/);
    assert.doesNotMatch(menu, /coui:/);
    assert.doesNotMatch(menu, /spec:\/\//);
  });

  it("is idempotent", () => {
    rewriteScheme(root, PAIRS);
    const second = rewriteScheme(root, PAIRS);

    for (const count of Object.values(second)) {
      assert.deepEqual(count, { files: 0, occurrences: 0 });
    }
  });

  it("leaves docs and non-code files untouched", () => {
    rewriteScheme(root, PAIRS);

    assert.match(
      fs.readFileSync(path.join(root, "docs/cef-migration.md"), "utf8"),
      /coui:\/\//
    );
    assert.match(
      fs.readFileSync(path.join(root, "ui/mods/x/readme.txt"), "utf8"),
      /coui:\/\//
    );
  });

  it("parses --from/--to pairs", () => {
    assert.deepEqual(parseArgs(["--from", "coui://", "--to", "cef://"]), [
      { from: "coui://", to: "cef://" },
    ]);
  });

  it("rejects a --from without a --to", () => {
    assert.throws(() => parseArgs(["--from", "coui://"]), /every --from/);
  });

  it("rejects unknown flags", () => {
    assert.throws(() => parseArgs(["--form", "coui://"]), /expected --from/);
  });

  it("rejects a replacement containing a searched scheme", () => {
    assert.throws(
      () =>
        rewriteScheme(root, [
          { from: "coui://", to: "cef://" },
          { from: "spec://", to: "rehearsalspec://" },
        ]),
      /second run would corrupt/
    );
  });
});
