"use strict";

// `npm run release`: brings everything generated from the PA install and the
// race and add-on zips up to date, checks it against them, stamps the version
// CHANGELOG.md names into modinfo.json, version.js and sonar-project.properties
// with today's date and the install's PA build, then runs `verify`. Stops at the
// first failing step. Commits nothing: the diff is the review. Local-only, as
// the harvests are. See docs/releasing.md.

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { mediaDir } = require("./lib/pa-install.js");
const {
  releaseHeading,
  stampModinfo,
  stampVersionJs,
  stampSonar,
  localDate,
} = require("./lib/release.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const MODINFO = "modinfo.json";
const VERSION_JS = "ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js";
const SONAR = "sonar-project.properties";

const REFRESH = [
  ["harvest:unit-types"],
  ["harvest:race-specs"],
  ["generate:race-tables"],
  // After the tables: a race file's unit names are catalog keys.
  ["i18n:catalog"],
];
const CHECKS = [
  ["validate:race-trees"],
  ["validate:queller-maps"],
  // Also prints how many keys each language still lacks.
  ["i18n:missing", "--report"],
];

const read = (file) => fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
const write = (file, text) =>
  fs.writeFileSync(path.join(REPO_ROOT, file), text);

// Every command line here is a constant. npm is npm.cmd on Windows, which spawn
// only runs through a shell, and a shell takes one string.
function run(commandLine) {
  console.log("\n> " + commandLine);
  const result = spawnSync(commandLine, {
    cwd: REPO_ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(commandLine + " failed");
  }
}

function npmRun(script, args) {
  run(["npm run", script].concat(args.length ? ["--"] : [], args).join(" "));
}

function installBuild() {
  const file = path.join(path.dirname(mediaDir()), "build.txt");
  if (!fs.existsSync(file)) {
    throw new Error("no PA build number at " + file + "; set PA_MEDIA");
  }
  return fs.readFileSync(file, "utf8").trim();
}

function stamp(version, build) {
  const date = localDate(new Date());
  const before = JSON.parse(read(MODINFO));
  write(MODINFO, stampModinfo(read(MODINFO), { version, date, build }));
  write(VERSION_JS, stampVersionJs(read(VERSION_JS), version));
  write(SONAR, stampSonar(read(SONAR), version));
  console.log(
    "\nrelease: stamped v" + version + ", date " + date + ", PA build " + build
  );
  return { date, previousBuild: before.build };
}

function main() {
  const heading = releaseHeading(read("CHANGELOG.md"));
  const build = installBuild();

  for (const [script, ...args] of REFRESH.concat(CHECKS)) {
    npmRun(script, args);
  }

  const { date, previousBuild } = stamp(heading.version, build);
  npmRun("verify", []);
  run("git status --short");

  if (heading.date !== date) {
    console.warn(
      "\nrelease: CHANGELOG.md dates v" +
        heading.version +
        " " +
        heading.date +
        ", modinfo.json now says " +
        date
    );
  }
  if (previousBuild !== build) {
    console.warn(
      "\nrelease: PA build " +
        previousBuild +
        " -> " +
        build +
        ". Recheck validate:schemas' KNOWN_TEST_TYPES by hand (docs/testing.md)."
    );
  }
  console.log("\nrelease: v" + heading.version + " ready; review the diff.");
}

try {
  main();
} catch (error) {
  console.error("\nrelease: " + error.message);
  process.exitCode = 1;
}
