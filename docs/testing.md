# Testing and validation

There is no way to run PA in CI. Everything here therefore works by loading the
mod's shipped AMD modules under plain Node and asserting against them.

```bash
npm test                  # node --test, everything under test/
npm run test:coverage     # same, plus lcov for the Sonar job
npm run validate          # every validate:* check in sequence
npm run verify            # exactly what CI runs
```

Run one file with `node --test test/specs.test.js`. Run one test with
`--test-name-pattern="<pattern>"`.

## The AMD harness

`scripts/lib/amd-loader.js` loads shipped modules by stubbing `define()` and a
handful of engine globals.

The whole loader rests on one invariant. **Shipped files reference engine globals
only inside function bodies, never at the top level of a `define()` factory.**
The loader therefore deliberately leaves `api`, `model`, `ko`, `$`, `createjs`,
`window` and `requireGW` _unstubbed_ at define time. A file that violates the
rule then fails loudly and specifically. It does not silently pass against a
fake engine.

The loader has two entry points, and the difference between them matters:

| Function                      | Returns                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `loadCouiModule(entry)`       | Whatever the target's `define()` factory returned, which is the normal public interface. |
| `requireShippedModule(entry)` | The file's plain Node `module.exports`.                                                  |

`requireShippedModule` is only for files that carry a deliberate, additive,
dead-in-production test hook. That hook is the `typeof module` hook described
under "Coverage" below.

`loadCouiModule` resolves both `coui://` paths and bare AMD ids (`"cards/x"`,
`"shared/x"`) the same way the game's loader would.

### `NOT_SHIPPED`

A bare AMD id this repo does not ship is a **base-game** module. The loader throws
a distinct `NOT_SHIPPED` error for it rather than a generic failure. CI has no
base install to use instead, and the two cases must be distinguishable.

This is why a quarter of the cards cannot be shape-checked. They transitively
depend on `shared/gw_common`. Some sweeps would test nothing if they skipped
those cards. For those sweeps, `registerModuleStub` is an opt-in escape hatch.
It does **not** weaken the default.

`scripts/lib/card-probe.js` takes that hatch. With `shared/gw_common` stubbed,
every card but the `KNOWN_UNLOADABLE` one loads. That sits oddly beside
`validate:cards`'s `MIN_CHECKED` floor until you notice that they answer
different questions. The validator refuses the hatch on purpose. Its number is
therefore what can be checked with no stand-in at all.

A bare `catch` around a load also swallows syntax errors and genuine breakage.
The validators therefore discriminate on the reason. A bare catch once reported
real failures as "excluded" while the run stayed green.

## The validators

Every `validate:*` script that `npm run validate` runs has a row here.
`validate:docs` checks that it does. `validate:race-trees` is local-only and is
described separately below.

