"use strict";

// scripts/lib/release.js: the version CHANGELOG.md names, and the one-line
// stamps `npm run release` makes with it.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");
const {
  releaseHeading,
  stampModinfo,
  stampVersionJs,
  stampSonar,
  localDate,
} = require("../scripts/lib/release.js");

const read = (file) => fs.readFileSync(path.join(REPO_ROOT, file), "utf8");

describe("releaseHeading", () => {
  it("reads the first heading's version and date", () => {
    assert.deepEqual(
      releaseHeading(
        "# CHANGELOG\n\n## v7.8.0 - 2026-10-20\n\n## v7.7.0 - 2026-10-17\n"
      ),
      { version: "7.8.0", date: "2026-10-20" }
    );
  });

  it("refuses an Unreleased first heading", () => {
    assert.throws(
      () => releaseHeading("# CHANGELOG\n\n## Unreleased\n\n## v7.7.0 - x\n"),
      /"## Unreleased", not ## v<version> - <date>/
    );
  });

  it("refuses a changelog with no heading", () => {
    assert.throws(() => releaseHeading("# CHANGELOG\n"), /no ## heading/);
  });
});

describe("stampModinfo", () => {
  it("rewrites version, date and build and nothing else", () => {
    const before = read("modinfo.json");
    const after = stampModinfo(before, {
      version: "9.9.9",
      date: "2030-01-02",
      build: "200000",
    });
    const parsed = JSON.parse(after);
    assert.equal(parsed.version, "9.9.9");
    assert.equal(parsed.date, "2030-01-02");
    assert.equal(parsed.build, "200000");
    const changed = after
      .split("\n")
      .filter((line, i) => line !== before.split("\n")[i]);
    assert.equal(changed.length <= 3, true);
    assert.equal(after.split("\n").length, before.split("\n").length);
  });

  it("refuses a file missing a key", () => {
    assert.throws(
      () =>
        stampModinfo('{\n  "version": "1.0.0",\n  "date": "x"\n}\n', {
          version: "1",
          date: "2",
          build: "3",
        }),
      /modinfo.json build: expected one match, found 0/
    );
  });
});

describe("stampVersionJs", () => {
  it("rewrites the returned literal", () => {
    const after = stampVersionJs(
      read("ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js"),
      "9.9.9"
    );
    assert.match(after, /^ {2}return "9\.9\.9";$/m);
  });

  it("keeps CRLF line endings", () => {
    assert.equal(
      stampVersionJs(
        'define(function () {\r\n  return "1.0.0";\r\n});\r\n',
        "9.9.9"
      ),
      'define(function () {\r\n  return "9.9.9";\r\n});\r\n'
    );
  });
});

describe("stampSonar", () => {
  it("rewrites sonar.projectVersion", () => {
    const after = stampSonar(read("sonar-project.properties"), "9.9.9");
    assert.match(after, /^sonar\.projectVersion=9\.9\.9$/m);
  });

  it("keeps CRLF line endings", () => {
    assert.equal(
      stampSonar("a=1\r\nsonar.projectVersion=1.0.0\r\nb=2\r\n", "9.9.9"),
      "a=1\r\nsonar.projectVersion=9.9.9\r\nb=2\r\n"
    );
  });
});

describe("localDate", () => {
  it("pads month and day", () => {
    assert.equal(localDate(new Date(2026, 0, 5)), "2026-01-05");
  });
});
