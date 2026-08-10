# Testing and validation

There is no way to run PA in CI, so everything here works by loading the mod's
shipped AMD modules under plain Node and asserting against them.

```bash
npm test                  # node --test, everything under test/
npm run test:coverage     # same, plus lcov for the Sonar job
npm run validate          # all seven validate:* checks in sequence
npm run verify            # CI's hard gates + repo-wide format:check
```

Run one file with `node --test test/specs.test.js`, or one test with
`--test-name-pattern="<pattern>"`.

## The AMD harness

`scripts/lib/amd-loader.js` loads shipped modules by stubbing `define()` and a
handful of engine globals.

The invariant the whole loader rests on: **shipped files reference engine globals
only inside function bodies, never at the top level of a `define()` factory.**
`api`, `model`, `ko`, `$`, `createjs`, `window` and `requireGW` are therefore
deliberately left _unstubbed_ at define time, so a file that violates the rule
fails loudly and specifically rather than silently passing against a fake engine.

Two entry points, and the difference matters:

| Function                      | Returns                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `loadCouiModule(entry)`       | Whatever the target's `define()` factory returned — the normal public interface. |
| `requireShippedModule(entry)` | The file's plain Node `module.exports`.                                          |

`requireShippedModule` is only for files carrying a deliberate, additive,
dead-in-production test hook:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { applyAiMods: applyAiMods };
}
```

`module` does not exist in the game's Chromium runtime, so that branch never
executes in-game. It exists to reach functions `define()` never returns —
`referee_ai.js`'s `applyAiMods`, and the naming helpers in
`gw_play/cards_card_name_sync.js`.

`loadCouiModule` resolves both `coui://` paths and bare AMD ids (`"cards/x"`,
`"shared/x"`) the same way the game's loader would.

### `NOT_SHIPPED`

A bare AMD id this repo does not ship is a **base-game** module. The loader throws
a distinct `NOT_SHIPPED` error for it rather than a generic failure, because CI has
no base install to fall back on and the two cases need telling apart.

This is why 61 of the 237 cards cannot be shape-checked: they transitively depend
on `shared/gw_common`. For sweeps where skipping them would mean testing nothing,
`registerModuleStub` is an opt-in escape hatch — it does **not** weaken the default.

Because a bare `catch` around a load also swallows syntax errors and genuine
breakage, the validators discriminate on the reason. A bare catch once reported
real failures as "excluded" with the run still green.

## The seven validators

