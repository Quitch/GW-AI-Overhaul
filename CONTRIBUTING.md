# Submissions

This project welcomes any changes which aim to build upon existing features or simply improve current implementations.

## Tooling

Run `npm ci` once to install this project's tooling (eslint, stylelint, prettier, markdownlint) at the exact pinned versions CI checks against - versions are pinned in `package.json`/`package-lock.json` rather than floating on latest, so a local pass means CI will pass too. Dependabot proposes version bumps as reviewable PRs.

Before submitting a change, run:

- `npm run verify` - everything CI checks in one command: lint, formatting, structural/data validation, and unit tests.
- `npm run format:write` - runs Prettier across the whole repo (`prettier --write .`), not just the files you touched. Stage only the files your change actually touches, per the "only modify what's necessary" rule below.

GitHub Actions runs the same checks automatically on every push, pull request, and release. `stylelint.config.mjs` is a Chromium 151 profile: `.browserslistrc` plus `stylelint-no-unsupported-browser-features` checks each declaration against caniuse, guarding against features newer than the engine, and hand-written rules ban the syntax no Blink release ever shipped, which caniuse cannot flag. Don't remove an entry or "fix" the usage it covers as a drive-by: `format:css` runs `stylelint --fix` across the repo, so a mis-set rule there produces CSS the engine silently drops.

SonarLint remains useful as an editor extension for local feedback beyond what the above covers.

## Submissions

Any pull request must only modify code necessary for the request, for example, a new feature should not be accompanied by additional clean-up or reformatting. Any such changes should be submitted separately.

Submissions must include a clear breakdown of the work done.

## Conventions

Any submissions should follow the requirements below:

- Code targets CEF's Chromium 151, plus libraries shipping with PA (see Available Libraries below). Modern JavaScript is fine, with one hard scene-scope rule enforced by `eslint.config.mjs`: no top-level `let`, `const` or `class` in shipped files - scene scripts share one scope, and a duplicate lexical declaration across mods is a scene-killing `SyntaxError`. Keep declarations inside the `define(...)` factory or an IIFE. Shadowed base-game files stay in ES5/stock idiom regardless - see the modernisation boundary in `docs/shadowing.md`.
- Indent using two spaces (soft tabs).
- All warnings and errors must be resolved prior to commit.
- HTML is loaded from a separate file, not included in the body of JavaScript.
- File shadowing must not be used unless unavoidable.
- Camel case must be used for JavaScript.
- Kebab case or snake case, lower case only, must be used for CSS class and id names. You do not need to memorise what Chromium 151 supports in CSS: `stylelint.config.mjs` checks every declaration against caniuse and bans the never-shipped syntax by hand, and the lint will tell you either way.
- Code must be formatted using prettier.
- Commit summaries must be informative but concise, with any required detail in the body.
- `CHANGELOG.md` additions always go under an `## Unreleased` heading, as `### Added`, `### Changed` or `### Bugfix`. A versioned heading describes a copy that has shipped, so its entries are static - never add to one or amend it. While a feature is still unreleased, later fixes and refinements to it are not changes anyone can have seen: the entry says the feature exists, and is not extended to describe the work that went into it.

### Available Libraries

