# Testing and validation

There is no way to run PA in CI, so everything here works by loading the mod's
shipped AMD modules under plain Node and asserting against them.

```bash
npm test                  # node --test, everything under test/
npm run test:coverage     # same, plus lcov for the Sonar job
npm run validate          # all seven validate:* checks in sequence
npm run verify            # exactly what CI runs
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

`scripts/lib/card-probe.js` takes that hatch, and with `shared/gw_common` stubbed
**236** of the 237 cards load. That sits oddly beside `validate:cards`'s 175 until
you notice they answer different questions: the validator refuses the hatch on
purpose, so its number is what can be checked with no stand-in at all.

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

**`validate:schemas` checks whatever files it finds, which is why
`test/ai_source_files.test.js` exists alongside it.** The walk covers `pa/ai`,
`pa/ai_penchant` and `pa/ai_tech`, so a build list renamed or deleted out from
under the code leaves the run green - it simply has one fewer file to check.
That test is the existence half, and deliberately asserts nothing about shape:
duplicating the schema checks there would be strictly weaker than the validator
and drift from it. Verified by renaming a build list, which reports
`schemas: 0 problems` and one failed test.

**`validate:sonar` exists because that config is live but unreferenced.**
`sonar-project.properties` is genuinely read by the scanner, so its exclusions and
coverage settings are real config — but nothing else reads it, so its paths drift
silently and only fail on SonarCloud after a push. A rename out from under an
exclusion once put a GBK-encoded readme back into analysis. Do not run the `sonar`
CLI locally; it does not perform real rule analysis for this org.

## The one test that lints

`test/stylelint_config.test.js` is the odd one out: it loads no shipped module and
instead runs stylelint's Node API over CSS fixtures, asserting that each Chrome 40
limit is rejected and each supported feature is not. It exists because
`stylelint.config.mjs` is the only guard against a class of bug the game cannot
report — an unsupported declaration is silently dropped, so nothing fails loudly.

Two details are load-bearing:

- It passes `configFile` rather than importing the config module, so the test
  exercises the file the CLI actually resolves. It also asserts `.stylelintrc.json`
  is **absent**: cosmiconfig ranks that name third and `stylelint.config.mjs` last,
  so a resurrected JSON would silently shadow the whole profile while every other
  assertion here still passed.
- `require("stylelint")` works even though stylelint 17 is ESM-only, via Node's
  `require(ESM)` interop on the pinned Node version.

The accept cases matter more than the reject cases. Several of these rules are
fixable, and `format:css` runs `stylelint --fix` repo-wide, so an over-broad denylist
would rewrite working CSS into CSS the engine drops.

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
a then property" rule warns about. Its `when` keeps jQuery 2's shape — one
argument resolves to that value, several to the array — and `installFakeJQuery`
puts a callable `$` carrying the lot behind a suite's global stubs.

`scripts/lib/global-stubs.js` saves and restores the engine globals that shipped
code reads at call time. It is a factory, not a singleton, so two suites never
share a restore stack.

`scripts/lib/card-probe.js` runs a card's `deal()` and `buff()`, which is what
`test/card_deal_unit_gate.test.js` needs and `validate:cards` deliberately refuses
to do. Four decisions in it are load-bearing:

- Its `numberOfSystems` is a **real nine-entry array**, not `createAutoStub()`.
  `farForSize` walks `Math.min(numberOfSystems.length, thresholds.length) - 1`, and a
  stub makes that `NaN`, so the tier loop never runs and every card scores at tier 0 —
  the sweep stays green while testing almost nothing. Nine entries, not the base
  game's five, because `shared/cards.js`'s own `distances` tables are cut for the four
  sizes Bigger Galactic War adds as well.
- It installs **no `model` global**, for the reason `amd-loader.js` gives for leaving
  `api`/`model`/`ko` undefined: no card in scope reads one inside `deal()`, so a card
  that starts to should throw rather than be weighted against a fake galaxy.
- `makeInventory` is a plain object rather than an auto-stub, so a card reaching for
  something unanticipated fails loudly instead of being scored against a Proxy that
  says yes to everything. `lookupCard` answers `-1` — `gw_inventory`'s "absent"; `0`
  means "the first card in the hand".
- The starter unit set is **recorded from `gwc_start.buff()`**, never restated, so a
  change to `gwoGroup.orbitalBasic` moves the baseline instead of silently
  disagreeing with it.

The test carries three coverage floors — `MIN_PROBED`, `MIN_DEALABLE` and the
partition assertion that no card is unclassified. `MIN_DEALABLE` is the one with no
analogue in `validate:cards`: without it, a broken `gw_common` stub that made every
`deal()` return 0 would leave the card count intact and every assertion vacuously
green. Raise them when coverage genuinely rises; never lower one to make a run pass.

`scripts/lib/capturing-inventory.js` is the inventory every card sweep hands to
`buff()`/`dull()`: the caller's explicit answers steer a card down the branch
under test, a recorder captures the calls the sweep is collecting, and everything
else is auto-stubbed so a new call a card makes needs no fixture update.
`recordInto` is the recorder for `addMods`/`addAIMods`/`addUnits`, which concat
and so take a bare descriptor as readily as an array.

`scripts/lib/fake-knockout.js` is enough knockout for what shipped code does with
an observable: read, write, subscribe, `push`/`remove`, `valueHasMutated`, and a
`computed` that is just its function. Its `hooks` let a test watch writes and
mutations without a subscription of its own. `makeInertObservable` is the one
whose subscriptions never fire, which the card sweeps need because
`shared/bank.js` subscribes to its own `startCards` at define time and the
callback reaches `api.tally`.

`scripts/lib/coop-fixtures.js` holds what the co-op card factory tests share: a
connected `viewer`, its inventory `record`, the `inventoryClass` stand-in for the
base game's `GWInventory` (which only loads a record's saved cards, counts them
and applies them), and `rejection`, because those host handlers reject with a
plain string that `assert.rejects` will not take as an error. The `HOST_CARDS`
trap stays in each file: it is hung off that test's own game stub.

`scripts/lib/fake-lodash-timers.js` captures `_.delay` and `_.debounce`.
`node:test`'s timer mocks cannot reach them — lodash 3 binds
`context.setTimeout` once, at load — so it swaps the global lodash for a context
bound to a recording `setTimeout`, with an optional driven clock behind `_.now()`,
and hands back the recorded calls and a restore.

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

**A test file is named for the module it loads, not the feature it belongs to.**
Once the pure logic is extracted, the bootstrap that is left — `gw_play/coop_ping.js`
injects a button and calls `requireGW`, and nothing else — has nothing the harness
can reach, and no test. That is expected, but it only stays visible if the tests
around it are named honestly: `coop_ping_operators.test.js` and
`coop_ping_marker.test.js` say which module each covers, and by saying it they
leave `coop_ping.js` conspicuously unclaimed. A `coop_ping.test.js` covering the
operators would read as though the bootstrap were tested.

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
