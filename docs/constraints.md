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
stock UI code and every enabled mod's scripts share it. Three consequences, all
enforced or documented rather than left to memory:

- **No top-level `let`, `const` or `class` in any shipped file.** Top-level
  lexical declarations join the scene's shared global lexical environment, and
  a duplicate name across two mods is a `SyntaxError` that kills the later
  script wholesale. Top-level `var` and `function` stay legal: they are the
  deliberate cross-scene globals scene scripts already rely on, and a
  collision there reassigns instead of throwing. `eslint.config.mjs` enforces
  this with `no-restricted-syntax`; everything else belongs inside the
  `define(...)` factory or an IIFE.
- **A scene script is one IIFE.** The scene scripts that `modinfo.json` lists
  have no `define(...)` to hide inside, so each is one `(() => { ... })();`
  that holds its `try`/`catch` and any scene-specific early return, and
  declares nothing at file top level. Sharing between scene scripts goes
  through `model.gwo*`, never `window`.
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

`$.when()` and `deferred.then` identify a promise by a `promise` **method**. An
engine promise (what every `api.*` call returns) has no such method, and a
native promise has none either, so jQuery reads both as plain values and never
waits for either one, with no error and no log line. Where a jQuery chain must
wait on one, `shared/gwo_promise.js` adapts it into a jQuery promise; a native
chain assimilates it directly (`Promise.resolve(enginePromise)`), which is what
the converted referee pipeline does. `scripts/lib/fake-jquery.js` applies the
same test, so a shipped file that skips the adapter fails a test rather than
skipping the wait in a war. An audit on 2026-08-31 found that every other
`$.when` in the mod is handed a jQuery promise or a plain value.

PA installs one-argument `String.prototype.startsWith`/`endsWith` polyfills in
`ui/main/shared/js/helpers.js`. Both are guarded by
`typeof ... !== "function"`, so under CEF the native two-argument forms win
and the polyfill no-ops. (Under Chrome 40 the polyfill was live and silently
ignored the position argument, which is why older code here reaches for
`_.startsWith`/`_.endsWith`.)

`requireGW` is configured `waitSeconds: 0`, so a module that never arrives never
errors either. The callback simply never fires. A tally that counts callbacks
must count failures too. Otherwise the promise it gates is never settled at all.

## Where a defensive check belongs

A guard marks a **trust boundary**. Its presence should tell a reader that the
data came from somewhere GWO does not control. A guard anywhere else costs that
signal and buys nothing. A check on a value that GWO itself built moments
earlier cannot prevent a crisis. It can only hide a crisis that already
happened. That turns a stack trace into a war that silently plays wrong.

Guard when the data is:

- **Third-party**: a card object and its methods, `addMods`/`addAIMods`
  descriptors, `model.gwo*` entries, a registered loadout bank, a system
  template. The validators cover shipped cards only ([`tech-cards.md`](tech-cards.md)).
- **Remote**: an operator payload from another peer ([`coop.md`](coop.md)).
- **Persisted**: an older GWO's save, or user-writable `localStorage`. Name the
  version the field appeared in, as `shared/deal.js` does.
- **Scene- or mod-conditional**: a symbol genuinely absent from a scene the
  module also loads into, or a base path another mod may own.
- **Optional by contract**: `rng` on `deal()`, `keep`/`discard`.

Do not guard a hard invariant. Do not re-check what a named gate upstream
already validated. Do not write a half-guard. `card.deal && card.deal(…)`
followed by an unguarded read of the result is worse than neither, because it
advertises a safety it does not provide.

`gw_play/gwo_panel.js` is the calibration. It walks
`model.game() → galaxy() → stars()[origin()].system()` unguarded, then checks
`_.isPlainObject(originSystem.gwaio)`. It trusts the base game and checks the
field that an old save may lack.

Two shapes satisfy this rather than scattering checks. The first is a **named
pre-flight gate** that refuses the whole operation with a diagnostic
(`gw_play/per_player_tech.js`). The second is a **per-item `try`/`catch`**, so
one bad entry in a batch is skipped rather than aborting the rest
(`shared/specs.js`).

