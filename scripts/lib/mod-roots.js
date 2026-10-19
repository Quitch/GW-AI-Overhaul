"use strict";

// The roots the two harvests and validate-race-trees.js read `pa/` files
// through: a folder, or a server mod's store zip.
// Each root serves paths relative to its `pa/` folder. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { userDataDir } = require("./pa-install.js");
const { walkFiles } = require("./walk.js");
const { ZipReader } = require("./zip-read.js");

// `list(sub)` gives every file under `sub`, as "sub/..." paths; `list("")`
// gives every file.
function folderRoot(dir) {
  return {
    name: dir,
    has: (rel) => fs.existsSync(path.join(dir, rel)),
    read: (rel) => fs.readFileSync(path.join(dir, rel), "utf8"),
    list: (sub) => {
      const subDir = path.join(dir, sub);
      if (!fs.existsSync(subDir)) {
        return [];
      }
      return walkFiles(subDir, () => true).map((file) =>
        path.relative(dir, file).replaceAll("\\", "/")
      );
    },
  };
}

function zipRoot(file) {
  const zip = new ZipReader(file);
  return {
    name: file,
    has: (rel) => zip.has("pa/" + rel),
    read: (rel) => zip.read("pa/" + rel).toString("utf8"),
    list: (sub) =>
      zip
        .names()
        .filter((name) => name.startsWith(sub ? "pa/" + sub + "/" : "pa/"))
        .map((name) => name.slice("pa/".length)),
  };
}

// Each mod's store zip under download/, tagged with its identifier. A
// server_mods/ build is never read: it can hold changes the mod has not
// released.
function modRoots(identifiers) {
  const userData = userDataDir();
  const roots = [];
  for (const id of identifiers) {
    const zip = path.join(userData, "download", id + ".zip");
    if (fs.existsSync(zip)) {
      roots.push(Object.assign(zipRoot(zip), { mod: id }));
    }
  }
  return roots;
}

module.exports = { folderRoot, modRoots, zipRoot };
