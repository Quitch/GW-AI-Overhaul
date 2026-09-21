"use strict";

// Node-side source of truth for the engine URL scheme. The shipped counterpart
// is shared/gwo_url.js, which cannot import this file; test/gwo_url.test.js
// asserts the two match. See cef-migration.md.

const UI_SCHEME = "coui://";
const SPEC_SCHEME = "spec://";

module.exports = { UI_SCHEME: UI_SCHEME, SPEC_SCHEME: SPEC_SCHEME };
