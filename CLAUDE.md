# CLAUDE.md

## What this is

GW-AI-Overhaul (GWO/GWAIO) is a client mod for Planetary Annihilation: TITANS that
overhauls the single-player Galactic War campaign (AI personalities, difficulty
tiers, tech cards, factions, planetary intel, etc). It ships as plain JS/CSS/JSON
loaded by the game's embedded Chrome 40, not a bundled/transpiled app - there is no
build step, only lint/validate/test.

The base game install (a `media` folder under Steam's `.../Planetary Annihilation
Titans/`) is not part of this repo and lives at a different path on every
contributor's machine. If it's set up as an additional workspace root, it will
appear in the "Additional working directories" list at the start of the session,
and its own `CLAUDE.md` will identify it as the base game install - use that rather
than assuming a fixed path here. Treat it as read-only reference for what an
unmodified file looked like before this mod shadowed it, or to find game systems
(units, specs, AI) this mod doesn't touch. Never edit anything there.

## Architecture

**Full developer documentation lives in [`docs/`](docs/).** Read
[`docs/README.md`](docs/README.md) first - it gives a reading order and a list of
the traps that have actually caused bugs here.

| Topic                                                                   | Doc                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| Chrome 40 / ES5 limits, available libraries, CSS and localisation rules | [`docs/constraints.md`](docs/constraints.md)   |
| Tree layout, scenes, entry points, battle launch sequence               | [`docs/architecture.md`](docs/architecture.md) |
| File shadowing, function hijacking, the full shadowed-file inventory    | [`docs/shadowing.md`](docs/shadowing.md)       |
| Tech cards, the card mod API, and what breaks downstream if it changes  | [`docs/tech-cards.md`](docs/tech-cards.md)     |
| AI-mod descriptors, the `ops` table, `managerPath`, the tree cache      | [`docs/ai-pipeline.md`](docs/ai-pipeline.md)   |
| The five AI trees, source vs destination, scope tokens                  | [`docs/ai-paths.md`](docs/ai-paths.md)         |
| Host/viewer, per-player tech, colour allocation                         | [`docs/coop.md`](docs/coop.md)                 |
| Unit spec ops, path segments, spec caching                              | [`docs/specs.md`](docs/specs.md)               |
| Galaxy generation, factions, difficulty tiers, penchants                | [`docs/galaxy.md`](docs/galaxy.md)             |
| Races (Legion, Bugs, Exiles): registry, translation, race AI trees      | [`docs/races.md`](docs/races.md)               |
| The Node AMD harness, the validators, coverage                          | [`docs/testing.md`](docs/testing.md)           |

These are worth knowing before you touch anything, each covered in full by the doc
named:

- **Shipped `ui/**` code must be ES5 / Chrome 40 safe.** No `let`, arrow functions,
  template literals or `class`. A parse error takes out the whole script, not just
  the line. The `eslint.config.mjs` whitelist is exhaustive, so it doubles as the
  answer to "may I use X?" - no entry means no.
  ([`constraints.md`](docs/constraints.md))
- **Shipped CSS is bound by the same engine, and fails more quietly.** An
  unsupported declaration is dropped silently rather than erroring, so
  `stylelint.config.mjs` is the CSS half of that whitelist and the answer to "may I
  use this property?". ([`constraints.md`](docs/constraints.md))
- **A shadowed file is a full copy, not a diff.** Prefer injecting into a scene or
  hijacking a function; shadow only when neither works.
  ([`shadowing.md`](docs/shadowing.md))
- **Keep module-private helpers inside the `define(...)` factory.** A file-top-level
  declaration is a `window` global in PA's RequireJS runtime, so Sonar's S7721 is
  deliberately scoped out of `ui/**`. ([`constraints.md`](docs/constraints.md))
- **`model.game().inventory()` is always the host's.** Under per-player tech in
  co-op, card code must use the inventory passed to it. ([`coop.md`](docs/coop.md))
- **Part of this mod is a public API with a downstream consumer.** The `model.gwo*`
  globals, the helper names `shared/cards.js` returns, the key names in
  `shared/units.js` / `shared/unit_groups.js`, and the `deal()` signature are all
  built against by the sibling [New-GW-Cards](https://github.com/Quitch/New-GW-Cards)
  template, which documents them in its own README and card templates. Renaming or
  dropping any of them breaks every mod written from it, and breaks it _silently_ -
  a card reading a helper that no longer exists just gets `undefined`. Change one
  and update that repo in step. `test/modder_api.test.js` pins the whole surface.
  ([`tech-cards.md`](docs/tech-cards.md))

## Verifying a change

`npm run verify` is the pre-submit gate - it runs everything CI checks. The
individual scripts are in `package.json`, and what each validator catches is in
[`docs/testing.md`](docs/testing.md), which also covers running a single test file
or test.

After touching a `.md` or `.css` file, run `format:md` / `format:css` and then
`lint:md` / `lint:css` - that order is the one that converges, for reasons
CONTRIBUTING.md gives. Both are repo-wide, as is `format:write`, so stage only the
files your change touches.

## Conventions

See [CONTRIBUTING.md](CONTRIBUTING.md). The two that bite most often:

- A PR touches only what the request needs. Drive-by cleanup, reformatting and
  comment fixes elsewhere are correct but belong in a separate PR.
- `CHANGELOG.md` additions go under `## Unreleased`, as `### Added`, `### Changed`
  or `### Bugfix`. A versioned heading describes a copy that has shipped, so its
  entries are static - never add to one or amend it. While a feature is still
  unreleased, later fixes to it are not changes anyone can have seen: the entry
  says the feature exists, and does not grow to cover the work behind it.

### Comments

The bar, and what belongs in a comment versus in `docs/`, is in
[`docs/README.md`](docs/README.md). One rule beyond it: verify a comment against
the code before writing it. Every path, filename and identifier it names must
exist, and the claim must match the lines beside it - a confidently wrong comment
is worse than none, and it is by far the most common defect found here.

Never removed, because they are not prose:

- `eslint-disable`, `prettier-ignore` and `stylelint-disable` directives.
- Knockout `<!-- ko -->` / `<!-- /ko -->`, which are executable virtual bindings
  ([`constraints.md`](docs/constraints.md)).
- `// GWO - ...` markers. These sit inline against the lines a shadowed or copied
  base-game file changes, and are the only record of what GWO altered
  ([`shadowing.md`](docs/shadowing.md)). Reword one if it has gone verbose, but the
  marker itself stays. Stock's `// !LOCNS:...` is deliberately not carried; don't
  reinstate it ([`constraints.md`](docs/constraints.md)).
- Stock's own comments inside a deliberate copy of a base-game file - today
  `gw_start/gwo_breeder.js` and `shared/gwo_system_templates.js`. Those copies are
  kept line-for-line close to stock so the diff after a PA patch stays readable,
  which covers stock's comments, its dead branches, and its `TODO`s. Sonar flags
  that TODO; leave it.
- The vendored-code attribution at the top of
  `gw_play/section_of_foreign_intelligence/`, which is a licence condition.
