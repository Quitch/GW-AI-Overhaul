# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Do not delete, rewrite, or restructure this file without the user's explicit permission first.** It has been
> accidentally deleted before. Small factual edits/additions to keep it accurate as the repo changes are fine, but
> ask before removing it or replacing large sections wholesale.

## What this is

GW-AI-Overhaul (GWO/GWAIO) is a client mod for Planetary Annihilation: TITANS that
overhauls the single-player Galactic War campaign (AI personalities, difficulty
tiers, tech cards, factions, planetary intel, etc). It ships as plain JS/CSS/JSON
loaded by the game's embedded Chrome 40, not a bundled/transpiled app - there is no
build step, only lint/validate/test.

The sibling folder `../../../../Steam/steamapps/common/Planetary Annihilation Titans/media`
(its own `CLAUDE.md` describes it) is the base game install. Treat it
as read-only reference for what an unmodified file looked like before this mod
shadowed it, or to find game systems (units, specs, AI) this mod doesn't touch. Never
edit anything there.

## Commands

```bash
npm ci                    # install pinned tooling (only needed once / after deps change)
npm run verify            # everything CI checks: lint + validate + test
npm run lint:js           # eslint .
npm run lint:css          # stylelint "**/*.css"
npm run lint:md           # markdownlint-cli2
npm run validate          # all validate:* checks below, in sequence
npm run validate:json     # every .json file in the repo parses
npm run validate:manifest # modinfo.json scenes reference files that actually exist
npm run validate:cards    # every tech card exports the fixed contract shape (see below)
npm run validate:ai-mods  # every card's buff()/dull() emits AI-mod descriptors matching referee_ai.js's contract
npm run validate:schemas  # AI build-order JSON + difficulty/personality data: type-consistency checks
npm run validate:refs     # cross-references: loadout ids <-> card files, unit keys, AI builder roles <-> unit_map
npm test                  # node --test (runs everything under test/)
npm run format:check      # prettier --check .
npm run format:write      # prettier --write . (only stage files your change actually touches - see below)
```

Run a single test file: `node --test test/specs.test.js`. Run a single test by name:
`node --test --test-name-pattern="<pattern>" test/specs.test.js`.

