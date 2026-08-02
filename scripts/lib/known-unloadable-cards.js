"use strict";

// Cards that fail to load under the AMD shim for a reviewed reason other than a
// missing base-game module. NOT_SHIPPED failures don't belong here - the loader
// identifies those precisely and callers tolerate them generically. Only a
// non-NOT_SHIPPED failure needs a named entry; anything else failing to load is a
// real regression.
//
// Shared by scripts/validate/cards-contract.js, scripts/validate/ai-mods-contract.js
// and test/cluster_subcommander_buildable.test.js, which previously each carried
// their own copy.
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
