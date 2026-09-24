"use strict";

// shared/ is loaded by several scenes, so a module there that requires a scene
// folder's module drags that scene's code into every other scene. A module that
// both need lives in shared/. See architecture.md, "How files reach each other".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  MOD_ROOT,
  REPO_ROOT,
  couiToFsPath,
} = require("../scripts/lib/amd-loader.js");

const MOD_DIR = couiToFsPath(MOD_ROOT);
const SHARED_DIR = path.join(MOD_DIR, "shared");

const modinfo = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "modinfo.json"), "utf8")
);
const sceneFolders = Object.keys(modinfo.scenes).filter((scene) =>
  fs.existsSync(path.join(MOD_DIR, scene))
);

const sharedModules = fs
  .readdirSync(SHARED_DIR, { recursive: true })
  .filter((file) => file.endsWith(".js"));

const sceneModuleUrl = new RegExp(
  MOD_ROOT.replaceAll(".", "\\.") +
    "/(" +
    sceneFolders.join("|") +
    ")/[^\"']+\\.js",
  "g"
);

describe("shared/ requires no scene folder's module", () => {
  it("finds the scene folders and the shared modules", () => {
    assert.ok(sceneFolders.includes("gw_start"));
    assert.ok(sceneFolders.includes("gw_play"));
    assert.ok(sharedModules.includes("ai.js"));
  });

  for (const file of sharedModules) {
    it(`shared/${file}`, () => {
      const source = fs.readFileSync(path.join(SHARED_DIR, file), "utf8");
      assert.deepEqual(source.match(sceneModuleUrl) || [], []);
    });
  }
});
