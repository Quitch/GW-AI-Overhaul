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
[`galaxy.md`](galaxy.md).

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

Also: `$.when()` does not wait for a function that returns a native Promise, and
`.then` on a jQuery promise returns a _new_ promise each time (which the AI tree
cache depends on).

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

Chrome 40 predates a lot of modern CSS syntax, and `.stylelintrc.json` disables two
rules for that reason:

- `color-function-alias-notation` — the modern `rgb()`/`rgba()` unification is not
  available.
- `declaration-block-no-redundant-longhand-properties`, scoped to ignore `overflow`
  — `overflow-x` + `overflow-y` cannot be collapsed.

Do not remove those exclusions or "fix" the usage they cover as a drive-by.

The prefixed-property case that matters most: **`filter` is Chrome 53**, so only
`-webkit-filter` does anything here. An unprefixed `filter` is silently inert.

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

## HTML

HTML lives in its own file, never inline in JS.

Knockout virtual bindings look like comments but are **executable markup**:

```html
<!-- ko foreach: items -->
<!-- /ko -->
```

They are not comments and must never be removed as such.
