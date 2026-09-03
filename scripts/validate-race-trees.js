"use strict";

// Validates the referee's Titans race trees against a manual mount-order
// merge, one race at a time: media/pa/ai -> media/pa_ex1/ai -> GWO's own
// pa/ai -> the race's server mod(s), later layers overwriting duplicates,
// which is the order the runtime virtual filesystem mounts them. The real
// referee_ai.js runs against that merge served through the test fakes, and
// its tree must match the merge exactly (minus the unit_maps and
// neural_networks rules the engine forces). A second pass mounts every race
// at once and checks no race's tree carries another race's layer. Local-only:
// CI has neither the PA install nor the race mods. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const { ZipReader } = require("./lib/zip-read.js");
const { loadCouiModule } = require("./lib/amd-loader.js");
const { buildGame, installModel } = require("./lib/ai-path-fixtures.js");
const { installRefereeFakes, runRefereeAi } = require("./lib/referee-fakes.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const MEDIA =
  process.env.PA_MEDIA ||
  "C:/Program Files (x86)/Steam/steamapps/common/Planetary Annihilation Titans/media";
const USER_DATA =
  process.env.PA_USER_DATA ||
  path.join(
    process.env.LOCALAPPDATA || "",
    "Uber Entertainment",
    "Planetary Annihilation"
  );

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const refereeAi = loadCouiModule(MOD_ROOT + "/gw_play/referee_ai.js");

// A root serves the "ai/..." relative paths it holds. Folder roots walk the
// tree; zip roots read the archive's index.
function folderRoot(dir) {
  return {
    name: dir,
    list: () => {
      const aiDir = path.join(dir, "ai");
      if (!fs.existsSync(aiDir)) {
        return [];
      }
      const results = [];
      const visit = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
          const fullPath = path.join(current, entry.name);
          if (entry.isDirectory()) {
            visit(fullPath);
          } else {
            results.push(path.relative(dir, fullPath).replaceAll("\\", "/"));
          }
        }
      };
      visit(aiDir);
      return results;
    },
    read: (rel) => fs.readFileSync(path.join(dir, rel), "utf8"),
  };
}

function zipRoot(file) {
  const zip = new ZipReader(file);
  return {
    name: file,
    list: () =>
      zip
        .names()
        .filter((name) => name.startsWith("pa/ai/"))
        .map((name) => name.slice("pa/".length)),
    read: (rel) => zip.read("pa/" + rel).toString("utf8"),
  };
}

// The race's server mods as the runtime mounts them: the store zip under
// download/, then any local build under server_mods/ shadowing it.
function raceRoots(race) {
  const roots = [];
  for (const id of race.serverMods) {
    const zip = path.join(USER_DATA, "download", id + ".zip");
    if (fs.existsSync(zip)) {
      roots.push(zipRoot(zip));
    }
    for (const dir of [id, id + "-dev"]) {
      const folder = path.join(USER_DATA, "server_mods", dir, "pa");
      if (fs.existsSync(folder)) {
        roots.push(folderRoot(folder));
      }
    }
  }
  return roots;
}

function baseRoots() {
  return [
    folderRoot(path.join(MEDIA, "pa")),
    folderRoot(path.join(MEDIA, "pa_ex1")),
    folderRoot(path.join(REPO_ROOT, "pa")),
  ];
}

