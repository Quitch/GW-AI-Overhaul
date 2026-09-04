# Runtime constraints

PA renders its UI with Coherent UI, which embeds **Chrome 40**. Shipped code has
to run there, unbundled and untranspiled. This page is the answer to "may I use
X?".

Scope: `ui/**` only. `scripts/**` and `test/**` are Node-only tooling and are
exempt — `eslint.config.mjs` has a separate override block for them.

## The whitelist, not a denylist

`eslint.config.mjs` applies `eslint-plugin-es-x`'s `flat/restrict-to-es5` to
`ui/**`, forbidding **all** post-ES5 syntax and builtins, and then switches off the
individual rules for what Chrome 40 actually supports.

That list is **exhaustive rather than as-needed**: it covers every post-ES5 feature
Chrome 40 has, whether this repo uses it or not. So it doubles as the reference —
**no entry means no.**

Each entry carries the Chrome release that shipped the feature, taken from
`@mdn/browser-compat-data` and then verified feature-by-feature against a running
PA (Chrome/40.0.2214.28) over the DevTools protocol. A rule qualifies only if that
version is ≤ 40 _and_ the engine really has it.

Broadly available:

- `for...of`, generators, `Promise`
- `Map`, `Set`, `WeakMap`, `WeakSet`, `Symbol`, typed arrays
- All ES2015 `Math.*` and `Number.*` additions
- `Object.is`, `Object.setPrototypeOf`, `Object.getOwnPropertySymbols`
- `String.prototype.normalize`
- `Array.prototype.entries` and `keys` — but **not** `values`, which is Chrome 66

Not available, and the ones people reach for by reflex:

- `let` and `const`
- Arrow functions
- Template literals
- `class`
- Destructuring, spread, default parameters

A parse error takes out the **whole script**, not just the offending line, so one
arrow function silently disables an entire scene's worth of mod code.

## Four rules restated as explicit errors

These would already be caught, but are spelled out with reasons because the
reasoning is not obvious:

- **`no-block-scoped-variables`** (`let`/`const`) — Chrome 41, and strict-mode only
  even there. `const` stays out regardless, because Chrome 40 lacks ES2015
  per-iteration loop bindings.
- **`no-block-scoped-functions`** — block scoping for function declarations is
  Chrome 49. Chrome 40 hoists them out of the block under legacy rules.
- **`no-string-prototype-startswith`** and **`-endswith`** — PA's engine _does_
  have these, but only in **one-argument** form. It ignores the position argument
  and returns a wrong answer rather than throwing, so a feature detect is actively
  misleading. (PA installs its own polyfill in
  `ui/main/shared/js/helpers.js`, which is where the one-argument behaviour comes
  from.) Use `_.startsWith` / `_.endsWith`.

`ecmaVersion` is held at **6** as a backstop, so anything past ES2015 also
parse-errors. It cannot be lowered to 5: `for...of` would then be an unsuppressible
parse error that silently skips every other rule in the file.

## Available libraries

Globals in every scene: **lodash** (`_`), **jQuery** (`$`), **Knockout** (`ko`),
**createjs**, **`Math.seedrandom`**. `ui/main/shared/js/thirdparty` holds what else the
engine ships.

`Math.seedrandom` exists in the game but **not** in Node, so nothing on a testable path
can use it — hence `shared/gwo_rng.js`, which carries its own PRNG. See
[`galaxy.md`](galaxy.md), "Why a bespoke PRNG".

Lodash is the workaround for most missing builtins. Two of its behaviours are
relied on deliberately:

- `_.sortBy` is **stable**, which is what keeps non-host clients in their existing
  order during colour allocation.
- `_.random`'s bounds are **both inclusive**, so `_.random(100)` has 101 outcomes.
  A chance of N would fire at (N+1)/101, meaning a 0% setting still landed roughly
  one roll in a hundred until that was accounted for. `gwoRng.int` matches this.

Lodash also captures `nativeRandom = Math.random` at load, so reseeding `Math.random`
cannot make `_.sample`/`_.shuffle`/`_.random` deterministic — war generation draws from
`shared/gwo_rng.js` instead.

jQuery 2.x has a trap that has bitten this repo three times: **it does not convert
a `throw` inside a deferred callback into a rejection.** A `TypeError` there escapes
`.fail()` entirely — no retry, and the caller hangs. Callbacks that can fail must
`reject` explicitly rather than throwing or falling through.

Also: `$.when()` and `deferred.then` identify a promise by a `promise` **method**.
Neither an engine promise — what every `api.*` call returns — nor a native one has
got one, so both are read as plain values and neither is ever waited for, with no
error and no log line. `shared/gwo_promise.js` adapts one into a jQuery promise, and
`scripts/lib/fake-jquery.js` applies the same test, so a shipped file that skips the
adapter fails a test rather than skipping the wait in a war. Audited 2026-08-31:
every other `$.when` in the mod is handed a jQuery promise or a plain value.