That second shape is not optional where third-party code is _called_ rather than
read. In the deliberately-still-jQuery deal/cards subsystem the reason is the
deferred trap above — a throw is not an error but a permanent hang. In the
converted native pipelines a throw rejects instead, which surfaces, but still
aborts the whole launch over one bad entry; the per-item `try`/`catch` keeps it
to a skip either way.

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

Base-game files that carry `!LOC:` strings open with a `// !LOCNS:<namespace>`
directive on line 1. **GWO deliberately does not carry it**, including in
shadowed copies of files that have it upstream.

It is a build-time directive, not a runtime one. Nothing in the shipped game
parses it. Every occurrence in the base install is the directive itself, and
`localization.js` has no namespace handling. The directive tells Uber's
string-extraction tooling which translation file (`galactic_war.json`,
`leaderboard.json`, …) a file's strings belong in. GWO's strings never go
through that tooling, so the directive would do nothing here. At runtime,
`loc()` resolves against the merged tables regardless.

Do not restore it in a shadowed file "to match stock". It has no effect and no
consumer in this repo.

`loc()` lookups are **case sensitive**, and the shipped translation tables are
inconsistent about casing. `PLAYER` has entries in 20 locales where `Player` has 14.
`LOCKED` is the only casing shipped at all. That is why several UI strings
are requested in a shouty casing and then down-cased in CSS rather than written
naturally. `locTree` only rewrites an element's `innerHTML`, so attributes (and
therefore CSS classes) survive translation. That is what makes the trick work.

Three rules follow from that, and GWO's HTML applies each:

- **A trailing colon sits outside the `<loc>`.** Keys are character-sensitive
  too. The game ships entries for the bare label (`ECONOMY`) but none for the
  label plus colon (`ECONOMY:`). So `gw_start/ai_settings.html` writes
  `<loc>ECONOMY</loc>:`.
- **Where the entry's casing differs from what the panel displays**, the `<loc>`
  spells the label the way the entry does and carries `.gwo-uppercase`.
  `gw_start/gwo_start.css` restores the display casing after translation.
- **`Mod:` in the war panel is deliberately left untranslatable.** It is one
  `<loc>Mod:</loc>` with no entry, rather than `<loc>Mod</loc>:`, which would
  resolve. The only `Mod` the game ships is the server browser's column. It
  means something else there ("Modifizieren" in de, and 模型, "model", in
  zh-CN). Six more locales leave it as the English "Mod" anyway. Adopting it
  would mislead more players than it would help (`gw_play/gwo_panel.html`).

### Where GWO's translations come from

The game merges only its own `ui/main/_i18n/locales/<lang>/*.json` tables, natively,
before any mod script runs, and a mod file at one of those paths would shadow a
stock table wholesale. GWO therefore ships its translations as
`ui/mods/com.pa.quitch.gwaioverhaul/translations/<lang>.json` and hands them to the
**Mod Translations** mod, which adds them to the same i18next store `loc()` reads.
`shared/mod_translations.js` is the sole `global_mod_list` entry in `modinfo.json`,
and in no scene list, so the strings are in place before the stock scene's
`document.ready` and its model constructor, which translate eagerly; a scene-list
registration is too late for those and leaves them English. Where a key is in both
a GWO file and a stock table the GWO entry wins; the shipped files hold only keys
the stock tables lack, so nothing is overridden today. `en-US.json` is the catalog
for translators and is never loaded. Without Mod Translations the shim does nothing
and GWO's text is English, as it always was. Details and tooling:
[`translations.md`](translations.md).

## HTML

HTML lives in its own file, never inline in JS.

Knockout virtual bindings look like comments but are **executable markup**:

```html
<!-- ko foreach: items -->
<!-- /ko -->
```

They are not comments. Never remove them as comments.

## Engine URLs

The engine serves game files over the `coui://` scheme (and unit-spec reads
over `spec://`). Static references stay literal; dynamic URL builders go
through `shared/gwo_url.js`, and `scripts/migrate/rewrite-scheme.js` re-points
everything at once if the CEF port renames the scheme. See
[cef-migration.md](cef-migration.md).
