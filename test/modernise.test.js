"use strict";

// scripts/migrate/modernise.js. Pins the ES5 boundary the pass honours (the
// shadowed stock files under ui/main/game/galactic_war/gw_play/ and shared/
// stay untouched, everything else is mod-side) and the scene-scope rule that
// top-level declarations come back as var. See cef-migration.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  modernise,
  isEs5Side,
  run,
} = require("../scripts/migrate/modernise.js");

const STOCK = "ui/main/game/galactic_war/shared/js/gw_x.js";
const CARD = "ui/main/game/galactic_war/cards/gwc_x.js";
const MOD = "ui/mods/x/mod.js";

const FUNCTION_SCOPE =
  "define(function () {\n" +
  "  var f = function (x) {\n" +
  "    var y = x + 1;\n" +
  "    return y;\n" +
  "  };\n" +
  "  return { f: f };\n" +
  "});\n";

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-modernise-"));
  const write = (rel, content) => {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };
  write(STOCK, FUNCTION_SCOPE);
  write(CARD, FUNCTION_SCOPE);
  write(MOD, "var top = 1;\n" + FUNCTION_SCOPE);
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("modernise", () => {
  it("keeps the shadowed stock trees on the ES5 side", () => {
    assert.equal(isEs5Side(STOCK), true);
    assert.equal(
      isEs5Side(
        "ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js"
      ),
      true
    );
    assert.equal(isEs5Side(CARD), false);
    assert.equal(
      isEs5Side("ui/main/game/galactic_war/cards/gwaio_x.js"),
      false
    );
    assert.equal(isEs5Side(MOD), false);
    assert.equal(isEs5Side(path.join("ui", "mods", "x", "mod.js")), false);
  });

  it("rewrites function-scope code and leaves the ES5 side alone", () => {
    assert.equal(run(root), 2);

    assert.equal(read(STOCK), FUNCTION_SCOPE);

    const card = read(CARD);
    assert.match(card, /const f = x => \{/);
    assert.match(card, /const y = x \+ 1;/);
    assert.match(card, /return \{ f \};/);
    assert.equal(card.includes("function"), false);
  });

  it("restores top-level declarations to var for the shared scene scope", () => {
    run(root);

    const mod = read(MOD);
    assert.match(mod, /^var top = 1;/);
    assert.match(mod, /const f = x => \{/);
  });

  it("drops the arguments-in-arrow warning and keeps the rest", () => {
    const { code, warnings } = modernise(
      "define(function () {\n" +
        "  var f = function () {\n" +
        "    return arguments.length;\n" +
        "  };\n" +
        "  return { f: f };\n" +
        "});\n"
    );
    assert.equal(warnings.length, 0);
    assert.match(code, /const f = function \(\) \{/);
  });

  it("is idempotent", () => {
    run(root);
    const first = read(CARD);
    assert.equal(run(root), 0);
    assert.equal(read(CARD), first);
  });
});
