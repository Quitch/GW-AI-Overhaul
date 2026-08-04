# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code
in this repository.

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
| Tech card contract, `buff`/`dull`, deal weighting, loadouts             | [`docs/tech-cards.md`](docs/tech-cards.md)     |
| AI-mod descriptors, the `ops` table, `managerPath`, the tree cache      | [`docs/ai-pipeline.md`](docs/ai-pipeline.md)   |
| The five AI trees, source vs destination, scope tokens                  | [`docs/ai-paths.md`](docs/ai-paths.md)         |
| Host/viewer, per-player tech, colour allocation                         | [`docs/coop.md`](docs/coop.md)                 |
| Unit spec ops, path segments, spec caching                              | [`docs/specs.md`](docs/specs.md)               |
| Galaxy generation, factions, difficulty tiers, penchants                | [`docs/galaxy.md`](docs/galaxy.md)             |
| The Node AMD harness, the seven validators, coverage                    | [`docs/testing.md`](docs/testing.md)           |

Four things are worth knowing before you touch anything, each covered in full by
the doc named:

- **Shipped `ui/**` code must be ES5 / Chrome 40 safe.** No `let`, arrow functions,
  template literals or `class`. A parse error takes out the whole script, not just
  the line. The `eslint.config.mjs` whitelist is exhaustive, so it doubles as the
  answer to "may I use X?" - no entry means no.
  ([`constraints.md`](docs/constraints.md))
- **A shadowed file is a full copy, not a diff.** Prefer injecting into a scene or
  hijacking a function; shadow only when neither works.
  ([`shadowing.md`](docs/shadowing.md))
- **Keep module-private helpers inside the `define(...)` factory.** A file-top-level
  declaration is a `window` global in PA's RequireJS runtime, so Sonar's S7721 is
  deliberately scoped out of `ui/**`. ([`constraints.md`](docs/constraints.md))
- **`model.game().inventory()` is always the host's.** Under per-player tech in
  co-op, card code must use the inventory passed to it. ([`coop.md`](docs/coop.md))

## Commands

```bash
npm ci                    # install pinned tooling (only needed once / after deps change)
npm run verify            # everything CI checks: lint + format:check + validate + test
npm run lint:js           # eslint .
npm run lint:css          # stylelint "**/*.css"
npm run lint:md           # markdownlint-cli2
npm run validate          # all validate:* checks below, in sequence
npm run validate:json     # every .json file in the repo parses
npm run validate:manifest # modinfo.json scenes reference files that actually exist
npm run validate:cards    # every tech card exports the fixed contract shape
npm run validate:ai-mods  # every card's buff()/dull() emits valid AI-mod descriptors
npm run validate:schemas  # AI build-order JSON + difficulty/personality data
npm run validate:refs     # cross-references: loadout ids, unit keys, AI builder roles
npm run validate:sonar    # sonar-project.properties: no stale paths, files are UTF-8
npm test                  # node --test (runs everything under test/)
npm run test:coverage     # same tests + lcov to coverage/lcov.info
npm run format:check      # prettier --check .
npm run format:write      # prettier --write . (stage only your own files - see below)
```

Run a single test file: `node --test test/specs.test.js`. Run a single test by name:
`node --test --test-name-pattern="<pattern>" test/specs.test.js`.

CI (`.github/workflows/ci.yml`) runs `lint:js`/`lint:css`/`lint:md`/`validate`/`test`
as full-repo hard gates (clean today, so any new violation anywhere is a real
regression), plus a separate Prettier check scoped only to files a PR/push actually
changed. `npm run verify` mirrors the hard-gate job; run it before submitting a
change. `.github/workflows/build.yml` additionally runs `test:coverage` and the
SonarQube scan; `release.yml` re-runs the hard gates against a published release tag
as a post-publish alarm. What each validator catches, and why the Sonar config needs
its own guard, is in [`docs/testing.md`](docs/testing.md).

## Conventions

See CONTRIBUTING.md for the full list. The ones that bite most often:

- camelCase for JS, kebab-case for CSS, 2-space indent, HTML in its own file (never
  inline in JS).
- PRs must only touch what the request needs - no drive-by cleanup/reformatting
  (submit those separately). `format:write` is repo-wide (`prettier --write .`), so
  run it and then stage only the files your change actually touches. The whole repo
  passes `prettier --check .`, which `npm run verify` enforces.
- The whole `pa/**` data tree is excluded from Prettier (see `.prettierignore`).
  Those JSON files are intentionally minified to a single line, matching the base
  game's own convention - don't reformat them, and don't narrow the exclusion back
  to an enumerated file list.
- `.stylelintrc.json` disables `color-function-alias-notation` and scopes
  `declaration-block-no-redundant-longhand-properties` to ignore `overflow`, both
  because Chrome 40 predates the CSS syntax those rules assume. Don't remove those
  exclusions or "fix" the usage they cover as a drive-by.

### Comments

The repo has been through a full comment audit. These are the rules it was cleaned
to, and they bind every line you add or touch - mod-owned code, shadowed base-game
files and tech cards are held to the same bar.

**The default is no comment.** Code should self-document; when in doubt, leave it
out. The rules below are the narrow exceptions, not a licence to annotate.

- **A comment earns its place only by saying what the code cannot**: base-game or
  engine behaviour, a bug workaround, a dependency that lives outside the mod, or a
  counter-intuitive ordering. Anything that restates the code goes.
- **If the comment exists because the code is unclear, fix the code.** Rename the
  identifier, extract the helper, or hoist the magic number to a named constant -
  the comment then has nothing left to say.
- **Say it once.** A fact needed in five places is one comment plus four
  cross-references, or a name that carries it. Copies drift apart.
- **Keep the rule, drop the story.** Rejected alternatives, tuning history and "this
  used to live elsewhere" belong in `CHANGELOG.md`.
- **Don't record counts or measurements nothing enforces** - they are stale as soon
  as a file is added. An enforced floor (`MIN_CHECKED` in
  `scripts/lib/cards-contract.js`) is a different thing and stays.
- **Verify a comment against the code before writing it.** Every path, filename and
  identifier it names must exist, and the claim must match the lines beside it. The
  audit found sixteen that failed exactly there; a confidently wrong comment is
  worse than none.
- **Informative, but concise.** Keep it short. Keep it simple. If it requires an
  essay then consider that it may belong in the docs not the code.
- **`docs/` carries system-level knowledge; line-anchored facts stay in the code.**
  A paragraph explaining a whole subsystem belongs in `docs/` with the code pointing
  at it - but a documented subsystem is not licence to delete the comments inside
  it.

Never removed, because they are not prose:

- `eslint-disable`, `prettier-ignore` and `stylelint-disable` directives.
- Knockout `<!-- ko -->` / `<!-- /ko -->`, which are executable virtual bindings
  ([`constraints.md`](docs/constraints.md)).
- The `// GWO - ...` shadow marker on line 1 of a shadowed file - the only record of
  why that copy exists ([`shadowing.md`](docs/shadowing.md)). Stock's `// !LOCNS:...`
  is deliberately not carried; don't reinstate it
  ([`constraints.md`](docs/constraints.md)).

Applying these to comments your change doesn't otherwise touch is drive-by cleanup:
correct, but a separate PR.

## Requirements

- Apply a prettier pass to all new and edited files of support types, including test
  scripts.
