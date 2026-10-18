"use strict";

// The text edits behind `npm run release`: the version CHANGELOG.md names, and
// stamping it into the three files that carry it. Each edit replaces one line in
// place, so the files keep Prettier's formatting. See docs/releasing.md.

const VERSION_HEADING = /^## v(\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})\s*$/;

function releaseHeading(changelog) {
  const heading = changelog
    .split(/\r?\n/)
    .find((line) => line.startsWith("## "));
  if (!heading) {
    throw new Error("CHANGELOG.md has no ## heading");
  }
  const match = VERSION_HEADING.exec(heading);
  if (!match) {
    throw new Error(
      "CHANGELOG.md's first heading is " +
        JSON.stringify(heading) +
        ", not ## v<version> - <date>; retitle it before releasing"
    );
  }
  return { version: match[1], date: match[2] };
}

function replaceOnce(text, pattern, replacement, what) {
  const matches = text.match(new RegExp(pattern.source, pattern.flags + "g"));
  if (!matches || matches.length !== 1) {
    throw new Error(
      what + ": expected one match, found " + (matches ? matches.length : 0)
    );
  }
  return text.replace(pattern, replacement);
}

function stampModinfo(text, stamp) {
  let out = text;
  for (const key of ["version", "date", "build"]) {
    out = replaceOnce(
      out,
      new RegExp('^(\\s*"' + key + '":\\s*)"[^"]*"', "m"),
      "$1" + JSON.stringify(stamp[key]),
      "modinfo.json " + key
    );
  }
  return out;
}

function stampVersionJs(text, version) {
  return replaceOnce(
    text,
    /^(\s*return )"[^"]*";$/m,
    "$1" + JSON.stringify(version) + ";",
    "version.js return"
  );
}

function stampSonar(text, version) {
  return replaceOnce(
    text,
    /^sonar\.projectVersion=.*$/m,
    "sonar.projectVersion=" + version,
    "sonar.projectVersion"
  );
}

// YYYY-MM-DD in local time, as CHANGELOG.md's headings are written.
function localDate(now) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
  );
}

module.exports = {
  releaseHeading,
  stampModinfo,
  stampVersionJs,
  stampSonar,
  localDate,
};