And `.then` on a jQuery promise returns a _new_ promise each time (which the AI tree
cache depends on).

`requireGW` is configured `waitSeconds: 0`, so a module that never arrives never
errors either — the callback simply never fires. A tally that counts callbacks
must count failures too, or the promise it gates is never settled at all.

## Where a defensive check belongs

A guard marks a **trust boundary**, so its presence should tell a reader that the
data came from somewhere GWO does not control. Adding one anywhere else costs
that signal, and buys nothing: a check on a value GWO itself built moments
earlier cannot prevent a crisis, only hide one that has already happened, turning
a stack trace into a war that silently plays wrong.

Guard when the data is:

- **Third-party** — a card object and its methods, `addMods`/`addAIMods`
  descriptors, `model.gwo*` entries, a registered loadout bank, a system
  template. The validators cover shipped cards only ([`tech-cards.md`](tech-cards.md)).
- **Remote** — an operator payload from another peer ([`coop.md`](coop.md)).
- **Persisted** — an older GWO's save, or user-writable `localStorage`. Name the
  version the field appeared in, as `shared/deal.js` does.
- **Scene- or mod-conditional** — a symbol genuinely absent from a scene the
  module also loads into, or a base path another mod may own.
- **Optional by contract** — `rng` on `deal()`, `keep`/`discard`.

Do not guard a hard invariant, re-check what a named gate upstream already
validated, or write a half-guard — `card.deal && card.deal(…)` followed by an
unguarded read of the result is worse than neither, because it advertises a
safety it does not provide.

`gw_play/gwo_panel.js` is the calibration: it walks
`model.game() → galaxy() → stars()[origin()].system()` unguarded, then checks
`_.isPlainObject(originSystem.gwaio)` — base game trusted, the field an old save
may lack checked.

The two shapes that satisfy this rather than scattering checks are a **named
pre-flight gate** that refuses the whole operation with a diagnostic
(`gw_play/per_player_tech.js`), and a **per-item `try`/`catch`** so one bad entry
in a batch is skipped rather than aborting the rest (`shared/specs.js`).

That second shape is not optional where third-party code is _called_ rather than
read, because of the jQuery trap above: every such call site in this mod sits
inside a deferred or `requireGW` callback, past the scene-entry `try`, where a
throw is not an error but a permanent hang.

## Function scoping, and Sonar S7721

Keep module-private helpers **inside** the `define(...)` factory.

In PA's RequireJS runtime a file-top-level declaration becomes a `window` global.
Hoisting to the "outer scope" that Sonar's `javascript:S7721` wants therefore leaks
a global for no gain — the factory runs once anyway. S7721 is accepted and scoped
out of `ui/**` in `sonar-project.properties`; it stays active for `scripts/**` and
`test/**`.

When a base-game-shadowed module needs its logic tested, extract it into a measured
sibling module rather than hoisting helpers to file top level. See
[`shadowing.md`](shadowing.md).

## CSS

Same problem as the ES5 whitelist, and worse in one way: an unsupported CSS
declaration is not a parse error, it is **silently dropped**. No console message,
no failed rule — the page just renders wrong.

`stylelint.config.mjs` is the reference, one commented entry per rule, exactly as
`eslint.config.mjs` is for JS. It works through two nets:

- **`.browserslistrc` + `stylelint-no-unsupported-browser-features`** — checks every
  declaration against caniuse for `chrome 40`. This is the automatic half.
- **Hand-written rules** — for what the plugin structurally cannot see: at-rules,
  selectors, layout-level behaviour, and the rules `stylelint-config-standard`
  otherwise _forces_ into syntax the engine rejects.

Be honest about the difference from the JS side: **the CSS denylists are curated,
not exhaustive.** ES5-vs-Chrome-40 is a finite gap that can be enumerated;
CSS-since-2015 is not. The plugin is the exhaustive half; the hand-written rules are
the high-traffic set plus everything the plugin misses. "No entry means no" is a
promise the JS config keeps and this one cannot.

Every Chrome number in that file was verified against a running PA
(Chrome/40.0.2214.28) over the Coherent inspector — `PA.exe --coherent_port=9999`,
then `CSS.supports()` and a layout round-trip per feature. Several results
contradicted caniuse, so do not "correct" an entry from MDN alone.

### The four that catch people

- **`filter` is Chrome 53.** Only `-webkit-filter` does anything.
- **`animation` and `@keyframes` are Chrome 43.** Only `-webkit-animation` and
  `@-webkit-keyframes` work. The base game ships 41 prefixed and zero unprefixed.
- **`mask-*` is Chrome 120**, `user-select` 54, `appearance` 84 — all `-webkit-` only.
- **`justify-content: space-evenly` parses, computes, and does nothing.**
  `CSS.supports()` returns `true` and `getComputedStyle` echoes the value back, but
  flex layout falls through to `flex-start` — measured, it lays out identically to a
  bogus value. Same for `start`/`end`/`left`/`right` and the `align-*` box-alignment
  keywords. `space-around` and `space-between` are genuinely implemented.

