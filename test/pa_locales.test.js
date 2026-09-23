"use strict";

// scripts/lib/pa-locales.js: which install the i18n scripts read. --pa wins,
// then pa-install.js's answer, and a folder with no translation tables is an
// error that says how to name the install.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { paMedia } = require("../scripts/lib/pa-locales.js");

const SAVED_MEDIA = process.env.PA_MEDIA;

afterEach(() => {
  if (SAVED_MEDIA === undefined) {
    delete process.env.PA_MEDIA;
  } else {
    process.env.PA_MEDIA = SAVED_MEDIA;
  }
});

function fakeInstall() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-pa-media-"));
  fs.mkdirSync(path.join(dir, "ui", "main", "_i18n", "locales"), {
    recursive: true,
  });
  return dir;
}

describe("paMedia", () => {
  it("reads the install --pa names", (t) => {
    const dir = fakeInstall();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    process.env.PA_MEDIA = path.join(dir, "elsewhere");
    assert.deepEqual(paMedia(["--pa", dir]), {
      media: dir,
      locales: path.join(dir, "ui", "main", "_i18n", "locales"),
    });
  });

  it("reads PA_MEDIA without --pa", (t) => {
    const dir = fakeInstall();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    process.env.PA_MEDIA = dir;
    assert.equal(paMedia([]).media, dir);
  });

  it("says how to name the install when the folder has no tables", () => {
    process.env.PA_MEDIA = path.join(os.tmpdir(), "gwo-no-such-install");
    assert.throws(() => paMedia([]), /no _i18n\/locales under .*--pa <path>/);
  });

  it("asks for a path when --pa has none", () => {
    assert.throws(() => paMedia(["--pa"]), /--pa <path>/);
  });
});
