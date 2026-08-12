"use strict";

// A stand-in for shared/gwo_fetch.js, registered via registerModuleStub. Same
// contract as fake-jquery's resolver map: a URL with no configured resolver
// rejects, so a test's fixtures can't silently drift from what the code under
// test actually asks for.
function createFakeGwoFetch(options) {
  const opts = options || {};

  const resolve = (kind, url) =>
    Promise.resolve().then(() => {
      if (!opts[kind]) {
        throw new Error(
          `fake-fetch: no ${kind} resolver configured for ${url}`
        );
      }
      return opts[kind](url);
    });

  return {
    json: (url) => resolve("json", url),
    text: (url) => resolve("text", url),
  };
}

module.exports = { createFakeGwoFetch };