// Code-point order, what an argument-less sort gives strings: the report must
// not depend on the machine's locale.
function byCodePoint(a, b) {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

// The mount-order merge: every "ai/..." path any root holds, read from the
// last root holding it.
function mergeRoots(roots) {
  const byRel = new Map();
  for (const root of roots) {
    for (const rel of root.list()) {
      byRel.set(rel, root);
    }
  }
  return {
    rels: [...byRel.keys()].sort(byCodePoint),
    read: (rel) => JSON.parse(byRel.get(rel).read(rel)),
  };
}

// What the mount-order merge says the tree must hold: everything, minus the
// rules the engine forces on any tree (only the brain's two untagged maps
// under unit_maps/, no neural_networks/, .json only).
function expectedTree(merged, destRoot) {
  const expected = new Map();
  for (const rel of merged.rels) {
    if (!rel.endsWith(".json") || rel.includes("/neural_networks/")) {
      continue;
    }
    if (
      rel.startsWith("ai/unit_maps/") &&
      rel !== "ai/unit_maps/ai_unit_map.json" &&
      rel !== "ai/unit_maps/ai_unit_map_x1.json"
    ) {
      continue;
    }
    expected.set(destRoot + rel.slice("ai/".length), merged.read(rel));
  }
  return expected;
}

// One real referee_ai.js run: a Titans battle against the race, the merge
// served as the virtual filesystem.
async function refereeTree(race, merged, destRoot) {
  const fixture = buildGame({
    aiInUse: "Titans",
    enemyRace: race.id,
    aiMods: [],
  });
  const restoreModel = installModel(fixture.game, []);
  const fakes = installRefereeFakes({
    listFiles: () => merged.rels.map((rel) => "/pa/" + rel),
    getJSON: (url) => merged.read(url.replace(/^coui:\/\/pa\//, "")),
  });

  const filesObj = {};
  try {
    await runRefereeAi(refereeAi, filesObj);
  } finally {
    fakes.restore();
    restoreModel();
  }

  const tree = new Map();
  for (const key of Object.keys(filesObj)) {
    if (key.startsWith(destRoot)) {
      tree.set(key, filesObj[key]);
    }
  }
  return tree;
}

function compareTrees(raceId, expected, actual) {
  const problems = [];
  for (const key of expected.keys()) {
    if (!actual.has(key)) {
      problems.push("missing: " + key);
    } else if (!util.isDeepStrictEqual(actual.get(key), expected.get(key))) {
      problems.push("content differs: " + key);
    }
  }
  for (const key of actual.keys()) {
    if (!expected.has(key)) {
      problems.push("extra: " + key);
    }
  }
  if (problems.length) {
    console.error(raceId + ": tree does not match the manual merge");
    for (const problem of problems) {
      console.error("  " + problem);
    }
    return false;
  }
  console.log(
    raceId + ": " + actual.size + " files match the manual merge exactly"
  );
  return true;
}

// Every race mounted at once: another race's layer must never reach this
// race's tree, however the shared listing interleaves.
function checkSubtraction(race, othersSources, actual, destRoot) {
  const leaked = [...actual.keys()].filter((key) => {
    const sourcePath = "/pa/ai/" + key.slice(destRoot.length);
    return othersSources.some(
      (source) =>
        sourcePath.startsWith(source.dir) &&
        sourcePath.slice(source.dir.length).startsWith(source.match || "")
    );
  });
  if (leaked.length) {
    console.error(race.id + ": another race's layer leaked into the tree");
    for (const key of leaked) {
      console.error("  " + key);
    }
    return false;
  }
  console.log(
    race.id +
      ": no other race's files among " +
      actual.size +
      " with every race mounted"
  );
  return true;
}

async function main() {
  const candidates = races
    .all()
    .filter((race) => race.ai.titans && raceRoots(race).length);
  if (!candidates.length) {
    console.error("No race server mods found under " + USER_DATA);
    process.exitCode = 1;
    return;
  }

  let ok = true;

  for (const race of candidates) {
    const destRoot = races.aiRoot(race.id, "/pa/ai/");
    const merged = mergeRoots(baseRoots().concat(raceRoots(race)));
    const actual = await refereeTree(race, merged, destRoot);
    ok = compareTrees(race.id, expectedTree(merged, destRoot), actual) && ok;
  }

  const everyRaceRoots = baseRoots().concat(
    candidates.flatMap((race) => raceRoots(race))
  );
  const allMounted = mergeRoots(everyRaceRoots);
  for (const race of candidates) {
    const destRoot = races.aiRoot(race.id, "/pa/ai/");
    const actual = await refereeTree(race, allMounted, destRoot);
    const othersSources = candidates
      .filter((other) => other.id !== race.id)
      .flatMap((other) => other.ai.titans.sources || []);
    ok = checkSubtraction(race, othersSources, actual, destRoot) && ok;
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
