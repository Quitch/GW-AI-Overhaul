"use strict";

// The global $/api wiring referee_ai.js's file-discovery engine needs, shared by the
// test files that drive it. Each installer returns its own restore function, so a
// caller is free to sequence it with whatever else its afterEach has to undo.
//
// Calls are always recorded. A test that does not care simply ignores the arrays;
// one that does gets them without a second, subtly different, local installer.

const { createFakeJQuery, createFakeApi } = require("./fake-jquery.js");

// options.fileListByPath: { [aiPath]: string[] } - what api.file.list resolves to.
// options.listFiles: (path) => string[] - takes precedence, for tests that derive the
//   listing from the requested path rather than enumerating every path up front.
// options.getJSON: (url) => json - defaults to an empty build_list.
function installRefereeFakes(options) {
  const opts = options || {};
  const previousDollar = global.$;
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

  global.$ = createFakeJQuery({
    getJSON: (url) => {
      getJSONCalls.push(url);
      return opts.getJSON ? opts.getJSON(url) : { build_list: [] };
    },
  });

  function restore() {
    global.$ = previousDollar;
    global.api = previousApi;
  }

  return { listCalls, getJSONCalls, restore };
}

// referee_ai.js's default export reads its output target off `this`.
function runRefereeAi(refereeAi, filesObj) {
  return refereeAi.call({ files: () => filesObj || {} });
}

module.exports = { installRefereeFakes, runRefereeAi };
