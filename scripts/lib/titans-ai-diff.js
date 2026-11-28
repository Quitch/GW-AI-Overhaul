"use strict";

// The comparison behind scripts/diff-titans-ai.js: GWO's pa/ai/ copies against the
// base game's, entry by entry, and which commits changed each entry. See
// shadowing.md, "What GWO changes in the pa/ai/ files, and why".

// Where a pa/ai/ file has lived in this repo, newest layout first. Before
// 180000040 (2021) the copies sat under pa/ai/bugfix/, and before 6c9f51af6 under
// ai/. Searching every layout keeps the history from stopping at a move.
const LAYOUTS = ["pa/ai/", "pa/ai/bugfix/", "ai/"];

function historicPaths(rel) {
  return LAYOUTS.map((prefix) => prefix + rel);
}

// The copy the game loads for a pa/ai/ path: the TITANS overlay first.
function baseRels(rel) {
  return ["pa_ex1/ai/" + rel, "pa/ai/" + rel];
}

// A build list keys each entry by its name, adding the occurrence for a name the
// file repeats. A platoon template file keys each template by its name.
function entries(doc) {
  const out = new Map();
  if (!doc || typeof doc !== "object") {
    return out;
  }
  if (Array.isArray(doc.build_list)) {
    const seen = new Map();
    for (const entry of doc.build_list) {
      const name = String(entry && entry.name);
      const count = (seen.get(name) || 0) + 1;
      seen.set(name, count);
      out.set(count === 1 ? name : name + " #" + count, entry);
    }
  } else if (
    doc.platoon_templates &&
    typeof doc.platoon_templates === "object"
  ) {
    for (const [name, template] of Object.entries(doc.platoon_templates)) {
      out.set(name, template);
    }
  }
  return out;
}

function kindOf(doc) {
  if (doc && Array.isArray(doc.build_list)) {
    return "build";
  }
  if (
    doc &&
    doc.platoon_templates &&
    typeof doc.platoon_templates === "object"
  ) {
    return "template";
  }
  return "unknown";
}

