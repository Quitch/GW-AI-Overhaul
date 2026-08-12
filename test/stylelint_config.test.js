"use strict";

// Guards the Chromium 151 CSS profile in stylelint.config.mjs. Every reject
// case pins syntax the engine drops or the profile forbids, and every accept
// case pins something it must keep allowing - the accept half is what catches
// an over-broad denylist, and several of these rules are fixable, so a mis-set
// one would have `format:css` rewrite working CSS into dead CSS.
//
// Expectations come from caniuse/MDN for Chromium 151; the live CEF probe pass
// re-verifies the rendering claims when a build exists. See
// docs/cef-migration.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
// stylelint 17 is ESM-only; Node's require(ESM) interop is what lets a
// CommonJS test load it. See its "exports" field and .nvmrc.
const stylelint = require("stylelint");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");

const CONFIG_FILE = path.join(REPO_ROOT, "stylelint.config.mjs");
// Named under ui/ so any future path-scoped override block applies as it would
// in anger.
const FIXTURE = path.join(
  REPO_ROOT,
  "ui/mods/com.pa.quitch.gwaioverhaul/__fixture__.css",
);

// Fixtures must be Prettier-shaped - one declaration per line, trailing newline
// - or they trip declaration-block-single-line-max-declarations and report a
// rule the case was not about.
async function rulesFired(code) {
  const { results } = await stylelint.lint({
    code,
    codeFilename: FIXTURE,
    configFile: CONFIG_FILE,
  });
  const [result] = results;
  assert.deepEqual(
    result.invalidOptionWarnings,
    [],
    "stylelint.config.mjs has invalid options",
  );
  assert.deepEqual(result.parseErrors, []);
  return [...new Set(result.warnings.map((warning) => warning.rule))].sort();
}

async function rejects(code, rule) {
  const fired = await rulesFired(code);
  assert.ok(
    fired.includes(rule),
    `expected ${rule} to reject:\n${code}\ngot: ${fired.join(", ") || "nothing"}`,
  );
}

async function accepts(code) {
  assert.deepEqual(await rulesFired(code), [], `expected to pass:\n${code}`);
}

function rule(selector, declarations) {
  return `${selector} {\n${declarations.map((d) => `  ${d};\n`).join("")}}\n`;
}

describe("stylelint config resolution", () => {
  it("is the .mjs file, with no .stylelintrc.json left to outrank it", () => {
    // cosmiconfig ranks .stylelintrc.json third and stylelint.config.mjs last,
    // so a resurrected JSON would silently shadow the whole profile while every
    // other test here still passed.
    assert.ok(fs.existsSync(CONFIG_FILE));
    assert.ok(!fs.existsSync(path.join(REPO_ROOT, ".stylelintrc.json")));
  });
});

describe("CSS the profile forbids", () => {
  it("rejects syntax no Blink release ever shipped", async () => {
    await rejects(
      "@custom-media --small (max-width: 30em);\n@media (--small) {\n  a {\n    color: #fff;\n  }\n}\n",
      "at-rule-disallowed-list",
    );
    await rejects(
      '@document url("https://example.com/") {\n  a {\n    color: #fff;\n  }\n}\n',
      "at-rule-disallowed-list",
    );
    await rejects(
      rule("a", ["-webkit-overflow-scrolling: touch"]),
      "property-disallowed-list",
    );
    await rejects(
      rule("a", ["text-size-adjust: none"]),
      "property-disallowed-list",
    );
    await rejects(
      rule("a", ["background: element(#x)"]),
      "function-disallowed-list",
    );
    await rejects(
      rule("a:matches(.x)", ["color: #fff"]),
      "selector-pseudo-class-disallowed-list",
    );
    await rejects(
      rule("a::grammar-error", ["color: #fff"]),
      "selector-pseudo-element-disallowed-list",
    );
  });

  it("rejects features the engine lacks, via the caniuse net", async () => {
    // Safari-only; caniuse marks every Chrome "n", which is what proves the
    // plugin is wired to .browserslistrc at all.
    await rejects(
      rule("a", ["hanging-punctuation: first"]),
      "plugin/no-unsupported-browser-features",
    );
  });

  it("rejects vendor prefixes the engine no longer needs", async () => {
    await rejects(
      rule("a", ["-webkit-filter: brightness(1.2)"]),
      "property-no-vendor-prefix",
    );
    await rejects(
      rule("a", ['-webkit-mask-image: url("x.png")']),
      "property-no-vendor-prefix",
    );
    await rejects(
      rule("a", ["-webkit-user-select: none"]),
      "property-no-vendor-prefix",
    );
    await rejects(
      rule("a", ["-webkit-box-shadow: 0 0 1px #000"]),
      "property-no-vendor-prefix",
    );
    await rejects(
      "@-webkit-keyframes gwo-fade-in {\n  from {\n    opacity: 0;\n  }\n}\n",
      "at-rule-no-vendor-prefix",
    );
    await rejects(
      rule("a::-webkit-input-placeholder", ["color: #fff"]),
      "selector-no-vendor-prefix",
    );
  });

  it("rejects legacy colour notation", async () => {
    // The engine still parses all of these; standard-config keeps the repo on
    // one modern spelling so format:css converges instead of flip-flopping.
    await rejects(
      rule("a", ["color: rgba(0, 0, 0, 0.5)"]),
      "color-function-notation",
    );
    await rejects(
      rule("a", ["color: rgb(0 0 0 / 0.5)"]),
      "alpha-value-notation",
    );
  });

  it("rejects legacy media query notation", async () => {
    await rejects(
      "@media (min-width: 600px) {\n  a {\n    color: #fff;\n  }\n}\n",
      "media-feature-range-notation",
    );
  });

  it("rejects house-style violations", async () => {
    await rejects(
      rule(".CamelCase", ["color: #fff"]),
      "selector-class-pattern",
    );
    await rejects(rule("#CamelCase", ["color: #fff"]), "selector-id-pattern");
  });
});

