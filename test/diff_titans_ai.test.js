"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const {
  historicPaths,
  baseRels,
  entries,
  kindOf,
  canon,
  formatTest,
  formatUnit,
  compareFile,
  entryHistory,
  changelogLines,
  mergeLabel,
  introducingMerge,
  formatReport,
} = require("../scripts/lib/titans-ai-diff.js");

const REPO_ROOT = path.join(__dirname, "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "diff-titans-ai.js");
const AI_ROOT = path.join(REPO_ROOT, "pa", "ai");

const ALONE = { test_type: "AloneOnPlanet", boolean: true };
const AFFORD = { test_type: "CanAffordBuildDemand" };
const AIR = {
  test_type: "SystemThreat",
  string0: "Air",
  compare0: ">",
  value0: 0,
};

function build(name, groups, extra) {
  return Object.assign(
    { name: name, to_build: name, build_conditions: groups },
    extra
  );
}

describe("titans-ai-diff paths", () => {
  it("searches every layout the copies have had, newest first", () => {
    assert.deepEqual(historicPaths("factory_builds/x.json"), [
      "pa/ai/factory_builds/x.json",
      "pa/ai/bugfix/factory_builds/x.json",
      "ai/factory_builds/x.json",
    ]);
  });

  it("prefers the TITANS overlay as the base copy", () => {
    assert.deepEqual(baseRels("platoon_templates/platoon_templates.json"), [
      "pa_ex1/ai/platoon_templates/platoon_templates.json",
      "pa/ai/platoon_templates/platoon_templates.json",
    ]);
  });
});

describe("titans-ai-diff entries", () => {
  it("keys a build list by name, numbering a repeated name", () => {
    const keyed = entries({
      build_list: [build("A", []), build("B", []), build("A", [])],
    });
    assert.deepEqual([...keyed.keys()], ["A", "B", "A #2"]);
  });

  it("keys platoon templates by name and reads anything else as empty", () => {
    assert.deepEqual(
      [...entries({ platoon_templates: { Raid: {}, Attack: {} } }).keys()],
      ["Raid", "Attack"]
    );
    assert.equal(entries(null).size, 0);
    assert.equal(entries({ unit_map: {} }).size, 0);
    assert.equal(kindOf({ unit_map: {} }), "unknown");
    assert.equal(kindOf({ build_list: [] }), "build");
    assert.equal(kindOf({ platoon_templates: {} }), "template");
  });
});

describe("titans-ai-diff canon", () => {
  it("ignores key order and reads 1.0 as 1", () => {
    assert.equal(
      canon(JSON.parse('{"b":1.0,"a":[{"y":2,"x":null}]}')),
      canon({ a: [{ x: null, y: 2 }], b: 1 })
    );
    assert.notEqual(canon([1, 2]), canon([2, 1]));
  });
});

describe("titans-ai-diff formatting", () => {
  it("writes a test with its strings, boolean and comparison", () => {
    assert.equal(formatTest(AIR), "SystemThreat Air > 0");
    assert.equal(formatTest(ALONE), "AloneOnPlanet = true");
    assert.equal(
      formatTest({
        test_type: "UnitRatioOnPlanet",
        unit_type_string0: "A",
        unit_type_string1: "B",
        compare0: "<",
        value0: 0.1,
      }),
      "UnitRatioOnPlanet A B < 0.1"
    );
    assert.equal(formatTest("odd"), "odd");
  });

  it("writes a platoon row with its squad, types and counts", () => {
    assert.equal(
      formatUnit({
        squad: "Fast",
        unit_types: "Bot",
        min_count: 0,
        max_count: 3,
      }),
      "Fast | Bot | min 0 | max 3"
    );
    assert.equal(
      formatUnit({ squad: "Close", unit_types: "Heavy", percent: 0.5 }),
      "Close | Heavy | percent 0.5"
    );
    assert.equal(formatUnit(7), "7");
  });
});

describe("titans-ai-diff compareFile", () => {
  const base = {
    build_list: [
      build("Same", [[AFFORD]]),
      build("Tested", [[ALONE, AFFORD]], { priority: 97 }),
      build("Shuffled", [[AFFORD], [ALONE]]),
      build("Dropped", [[AFFORD]]),
    ],
  };

  it("counts identical entries and names each difference", () => {
    const gwo = {
      build_list: [
        build("Same", [[AFFORD]]),
        build("Tested", [[ALONE, AFFORD, AIR]], { priority: 99 }),
        build("Shuffled", [[ALONE], [AFFORD]]),
        build("Added", [[AFFORD]]),
      ],
    };
    const result = compareFile(gwo, base);
    assert.equal(result.kind, "build");
    assert.equal(result.gwoCount, 4);
    assert.equal(result.baseCount, 4);
    assert.equal(result.identical, 1);
    assert.equal(result.sameOrder, true);
    assert.deepEqual(result.otherKeys, []);
    const byKey = Object.fromEntries(
      result.diffs.map((diff) => [diff.key, diff])
    );
    assert.equal(byKey.Added.status, "gwo only");
    assert.equal(byKey.Dropped.status, "base only");
    assert.deepEqual(byKey.Tested.detail.fields, [
      { field: "priority", gwo: 99, base: 97 },
    ]);
    assert.deepEqual(byKey.Tested.detail.build_conditions.onlyGwo, [
      "AloneOnPlanet = true; CanAffordBuildDemand; SystemThreat Air > 0",
    ]);
    assert.deepEqual(byKey.Tested.detail.build_conditions.onlyBase, [
      "AloneOnPlanet = true; CanAffordBuildDemand",
    ]);
    assert.equal(byKey.Shuffled.detail.build_conditions.reordered, true);
  });

  it("reports entry order and other top-level keys", () => {
    const gwo = {
      version: 2,
      build_list: [...base.build_list].reverse(),
    };
    const result = compareFile(gwo, base);
    assert.equal(result.identical, 4);
    assert.equal(result.sameOrder, false);
    assert.deepEqual(result.otherKeys, ["version"]);
  });

  it("compares platoon templates by their unit rows", () => {
    const row = { squad: "Defense", unit_types: "NukeDefense", max_count: 1 };
    const result = compareFile(
      {
        platoon_templates: {
          Attack: {
            units: [
              Object.assign({}, row, { unit_types: "NukeDefense & Mobile" }),
            ],
          },
        },
      },
      { platoon_templates: { Attack: { units: [row] } } }
    );
    assert.equal(result.kind, "template");
    assert.deepEqual(result.diffs[0].detail.units.onlyGwo, [
      "Defense | NukeDefense & Mobile | max 1",
    ]);
    assert.deepEqual(result.diffs[0].detail.units.onlyBase, [
      "Defense | NukeDefense | max 1",
    ]);
  });
});

describe("titans-ai-diff repeats and missing fields", () => {
  it("counts a repeated item instead of calling the list reordered", () => {
    const a = { squad: "Fast", unit_types: "A" };
    const b = { squad: "Fast", unit_types: "B" };
    const result = compareFile(
      { platoon_templates: { T: { units: [a, a, b] } } },
      { platoon_templates: { T: { units: [a, b] } } }
    );
    const units = result.diffs[0].detail.units;
    assert.deepEqual(units.onlyGwo, ["Fast | A"]);
    assert.deepEqual(units.onlyBase, []);
    assert.equal(units.reordered, false);
  });

  it("names a field that only one side has, even when it is null", () => {
    const result = compareFile(
      { build_list: [build("A", [[AFFORD]], { max_count: null })] },
      { build_list: [build("A", [[AFFORD]])] }
    );
    assert.deepEqual(result.diffs[0].detail.fields, [
      { field: "max_count", gwo: null, base: undefined },
    ]);
  });
});

describe("titans-ai-diff list keys", () => {
  it("names a condition list only one side has, or one that is not a list", () => {
    const empty = compareFile(
      { build_list: [{ name: "A", build_conditions: [] }] },
      { build_list: [{ name: "A" }] }
    );
    assert.deepEqual(empty.diffs[0].detail, {
      fields: [{ field: "build_conditions", gwo: [], base: undefined }],
    });
    const odd = compareFile(
      { platoon_templates: { T: { units: "x" } } },
      { platoon_templates: { T: { units: [] } } }
    );
    assert.deepEqual(odd.diffs[0].detail, {
      fields: [{ field: "units", gwo: "x", base: [] }],
    });
  });
});

describe("titans-ai-diff entryHistory", () => {
  it("records every commit that added, changed or removed an entry", () => {
    const docs = {
      a: { build_list: [build("X", [[AFFORD]])] },
      b: { build_list: [build("X", [[AFFORD, AIR]]), build("Y", [])] },
      c: { build_list: [build("Y", [])] },
    };
    const parents = {
      "a^": null,
      "b^": docs.a,
      "c^": docs.b,
      d: null,
      "d^": docs.c,
    };
    const readAt = (ref) => (ref in parents ? parents[ref] : docs[ref]);
    const history = entryHistory(["a", "b", "c", "d"], readAt);
    assert.deepEqual(history.get("X"), [
      { sha: "a", change: "added" },
      { sha: "b", change: "changed" },
      { sha: "c", change: "removed" },
    ]);
    assert.deepEqual(history.get("Y"), [
      { sha: "b", change: "added" },
      { sha: "d", change: "removed" },
    ]);
  });
});

describe("titans-ai-diff commit details", () => {
  it("takes the bullets a commit added to the changelog", () => {
    assert.deepEqual(
      changelogLines(
        "--- a/CHANGELOG.md\n+++ b/CHANGELOG.md\n+### Bugfix\n+- First\r\n-- Gone\n+  - Nested\n"
      ),
      ["First", "Nested"]
    );
    assert.deepEqual(changelogLines(undefined), []);
  });

  it("names a pull request merge by its number", () => {
    assert.equal(
      mergeLabel("Merge pull request #733 from Quitch/fix/713-x"),
      "PR #733"
    );
    assert.equal(
      mergeLabel("Merge branch 'feature' into develop"),
      "Merge branch 'feature' into develop"
    );
  });

  it("finds the first merge that holds a commit", () => {
    const merges = ["m1", "m2", "m3", "m4", "m5"].map((sha) => ({ sha: sha }));
    const holds = {
      c: ["m3", "m4", "m5"],
      late: [],
      early: ["m1", "m2", "m3", "m4", "m5"],
    };
    const isAncestor = (sha, merge) => holds[sha].includes(merge);
    assert.equal(introducingMerge("c", merges, isAncestor).sha, "m3");
    assert.equal(introducingMerge("early", merges, isAncestor).sha, "m1");
    assert.equal(introducingMerge("late", merges, isAncestor), undefined);
  });
});

describe("titans-ai-diff formatReport", () => {
  it("lists each file, its differences and their history", () => {
    const text = formatReport({
      files: [
        { rel: "missing.json" },
        {
          rel: "factory_builds/x.json",
          base: "pa_ex1/ai/factory_builds/x.json",
          comparison: {
            gwoCount: 2,
            identical: 1,
            sameOrder: false,
            otherKeys: ["version"],
            diffs: [
              {
                key: "Tested",
                status: "differs",
                detail: {
                  fields: [{ field: "priority", gwo: 99, base: 97 }],
                  build_conditions: {
                    onlyGwo: ["g"],
                    onlyBase: ["b"],
                    reordered: false,
                  },
                },
              },
              {
                key: "Shuffled",
                status: "differs",
                detail: {
                  fields: [],
                  units: { onlyGwo: [], onlyBase: [], reordered: true },
                },
              },
            ],
          },
          history: {
            Tested: [
              {
                sha: "0123456789abcdef",
                date: "2024-07-31",
                change: "added",
                via: "direct",
                subject: "Improve",
                changelog: ["Better"],
              },
            ],
          },
        },
      ],
    });
    assert.equal(
      text,
      [
        "pa/ai/missing.json: no base copy in the install",
        "pa/ai/factory_builds/x.json against pa_ex1/ai/factory_builds/x.json: 2 entries, 1 identical, 2 differing",
        "  entry order differs from base",
        "  top-level key differs: version",
        "  Tested: differs",
        "    priority: GWO 99, base 97",
        "    only GWO:  g",
        "    only base: b",
        "    history:",
        "      012345678 2024-07-31 added (direct): Improve",
        "        changelog: Better",
        "  Shuffled: differs",
        "    units: the same items in another order",
        "2 differing entries in 1 files",
      ].join("\n")
    );
  });
});

describe("diff-titans-ai.js", () => {
  let dir;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-titans-ai-diff-"));
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function copies(prefix, dirPath) {
    const rels = [];
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const rel = prefix + entry.name;
      if (entry.isDirectory()) {
        rels.push(...copies(rel + "/", path.join(dirPath, entry.name)));
      } else if (entry.name.endsWith(".json")) {
        rels.push(rel);
      }
    }
    return rels;
  }

  // GWO's own copies as the install, all under pa_ex1/ but the platoon
  // templates, which go under pa/ to exercise the fallback.
  function writeMedia(name, mutate) {
    const media = path.join(dir, name);
    for (const rel of copies("", AI_ROOT)) {
      const doc = JSON.parse(fs.readFileSync(path.join(AI_ROOT, rel), "utf8"));
      if (mutate) {
        mutate(rel, doc);
      }
      const root = rel.startsWith("platoon_templates/") ? "pa" : "pa_ex1";
      const file = path.join(media, root, "ai", rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(doc));
    }
    return media;
  }

  function run(media, args) {
    return spawnSync(
      process.execPath,
      [SCRIPT, "--no-history"].concat(args || []),
      {
        encoding: "utf8",
        env: Object.assign({}, process.env, { PA_MEDIA: media }),
      }
    );
  }

  it("finds nothing over a fixture install built from GWO's own copies", () => {
    const count = copies("", AI_ROOT).length;
    const json = path.join(dir, "report.json");
    const result = run(writeMedia("media"), ["--json", json]);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(
      result.stdout,
      new RegExp("0 differing entries in " + count + " files")
    );
    assert.match(
      result.stdout,
      /pa\/ai\/platoon_templates\/platoon_templates\.json against pa\/ai\/platoon_templates\/platoon_templates\.json: \d+ entries/
    );
    const report = JSON.parse(fs.readFileSync(json, "utf8"));
    assert.equal(report.files.length, count);
    assert.equal(report.files[0].history, undefined);
  });

  it("names each entry that differs over a fixture install that differs", () => {
    const media = writeMedia("drifted", (rel, doc) => {
      if (rel === "factory_builds/factory_uc_builds_x1.json") {
        const entry = doc.build_list[0];
        entry.priority = -1;
        doc.build_list.push(build("Base Only", [[AFFORD]]));
      }
    });
    const result = run(media);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /factory_uc_builds_x1\.json against pa_ex1\/.*: \d+ entries, \d+ identical, 2 differing/
    );
    assert.match(result.stdout, /\n {4}priority: GWO \d+, base -1\n/);
    assert.match(result.stdout, /\n {2}Base Only: base only\n/);
  });

  it("says when a copy has no base file", () => {
    const media = writeMedia("partial");
    fs.rmSync(path.join(media, "pa", "ai", "platoon_templates"), {
      recursive: true,
    });
    const result = run(media);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /pa\/ai\/platoon_templates\/platoon_templates\.json: no base copy in the install/
    );
  });

  it("stops without an install, on a bad argument, or on a broken file", () => {
    assert.equal(run(path.join(dir, "nowhere")).status, 1);
    const media = writeMedia("args");
    const bad = run(media, ["--bogus"]);
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /unknown argument: --bogus/);
    for (const args of [
      ["--json", ""],
      ["--json"],
      ["--json", "--no-history"],
    ]) {
      const missing = run(media, args);
      assert.equal(missing.status, 1, args.join(" "));
      assert.match(missing.stderr, /--json needs a file/);
    }
    const broken = path.join(
      media,
      "pa_ex1",
      "ai",
      "factory_builds",
      "factory_land_builds.json"
    );
    fs.writeFileSync(broken, "{");
    const result = run(media);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /cannot compare pa\/ai\/factory_builds\/factory_land_builds\.json/
    );
  });

  // The script, its two libraries and GWO's pa/ai/, outside this clone.
  function copyTool(copy) {
    for (const rel of [
      "scripts/diff-titans-ai.js",
      "scripts/lib/titans-ai-diff.js",
      "scripts/lib/pa-install.js",
    ]) {
      fs.mkdirSync(path.dirname(path.join(copy, rel)), { recursive: true });
      fs.copyFileSync(path.join(REPO_ROOT, rel), path.join(copy, rel));
    }
    fs.cpSync(AI_ROOT, path.join(copy, "pa", "ai"), { recursive: true });
  }

  function runCopy(copy, media) {
    return spawnSync(
      process.execPath,
      [path.join(copy, "scripts", "diff-titans-ai.js")],
      {
        encoding: "utf8",
        env: Object.assign({}, process.env, {
          PA_MEDIA: media,
          GIT_CEILING_DIRECTORIES: dir,
        }),
      }
    );
  }

  function git(cwd, args) {
    const hooks = path.join(dir, "no-hooks");
    fs.mkdirSync(hooks, { recursive: true });
    const result = spawnSync(
      "git",
      [
        "-c",
        "user.name=test",
        "-c",
        "user.email=test@example.invalid",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "core.hooksPath=" + hooks,
      ].concat(args),
      { cwd: cwd, encoding: "utf8" }
    );
    assert.equal(result.status, 0, args.join(" ") + ": " + result.stderr);
  }

  it("asks for --no-history where there is no git history", () => {
    const copy = path.join(dir, "no-git");
    copyTool(copy);
    const result = runCopy(copy, writeMedia("no-git-media"));
    assert.equal(result.status, 1, result.stdout);
    assert.match(
      result.stderr,
      /cannot read the git history \(.*not a git repository.*\); run with --no-history/
    );
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  });

  it("asks for --no-history in a shallow clone", () => {
    const origin = path.join(dir, "origin");
    copyTool(origin);
    git(origin, ["init", "-q"]);
    git(origin, ["add", "."]);
    git(origin, ["commit", "-q", "-m", "one"]);
    fs.writeFileSync(path.join(origin, "note.txt"), "two");
    git(origin, ["add", "."]);
    git(origin, ["commit", "-q", "-m", "two"]);
    const shallow = path.join(dir, "shallow");
    git(dir, [
      "clone",
      "-q",
      "--depth",
      "1",
      pathToFileURL(origin).href,
      shallow,
    ]);
    const result = runCopy(shallow, writeMedia("shallow-media"));
    assert.equal(result.status, 1, result.stdout);
    assert.match(
      result.stderr,
      /cannot read the git history \(the clone is shallow\); run with --no-history/
    );
  });
});
