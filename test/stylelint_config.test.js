"use strict";

// Guards the Chrome 40 CSS profile in stylelint.config.mjs. Every reject case
// pins one thing PA's engine drops on the floor without reporting anything, and
// every accept case pins something it does support - the accept half is what
// catches an over-broad denylist, and several of these rules are fixable, so a
// mis-set one would have `format:css` rewrite working CSS into dead CSS.
//
// Each expectation was verified against a running PA (Chrome/40.0.2214.28) over
// the Coherent inspector. See constraints.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
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
  "ui/mods/com.pa.quitch.gwaioverhaul/__fixture__.css"
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
    "stylelint.config.mjs has invalid options"
  );
  assert.deepEqual(result.parseErrors, []);
  return [...new Set(result.warnings.map((warning) => warning.rule))].sort();
}

async function rejects(code, rule) {
  const fired = await rulesFired(code);
  assert.ok(
    fired.includes(rule),
    `expected ${rule} to reject:\n${code}\ngot: ${fired.join(", ") || "nothing"}`
  );
}

async function accepts(code) {
  assert.deepEqual(await rulesFired(code), [], `expected to pass:\n${code}`);
}

function rule(selector, declarations) {
  return `${selector} {\n${declarations.map((d) => `  ${d};\n`).join("")}}\n`;
}

describe("stylelint config resolution", () => {
  it("resolves ui/ CSS to the .mjs file, with nothing outranking it", async () => {
    // cosmiconfig ranks twenty names above stylelint.config.mjs and searches
    // upward from each file, so any of them, here or under ui/, would silently
    // shadow the whole profile while every other test here still passed.
    assert.deepStrictEqual(
      await stylelint.resolveConfig(FIXTURE),
      await stylelint.resolveConfig(FIXTURE, { configFile: CONFIG_FILE }),
      "stylelint resolves a config other than stylelint.config.mjs for ui/ CSS"
    );
  });
});