describe("CSS the engine supports", () => {
  it("accepts the unprefixed forms that used to need a prefix", async () => {
    await accepts(
      "@keyframes gwo-fade-in {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n",
    );
    await accepts(rule("a", ["animation: gwo-fade-in 1s linear"]));
    await accepts(rule("a", ["filter: brightness(1.2)"]));
    await accepts(rule("a", ['mask-image: url("x.png")', "mask-size: cover"]));
    await accepts(rule("a", ["user-select: none"]));
    await accepts(rule("a", ["appearance: none"]));
    await accepts(rule("a", ["clip-path: circle(50%)"]));
    await accepts(rule("a::placeholder", ["color: #fff"]));
  });

  it("accepts custom properties and modern functions", async () => {
    await accepts(rule(":root", ["--gwo-brand: #fff"]));
    await accepts(rule("a", ["color: var(--gwo-brand)"]));
    await accepts(rule("a", ["width: clamp(1px, 2vw, 3px)"]));
    await accepts(rule("a", ["width: min(1px, 2px)"]));
    await accepts(rule("a", ["color: color-mix(in srgb, red, blue)"]));
    await accepts(rule("a", ["background: conic-gradient(red, blue)"]));
  });

  it("accepts grid, gap and the independent transforms", async () => {
    await accepts(
      rule("a", [
        "display: grid",
        "grid-template-columns: repeat(2, 1fr)",
        "gap: 4px",
      ]),
    );
    await accepts(rule("a", ["translate: 10px", "rotate: 45deg"]));
  });

  it("accepts logical properties and inset", async () => {
    await accepts(rule("a", ["margin-inline-start: 4px"]));
    await accepts(rule("a", ["inline-size: 4px"]));
    await accepts(rule("a", ["position: absolute", "inset: 0"]));
  });

  it("accepts the flex values Chrome 40 used to silently ignore", async () => {
    await accepts(
      rule("a", ["display: flex", "justify-content: space-evenly"]),
    );
    await accepts(rule("a", ["display: flex", "align-items: start"]));
    await accepts(rule("a", ["position: sticky", "top: 0"]));
    await accepts(rule("a", ["width: fit-content"]));
    await accepts(rule("a", ["overflow: clip"]));
  });

  it("accepts modern at-rules", async () => {
    await accepts(
      "@container (width >= 1px) {\n  a {\n    color: #fff;\n  }\n}\n",
    );
    await accepts("@layer base {\n  a {\n    color: #fff;\n  }\n}\n");
    await accepts(
      "@media (width >= 600px) {\n  a {\n    color: #fff;\n  }\n}\n",
    );
    await accepts(
      "@supports (display: flex) {\n  a {\n    display: flex;\n  }\n}\n",
    );
    await accepts(
      '@font-face {\n  font-family: Sansation;\n  src: url("x.woff") format("woff");\n}\n',
    );
  });

  it("accepts modern selectors", async () => {
    await accepts(rule("a:is(.x)", ["color: #fff"]));
    await accepts(rule("a:has(> .x)", ["color: #fff"]));
    await accepts(rule("a:focus-within", ["color: #fff"]));
    await accepts(rule("a:not(.x, .y)", ["color: #fff"]));
    await accepts(rule('a[data-x="y"] > .b + .c', ["color: #fff"]));
  });

  it("accepts modern units and colour", async () => {
    await accepts(rule("a", ["height: 100dvh", "width: 10cqw"]));
    await accepts(rule("a", ["color: rgb(0 179 255 / 50%)"]));
    await accepts(rule("a", ["color: oklch(70% 0.1 200deg)"]));
    await accepts(rule("a", ["color: #ff00ff80"]));
  });

  it("accepts the flexbox the whole UI is built on", async () => {
    await accepts(
      rule("a", [
        "display: flex",
        "flex-direction: column",
        "flex: 1 1 0",
        "align-self: flex-start",
        "justify-content: space-between",
      ]),
    );
    await accepts(rule("a", ["display: flex", "flex-flow: row wrap"]));
  });

  it("accepts border-image despite its partial caniuse mark", async () => {
    // Partial only over `fill` and `repeat: space`; the base game leans on it
    // for every panel frame, so the profile must not start flagging it.
    await accepts(rule("a", ['border-image: url("x.png") 1']));
  });
});
