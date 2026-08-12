"use strict";

// The fetch/api wiring referee_ai.js's file discovery needs. Each installer
// returns its own restore function. Calls are always recorded, so no test needs
// a second, subtly different, local installer.

const { createFakeApi } = require("./fake-jquery.js");

// options.fileListByPath: { [aiPath]: string[] } - what api.file.list resolves to.
// options.listFiles: (path) => string[] - takes precedence, for tests that derive the
//   listing from the requested path rather than enumerating every path up front.
// options.getJSON: (url) => json - what a fetched url parses to; defaults to an
//   empty build_list. Served through a fake global fetch, which is how
//   shared/gwo_fetch.js reaches the engine.
function installRefereeFakes(options) {
  const opts = options || {};
  const previousFetch = global.fetch;
  const previousApi = global.api;

  const listCalls = [];
  const getJSONCalls = [];

  global.api = createFakeApi({
    file: {
      list: (path) => {
        listCalls.push(path);
        const files = opts.listFiles
          ? opts.listFiles(path)
          : (opts.fileListByPath && opts.fileListByPath[path]) || [];
        return Promise.resolve(files);
      },
    },
  });

  global.fetch = (url) => {
    getJSONCalls.push(url);
    const json = opts.getJSON ? opts.getJSON(url) : { build_list: [] };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(json) });
  };

  function restore() {
    global.fetch = previousFetch;
    global.api = previousApi;
  }

  return { listCalls, getJSONCalls, restore };
}

// referee_ai.js's default export reads its output target off `this`.
function runRefereeAi(refereeAi, filesObj) {
  return refereeAi.call({ files: () => filesObj || {} });
}

module.exports = { installRefereeFakes, runRefereeAi };