- Those supported by Planetary Annihilation: TITANS - `media\ui\main\shared\js\thirdparty\`
  - Where multiple libraries exist use the following:
    - lodash 3.9.3
    - Knockout.js 3.5.1

### Function scoping in shipped UI code (Sonar S7721)

Shipped `ui/**` code is loaded by the game through stock RequireJS, which runs each module file by injecting a `<script>` element (`req.load` -> `req.createNode`; `node.src = url; head.appendChild(node)`). A `<script>` executes in **global scope**, so anything declared at a file's top level - outside its `define(...)` factory - becomes a property of the global `window` object. The mod's non-AMD scene scripts (e.g. `function gwoSetup()`) rely on exactly this. GWO's convention is therefore:

- **Keep module-private helpers inside the `define(...)` factory.** Do not hoist a helper to file top level just to satisfy Sonar `javascript:S7721` ("Move function to the outer scope"). The factory body runs once per load, so a factory-scoped helper is created once regardless - there is no performance win - whereas hoisting it leaks a globally-named function (`multiply`, `isNullish`, `luminance`, ...) that can silently collide (last-loaded-wins) with the base game, other mods, or GWO's own files. S7721 is unsatisfiable in this runtime without creating such a global (hoisting only _within_ the factory does not clear it - the rule wants the outermost scope), so it is **accepted** (won't-fix) and scoped out of `ui/**`. It stays active for `scripts/**` and `test/**`, which are real CommonJS modules where Node wraps each file and hoisting is both safe and beneficial.
- **Node test reach for base-game-shadowed modules.** A module whose `define(...)` dependencies cannot resolve in the Node test harness - it depends on an unshipped base-game module, so `amd-loader` throws `NotShippedError` before the factory can run (e.g. `gw_per_player_tech_referee.js`, `gw_galaxy.js`, `referee_game_files.js`, `referee_config.js`) - keeps its testable logic in a separate **measured** sibling module (`gw_play/{per_player_tech,referee_config_setup,referee_game_file_paths}.js`, `shared/gw_galaxy_graph.js`) that the shadowed file `require`s and that tests load directly via `loadCouiModule`. The residual model/ko/api glue stays in the shadowed file, which is coverage-excluded (see `sonar-project.properties`). The extracted module is a normal `define(...)` returning its helpers, so nothing is hoisted to file top level; helpers that need the shadowed file's collaborators take them as explicit parameters or (when all collaborators are themselves shipped mod modules) inject the same `define(...)` dependencies. The one remaining in-factory `module.exports` test hook is `referee_ai.js`'s `applyAiMods` (reached via `requireShippedModule`); prefer the extract-a-sibling approach for new cases.

### Test coverage and new code

CI runs SonarCloud's default quality gate, which requires **≥ 80% coverage on _new code_** (the lines a change adds or edits) - not on the whole repo, so the large body of pre-existing untested `ui/**` is not retroactively measured. The aim is honest coverage, never padding to hit the number:

- **New/changed logic gets a unit test.** Add coverage under `test/**` for the branching you introduce in the measured logic layer (`shared/**` helpers, `gw_play/referee_*.js`, `gw_start/ai_tech.js`, and similar). Follow the existing harness in `test/*.test.js` (`node:test` + `scripts/lib/amd-loader.js`, engine globals stubbed only where a function reads them).
- **Keep non-trivial logic in a measured `shared/` helper, not inline in a tech card.** Tech cards (`cards/**`) are excluded from the coverage metric because their contract and AI-mod behaviour are already enforced by `validate:cards`/`validate:ai-mods`; that exclusion is only honest while cards stay thin, so real logic belongs in a `shared/` module where it is both testable and tested.
- **Genuinely-untestable new code is excluded, not faked.** DOM/knockout/createjs glue and pure `define({...})` data blobs (whose correctness is guarded by `validate:schemas`/`validate:refs`) belong in `sonar.coverage.exclusions` in `sonar-project.properties` - each with a one-line rationale matching the categories already documented there - rather than being given assertionless "tests" just to move coverage.
- **Renaming or deleting an excluded file means updating its exclusion.** Nothing in the game or the rest of the tooling reads `sonar-project.properties`, so a path left pointing at a file that no longer exists looks deliberate and silently puts that file back into analysis - which is how a GBK-encoded readme reintroduced SonarCloud's "problems with file encoding" warning. `validate:sonar` (part of `npm run validate`) fails on any exclusion pattern matching no tracked file, and on any file still in analysis that isn't valid UTF-8; a genuinely non-UTF-8 asset needs an exclusion rather than a re-encode.
