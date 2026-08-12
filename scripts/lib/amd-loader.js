"use strict";

// Loads GWO's shipped AMD modules under plain Node, without the game's Chromium
// UI runtime. Safe because shipped files only touch engine globals inside function
// bodies, never at define time. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { UI_SCHEME } = require("./scheme.js");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GW_ROOT = path.join(REPO_ROOT, "ui", "main", "game", "galactic_war");

// Namespace -> directory under GW_ROOT, where the two differ. Bare ids are the
// engine's own relative-id scheme, so one may resolve to a GWO override or fall
// through to an unshipped base-game file. See testing.md, "NOT_SHIPPED".
const BARE_ID_NAMESPACES = {
  cards: "cards",
  shared: path.join("shared", "js"),
};

class NotShippedError extends Error {
  constructor(message) {
    super(message);
    this.code = "NOT_SHIPPED";
  }
}

const moduleRegistry = new Map();
const stubbedModules = new Map();
const loadStack = [];
let globalsInstalled = false;

// Opt-in escape hatch from NOT_SHIPPED. `id` is matched against the dependency
// string exactly as the define() array writes it. See testing.md.
function registerModuleStub(id, exports) {
  stubbedModules.set(id, exports);
}

function resolveBareId(entry) {
  const slash = entry.indexOf("/");
  const namespace = slash === -1 ? entry : entry.slice(0, slash);
  const rest = slash === -1 ? "" : entry.slice(slash + 1);
  const dir = BARE_ID_NAMESPACES[namespace];

  if (dir) {
    const candidate = path.join(GW_ROOT, dir, rest + ".js");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new NotShippedError(
    'amd-loader: "' +
      entry +
      "\" is not shipped by this mod (likely a base-game module GWO doesn't override) - " +
      "not resolvable without the game's own base install, which CI does not have.",
  );
}

function resolveEntryPath(entry) {
  if (entry.startsWith(UI_SCHEME)) {
    const fsPath = path.resolve(REPO_ROOT, entry.slice(UI_SCHEME.length));
    if (!fs.existsSync(fsPath)) {
      throw new Error(
        'amd-loader: "' +
          entry +
          '" resolved to a path that does not exist: ' +
          fsPath,
      );
    }
    return fsPath;
  }

  // A filesystem path, how callers pass an enumerated entry point - never a
  // bare AMD id, which is always namespace-relative like "cards/x".
  if (path.isAbsolute(entry)) {
    if (!fs.existsSync(entry)) {
      throw new Error("amd-loader: path does not exist: " + entry);
    }
    return entry;
  }

  return resolveBareId(entry);
}

// The AMD "module" special dependency. Only ever used here to recover a card's own
// bare id, so a GW_ROOT-relative path suffices - not full RequireJS semantics.
function moduleMetaFor(fsPath) {
  const base = fsPath.startsWith(GW_ROOT) ? GW_ROOT : REPO_ROOT;
  const id = path
    .relative(base, fsPath)
    .replace(/\.js$/, "")
    .split(path.sep)
    .join("/");
  return { id: id };
}

// Text/localisation globals only. api/model/ko/$/createjs/window/requireGW are
// deliberately left undefined, so a define-time reference fails loudly rather
// than passing against a fake engine.
function installGlobals() {
  if (globalsInstalled) {
    return;
  }

  global._ = require("lodash");
  global.loc = function (value) {
    return value;
  };
  global.i18n = function (value) {
    return value;
  };
  global.locTree = function (value) {
    return value;
  };
  global.parse = function (value) {
    return value;
  };

  global.define = function (a, b) {
    const currentPath = loadStack[loadStack.length - 1];
    if (!currentPath) {
      throw new Error(
        "amd-loader: define() was called outside of a loadCouiModule()/requireShippedModule() load",
      );
    }

    let exported;
    if (typeof a === "function" && b === undefined) {
      exported = a();
    } else if (Array.isArray(a)) {
      const deps = a.map(function (dep) {
        if (dep === "module") {
          return moduleMetaFor(currentPath);
        }
        if (dep === "require" || dep === "exports") {
          throw new Error(
            'amd-loader: AMD special dependency "' +
              dep +
              '" is not supported yet (seen in ' +
              currentPath +
              ")",
          );
        }
        return loadCouiModule(dep);
      });
      exported = b.apply(null, deps);
    } else {
      exported = a;
    }

    moduleRegistry.set(currentPath, exported);
  };

  globalsInstalled = true;
}

// Returns the define() factory's return value. Contrast requireShippedModule below.
function loadCouiModule(entry) {
  installGlobals();

  if (stubbedModules.has(entry)) {
    return stubbedModules.get(entry);
  }

  const fsPath = resolveEntryPath(entry);
  if (moduleRegistry.has(fsPath)) {
    return moduleRegistry.get(fsPath);
  }
  if (loadStack.includes(fsPath)) {
    throw new Error(
      "amd-loader: circular define() dependency at " +
        fsPath +
        " (stack: " +
        loadStack.concat(fsPath).join(" -> ") +
        ")",
    );
  }

  loadStack.push(fsPath);
  try {
    require(fsPath); // executes the file top-to-bottom, triggering its define() call
  } finally {
    loadStack.pop();
  }

  if (!moduleRegistry.has(fsPath)) {
    throw new Error(
      "amd-loader: " + fsPath + " did not call define() while loading",
    );
  }
  return moduleRegistry.get(fsPath);
}

// The target's own `module.exports` via a plain Node require(), not its define()
// return value. Only meaningful for a file carrying the test-only hook.
function requireShippedModule(entry) {
  installGlobals();

  const fsPath = resolveEntryPath(entry);
  loadStack.push(fsPath);
  try {
    return require(fsPath);
  } finally {
    loadStack.pop();
  }
}

module.exports = {
  REPO_ROOT: REPO_ROOT,
  installGlobals: installGlobals,
  loadCouiModule: loadCouiModule,
  registerModuleStub: registerModuleStub,
  requireShippedModule: requireShippedModule,
};