CI (`.github/workflows/ci.yml`) runs `lint:js`/`lint:css`/`lint:md`/`validate`/`test`
as full-repo hard gates (clean today, so any new violation anywhere is a real
regression), plus a separate Prettier check scoped only to files a PR/push actually
changed (most of the repo predates Prettier enforcement and isn't reformatted).
`npm run verify` mirrors the hard-gate job; run it before submitting a change.

## Architecture

### File shadowing

The mod overrides base-game files by shipping a file at the identical relative path
(`pa/**`, `ui/main/**`). CONTRIBUTING.md says avoid this unless unavoidable - prefer
adding new files under the mod's own namespaced directory,
`ui/mods/com.pa.quitch.gwaioverhaul/**`. `modinfo.json`'s `scenes` block is the mod's
real entry-point list: the game loads exactly the `coui://` files listed there per
scene (`gw_start`, `gw_play`, `gw_war_over`, `live_game`, `shared_build`, `start`,
`gw_coop_per_player_loadout`) and nothing else - a renamed/deleted file still listed
there fails silently in-game with no error a contributor would see locally, which is
what `validate:manifest` exists to catch.

### Function hijacking

Where the base game loads something into `self` this is usually in the context of
the global `model`, which is how this mod will intercept and overwrite individual
functions without needing to shadow an entire file.

### Tech card contract

Every file under `ui/main/game/galactic_war/cards/*.js` is an AMD module
(`define([deps], function(...) {...})`) returning an object with this fixed shape
(enforced by `scripts/validate/cards-contract.js`, empirically confirmed across all
223 cards):

- `visible`, `describe`, `summarize`, `icon`, `deal`, `buff`, `dull` - always
  functions.
- `audio`, `getContext` - functions on every card except one legacy exception kept
  for save-compatibility.
- `keep`, `discard` - optional, present on exactly one card each; legitimate
  extensions, not typos.

`buff(inventory)` mutates game state via `inventory.addMods(...)` (unit-spec stat
mods) and/or `inventory.addAIMods(...)` (AI build-order mod descriptors - see below).
`dull(inventory)` reverses it.

### AI-mod pipeline

A card's `buff()`/`dull()` can call `inventory.addAIMods([{type, op, value, toBuild,
idToMod, refId, refValue, matchAll}, ...])`. These descriptors have no static JSON
schema - they only exist as objects built at runtime - so `validate:ai-mods` checks
their shape by actually calling every card's `buff()`/`dull()` against a mock
inventory (`scripts/lib/auto-stub.js` auto-stubs every inventory method except the
ones under test, so this doesn't need to hand-mock the whole inventory API).

At game start, `gw_play/referee_ai.js` reads every AI build-order JSON file under the
resolved AI path, applies the in-scope descriptors via its `ops` table (`append`,
`prepend`, `replace`, `remove`, `new` - fabber/factory/platoon builds only; `squad` -
platoon templates only), and writes the result to one or more destination paths
(`writeConfigFiles`) sent to the server. `managerPath(type)` maps a descriptor's
`type` (`fabber`/`factory`/`platoon`/`template`) to a directory
(`fabber_builds/`/`factory_builds/`/`platoon_builds/`/`platoon_templates/`).

Which AI build tree is read/written is resolved by `shared/ai.js` +
`shared/referee_ai_paths.js` from `aiInUse` (`Titans` | `Penchant` | `Queller`) and
scoping (per-player, Guardians/mirror-mode, Cluster faction presence, subcommander
vs. enemy):

- `pa/ai/` - base game's stock Titans AI build data. This repo only ships the
  handful of files GWO shadows here; most of the tree is base-game-owned and not
  present in this repo (not available in CI either - no base game install).
- `pa/ai_penchant/` - GWO's own personality-driven build trees, shipped in full.
  `shared/ai.js`'s `penchants()` table maps a personality name to build-file tags
  drawn from this tree.
- `pa_ex1/ai_queller/` - base game's Queller AI data (also not shipped here).
- `pa/ai_tech/` - destination tree AI-mod `load` descriptors and card-driven output
  resolve against; not a source tree in this repo.
- `pa/ai_subcommander/`, `pa/ai_cluster/` - purely runtime-synthesized virtual mount
  paths `referee_ai.js` writes to; no on-disk existence in this repo at all.

`test/ai_source_files.test.js` documents this dual nature precisely - it's a
filesystem contract check scoped only to the source paths actually shipped here.
Runtime-only paths (with no filesystem backing) are instead covered by
`test/referee_ai_file_processing.test.js` via mocked `api.file.list`/`$.getJSON`.

### Difficulty & personality tuning data

`gw_start/difficulty_levels.js` (nine tiers, Beginner through Uber plus a minimal
"Custom" sentinel) and `faction/personalities.js` are declarative data, each wrapped
in `define({...})`. They don't share one fixed key set across entries (the Custom
tier intentionally has far fewer fields than the rest), so `validate:schemas` checks
type _consistency_ instead of required fields: any field appearing with more than one
`typeof` across entries that have it is almost certainly a typo, not a legitimate
variation.

### Test harness

`scripts/lib/amd-loader.js` loads this mod's shipped AMD modules under plain Node
(no game/Chromium runtime) by stubbing `define()` and the handful of engine globals
files reference _inside function bodies_ (`api`/`model`/`ko`/`$`/`createjs`/`window`/
`requireGW` are deliberately left unstubbed at define-time, so a file that touches
them at the top level of its factory fails loudly rather than silently passing).
`loadCouiModule(entry)` resolves both `coui://` paths and bare AMD ids
(`"cards/x"`, `"shared/x"`) the same way the game's own loader would; an id this repo
doesn't ship (a base-game module GWO doesn't override) throws a distinct
`NOT_SHIPPED` error rather than a generic failure, since CI has no base-game install
to fall back to. `requireShippedModule(entry)` instead pulls a file's plain Node
`module.exports`, used only where a file deliberately exposes a test-only hook dead
in production (e.g. `referee_ai.js`'s `applyAiMods`, guarded by `typeof module !==
"undefined"`, which never executes in-game).

## Conventions (see CONTRIBUTING.md for the full list)

- Shipped game code must stay ES5/Chrome 40 compatible - only `for...of` and
  `Promise` are allowed beyond ES5. `scripts/**` and `test/**` are Node-only tooling
  and are exempt (see `eslint.config.mjs`'s separate override block for them).
- camelCase for JS, kebab-case for CSS, 2-space indent, HTML in its own file (never
  inline in JS).
- PRs must only touch what the request needs - no drive-by cleanup/reformatting
  (submit those separately). Most of the repo predates Prettier enforcement and
  isn't reformatted; `format:write` and the CI Prettier check both scope to
  changed files only, not the whole repo.
- `.stylelintrc.json` disables `color-function-alias-notation` and scopes
  `declaration-block-no-redundant-longhand-properties` to ignore `overflow`, both
  because PA's embedded Chrome 40 predates the modern CSS syntax those rules assume.
  Don't remove those exclusions or "fix" the `rgba()`/`overflow-x`+`overflow-y` usage
  they cover as a drive-by.
- Several `pa/ai_penchant/**/*.json` files are intentionally minified to a single
  line (see `.prettierignore`) - don't reformat them.
- Sonar `javascript:S7721` (function scoping): keep module-private helpers inside the
  `define(...)` factory. In PA's RequireJS runtime a file-top-level declaration is a
  `window` global, so hoisting to the "outer scope" the rule wants leaks a global for
  no gain (the factory runs once). S7721 is therefore accepted and scoped out of
  `ui/**` (it stays active for `scripts/**`/`test/**`). Base-game-shadowed modules whose
  `define()` can't load under the Node harness reach their testable logic by extracting
  it into a measured sibling module the shadowed file requires (see CONTRIBUTING.md's
  "Node test reach for base-game-shadowed modules"), not by hoisting helpers to file top
  level. See CONTRIBUTING.md's "Function scoping in shipped UI code".

## Requirements

- Apply a prettier pass to all new and edited files of support types, including test scripts.
