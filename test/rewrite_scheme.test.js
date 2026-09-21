"use strict";

// scripts/migrate/rewrite-scheme.js. The CEF migration's remediation for a
// different real scheme is "one command" (cef-migration.md), so these pin the
// properties that promise rests on: full coverage of the four categories,
// idempotence, and docs staying untouched.
//
// The searched schemes are built by concatenation throughout: the rewriter
// rewrites test/** too, and a bare scheme literal here would be rewritten out
// from under the fixtures on a real run - the rename rehearsal caught exactly
// that.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  rewriteScheme,
  parseArgs,
} = require("../scripts/migrate/rewrite-scheme.js");

const COUI = "coui" + "://";
const SPEC = "spec" + "://";

const PAIRS = [
  { from: COUI, to: "cef://" },
  { from: SPEC, to: "sfx://" },
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
    JSON.stringify({ scenes: { start: [COUI + "ui/mods/x/menu.js"] } })
  );
  write(
    "ui/mods/x/menu.js",
    'define(["' +
      COUI +
      'ui/mods/x/dep.js"], function (dep) {\n' +
      '  var icon = "' +
      COUI +
      'ui/mods/x/img/icon.png";\n' +
      '  var map = "' +
      SPEC +
      'pa/units/unit_list.json";\n' +
      "});\n"
  );
  write(
    "ui/mods/x/menu.css",
    'a { background: url("' + COUI + 'ui/x.png"); }\n'
  );
  write("scripts/lib/scheme.js", 'const UI_SCHEME = "' + COUI + '";\n');
  write("test/menu.test.js", 'const p = "' + COUI + 'ui/mods/x/menu.js";\n');
  write("docs/cef-migration.md", "The old scheme was " + COUI + ".\n");
  write("ui/mods/x/readme.txt", COUI + " in a non-code file stays.\n");
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
    assert.equal(menu.includes(COUI), false);
    assert.equal(menu.includes(SPEC), false);
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

    assert.equal(
      fs
        .readFileSync(path.join(root, "docs/cef-migration.md"), "utf8")
        .includes(COUI),
      true
    );
    assert.equal(
      fs
        .readFileSync(path.join(root, "ui/mods/x/readme.txt"), "utf8")
        .includes(COUI),
      true
    );
  });

  it("parses --from/--to pairs", () => {
    assert.deepEqual(parseArgs(["--from", COUI, "--to", "cef://"]), [
      { from: COUI, to: "cef://" },
    ]);
  });

  it("rejects a --from without a --to", () => {
    assert.throws(() => parseArgs(["--from", COUI]), /every --from/);
  });

  it("rejects unknown flags", () => {
    assert.throws(() => parseArgs(["--form", COUI]), /expected --from/);
  });

  it("rejects a replacement containing a searched scheme", () => {
    assert.throws(
      () =>
        rewriteScheme(root, [
          { from: COUI, to: "cef://" },
          { from: SPEC, to: "rehearsal" + SPEC },
        ]),
      /second run would corrupt/
    );
  });
});
