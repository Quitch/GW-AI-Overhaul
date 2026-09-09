"use strict";

// shared/mod_translations.js: registers GWO with the Mod Translations mod when
// its global is there, and is inert - no call, no throw - when it is not.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const translations = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/mod_translations.js"
);

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

function consoleSpy() {
  const errors = [];
  setGlobal("console", { error: (first) => errors.push(String(first)) });
  return errors;
}

describe("register", () => {
  it("registers GWO's exact identifier and returns the framework's result", () => {
    const calls = [];
    const result = { ok: true, added: 3 };
    const root = {
      ModTranslations: {
        register: (id, options) => {
          calls.push([id, options]);
          return result;
        },
      },
    };

    assert.equal(translations.register(root), result);
    assert.deepEqual(calls, [["com.pa.quitch.gwaioverhaul", undefined]]);
  });

  it("does nothing when the global is absent or has no register function", () => {
    const errors = consoleSpy();

    assert.equal(translations.register({}), undefined);
    assert.equal(translations.register({ ModTranslations: null }), undefined);
    assert.equal(
      translations.register({ ModTranslations: { register: "no" } }),
      undefined
    );
    assert.deepEqual(errors, []);
  });

  it("reports a throwing framework once and still returns undefined", () => {
    const errors = consoleSpy();
    const root = {
      ModTranslations: {
        register: () => {
          throw new Error("boom");
        },
      },
    };

    assert.equal(translations.register(root), undefined);
    assert.deepEqual(errors, ["gwoTranslations: boom"]);
  });

  it("reports a non-Error throw by its value", () => {
    const errors = consoleSpy();
    const root = {
      ModTranslations: {
        register: () => {
          throw "bare";
        },
      },
    };

    assert.equal(translations.register(root), undefined);
    assert.deepEqual(errors, ["gwoTranslations: bare"]);
  });
});