| Command                 | Catches                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate:json`         | Any `.json` in the repo that does not parse. The check is cheap. Otherwise this class of bug breaks the game silently, with no error until something loads that exact file.                                                 |
| `validate:manifest`     | `modinfo.json` `scenes` entries that point at files that no longer exist. This fails silently in-game.                                                                                                                      |
| `validate:cards`        | Every card exports the fixed contract shape.                                                                                                                                                                                |
| `validate:ai-mods`      | Every card's `buff()`/`dull()` emits descriptors matching `referee_ai.js`'s contract.                                                                                                                                       |
| `validate:schemas`      | AI build-order JSON and difficulty/personality data: type consistency.                                                                                                                                                      |
| `validate:refs`         | Cross-references: loadout ids against card files, unit keys, AI builder roles against `unit_map`.                                                                                                                           |
| `validate:sonar`        | `sonar-project.properties`: no stale exclusion paths, every analysed file is UTF-8.                                                                                                                                         |
| `validate:docs`         | The hand-maintained inventories in `docs/` (scene, shadowed-file, `pa/` tree and validator tables) against the tree and `package.json`.                                                                                     |
| `validate:translations` | The translation files under `translations/`: PA locale names, PA's table shape, sorted unique keys, the en-US catalog equal to the tree's `!LOC:` keys, other files a subset of it, placeholders and style codes preserved. |

Several are worth understanding rather than just running.

**`validate:ai-mods` works by execution, not inspection.** AI-mod descriptors have
no static JSON form. The only way to check their shape is to call every card's
`buff()`/`dull()` against a mock inventory.

`scripts/lib/auto-stub.js` provides that mock. It is a Proxy that answers any
property access or call with another instance of itself. The check therefore
does not need to hand-mock the whole inventory API. It special-cases the
primitive conversion traps. Arithmetic on a stubbed value
(`inventory.maxCards() + 1`) should produce garbage rather than throw. Garbage
is fine here.

**`validate:schemas` carries `KNOWN_TEST_TYPES`**, every `test_type` the engine
implements. That list is harvested from the base game's own AI data. The engine
does not report an unrecognised value as an error. The condition simply never
validates, so the build entry silently never fires. That is how
`HasEcoForAdvanced` (the real test is `HaveEcoForAdvanced`) went unnoticed.

CI has no base install, so this list has to be committed. **Re-harvest it after
a PA patch adds tests.** `UnitCountonPlanet` is a base-game spelling variant. It
stays in the list because the engine accepts what its own data ships.

**`test/fixtures/unit_types.json` is harvested the same way.**
`scripts/harvest-unit-types.js` writes it. It holds every listed unit's
effective `unit_types`, with their `buildable_types`. The sources are the
installed game (`pa_ex1` over `pa`) and the race and add-on server mods on
disk. A server mod on disk is a `download/` zip or a `server_mods/` folder.
The mods are read in mount order.

With that fixture, `test/unit_groups_cells.test.js` can check the cell
classifier against `unit_groups.js` in CI, `test/race_legion.test.js` can see
Legion's cells, and `test/addon_second_wave.test.js` can see what an add-on
brings (`scripts/lib/addon-fixture.js` builds the index as `race_cells.js`
does). With a PA install present, the test asserts that the fixture is fresh.
**Re-harvest it after a PA, race or add-on patch.**

**`i18n:missing` and `i18n:glossary` are local-only for the same reason.** They
read the game's own translation tables from the PA install (`PA_MEDIA` or
`--pa <path>`) to list what each language still lacks and how the stock UI renders
shared terms. `validate:translations` needs no install and runs in `verify`. See
[translations.md](translations.md).

**`npm run validate:race-trees` is local-only for the same reason.** It runs
the real `referee_ai.js` over the actual files on disk. Those files are the PA
install (`pa_ex1` over `pa`), GWO's own shadows, each race's server mod and
every add-on's, merged in mount order. The check requires the Titans race
tree to match that merge exactly, minus every other layer. An MLA pass then
requires the sweep into `/pa/ai/player_guardians/` to hold the base files
and MLA's add-on files, untagged add-on maps included, and no race layer. It
then re-runs with every mod mounted to prove that no other layer leaks into
any tree, and checks each mounted descriptor's `unitMaps` and `sources`
against the merge, so a descriptor that has gone stale fails rather than
silently claiming nothing. The reverse holds too: every AI file an add-on's
server mod ships must be claimed by one of its layers, so a layer the mod
grows upstream (Second Wave's Bugs layer in 0.16.1) fails here instead of
being dropped from every tree.

CI has none of those files, so the unit tests pin the same contract on mocked
listings (`test/races.test.js`, `test/referee_ai_file_processing.test.js`). Run
it after a PA, race or add-on patch. Also run it after you change
`races.treeFilter`, `races.inAnyRaceLayer` or `referee_ai.js`'s tree writing.

**`validate:schemas` checks whatever files it finds, which is why
`test/ai_source_files.test.js` exists alongside it.** The walk covers `pa/ai`,
`pa/ai_penchant` and `pa/ai_tech`. A build list renamed or deleted out from
under the code therefore leaves the run green. The run simply has one fewer file
to check.

That test is the existence half, and it deliberately asserts nothing about
shape. Duplicated schema checks there would be strictly weaker than the
validator and would drift from it. This was verified by renaming a build list,
which reports `schemas: 0 problems` and one failed test.

**`validate:sonar` exists because that config is live but unreferenced.** The
scanner genuinely reads `sonar-project.properties`, so its exclusions and
coverage settings are real config. But nothing else reads it. Its paths
therefore drift silently and only fail on SonarCloud after a push. A rename out
from under an exclusion once put a GBK-encoded readme back into analysis.

Do not run the `sonar` CLI locally. It does not perform real rule analysis for
this org.

## The one test that lints

`test/stylelint_config.test.js` is the odd one out. It loads no shipped module.
Instead it runs stylelint's Node API over CSS fixtures. It asserts that stylelint
rejects each Chrome 40 limit and accepts each supported feature. It exists
because `stylelint.config.mjs` is the only guard against a class of bug the game
cannot report. The engine silently drops an unsupported declaration, so nothing
fails loudly.

Two details are load-bearing:

- It passes `configFile` rather than importing the config module. The test
  therefore exercises the file the CLI actually resolves. It also asserts that
  `.stylelintrc.json` is **absent**. That name ranks third in cosmiconfig's
  order and `stylelint.config.mjs` ranks last. A resurrected JSON would
  therefore silently shadow the whole profile while every other assertion here
  still passed.
- `require("stylelint")` works even though stylelint 17 is ESM-only. Node's
  `require(ESM)` interop on the pinned Node version makes that possible.

The accept cases matter more than the reject cases. Several of these rules are
fixable, and `format:css` runs `stylelint --fix` repo-wide. An over-broad
denylist would therefore rewrite working CSS into CSS the engine drops.

## Test fixtures

`scripts/lib/ai-path-fixtures.js` holds the shared scenario matrix, so no test
file reinvents its own list. Two things about it are load-bearing:

- `buildGame()`/`installModel()` return the **same object references** on every
  call. That matches production code, which calls `model.game()`/`game.galaxy()`
  repeatedly rather than caching a snapshot.
- A suite passes connected clients separately to
  `installModel(game, connectedClients)`, **not** through `buildGame`'s options.
  `useModel()` is the same installer with the `afterEach` restore built in. A
  suite therefore does not track the restore itself.

`scripts/lib/fake-jquery.js` covers exactly the `$`/`api` subset `referee_ai.js`
uses. A request for a URL with no configured resolver rejects. A test's fixtures
therefore cannot silently drift from what the code actually asks for.

It returns the Promise itself rather than an object with a `then` property. That
keeps `.then` the real inherited `Promise.prototype.then`. An object with its
own `then` property is the shape that SonarLint's "objects should not have a
then property" rule warns about. What `.then` gives back also carries
`promise`/`done`/`fail`/`always`, as jQuery's does.

Its `when` keeps jQuery 2's shape: one argument resolves to that value, and
several arguments resolve to the array. It identifies a promise by a `promise`
**method**. An argument without one therefore passes straight through, and
`when` never waits for it, exactly as `constraints.md` describes. That is why it
is hand-built rather than wrapped around `Promise.all`. A native promise
resolved with a thenable adopts it, which would wait after all.

Modelling thenables is the file's whole job. `sonar-project.properties`
therefore scopes Sonar's `javascript:S7739` ("Do not add `then` to an object")
out of this one file. The rule stays active everywhere else.

`installFakeJQuery` puts a callable `$` carrying the lot behind a suite's global
stubs. The file also exports `enginePromise()`. That is the
`then`-and-nothing-else shape every `api.*` call returns. Hold one pending to
prove that the code under test waits for it. The file also exports
`resolved()`/`rejected()`. Those are jQuery-shaped settled promises for a fixture
that stands in for stock code that returns one.

`scripts/lib/global-stubs.js` saves and restores the engine globals that shipped
code reads at call time. It is a factory, not a singleton, so two suites never
share a restore stack. `trackActive(setup)` is the factory-test scaffold built on
it. Its `build()` runs the suite's setup and keeps the result. The `afterEach`
that the helper registers can then call the result's `restore()`.

`scripts/lib/card-probe.js` runs a card's `deal()` and `buff()`. That is what
`test/card_deal_unit_gate.test.js` needs, and it is what `validate:cards`
deliberately refuses to do. Four decisions in it are load-bearing:

- Its `numberOfSystems` is a **real nine-entry array**, not `createAutoStub()`.
  `farForSize` walks `Math.min(numberOfSystems.length, thresholds.length) - 1`,
  and a stub makes that `NaN`. The tier loop then never runs and every card
  scores at tier 0. The sweep stays green while it tests almost nothing. The
  array has nine entries, not the base game's five. `shared/cards.js`'s own
  `distances` tables are cut for the four sizes Bigger Galactic War adds as
  well.
- It installs **no `model` global**, for the reason `amd-loader.js` gives for
  leaving `api`/`model`/`ko` undefined. No card in scope reads one inside
  `deal()`. A card that starts to should therefore throw rather than be weighted
  against a fake galaxy.
- `makeInventory` is a plain object rather than an auto-stub. A card that
  reaches for something unanticipated therefore fails loudly. It is not scored
  against a Proxy that says yes to everything. `lookupCard` answers `-1`, which
  is `gw_inventory`'s "absent". `0` means "the first card in the hand".
- The starter unit set is **recorded from `gwc_start.buff()`**, never restated.
  A change to `gwoGroup.orbitalBasic` therefore moves the baseline instead of
  silently disagreeing with it.

The test carries three coverage floors: `MIN_PROBED`, `MIN_DEALABLE` and the
partition assertion that no card is unclassified. `MIN_DEALABLE` is the one with
no analogue in `validate:cards`. Without it, a broken `gw_common` stub that made
every `deal()` return 0 would leave the card count intact and every assertion
vacuously green. Raise the floors when coverage genuinely rises. Never lower one
to make a run pass.

`scripts/lib/capturing-inventory.js` is the inventory every card sweep hands to
`buff()`/`dull()`. The caller's explicit answers steer a card down the branch
under test. A recorder captures the calls the sweep is collecting. Everything
else is auto-stubbed, so a new call a card makes needs no fixture update.
`recordInto` is the recorder for `addMods`/`addAIMods`/`addUnits`. Those methods
concat, and so they take a bare descriptor as readily as an array.

`scripts/lib/fake-knockout.js` is enough knockout for what shipped code does with
an observable. That is read, write, subscribe, `push`/`remove`,
`valueHasMutated`, and a `computed` that is just its function. Its `hooks` let a
test watch writes and mutations without a subscription of its own.
`makeInertObservable` is the one whose subscriptions never fire. The card sweeps
need it because `shared/bank.js` subscribes to its own `startCards` at define
time and the callback reaches `api.tally`.

`scripts/lib/coop-fixtures.js` holds what the tests for the co-op card factory
share. It holds a connected `viewer` and its inventory `record`. It holds the
`inventoryClass` stand-in for the base game's `GWInventory`, which only loads a
record's saved cards, counts them and applies them. It holds `rejection`,
because those host handlers reject with a plain string that `assert.rejects`
will not take as an error. The `HOST_CARDS` trap stays in each file. It hangs
off that test's own game stub.

`scripts/lib/fake-lodash-timers.js` captures `_.delay` and `_.debounce`.
`node:test`'s timer mocks cannot reach them, because lodash 3 binds
`context.setTimeout` once, at load. So the helper swaps the global lodash for a
context bound to a recording `setTimeout`, with an optional driven clock behind
`_.now()`. It returns the recorded calls and a restore.

`scripts/lib/referee-fakes.js` builds on `fake-jquery.js` to install the `$`/`api`
wiring that `referee_ai.js`'s file discovery needs. It returns its own restore
function. It records every `api.file.list` and `$.getJSON` call unconditionally.
A test that asserts which paths were walked therefore needs no second, subtly
different, local installer. The three tests that use it would otherwise each
have grown one.

## Coverage

The Sonar quality gate requires ~80% coverage on **new code only**. Files that are
pure `model`/`ko`/`api` glue are coverage-excluded. Their testable logic is
extracted into measured sibling modules. See [`shadowing.md`](shadowing.md).

Each sibling is a plain `define()` over lodash and `console` only. It has no
engine globals and no dependency the repo does not ship, so it loads under the
Node AMD harness. Where a helper needs one of the excluded file's injected
modules, it takes it as an explicit parameter rather than closing over it.

The glue file depends on the unshipped `shared/gw_common`. That dependency is
what stops it loading in the harness in the first place.
[`shadowing.md`](shadowing.md) carries the list of pairs. It is one list, and
this page is not a second copy of it.

### The `typeof module` hook

Several scene scripts are not modules at all. `gw_play/cards.js` is
self-invoking and never calls `define()`, so the harness cannot load it in
place. Its pure logic is extracted into sibling `define()` modules:
`cards_deal_helpers.js`, `cards_coop_deal.js`, `cards_coop_reroll.js`,
`cards_card_name_sync.js` and `cards_cheats.js`. Each returns a factory that
`cards.js` calls with its collaborators.

Where a helper inside such a module is not reachable through the returned
factory, it is re-exported through:

```js
// eslint-disable-next-line no-undef
if (typeof module !== "undefined" && module.exports) {
  module.exports = { applyAiMods: applyAiMods };
}
```

`module` is a Node/CommonJS global that does not exist in the game's Chromium
runtime. The branch is therefore dead in production and exists purely for the
test suite. The suite reaches it with `requireShippedModule`. The global is
deliberately absent from these files' configured globals. That is why each
occurrence carries an `eslint-disable-next-line no-undef`. The same hook appears
in `gw_play/referee_ai.js` for `applyAiMods`, which `define()` never returns.

**A test file is named for the module it loads, not the feature it belongs to.**
Once the pure logic is extracted, the bootstrap that is left has nothing the
harness can reach, and no test. `gw_play/coop_ping.js` injects a button and
calls `requireGW`, and nothing else.

That is expected, but it only stays visible if the tests around it are named
honestly. `coop_ping_operators.test.js` and `coop_ping_marker.test.js` say which
module each covers. By saying it, they leave `coop_ping.js` conspicuously
unclaimed. A `coop_ping.test.js` covering the operators would read as though the
bootstrap were tested.

`test/version.test.js` deliberately covers the one-line version bump. The
SonarCloud new-code baseline is the previous version, so a bump always lands
inside the new-code period. An uncovered bump drags "Coverage on New Code" to 0%
by itself.

`shared/gwo_rng.js` is deliberately **not** excluded. It carries its own PRNG
precisely so that it loads in Node, because `Math.seedrandom` is browser-only.
Its stream-independence and no-`Math.random` suites are what the rest of the
seeding work rests on.

## What tests cannot cover

No test here starts PA. Anything that only fails at runtime is verified by
loading the game with the mod enabled and starting a war. That includes a
renamed identifier in shipped `ui/**`, a CSS class rename that spans HTML and
CSS, a `modinfo.json` path and a localisation directive. CI gates the rest.
