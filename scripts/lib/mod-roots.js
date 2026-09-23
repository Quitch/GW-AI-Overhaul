"use strict";

// The roots the local-only scripts read `pa/` files through: a folder, a mod's
// store zip, or a race mod's every copy on disk. Each root serves paths
// relative to its `pa/` folder. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { userDataDir } = require("./pa-install.js");
const { walkFiles } = require("./walk.js");
const { ZipReader } = require("./zip-read.js");

// `list(sub)` gives every file under `sub`, as "sub/..." paths.
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
        .filter((name) => name.startsWith("pa/" + sub + "/"))
        .map((name) => name.slice("pa/".length)),
  };
}

// Each mod's roots as the runtime mounts them, tagged with its identifier: the
// store zip under download/, then any local build under server_mods/
// shadowing it. A later root shadows an earlier one.
function modRoots(identifiers) {
  const userData = userDataDir();
  const roots = [];
  for (const id of identifiers) {
    const zip = path.join(userData, "download", id + ".zip");
    if (fs.existsSync(zip)) {
      roots.push(Object.assign(zipRoot(zip), { mod: id }));
    }
    for (const dir of [id, id + "-dev"]) {
      const folder = path.join(userData, "server_mods", dir, "pa");
      if (fs.existsSync(folder)) {
        roots.push(Object.assign(folderRoot(folder), { mod: id }));
      }
    }
  }
  return roots;
}

// Code-point order, what an argument-less sort gives strings: committed output
// must not churn with the machine's locale.
function byCodePoint(a, b) {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

module.exports = { byCodePoint, folderRoot, modRoots, zipRoot };
