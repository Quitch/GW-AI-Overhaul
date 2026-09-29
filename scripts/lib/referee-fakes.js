"use strict";

// The $/api wiring referee_ai.js's file discovery needs. Each installer returns
// its own restore function. Calls are always recorded, so no test needs a second,
// subtly different, local installer.

const { createFakeJQuery, createFakeApi } = require("./fake-jquery.js");

// options.fileListByPath: { [aiPath]: string[] } - what api.file.list resolves to.
// options.listFiles: (path) => string[] - takes precedence, for tests that derive the
//   listing from the requested path rather than enumerating every path up front.
// options.getJSON: (url) => json.
// A path or URL no option answers rejects, as in fake-jquery.js.
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
        if (opts.listFiles) {
          return Promise.resolve(opts.listFiles(path));
        }
        if (opts.fileListByPath && Object.hasOwn(opts.fileListByPath, path)) {
          return Promise.resolve(opts.fileListByPath[path]);
        }
        return Promise.reject(
          new Error("referee-fakes: no file listing configured for " + path)
        );
      },
    },
  });

  global.$ = createFakeJQuery({
    getJSON: (url) => {
      getJSONCalls.push(url);
      if (!opts.getJSON) {
        throw new Error(
          "referee-fakes: no getJSON resolver configured for " + url
        );
      }
      return opts.getJSON(url);
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
