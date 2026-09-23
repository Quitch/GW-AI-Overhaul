"use strict";

// scripts/lib/pa-install.js: where the local-only scripts look for the PA
// install and PA's user data folder.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  DEFAULT_MEDIA,
  mediaDir,
  userDataDir,
} = require("../scripts/lib/pa-install.js");

const SAVED = {
  PA_MEDIA: process.env.PA_MEDIA,
  PA_USER_DATA: process.env.PA_USER_DATA,
  LOCALAPPDATA: process.env.LOCALAPPDATA,
};

function setEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  for (const [name, value] of Object.entries(SAVED)) {
    setEnv(name, value);
  }
});

describe("mediaDir", () => {
  it("is PA_MEDIA when set", () => {
    setEnv("PA_MEDIA", "/somewhere/media");
    assert.equal(mediaDir(), "/somewhere/media");
  });

  it("is Steam's default install without PA_MEDIA", () => {
    setEnv("PA_MEDIA", undefined);
    assert.equal(mediaDir(), DEFAULT_MEDIA);
  });
});

describe("userDataDir", () => {
  it("is PA_USER_DATA when set", () => {
    setEnv("PA_USER_DATA", "/somewhere/pa");
    assert.equal(userDataDir(), "/somewhere/pa");
  });

  it("is PA's folder under LOCALAPPDATA without PA_USER_DATA", () => {
    setEnv("PA_USER_DATA", undefined);
    setEnv("LOCALAPPDATA", "/local");
    assert.equal(
      userDataDir(),
      path.join("/local", "Uber Entertainment", "Planetary Annihilation")
    );
  });
});