### What is fine, despite feeling modern

`calc()` (Chrome 26, and the base game uses it ~40 times), `vw`/`vh`/`vmin`/`vmax`
(26), `rem` (4), `ch` (27), `object-fit` (32), `will-change` (36), `touch-action`
(36), `all` (37), `shape-outside` (37), `border-image` (16, and PA's panel frames are
built on it), `@supports` (28), `::before`/`::after`/`::first-letter`, `::backdrop`,
`::selection`, `:not()` with one simple argument, and flexbox in full (29).

### Which prefixes are actually required

Only where the unprefixed form postdates 40. `transition` (Chrome 26), `transform`
(36), `box-shadow` (10), `border-radius` (4) and every flex property (29) need **no**
prefix, and the config rejects them as legacy cruft even though the base game ships
64 `-webkit-transition` and 10 `-webkit-box-shadow`.

Four are dropped in **both** spellings, so there is no working form and the property
is banned outright: `hyphens`, `text-decoration-color`, `text-size-adjust`, and
`-webkit-overflow-scrolling` — the last of which the base game uses three times, inertly.

### Where this repo diverges from stock deliberately

`::first-letter` double-colon (stock writes `:before`); `selector-class-pattern`
lower-case-only (stock has camelCase classes and ids); `function-url-quotes: "always"`
(stock is split three ways). Stock is not linted, so stock violating a rule is not a
reason to loosen it.

The config is calibrated, not over-tuned: run over the base game's own 57 unmodified
CSS files it reports no false positives. Everything it flags there is either a
genuinely inert declaration — unprefixed `filter` ×9, `user-select` ×7, `mask` ×2,
`-webkit-overflow-scrolling` ×1, `word-break: keep-all` ×1 — or a redundant prefix.

Do not remove an exclusion or "fix" the usage it covers as a drive-by. The
`format:css` pass runs `stylelint --fix` repo-wide, and several of these rules are
fixable, so a mis-set one rewrites working CSS into dropped CSS.
`test/stylelint_config.test.js` is what stops that.

CSS load order is also not what it looks like. Mod CSS is injected at runtime via
`loadCSS`'s `head.appendChild`, fired from a delayed `ko.computed` — so it loads
**after** the scene's own static `<link>` stylesheets, not before. Overrides should
out-specify rather than rely on source order.

## Localisation

Base-game files carrying `!LOC:` strings open with a `// !LOCNS:<namespace>`
directive on line 1. **GWO deliberately does not carry it**, including in shadowed
copies of files that have it upstream.

It is a build-time directive, not a runtime one. Nothing in the shipped game
parses it — every occurrence in the base install is the directive itself, and
`localization.js` has no namespace handling. It tells Uber's string-extraction
tooling which translation file (`galactic_war.json`, `leaderboard.json`, …) a
file's strings belong in. GWO's strings never go through that tooling, so the
directive would do nothing here; at runtime `loc()` resolves against the merged
tables regardless.

Don't add it back to a shadowed file "to match stock" — it has no effect and no
consumer in this repo.

`loc()` lookups are **case sensitive**, and the shipped translation tables are
inconsistent about casing. `PLAYER` has entries in 20 locales where `Player` has
14; `LOCKED` is the only casing shipped at all. That is why several UI strings are
asked for in a shouty casing and then down-cased in CSS rather than being written
naturally. `locTree` only rewrites an element's `innerHTML`, so attributes (and
therefore CSS classes) survive translation — which is what makes the trick work.

Three rules follow from that, and GWO's HTML applies each:

- **A trailing colon sits outside the `<loc>`.** Keys are character-sensitive
  too, and the game ships entries for the bare label (`ECONOMY`) but none for the
  label plus colon (`ECONOMY:`). So `gw_start/ai_settings.html` writes
  `<loc>ECONOMY</loc>:`.
- **Where the entry's casing differs from what the panel displays**, the `<loc>`
  spells the label the way the entry does and carries `.gwo-uppercase`;
  `gw_start/gwo_start.css` restores the display casing after translation.
- **`Mod:` in the war panel is deliberately left untranslatable**, as one
  `<loc>Mod:</loc>` with no entry rather than `<loc>Mod</loc>:`, which would
  resolve: the only `Mod` the game ships is the server browser's column, which
  means something else there ("Modifizieren" in de, 模型 — "model" — in zh-CN),
  and six more locales leave it as the English "Mod" anyway. Adopting it would
  mislead more players than it would help (`gw_play/gwo_panel.html`).

## HTML

HTML lives in its own file, never inline in JS.

Knockout virtual bindings look like comments but are **executable markup**:

```html
<!-- ko foreach: items -->
<!-- /ko -->
```

They are not comments and must never be removed as such.