| Command             | Catches                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate:json`     | Any `.json` in the repo that does not parse. Cheap, and this class of bug otherwise breaks the game silently with no error until something loads that exact file. |
| `validate:manifest` | `modinfo.json` `scenes` entries pointing at files that no longer exist — which fails silently in-game.                                                            |
| `validate:cards`    | Every card exports the fixed contract shape.                                                                                                                      |
| `validate:ai-mods`  | Every card's `buff()`/`dull()` emits descriptors matching `referee_ai.js`'s contract.                                                                             |
| `validate:schemas`  | AI build-order JSON and difficulty/personality data: type consistency.                                                                                            |
| `validate:refs`     | Cross-references — loadout ids against card files, unit keys, AI builder roles against `unit_map`.                                                                |
| `validate:sonar`    | `sonar-project.properties`: no stale exclusion paths, every analysed file is UTF-8.                                                                               |

Several are worth understanding rather than just running.

**`validate:ai-mods` works by execution, not inspection.** AI-mod descriptors have
no static JSON form, so the only way to check their shape is to call every card's
`buff()`/`dull()` against a mock inventory. `scripts/lib/auto-stub.js` provides
that mock: a Proxy answering any property access or call with another instance of
itself, so the check does not need to hand-mock the whole inventory API. It
special-cases the primitive conversion traps, because arithmetic on a stubbed value
(`inventory.maxCards() + 1`) should produce garbage rather than throw — garbage is
fine here.

**`validate:schemas` carries `KNOWN_TEST_TYPES`**, every `test_type` the engine
implements, harvested from the base game's own AI data. An unrecognised value is
not an error the engine reports: the condition simply never validates, so the build
entry silently never fires. That is how `HasEcoForAdvanced` (the real test is
`HaveEcoForAdvanced`) went unnoticed. CI has no base install, so this list has to be
committed — **re-harvest it after a PA patch adds tests.** `UnitCountonPlanet` is a
base-game spelling variant, kept because the engine accepts what its own data ships.

**`validate:sonar` exists because that config is live but unreferenced.**
`sonar-project.properties` is genuinely read by the scanner, so its exclusions and
coverage settings are real config — but nothing else reads it, so its paths drift
silently and only fail on SonarCloud after a push. A rename out from under an
exclusion once put a GBK-encoded readme back into analysis. Do not run the `sonar`
CLI locally; it does not perform real rule analysis for this org.

## Test fixtures

`scripts/lib/ai-path-fixtures.js` holds the shared scenario matrix so each test
file does not reinvent its own list. Two things about it are load-bearing:

- `buildGame()`/`installModel()` return the **same object references** on every
  call, matching production code, which calls `model.game()`/`game.galaxy()`
  repeatedly rather than caching a snapshot.
- Connected clients are passed separately to `installModel(game, connectedClients)`,
  **not** through `buildGame`'s options.

`scripts/lib/fake-jquery.js` covers exactly the `$`/`api` subset `referee_ai.js`
uses. Requesting a URL with no configured resolver rejects, so a test's fixtures
cannot silently drift from what the code actually asks for. It returns the Promise
itself rather than an object with a `then` property, keeping `.then` the real
inherited `Promise.prototype.then` — the shape SonarLint's "objects should not have
a then property" rule warns about.

`scripts/lib/global-stubs.js` saves and restores the engine globals that shipped
code reads at call time. It is a factory, not a singleton, so two suites never
share a restore stack.

`scripts/lib/referee-fakes.js` builds on `fake-jquery.js` to install the `$`/`api`
wiring `referee_ai.js`'s file discovery needs, and returns its own restore
function. It records every `api.file.list` and `$.getJSON` call unconditionally,
so a test asserting which paths were walked needs no second, subtly different,
local installer — which is what the three tests using it would otherwise each
have grown.

## Coverage

The Sonar quality gate requires ~80% coverage on **new code only**. Files that are
pure `model`/`ko`/`api` glue are coverage-excluded, with their testable logic
extracted into measured sibling modules — see [`shadowing.md`](shadowing.md).

Each sibling is a plain `define()` over lodash and `console` only: no engine
globals, and no dependency the repo does not ship, so it loads under the Node AMD
harness. Where a helper needs one of the excluded file's injected modules, it
takes it as an explicit parameter rather than closing over it.

The glue file depends on the unshipped `shared/gw_common`, which is what stops it
loading in the harness in the first place. [`shadowing.md`](shadowing.md) carries
the list of pairs; it is one list, and this is not a second copy of it.

### The `typeof module` hook

Several scene scripts are not modules at all: `gw_play/cards.js` is self-invoking
and never calls `define()`, so it cannot be loaded in place. Its pure logic is
extracted into sibling `define()` modules — `cards_deal_helpers.js`,
`cards_coop_deal.js`, `cards_coop_reroll.js`, `cards_card_name_sync.js`,
`cards_cheats.js` — each returning a factory that `cards.js` calls with its
collaborators.

Where a helper inside such a module is not reachable through the returned
factory, it is re-exported through:

```js
// eslint-disable-next-line no-undef
if (typeof module !== "undefined" && module.exports) {
```

`module` is a Node/CommonJS global that does not exist in the game's Chromium
runtime, so the branch is dead in production and exists purely for the test
suite. It is deliberately absent from these files' configured globals, which is
why each occurrence carries an `eslint-disable-next-line no-undef`. The same hook
appears in `gw_play/referee_ai.js`.

`test/version.test.js` deliberately covers the one-line version bump: the SonarCloud
new-code baseline is the previous version, so a bump always lands inside the
new-code period and an uncovered one drags "Coverage on New Code" to 0% by itself.

`shared/gwo_rng.js` is deliberately **not** excluded. It carries its own PRNG precisely so
it loads in Node — `Math.seedrandom` is browser-only — and its stream-independence and
no-`Math.random` suites are what the rest of the seeding work rests on.

## What tests cannot cover

No test here starts PA. Anything that only fails at runtime — a renamed identifier
in shipped `ui/**`, a CSS class rename spanning HTML and CSS, a `modinfo.json` path,
a localisation directive — is verified by loading the game with the mod enabled and
starting a war. CI gates the rest.