describe("CSS the engine drops", () => {
  it("rejects custom properties and var()", async () => {
    await rejects(rule(":root", ["--brand: #fff"]), "property-disallowed-list");
    await rejects(
      rule("a", ["color: var(--brand)"]),
      "function-disallowed-list"
    );
  });

  it("rejects unprefixed @keyframes and animation", async () => {
    await rejects(
      "@keyframes gwo-spin {\n  from {\n    opacity: 0;\n  }\n}\n",
      "at-rule-disallowed-list"
    );
    await rejects(
      rule("a", ["animation: gwo-spin 1s linear"]),
      "property-disallowed-list"
    );
  });

  it("rejects at-rules that postdate the engine", async () => {
    await rejects(
      "@layer base {\n  a {\n    color: #fff;\n  }\n}\n",
      "at-rule-disallowed-list"
    );
    await rejects(
      "@container (min-width: 1px) {\n  a {\n    color: #fff;\n  }\n}\n",
      "at-rule-disallowed-list"
    );
  });

  it("rejects properties that only work prefixed", async () => {
    await rejects(rule("a", ["filter: blur(2px)"]), "property-disallowed-list");
    await rejects(
      rule("a", ['mask-image: url("x.png")']),
      "property-disallowed-list"
    );
    await rejects(rule("a", ["user-select: none"]), "property-disallowed-list");
    await rejects(rule("a", ["appearance: none"]), "property-disallowed-list");
  });

  it("rejects properties with no working form at all", async () => {
    // Both the bare and the -webkit- spelling are dropped by the engine, so
    // neither may be recommended over the other.
    await rejects(rule("a", ["hyphens: auto"]), "property-disallowed-list");
    await rejects(
      rule("a", ["-webkit-hyphens: auto"]),
      "property-disallowed-list"
    );
    await rejects(
      rule("a", ["text-decoration-color: red"]),
      "property-disallowed-list"
    );
    await rejects(
      rule("a", ["-webkit-overflow-scrolling: touch"]),
      "property-disallowed-list"
    );
  });

  it("rejects grid, gap and the independent transforms", async () => {
    await rejects(
      rule("a", ["display: grid"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(rule("a", ["gap: 4px"]), "property-disallowed-list");
    await rejects(
      rule("a", ["grid-template-columns: repeat(2, 1fr)"]),
      "property-disallowed-list"
    );
    await rejects(rule("a", ["translate: 10px"]), "property-disallowed-list");
  });

  it("rejects logical properties", async () => {
    await rejects(
      rule("a", ["margin-inline-start: 4px"]),
      "property-disallowed-list"
    );
    await rejects(rule("a", ["inline-size: 4px"]), "property-disallowed-list");
    await rejects(rule("a", ["inset: 0"]), "property-disallowed-list");
  });

  it("rejects values the parser accepts but layout ignores", async () => {
    // The trap this whole file exists for: CSS.supports() says yes to
    // space-evenly and the box-alignment keywords, getComputedStyle echoes them
    // back, and flex layout falls through to flex-start anyway.
    await rejects(
      rule("a", ["display: flex", "justify-content: space-evenly"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["display: flex", "align-items: start"]),
      "declaration-property-value-disallowed-list"
    );
  });

  it("rejects other unsupported values", async () => {
    await rejects(
      rule("a", ["position: sticky"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["width: fit-content"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["background-clip: text"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["word-break: keep-all"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["overflow: clip"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["cursor: grab"]),
      "declaration-property-value-disallowed-list"
    );
  });

  it("rejects the later alignment keywords the engine drops or ignores", async () => {
    for (const declaration of [
      "justify-content: safe center",
      "justify-content: unsafe center",
      "align-items: first baseline",
      "align-items: last baseline",
      "align-self: unsafe center",
      "align-content: safe center",
    ]) {
      await rejects(
        rule("a", ["display: flex", declaration]),
        "declaration-property-value-disallowed-list"
      );
    }
  });

  it("rejects the box-alignment keywords on align-content too", async () => {
    for (const value of ["space-evenly", "start", "normal"]) {
      await rejects(
        rule("a", ["display: flex", `align-content: ${value}`]),
        "declaration-property-value-disallowed-list"
      );
    }
  });

  it("rejects a banned keyword anywhere in the value", async () => {
    await rejects(
      rule("a", ["overflow: clip visible"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["background-clip: padding-box, text"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["display: flex", "justify-content: safe start"]),
      "declaration-property-value-disallowed-list"
    );
  });

  it("rejects what the plugin's ignore list hides", async () => {
    await rejects(
      rule("a", ["overflow: hidden auto"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["touch-action: pan-left"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["text-indent: 1em hanging"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["word-break: auto-phrase"]),
      "declaration-property-value-disallowed-list"
    );
    await rejects(
      rule("a", ["-webkit-mask-mode: alpha"]),
      "property-disallowed-list"
    );
    // No hand-written entry: this pins that csstree's grammar still covers it.
    await rejects(
      rule("a", ["-webkit-appearance: auto"]),
      "declaration-property-value-no-unknown"
    );
  });

  it("rejects properties the plugin has no matcher for", async () => {
    await rejects(rule("a", ["accent-color: red"]), "property-disallowed-list");
    await rejects(
      rule("a", ["text-wrap: balance"]),
      "property-disallowed-list"
    );
  });

  it("rejects :-webkit-any-link, through the plugin", async () => {
    // doiuse's css-matches-pseudo matches `:-webkit-any` as a substring, so the
    // plugin rejects this whatever the engine does. That is why the config does
    // not recommend it.
    await rejects(
      rule("a:-webkit-any-link", ["color: #fff"]),
      "plugin/no-unsupported-browser-features"
    );
  });

  it("rejects modern functions", async () => {
    await rejects(
      rule("a", ["width: clamp(1px, 2vw, 3px)"]),
      "function-disallowed-list"
    );
    await rejects(
      rule("a", ["width: min(1px, 2px)"]),
      "function-disallowed-list"
    );
    await rejects(
      rule("a", ["color: color-mix(in srgb, red, blue)"]),
      "function-disallowed-list"
    );
    await rejects(
      rule("a", ["background: conic-gradient(red, blue)"]),
      "function-disallowed-list"
    );
  });

  it("rejects modern units", async () => {
    await rejects(rule("a", ["height: 100dvh"]), "unit-disallowed-list");
    await rejects(rule("a", ["width: 10cqw"]), "unit-disallowed-list");
    await rejects(rule("a", ["width: 4q"]), "unit-disallowed-list");
  });

  it("rejects modern colour notation", async () => {
    await rejects(rule("a", ["color: #ff00ff80"]), "color-hex-alpha");
    await rejects(
      rule("a", ["color: rgb(0 0 0 / 50%)"]),
      "color-function-notation"
    );
    await rejects(
      rule("a", ["color: rgba(0, 0, 0, 50%)"]),
      "alpha-value-notation"
    );
    await rejects(
      rule("a", ["color: hsl(120deg, 50%, 50%)"]),
      "hue-degree-notation"
    );
  });

  it("rejects modern selectors", async () => {
    await rejects(
      rule("a:is(.x)", ["color: #fff"]),
      "selector-pseudo-class-disallowed-list"
    );
    await rejects(
      rule("a:focus-within", ["color: #fff"]),
      "selector-pseudo-class-disallowed-list"
    );
    await rejects(
      rule("a:not(.x, .y)", ["color: #fff"]),
      "selector-not-notation"
    );
    await rejects(
      rule("a::placeholder", ["color: #fff"]),
      "selector-pseudo-element-disallowed-list"
    );
  });

  it("rejects media query range syntax", async () => {
    // Inserts without throwing, then normalises to `not all` and never matches.
    await rejects(
      "@media (width >= 600px) {\n  a {\n    color: #fff;\n  }\n}\n",
      "media-feature-range-notation"
    );
  });

  it("rejects multi-keyword display", async () => {
    await rejects(rule("a", ["display: block flow"]), "display-notation");
  });

  it("rejects vendor prefixes the engine does not need", async () => {
    await rejects(
      rule("a", ["-webkit-box-shadow: 0 0 1px #000"]),
      "property-no-vendor-prefix"
    );
    await rejects(
      rule("a", ["-webkit-transition: opacity 1s"]),
      "property-no-vendor-prefix"
    );
    await rejects(
      rule("a", ["display: -webkit-flex"]),
      "value-no-vendor-prefix"
    );
  });
});

describe("CSS the engine supports", () => {
  it("accepts the prefixed forms that are the only ones that work", async () => {
    await accepts(
      "@-webkit-keyframes gwo-fade-in {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n"
    );
    await accepts(
      "@-webkit-keyframes gwo-fade-out {\n  0% {\n    opacity: 1;\n  }\n\n  100% {\n    opacity: 0;\n  }\n}\n"
    );
    await accepts(rule("a", ["-webkit-animation: gwo-fade-in 1s linear"]));
    await accepts(rule("a", ["-webkit-filter: brightness(1.2)"]));
    await accepts(
      rule("a", [
        '-webkit-mask-image: url("x.png")',
        "-webkit-mask-size: cover",
      ])
    );
    await accepts(rule("a", ["-webkit-user-select: none"]));
    await accepts(rule("a", ["-webkit-appearance: none"]));
    await accepts(rule("a", ["-webkit-background-clip: text"]));
    await accepts(rule("a", ["-webkit-clip-path: circle(50%)"]));
    await accepts(rule("a", ["-webkit-column-count: 2"]));
    await accepts(rule("a", ["width: -webkit-fit-content"]));
    await accepts(rule("a", ["transition: -webkit-filter 0.2s"]));
    await accepts(rule("a", ["cursor: -webkit-grab"]));
    await accepts(rule("a", [`cursor: url("hand.png") 4 4, -webkit-grab`]));
    await accepts(rule("a", ["border-image-repeat: space"]));
    await accepts(rule("a", [`-webkit-mask-box-image: url("a.png") 10`]));
    await accepts(rule("a", ["-webkit-text-fill-color: red"]));
    await accepts(rule("a", ["display: -webkit-box", "-webkit-line-clamp: 2"]));
    await accepts(rule("a::-webkit-input-placeholder", ["color: #fff"]));
    await accepts(rule("a::-webkit-scrollbar", ["width: 4px"]));
  });

  it("accepts the unprefixed forms that do not need a prefix", async () => {
    // Chrome 40 has all of these bare, which is why their -webkit- twins are
    // rejected above even though the base game ships them in bulk.
    await accepts(rule("a", ["transition: opacity 1s"]));
    await accepts(rule("a", ["transform: translate(1px, 1px)"]));
    await accepts(rule("a", ["box-shadow: 0 0 1px #000"]));
    await accepts(rule("a", ["border-radius: 2px"]));
    await accepts(rule("a", ["box-sizing: border-box"]));
    await accepts(rule("a", ["object-fit: cover"]));
    await accepts(rule("a", ["will-change: opacity"]));
    await accepts(rule("a", ["touch-action: none"]));
    await accepts(rule("a", ['border-image: url("x.png") 1']));
    await accepts(rule("a", ["text-decoration: none"]));
    await accepts(rule("a", ["text-indent: 5px"]));
    await accepts(rule("a", ["word-break: break-all"]));
  });

  it("accepts the flexbox the whole UI is built on", async () => {
    await accepts(
      rule("a", [
        "display: flex",
        "flex-direction: column",
        "flex: 1 1 0",
        "align-self: flex-start",
        "justify-content: space-between",
      ])
    );
    await accepts(
      rule("a", ["display: flex", "justify-content: space-around"])
    );
    await accepts(rule("a", ["display: flex", "flex-flow: row wrap"]));
    // The keyword matchers must not catch the flex- spellings.
    await accepts(rule("a", ["display: flex", "justify-content: flex-end"]));
    await accepts(rule("a", ["display: flex", "align-content: flex-start"]));
    await accepts(rule("a", ["display: flex", "align-content: space-between"]));
    await accepts(rule("a", ["display: flex", "align-content: stretch"]));
  });

  it("accepts legacy colour notation and calc", async () => {
    await accepts(rule("a", ["color: rgba(0, 179, 255, 0.5)"]));
    await accepts(rule("a", ["color: hsl(120, 50%, 50%)"]));
    await accepts(rule("a", ["color: #0b1a1f"]));
    await accepts(rule("a", ["width: calc(100% - 10px)"]));
  });

  it("accepts the units the mod actually uses", async () => {
    await accepts(rule("a", ["width: 96vw", "max-height: 94vh"]));
    await accepts(rule("a", ["font-size: 13px", "padding: 0 0 0 4px"]));
  });

  it("accepts the selectors the engine has", async () => {
    await accepts(rule("a:not(.x)", ["color: #fff"]));
    await accepts(rule("a::first-letter", ["text-transform: uppercase"]));
    await accepts(rule("a::before", ["content: attr(data-x)"]));
    await accepts(rule("a::backdrop", ["background: #000"]));
    await accepts(rule('a[data-x="y"] > .b + .c', ["color: #fff"]));
  });

  it("accepts the at-rules the engine has", async () => {
    await accepts(
      "@media (min-width: 600px) {\n  a {\n    color: #fff;\n  }\n}\n"
    );
    await accepts(
      "@supports (display: flex) {\n  a {\n    display: flex;\n  }\n}\n"
    );
    await accepts(
      '@font-face {\n  font-family: Sansation;\n  src: url("x.woff") format("woff");\n}\n'
    );
  });

  it("accepts the longhands that must not be collapsed", async () => {
    // The shorthand this rule would otherwise propose is Chrome 68 for overflow
    // and Chrome 87 for inset - both dropped by the engine.
    await accepts(rule("a", ["overflow-x: hidden", "overflow-y: auto"]));
    await accepts(rule("a", ["overflow: hidden"]));
    await accepts(
      rule("a", [
        "position: absolute",
        "top: 0",
        "right: 0",
        "bottom: 0",
        "left: 0",
      ])
    );
    await accepts(
      rule("a", ["align-content: center", "justify-content: center"])
    );
  });
});
