# Runtime constraints

PA renders its UI with CEF, which embeds **Chromium 151**. Shipped code runs
there unbundled and untranspiled - current JavaScript and CSS syntax is
available, and what still constrains this repo is no longer the engine's age
but how PA loads code into it. This page is the answer to "may I use X?", and
for the engine itself the answer is now usually yes.

The migration that produced this profile, the assumptions it rests on and the
live test plan that verifies them are in [cef-migration.md](cef-migration.md).

Scope: `ui/**` only. `scripts/**` and `test/**` are Node-only tooling and are
exempt - `eslint.config.mjs` has a separate override block for them.

## One shared scope per scene

PA loads scene scripts as **classic scripts, all in one scope per scene** -
stock UI code and every enabled mod's scripts share it. Two consequences, both
enforced or documented rather than left to memory:

- **No top-level `let`, `const` or `class` in any shipped file.** Top-level
  lexical declarations join the scene's shared global lexical environment, and
  a duplicate name across two mods is a `SyntaxError` that kills the later
  script wholesale. Top-level `var` and `function` stay legal: they are the
  deliberate cross-scene globals scene scripts already rely on, and a
  collision there reassigns instead of throwing. `eslint.config.mjs` enforces
  this with `no-restricted-syntax`; everything else belongs inside the
  `define(...)` factory or an IIFE.
- **Keep module-private helpers inside the `define(...)` factory.** A
  file-top-level declaration becomes a `window` global in PA's RequireJS
  runtime. Hoisting to the "outer scope" that Sonar's `javascript:S7721` wants
  therefore leaks a global for no gain - the factory runs once anyway. S7721
  is accepted and scoped out of `ui/**` in `sonar-project.properties`; it
  stays active for `scripts/**` and `test/**`.

When a base-game-shadowed module needs its logic tested, extract it into a
measured sibling module rather than hoisting helpers to file top level. See
[shadowing.md](shadowing.md).

## Modernisation boundary

Shadowed base-game files and the deliberate line-for-line stock copies keep
ES5 syntax and stock idiom even though the engine no longer requires it - the
minimal-diff-vs-stock property is what post-patch re-syncs run on, and stock's
own CEF-era form is unknown. Modern syntax is for the mod's own namespace.
The full boundary is drawn in [shadowing.md](shadowing.md).

## Available libraries

Globals in every scene: **lodash** (`_`), **jQuery** (`$`), **Knockout**
(`ko`), **createjs**, **`Math.seedrandom`**. `ui/main/shared/js/thirdparty`
holds what else the engine ships.

`Math.seedrandom` exists in the game but **not** in Node, so nothing on a
testable path can use it - hence `shared/gwo_rng.js`, which carries its own
PRNG. See [galaxy.md](galaxy.md).

The game ships **lodash 3.9.3** (pinned to the same version in
`package.json`), not lodash 4 - the lodash-3-only API names are the surface a
future stock upgrade would break silently. Two of its behaviours are relied on
deliberately:

- `_.sortBy` is **stable**, which is what keeps non-host clients in their
  existing order during colour allocation.
- `_.random`'s bounds are **both inclusive**, so `_.random(100)` has 101
  outcomes. A chance of N would fire at (N+1)/101, meaning a 0% setting still
  landed roughly one roll in a hundred until that was accounted for.
  `gwoRng.int` matches this.

Lodash also captures `nativeRandom = Math.random` at load, so reseeding
`Math.random` cannot make `_.sample`/`_.shuffle`/`_.random` deterministic -
war generation draws from `shared/gwo_rng.js` instead.

Mod-owned code prefers native forms only where they are true drop-ins -
`Array.isArray`, `Object.assign` onto a literal target, `[0]`/`.slice(1)`,
`.some` with an explicit callback. The rest of the lodash surface stays
deliberately: `_.forEach`/`_.map`/`_.includes`/`_.keys` tolerate a null
collection and iterate plain objects where the native forms throw or don't
exist, `_.cloneDeep` clones structures that hold functions
(`structuredClone` throws on them, and cards hold functions), and
`_.random`/`_.sortBy`/`_.sample`/`_.shuffle` carry the semantics documented
above. Converting one of those is a per-site null-safety review, not a
rename.

