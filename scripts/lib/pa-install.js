"use strict";

// Where the local-only scripts find the PA install's media folder and PA's user
// data folder (download/, server_mods/). PA_MEDIA and PA_USER_DATA override the
// defaults. CI has neither folder. See testing.md.

const path = require("node:path");

const DEFAULT_MEDIA =
  "C:/Program Files (x86)/Steam/steamapps/common/Planetary Annihilation Titans/media";

function mediaDir() {
  return process.env.PA_MEDIA || DEFAULT_MEDIA;
}

function userDataDir() {
  return (
    process.env.PA_USER_DATA ||
    path.join(
      process.env.LOCALAPPDATA || "",
      "Uber Entertainment",
      "Planetary Annihilation"
    )
  );
}

module.exports = { DEFAULT_MEDIA, mediaDir, userDataDir };
