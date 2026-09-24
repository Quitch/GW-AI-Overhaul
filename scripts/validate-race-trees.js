"use strict";

// Validates the referee's race trees against a mount-order merge of the real
// files on disk. Local-only: CI has neither the PA install nor the mods. What
// each pass checks: testing.md, "The validators".

const path = require("node:path");
const util = require("node:util");
const { mediaDir, userDataDir } = require("./lib/pa-install.js");
const { byCodePoint, folderRoot, modRoots } = require("./lib/mod-roots.js");
const { MOD_ROOT, loadCouiModule } = require("./lib/amd-loader.js");
const { buildGame, installModel } = require("./lib/ai-path-fixtures.js");
const { installRefereeFakes, runRefereeAi } = require("./lib/referee-fakes.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const MEDIA = mediaDir();

const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
// Node has no GW Server Mods to activate add-ons, so every registered one
// counts here, as descriptorLayers() counts them.
races.activateAddons(races.addons().map((addon) => addon.id));
const refereeAi = loadCouiModule(MOD_ROOT + "/gw_play/referee_ai.js");

const MLA = races.MLA_ID;
const GUARDIANS_ROOT = "/pa/ai/player_guardians/";

function baseRoots() {
  return [
    folderRoot(path.join(MEDIA, "pa")),
    folderRoot(path.join(MEDIA, "pa_ex1")),
    folderRoot(path.join(REPO_ROOT, "pa")),
  ];
}

// The mount-order merge: every "ai/..." path any root holds, read from the
// last root holding it.
function mergeRoots(roots) {
  const byRel = new Map();
  for (const root of roots) {
    for (const rel of root.list("ai")) {
      byRel.set(rel, root);
    }
  }
  return {
    rels: [...byRel.keys()].sort(byCodePoint),
    read: (rel) => JSON.parse(byRel.get(rel).read(rel)),
  };
}

// The Titans layers the descriptors declare, by race id: each race's own
// `ai.titans` plus every add-on's `layers[raceId].titans`, MLA's included.
// Built here from the descriptors with this file's own prefix test, apart
// from races.layersFor, so the referee's arithmetic is checked rather than
// reused.
function descriptorLayers() {
  const layers = {};
  const add = (raceId, config) => {
    const id = races.normalizeId(raceId);
    const layer = layers[id] || { unitMaps: [], sources: [] };
    layers[id] = {
      unitMaps: layer.unitMaps.concat((config && config.unitMaps) || []),
      sources: layer.sources.concat((config && config.sources) || []),
    };
  };
  for (const race of races.all()) {
    add(race.id, race.ai.titans);
  }
  for (const addon of races.addons()) {
    for (const [raceId, brains] of Object.entries(addon.layers)) {
      add(raceId, brains && brains.titans);
    }
  }
  return layers;
}

function claimedBy(rel, layer) {
  const sourcePath = "/pa/" + rel;
  return (
    layer.unitMaps.includes(sourcePath) ||
    layer.sources.some(
      (source) =>
        sourcePath.startsWith(source.dir) &&
        sourcePath.slice(source.dir.length).startsWith(source.match || "")
    )
  );
}

// Whether a layer other than `ownId`'s claims the file and `ownId`'s does
// not - what every tree subtracts.
function claimedByOthers(rel, layers, ownId) {
  const own = layers[ownId];
  if (own && claimedBy(rel, own)) {
    return false;
  }
  return Object.entries(layers).some(
    ([id, layer]) => id !== ownId && claimedBy(rel, layer)
  );
}

// What the mount-order merge says a race tree must hold: everything the
// engine allows (only the brain's two untagged maps under unit_maps/, no
// neural_networks/, .json only) minus what other layers claim.
function expectedRaceTree(merged, destRoot, layers, raceId) {
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
    if (claimedByOthers(rel, layers, raceId)) {
      continue;
    }
    expected.set(destRoot + rel.slice("ai/".length), merged.read(rel));
  }
  return expected;
}

// What the sweep into an MLA army's scoped tree must hold: every .json but
// neural_networks/, minus what a race layer claims and MLA's does not. Every
// unit map not so claimed stays, untagged, as the live listing has it.
function expectedMlaTree(merged, destRoot, layers) {
  const expected = new Map();
  for (const rel of merged.rels) {
    if (!rel.endsWith(".json") || rel.includes("/neural_networks/")) {
      continue;
    }
    if (claimedByOthers(rel, layers, MLA)) {
      continue;
    }
    expected.set(destRoot + rel.slice("ai/".length), merged.read(rel));
  }
  return expected;
}

// One real referee_ai.js run over the merge served as the virtual
// filesystem: the files written under destRoot.
async function refereeTree(gameOptions, merged, destRoot) {
  const fixture = buildGame(
    Object.assign({ aiInUse: "Titans", aiMods: [] }, gameOptions)
  );
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

function compareTrees(label, expected, actual) {
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
    console.error(label + ": tree does not match the manual merge");
    for (const problem of problems) {
      console.error("  " + problem);
    }
    return false;
  }
  console.log(
    label + ": " + actual.size + " files match the manual merge exactly"
  );
  return true;
}

