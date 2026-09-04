"use strict";

// The inventories docs/ keeps by hand - which scenes modinfo.json lists, which
// files sit under ui/main/ and pa/, which validate:* scripts exist - go stale
// silently, so each is checked against the tree here. A table row is a file or
// a name; the first cell's backtick content is what is compared.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../lib/amd-loader.js");
const { reportProblems } = require("../lib/report-failures.js");
const { walkFiles } = require("../lib/walk.js");

const DOCS_DIR = path.join(REPO_ROOT, "docs");
const UI_MAIN = path.join(REPO_ROOT, "ui", "main");
const CARDS_DIR = path.join(UI_MAIN, "game", "galactic_war", "cards");
const PA_DIR = path.join(REPO_ROOT, "pa");
const PA_AI_DIR = path.join(PA_DIR, "ai");

function readDoc(name) {
  return fs.readFileSync(path.join(DOCS_DIR, name), "utf8").split(/\r?\n/);
}

// The first markdown table after the first heading whose text satisfies
// `matches`, as an array of first-cell backtick values. Stops at the next
// heading of any level.
function firstCells(lines, matches) {
  let inSection = false;
  let rows = 0;
  const cells = [];

  for (const line of lines) {
    const heading = /^#+\s+(.*)$/.exec(line);
    if (heading) {
      if (inSection && rows > 0) {
        break;
      }
      inSection = matches(heading[1]);
      continue;
    }
    if (!inSection || !line.startsWith("|")) {
      if (inSection && rows > 0) {
        break;
      }
      continue;
    }
    rows += 1;
    if (rows <= 2) {
      continue; // header and separator
    }
    const first = line.split("|")[1] || "";
    const code = /`([^`]+)`/.exec(first);
    if (code) {
      cells.push(code[1]);
    }
  }

  return cells;
}

function compareSets(problems, label, documented, actual) {
  const doc = new Set(documented);
  const real = new Set(actual);
  for (const name of documented) {
    if (!real.has(name)) {
      problems.push(label + ": documented but absent: " + name);
    }
  }
  for (const name of actual) {
    if (!doc.has(name)) {
      problems.push(label + ": present but undocumented: " + name);
    }
  }
}

function relativeTo(root, files) {
  return files.map((file) =>
    path.relative(root, file).split(path.sep).join("/")
  );
}

function checkScenes(problems) {
  const modinfo = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "modinfo.json"), "utf8")
  );
  const documented = firstCells(
    readDoc("architecture.md"),
    (text) => text === "Entry points"
  );
  compareSets(
    problems,
    "architecture.md scene table",
    documented,
    Object.keys(modinfo.scenes || {})
  );
}

function checkUiMain(problems) {
  const documented = firstCells(readDoc("shadowing.md"), (text) =>
    text.startsWith("`ui/main/`")
  );
  const actual = relativeTo(
    UI_MAIN,
    walkFiles(UI_MAIN, () => true).filter(
      (file) => !file.startsWith(CARDS_DIR + path.sep)
    )
  );
  compareSets(problems, "shadowing.md ui/main/ table", documented, actual);
}

function checkCards(problems) {
  const prefixes = firstCells(readDoc("shadowing.md"), (text) =>
    text.startsWith("`ui/main/game/galactic_war/cards/`")
  );
  if (!prefixes.length) {
    problems.push("shadowing.md cards table: no prefix rows found");
    return;
  }
  for (const name of fs.readdirSync(CARDS_DIR)) {
    if (!prefixes.some((prefix) => name.startsWith(prefix))) {
      problems.push(
        "shadowing.md cards table: no documented prefix matches " + name
      );
    }
  }
}

function checkPaTrees(problems) {
  const lines = readDoc("shadowing.md");
  const documentedTrees = firstCells(lines, (text) => text === "`pa/`");
  const actualTrees = fs
    .readdirSync(PA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => "pa/" + entry.name + "/");
  compareSets(problems, "shadowing.md pa/ table", documentedTrees, actualTrees);

  const documentedFiles = firstCells(lines, (text) =>
    text.startsWith("Which copy each `pa/ai/` file replaces")
  );
  const actualFiles = walkFiles(PA_AI_DIR, () => true).map((file) =>
    path.basename(file)
  );
  compareSets(
    problems,
    "shadowing.md pa/ai/ re-sync table",
    documentedFiles,
    actualFiles
  );
}

function checkAiPathTrees(problems) {
  const lines = readDoc("ai-paths.md");
  let inSection = false;
  let rows = 0;

  for (const line of lines) {
    const heading = /^#+\s+(.*)$/.exec(line);
    if (heading) {
      if (inSection && rows > 0) {
        break;
      }
      inSection = heading[1] === "The five trees";
      continue;
    }
    if (!inSection || !line.startsWith("|")) {
      continue;
    }
    rows += 1;
    if (rows <= 2) {
      continue;
    }
    const cells = line.split("|").map((cell) => cell.trim());
    const code = /`\/pa\/([^`/]+)\/`/.exec(cells[1] || "");
    if (!code) {
      continue;
    }
    const shipped = fs.existsSync(path.join(PA_DIR, code[1]));
    const saysNo = cells[2] === "No";
    if (shipped && saysNo) {
      problems.push(
        "ai-paths.md tree table: pa/" +
          code[1] +
          " exists here but the row says No"
      );
    } else if (!shipped && !saysNo) {
      problems.push(
        "ai-paths.md tree table: pa/" +
          code[1] +
          " is absent but the row says " +
          cells[2]
      );
    }
  }
  if (rows === 0) {
    problems.push("ai-paths.md tree table: not found");
  }
}

function checkValidators(problems) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")
  );
  const chained = new Set(
    (pkg.scripts.validate || "")
      .split("&&")
      .map((part) => part.trim().replace(/^npm run /, ""))
  );
  const actual = Object.keys(pkg.scripts).filter(
    (name) => name.startsWith("validate:") && chained.has(name)
  );
  const documented = firstCells(
    readDoc("testing.md"),
    (text) => text === "The validators"
  );
  compareSets(problems, "testing.md validator table", documented, actual);
}

function main() {
  const problems = [];
  checkScenes(problems);
  checkUiMain(problems);
  checkCards(problems);
  checkPaTrees(problems);
  checkAiPathTrees(problems);
  checkValidators(problems);

  console.log("docs: 6 inventories checked, " + problems.length + " problems.");
  reportProblems(problems);
}

main();
