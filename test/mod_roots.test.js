"use strict";

// scripts/lib/mod-roots.js: a server mod is read from its download/ zip, and
// never from a server_mods/ build, which can hold unreleased changes.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { modRoots } = require("../scripts/lib/mod-roots.js");
const { writeZip } = require("../scripts/lib/zip-write.js");

const MOD = "com.example.fixture-server";
const SPEC = "units/land/fx_tank/fx_tank.json";

describe("modRoots", () => {
  let dir;
  let saved;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-mod-roots-"));
    saved = process.env.PA_USER_DATA;
    process.env.PA_USER_DATA = dir;
    writeZip(path.join(dir, "download", MOD + ".zip"), {
      ["pa/" + SPEC]: '{"from":"zip"}',
    });
    for (const folder of [MOD, MOD + "-dev"]) {
      const file = path.join(dir, "server_mods", folder, "pa", SPEC);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ from: folder }));
    }
    const devOnly = path.join(dir, "server_mods", "com.example.dev-only", "pa");
    fs.mkdirSync(path.join(devOnly, "units"), { recursive: true });
    fs.writeFileSync(path.join(devOnly, "units", "unit_list.json"), "{}");
  });

  after(() => {
    if (saved === undefined) {
      delete process.env.PA_USER_DATA;
    } else {
      process.env.PA_USER_DATA = saved;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("reads the zip alone when server_mods/ builds sit beside it", () => {
    const roots = modRoots([MOD]);

    assert.equal(roots.length, 1);
    assert.equal(roots[0].mod, MOD);
    assert.equal(roots[0].read(SPEC), '{"from":"zip"}');
  });

  it("finds nothing for a mod that has only a server_mods/ build", () => {
    assert.deepEqual(modRoots(["com.example.dev-only"]), []);
  });
});
