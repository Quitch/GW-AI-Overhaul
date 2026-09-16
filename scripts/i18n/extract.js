"use strict";

// What the ui/ tree asks loc() for: a summary by role and file, or with --json
// the full site map for the other i18n scripts and for eyeballing a key.

const { extractKeys, sortedKeys } = require("../lib/loc-keys.js");

function main(argv) {
  const keys = extractKeys();

  if (argv.includes("--json")) {
    const out = {};
    for (const key of sortedKeys(keys.keys())) {
      out[key] = keys.get(key);
    }
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    return;
  }

  const roles = new Map();
  const files = new Map();
  let sites = 0;
  for (const entry of keys.values()) {
    for (const site of entry.sites) {
      sites += 1;
      roles.set(site.role, (roles.get(site.role) || 0) + 1);
      files.set(site.file, (files.get(site.file) || 0) + 1);
    }
  }

  console.log("i18n:extract: " + keys.size + " keys at " + sites + " sites.");
  console.log("");
  console.log("By role:");
  for (const [role, count] of Array.from(roles).sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(count).padStart(5) + "  " + role);
  }
  console.log("");
  console.log("By file:");
  for (const [file, count] of Array.from(files).sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(count).padStart(5) + "  " + file);
  }
}

main(process.argv.slice(2));