// JSON with sorted keys. JSON.parse already reads 1.0 as 1, so the minified
// copies compare equal to the base files' spelling.
function canon(value) {
  if (Array.isArray(value)) {
    return "[" + value.map(canon).join(",") + "]";
  }
  if (value && typeof value === "object") {
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + canon(value[key]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value === undefined ? null : value);
}

function formatTest(test) {
  if (!test || typeof test !== "object") {
    return String(test);
  }
  let text = String(test.test_type);
  for (const key of [
    "string0",
    "string1",
    "unit_type_string0",
    "unit_type_string1",
  ]) {
    if (key in test) {
      text += " " + test[key];
    }
  }
  if ("boolean" in test) {
    text += " = " + test.boolean;
  }
  if ("value0" in test) {
    text += " " + (test.compare0 || "") + " " + test.value0;
  }
  return text;
}

function formatUnit(unit) {
  if (!unit || typeof unit !== "object") {
    return String(unit);
  }
  const parts = [unit.squad, unit.unit_types];
  if ("min_count" in unit) {
    parts.push("min " + unit.min_count);
  }
  if ("max_count" in unit) {
    parts.push("max " + unit.max_count);
  }
  if ("percent" in unit) {
    parts.push("percent " + unit.percent);
  }
  return parts.filter((part) => part !== undefined).join(" | ");
}

// Items one list has more of than the other, by value, so a repeat counts. Order
// is not compared here; the caller reports a reorder.
function oneSided(mine, theirs, format) {
  const left = new Map();
  for (const item of theirs) {
    const key = canon(item);
    left.set(key, (left.get(key) || 0) + 1);
  }
  return mine
    .filter((item) => {
      const key = canon(item);
      const count = left.get(key) || 0;
      left.set(key, count - 1);
      return count <= 0;
    })
    .map(format);
}

function fieldDiffs(gwo, base, skip) {
  const fields = [];
  const keys = new Set([...Object.keys(gwo), ...Object.keys(base)]);
  for (const key of [...keys].sort()) {
    const oneSide = Object.hasOwn(gwo, key) !== Object.hasOwn(base, key);
    if (key !== skip && (oneSide || canon(gwo[key]) !== canon(base[key]))) {
      fields.push({ field: key, gwo: gwo[key], base: base[key] });
    }
  }
  return fields;
}

function diffList(gwoList, baseList, format) {
  const gwoItems = Array.isArray(gwoList) ? gwoList : [];
  const baseItems = Array.isArray(baseList) ? baseList : [];
  if (canon(gwoItems) === canon(baseItems)) {
    return undefined;
  }
  const onlyGwo = oneSided(gwoItems, baseItems, format);
  const onlyBase = oneSided(baseItems, gwoItems, format);
  return {
    gwoCount: gwoItems.length,
    baseCount: baseItems.length,
    onlyGwo: onlyGwo,
    onlyBase: onlyBase,
    reordered: !onlyGwo.length && !onlyBase.length,
  };
}

function diffEntry(gwo, base, kind) {
  const listKey = kind === "template" ? "units" : "build_conditions";
  const format =
    kind === "template"
      ? formatUnit
      : (group) =>
          Array.isArray(group)
            ? group.map(formatTest).join("; ")
            : String(group);
  const detail = { fields: fieldDiffs(gwo, base, listKey) };
  const list = diffList(gwo[listKey], base[listKey], format);
  if (list) {
    detail[listKey] = list;
  }
  return detail;
}

function compareFile(gwoDoc, baseDoc) {
  const kind = kindOf(gwoDoc);
  const gwo = entries(gwoDoc);
  const base = entries(baseDoc);
  const diffs = [];
  let identical = 0;
  for (const [key, entry] of gwo) {
    if (!base.has(key)) {
      diffs.push({ key: key, status: "gwo only" });
    } else if (canon(entry) === canon(base.get(key))) {
      identical += 1;
    } else {
      diffs.push({
        key: key,
        status: "differs",
        detail: diffEntry(entry, base.get(key), kind),
      });
    }
  }
  for (const key of base.keys()) {
    if (!gwo.has(key)) {
      diffs.push({ key: key, status: "base only" });
    }
  }
  return {
    kind: kind,
    gwoCount: gwo.size,
    baseCount: base.size,
    identical: identical,
    sameOrder:
      canon([...gwo.keys()].filter((key) => base.has(key))) ===
      canon([...base.keys()].filter((key) => gwo.has(key))),
    otherKeys: fieldDiffs(withoutLists(gwoDoc), withoutLists(baseDoc)).map(
      (diff) => diff.field
    ),
    diffs: diffs,
  };
}

function withoutLists(doc) {
  const copy = Object.assign({}, doc || {});
  delete copy.build_list;
  delete copy.platoon_templates;
  return copy;
}

// commits: oldest first. readAt(ref) returns the file's parsed JSON at ref, or
// null where no layout of it exists. Returns key -> [{ sha, change }] for every
// commit that added, changed, or removed that entry.
function entryHistory(commits, readAt) {
  const history = new Map();
  for (const sha of commits) {
    const before = entries(readAt(sha + "^"));
    const after = entries(readAt(sha));
    for (const key of new Set([...before.keys(), ...after.keys()])) {
      const was = before.get(key);
      const now = after.get(key);
      if (canon(was) === canon(now)) {
        continue;
      }
      let change = "changed";
      if (was === undefined) {
        change = "added";
      } else if (now === undefined) {
        change = "removed";
      }
      if (!history.has(key)) {
        history.set(key, []);
      }
      history.get(key).push({ sha: sha, change: change });
    }
  }
  return history;
}

// The bullets a commit added to CHANGELOG.md, from its unified diff.
function changelogLines(diffText) {
  return String(diffText || "")
    .split(/\r?\n/)
    .filter((line) => /^\+\s*- /.test(line))
    .map((line) => line.replace(/^\+\s*- /, "").trim());
}

function mergeLabel(subject) {
  const match = /^Merge pull request #(\d+)/.exec(subject || "");
  return match ? "PR #" + match[1] : subject;
}

// firstParentMerges: the merges on the branch's first-parent line, oldest first.
// isAncestor(sha, merge) answers git merge-base --is-ancestor. Once a commit is
// in one such merge it is in every later one, so the first is a binary search.
function introducingMerge(sha, firstParentMerges, isAncestor) {
  let low = 0;
  let high = firstParentMerges.length - 1;
  let found;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (isAncestor(sha, firstParentMerges[middle].sha)) {
      found = firstParentMerges[middle];
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }
  return found;
}

function describeDetail(detail, indent) {
  const lines = [];
  for (const field of detail.fields || []) {
    lines.push(
      indent +
        field.field +
        ": GWO " +
        JSON.stringify(field.gwo) +
        ", base " +
        JSON.stringify(field.base)
    );
  }
  for (const listKey of ["build_conditions", "units"]) {
    const list = detail[listKey];
    if (!list) {
      continue;
    }
    if (list.reordered) {
      lines.push(indent + listKey + ": the same items in another order");
    }
    for (const item of list.onlyGwo) {
      lines.push(indent + "only GWO:  " + item);
    }
    for (const item of list.onlyBase) {
      lines.push(indent + "only base: " + item);
    }
  }
  return lines;
}

function describeCommit(commit) {
  const lines = [
    "      " +
      commit.sha.slice(0, 9) +
      " " +
      commit.date +
      " " +
      commit.change +
      " (" +
      commit.via +
      "): " +
      commit.subject,
  ];
  for (const line of commit.changelog || []) {
    lines.push("        changelog: " + line);
  }
  return lines;
}

// report: { files: [{ rel, base, comparison, history? }] } as the script builds
// it. history, when present, maps a key to commits with their details filled in.
function formatReport(report) {
  const lines = [];
  let differing = 0;
  for (const file of report.files) {
    if (!file.base) {
      lines.push("pa/ai/" + file.rel + ": no base copy in the install");
      continue;
    }
    const comparison = file.comparison;
    differing += comparison.diffs.length;
    lines.push(
      "pa/ai/" +
        file.rel +
        " against " +
        file.base +
        ": " +
        comparison.gwoCount +
        " entries, " +
        comparison.identical +
        " identical, " +
        comparison.diffs.length +
        " differing"
    );
    if (!comparison.sameOrder) {
      lines.push("  entry order differs from base");
    }
    for (const key of comparison.otherKeys) {
      lines.push("  top-level key differs: " + key);
    }
    for (const diff of comparison.diffs) {
      lines.push("  " + diff.key + ": " + diff.status);
      if (diff.detail) {
        lines.push(...describeDetail(diff.detail, "    "));
      }
      const commits = file.history && file.history[diff.key];
      if (commits && commits.length) {
        lines.push("    history:");
        for (const commit of commits) {
          lines.push(...describeCommit(commit));
        }
      }
    }
  }
  lines.push(
    differing +
      " differing entries in " +
      report.files.filter((file) => file.base).length +
      " files"
  );
  return lines.join("\n");
}

module.exports = {
  LAYOUTS,
  historicPaths,
  baseRels,
  entries,
  kindOf,
  canon,
  formatTest,
  formatUnit,
  diffEntry,
  compareFile,
  entryHistory,
  changelogLines,
  mergeLabel,
  introducingMerge,
  formatReport,
};
