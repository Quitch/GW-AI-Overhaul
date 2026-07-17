"use strict";

// Loads GWO's shipped AMD-style modules (`define([...deps], factory)`) under plain
// Node so they can be validated/tested without the game's Chromium UI runtime.
//
// The shipped files only reference engine globals (api/model/ko/$/createjs/window/
// requireGW) *inside function bodies*, never at the top level of a define() factory -
// so simply loading (evaluating) any of them is safe with no engine mocks. Actually
// *calling* their exported methods is a different story and is out of scope here.

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const COUI_PREFIX = "coui://";
const GW_ROOT = path.join(REPO_ROOT, "ui", "main", "game", "galactic_war");

// Bare (non-coui://) dependency ids are the base game engine's own relative-id AMD
// scheme (e.g. a card depending on "cards/gwc_start" or "shared/gw_common"). GWO's
// file-shadowing means a given id may resolve to a GWO override or fall through to
// an unshipped base-game file - and this repo/CI has no access to the base game
// install, so "falls through" is a hard boundary, not something to chase further.
// Namespace -> directory-under-GW_ROOT, when it differs from the namespace itself.
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
const loadStack = [];
let globalsInstalled = false;

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
      "not resolvable without the game's own base install, which CI does not have."
  );
}

function resolveEntryPath(entry) {
  if (entry.startsWith(COUI_PREFIX)) {
    const fsPath = path.resolve(REPO_ROOT, entry.slice(COUI_PREFIX.length));
    if (!fs.existsSync(fsPath)) {
      throw new Error(
        'amd-loader: "' +
          entry +
          '" resolved to a path that does not exist: ' +
          fsPath
      );
    }
    return fsPath;
  }

  // A plain filesystem path (how callers pass an entry point enumerated via
  // fs.readdir/glob, as opposed to a dependency string found *inside* a define()
  // array) - never a bare AMD id, which is always namespace-relative like "cards/x".
  if (path.isAbsolute(entry)) {
    if (!fs.existsSync(entry)) {
      throw new Error("amd-loader: path does not exist: " + entry);
    }
    return entry;
  }

  return resolveBareId(entry);
}

// The AMD spec's "module" special dependency: a loader-injected object exposing the
// requesting file's own module id. The only thing observed in use across this repo
// is `module.id.substring(module.id.lastIndexOf("/") + 1)` to recover a card's own
// bare id, so a path relative to GW_ROOT (falling back to REPO_ROOT) is sufficient -
// exact RequireJS module-id semantics elsewhere aren't needed.
function moduleMetaFor(fsPath) {
  const base = fsPath.startsWith(GW_ROOT) ? GW_ROOT : REPO_ROOT;
  const id = path
    .relative(base, fsPath)
    .replace(/\.js$/, "")
    .split(path.sep)
    .join("/");
  return { id: id };
}

// Passthrough stubs for the mod's text/localization globals - safe no-ops for a
// structural check. Deliberately NOT stubbing api/model/ko/$/createjs/window/
// requireGW: those should only ever be touched inside function bodies (call-time,
// not define-time), and leaving them undefined makes any file that violates that
// fail loudly and specifically, instead of silently passing with a fake engine.
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
        "amd-loader: define() was called outside of a loadCouiModule()/requireShippedModule() load"
      );
    }

    let exported;
    if (typeof a === "function" && b === undefined) {
      // define(function () {...})
      exported = a();
    } else if (Array.isArray(a)) {
      // define([...deps], function (dep1, dep2) {...})
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
              ")"
          );
        }
        return loadCouiModule(dep);
      });
      exported = b.apply(null, deps);
    } else {
      // define({...})
      exported = a;
    }

    moduleRegistry.set(currentPath, exported);
  };

  globalsInstalled = true;
}

// Returns whatever the target file's define(...) factory returned - the normal way
// to pull in an AMD module's public interface (e.g. specs.js, units.js, a card).
function loadCouiModule(entry) {
  installGlobals();

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
        ")"
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
      "amd-loader: " + fsPath + " did not call define() while loading"
    );
  }
  return moduleRegistry.get(fsPath);
}

// Returns the target file's own `module.exports` via a plain Node require(), rather
// than its define() return value. Only meaningful for files carrying a deliberate,
// additive, dead-in-production test-export hook (see referee_ai.js's
// `if (typeof module !== "undefined" && module.exports) {...}` block) - use this to
// reach internals that define() itself never returns to the game runtime.
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
  requireShippedModule: requireShippedModule,
};