// Every mod mounted at once: another layer must never reach this tree,
// however the shared listing interleaves.
function checkSubtraction(label, layers, ownId, actual, destRoot) {
  const leaked = [...actual.keys()].filter((key) =>
    claimedByOthers("ai/" + key.slice(destRoot.length), layers, ownId)
  );
  if (leaked.length) {
    console.error(label + ": another layer leaked into the tree");
    for (const key of leaked) {
      console.error("  " + key);
    }
    return false;
  }
  console.log(
    label +
      ": no other layer's files among " +
      actual.size +
      " with every mod mounted"
  );
  return true;
}

// Every `unitMaps` entry and `sources` prefix a mounted descriptor declares
// names something in the merge, else the descriptor has gone stale.
function checkDescriptor(label, configs, merged) {
  const problems = [];
  for (const config of configs) {
    for (const map of config.unitMaps || []) {
      if (!merged.rels.includes(map.replace(/^\/pa\//, ""))) {
        problems.push("unit map not in the merge: " + map);
      }
    }
    for (const source of config.sources || []) {
      const prefix = (source.dir + (source.match || "")).replace(/^\/pa\//, "");
      if (!merged.rels.some((rel) => rel.startsWith(prefix))) {
        problems.push("source matches nothing: " + prefix);
      }
    }
  }
  if (problems.length) {
    console.error(label + ": stale descriptor");
    for (const problem of problems) {
      console.error("  " + problem);
    }
    return false;
  }
  console.log(label + ": descriptor matches the files on disk");
  return true;
}

// Every AI file an add-on's own mods ship is claimed by one of its layers,
// else a layer the mod grew upstream is silently dropped from every tree.
function checkUnclaimed(label, configs, own) {
  const layer = {
    unitMaps: configs.flatMap((config) => config.unitMaps || []),
    sources: configs.flatMap((config) => config.sources || []),
  };
  const unclaimed = own.rels.filter(
    (rel) =>
      rel.endsWith(".json") &&
      !rel.includes("/neural_networks/") &&
      !claimedBy(rel, layer)
  );
  if (unclaimed.length) {
    console.error(label + ": files no layer claims");
    for (const rel of unclaimed) {
      console.error("  " + rel);
    }
    return false;
  }
  console.log(label + ": every shipped AI file is claimed");
  return true;
}

async function main() {
  const candidates = races
    .all()
    .filter((race) => race.ai.titans && modRoots(race.serverMods).length);
  const mountedAddons = races
    .addons()
    .filter((addon) => modRoots(addon.serverMods).length);
  if (!candidates.length) {
    console.error("No race server mods found under " + userDataDir());
    process.exitCode = 1;
    return;
  }
  const layers = descriptorLayers();
  const addonRoots = mountedAddons.flatMap((addon) =>
    modRoots(addon.serverMods)
  );

  let ok = true;

  for (const race of candidates) {
    const destRoot = races.aiRoot(race.id, "/pa/ai/");
    const merged = mergeRoots(
      baseRoots().concat(modRoots(race.serverMods), addonRoots)
    );
    const actual = await refereeTree({ enemyRace: race.id }, merged, destRoot);
    ok =
      compareTrees(
        race.id,
        expectedRaceTree(merged, destRoot, layers, race.id),
        actual
      ) && ok;
  }

  const mlaMerged = mergeRoots(baseRoots().concat(addonRoots));
  const mlaActual = await refereeTree(
    { enemyType: "guardians" },
    mlaMerged,
    GUARDIANS_ROOT
  );
  ok =
    compareTrees(
      MLA,
      expectedMlaTree(mlaMerged, GUARDIANS_ROOT, layers),
      mlaActual
    ) && ok;

  const allMounted = mergeRoots(
    baseRoots().concat(
      candidates.flatMap((race) => modRoots(race.serverMods)),
      addonRoots
    )
  );
  for (const race of candidates) {
    const destRoot = races.aiRoot(race.id, "/pa/ai/");
    const actual = await refereeTree(
      { enemyRace: race.id },
      allMounted,
      destRoot
    );
    ok = checkSubtraction(race.id, layers, race.id, actual, destRoot) && ok;
  }
  const mlaAll = await refereeTree(
    { enemyType: "guardians" },
    allMounted,
    GUARDIANS_ROOT
  );
  ok = checkSubtraction(MLA, layers, MLA, mlaAll, GUARDIANS_ROOT) && ok;

  for (const race of candidates) {
    ok = checkDescriptor(race.id, [race.ai.titans], allMounted) && ok;
  }
  for (const addon of mountedAddons) {
    const configs = Object.values(addon.layers)
      .map((brains) => brains && brains.titans)
      .filter(Boolean);
    ok = checkDescriptor(addon.id, configs, allMounted) && ok;
    ok =
      checkUnclaimed(
        addon.id,
        configs,
        mergeRoots(modRoots(addon.serverMods))
      ) && ok;
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
