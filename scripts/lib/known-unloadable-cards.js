"use strict";

// Cards that fail to load under the AMD shim for a reviewed reason. NOT_SHIPPED
// does not belong here - callers tolerate that generically. Anything else failing
// to load is a real regression.
const KNOWN_UNLOADABLE = {
  "gwc_minion.js":
    "transitively depends on shared/gw_factions.js, which calls " +
    "api.content.usingTitans() directly at define-time (real engine coupling, " +
    "not just a missing file)",
};

module.exports = {
  KNOWN_UNLOADABLE,
  KNOWN_UNLOADABLE_FILES: new Set(Object.keys(KNOWN_UNLOADABLE)),
};