jQuery 2.x has a trap that has bitten this repo more than once: **it does not
convert a `throw` inside a deferred callback into a rejection.** A `TypeError`
there escapes `.fail()` entirely - no retry, no console line, and the caller
hangs. Callbacks that can fail must `reject` explicitly rather than throwing
or falling through. Also: `$.when()` does not wait for a function that returns
a native Promise, and `.then` on a jQuery promise returns a _new_ promise each
time. Native `Promise.all`/`await` do assimilate jQuery thenables, so
_consuming_ a stock deferred natively is safe; a promise _produced for_ stock
code must stay a `$.Deferred`, because stock calls `.done`/`.fail`/`.always`
on it.

PA installs one-argument `String.prototype.startsWith`/`endsWith` polyfills in
`ui/main/shared/js/helpers.js`. Both are guarded by
`typeof ... !== "function"`, so under CEF the native two-argument forms win
and the polyfill no-ops. (Under Chrome 40 the polyfill was live and silently
ignored the position argument, which is why older code here reaches for
`_.startsWith`/`_.endsWith`.)

## CSS

An unsupported CSS declaration is not a parse error, it is **silently
dropped** - no console message, no failed rule, the page just renders wrong.
That is a property of how browsers treat CSS, not of the old engine, so the
lint profile stays a hard gate.

`stylelint.config.mjs` is the reference. It works through two nets:

- **`.browserslistrc` + `stylelint-no-unsupported-browser-features`** - checks
  every declaration against caniuse for `chrome 151`. This guards against
  features newer than the engine, and its `ignore` list names the caniuse
  entries whose "partial" mark covers only syntax this repo does not use.
- **Hand-written lists** - down to syntax no Blink release ever shipped
  (`@custom-media`, `element()`, `:matches`, and friends), which caniuse has
  no entry to flag, plus the house-style selector patterns.

`stylelint-config-standard`'s notation rules are back at their defaults, so
`format:css` now converges on modern spellings - space-separated
`rgb(0 0 0 / 50%)`, range media queries, unprefixed everything. Do not
hand-write the legacy forms; `format:css` will rewrite them anyway.
`test/stylelint_config.test.js` pins both halves of the profile.

CSS load order is also not what it looks like. Mod CSS is injected at runtime
via `loadCSS`'s `head.appendChild`, fired from a delayed `ko.computed` - so it
loads **after** the scene's own static `<link>` stylesheets, not before.
Overrides should out-specify rather than rely on source order.

## Localisation

Base-game files carrying `!LOC:` strings open with a `// !LOCNS:<namespace>`
directive on line 1. **GWO deliberately does not carry it**, including in
shadowed copies of files that have it upstream.

It is a build-time directive, not a runtime one. Nothing in the shipped game
parses it - every occurrence in the base install is the directive itself, and
`localization.js` has no namespace handling. It tells Uber's string-extraction
tooling which translation file (`galactic_war.json`, `leaderboard.json`, …) a
file's strings belong in. GWO's strings never go through that tooling, so the
directive would do nothing here; at runtime `loc()` resolves against the
merged tables regardless.

Don't add it back to a shadowed file "to match stock" - it has no effect and
no consumer in this repo.

`loc()` lookups are **case sensitive**, and the shipped translation tables are
inconsistent about casing. `PLAYER` has entries in 20 locales where `Player`
has 14; `LOCKED` is the only casing shipped at all. That is why several UI
strings are asked for in a shouty casing and then down-cased in CSS rather
than being written naturally. `locTree` only rewrites an element's
`innerHTML`, so attributes (and therefore CSS classes) survive translation -
which is what makes the trick work.

## HTML

HTML lives in its own file, never inline in JS.

Knockout virtual bindings look like comments but are **executable markup**:

```html
<!-- ko foreach: items -->
<!-- /ko -->
```

They are not comments and must never be removed as such.

## Engine URLs

The engine serves game files over the `coui://` scheme (and unit-spec reads
over `spec://`). Static references stay literal; dynamic URL builders go
through `shared/gwo_url.js`, and `scripts/migrate/rewrite-scheme.js` re-points
everything at once if the CEF port renames the scheme. See
[cef-migration.md](cef-migration.md).
