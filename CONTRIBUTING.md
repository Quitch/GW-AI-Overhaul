# Submissions

This project welcomes any changes which aim to build upon existing features or simply improve current implementations.

## Tooling

Run `npm ci` once to install this project's tooling (eslint, eslint-plugin-es-x, eslint-plugin-lodash, stylelint, prettier, markdownlint) at the versions CI checks against - `package-lock.json` locks them (`package.json` gives `^` ranges), and `npm ci` installs exactly what the lock says, so a local pass means CI will pass too. Dependabot proposes version bumps as reviewable PRs.

Before submitting a change, run:

- `npm run verify` - everything CI checks in one command: lint, formatting, structural/data validation, and unit tests.
- `npm run format:write` - runs Prettier across the whole repo (`prettier --write .`), not just the files you touched. Stage only the files your change actually touches, per the "only modify what's necessary" rule below.

Markdown and CSS are each policed by two tools, so after touching a `.md` or `.css` file run `format:md` / `format:css` and then `lint:md` / `lint:css`. Both scripts run Prettier before the linter's `--fix`, which is the order that converges: Prettier first settles the layout the linters report but cannot repair themselves (an unformatted single-line rule block trips stylelint's `declaration-block-single-line-max-declarations`), and once it has, neither linter's own fixes break `prettier --check` - markdownlint only reaches for `*` bullets when Prettier has not already made them `-`. The linter still runs last because `--fix` cannot repair every rule: markdownlint's MD025 and friends need a manual edit, and the exit code is how you learn that. `.vscode/settings.json` runs only the linter's fix-all on save for Markdown and CSS - not Prettier - so the two passes are still yours to run. Both scripts are repo-wide, so stage only your own files.

GitHub Actions runs the same checks automatically on every push to `develop` or `master`, every pull request, and every published release; pushes to `develop` and pull requests also get the SonarCloud coverage gate (see [docs/testing.md](docs/testing.md), "Coverage"). `stylelint.config.mjs` is a Chrome 40 profile rather than a stock stylelint setup: `.browserslistrc` plus `stylelint-no-unsupported-browser-features` checks each declaration against caniuse, and hand-written rules cover what that cannot see - at-rules, selectors, and the several `stylelint-config-standard` rules that otherwise rewrite working CSS into syntax the engine rejects. Every entry carries the Chrome release that shipped the feature, verified against a running PA. Don't remove an exclusion or "fix" the usage it covers as a drive-by: `format:css` runs `stylelint --fix` across the repo, so a mis-set rule there produces CSS the engine silently drops.

SonarLint remains useful as an editor extension for local feedback beyond what the above covers.

## Submissions

Any pull request must only modify code necessary for the request, for example, a new feature should not be accompanied by additional clean-up or reformatting. Any such changes should be submitted separately.

Submissions must include a clear breakdown of the work done.

## Conventions

Any submissions should follow the requirements below:

- Code must comply with ES5/Chrome 40 support, plus libraries shipping with PA (see Available Libraries below). You do not need to memorise what Chrome 40 has: `eslint-plugin-es-x`'s `restrict-to-es5` config forbids every post-ES5 feature under `ui/**`, and the whitelist in `eslint.config.mjs` lists every one Chrome 40 supports, with the Chrome release that shipped it. If it is not in that list, do not use it - the lint will tell you either way. Note the entries excluded deliberately rather than for lack of support: `const` (Chrome 40's block scoping has no per-iteration loop binding, so `const`/`let` in a loop head misbehaves - use `var`), function declarations inside a block (Chrome 40 hoists them out of the block, so assign a function expression to a `var` instead), and `String.prototype.startsWith`/`endsWith` (present in PA's engine but they ignore the second positional argument and return a wrong answer instead of throwing - use `_.startsWith`/`_.endsWith`).
- Indent using two spaces (soft tabs).
- All warnings and errors must be resolved prior to commit.
- HTML is loaded from a separate file, not included in the body of JavaScript.
- File shadowing must not be used unless unavoidable.
- Camel case must be used for JavaScript.
- Kebab case or snake case, lower case only, must be used for CSS class and id names. As with JavaScript, you do not need to memorise what Chrome 40 supports in CSS: `stylelint.config.mjs` lists every property, value, function, unit, selector and at-rule it cannot handle, each with the Chrome release that shipped it, and the lint will tell you either way. Note that a few entries exist because the engine _parses_ the feature and then ignores it - `justify-content: space-evenly` is the notable one - so a `CSS.supports()` check in the console is not proof it works.
- Code must be formatted using prettier. The one exception is the `pa/**` data tree, excluded in `.prettierignore` because those JSON files are intentionally minified to a single line, matching the base game's own convention - don't reformat them, and don't narrow the exclusion back to an enumerated file list.
- Commit summaries must be informative but concise, with any required detail in the body.
- `CHANGELOG.md` additions always go under an `## Unreleased` heading, as `### Added`, `### Changed` or `### Bugfix`. A versioned heading describes a copy that has shipped, so its entries are static - never add to one or amend it. While a feature is still unreleased, later fixes and refinements to it are not changes anyone can have seen: the entry says the feature exists, and is not extended to describe the work that went into it.

### Releasing

The version lives in three places: `modinfo.json` (what the game reads), `ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js` (what the war panel shows and new saves record), and `sonar.projectVersion` in `sonar-project.properties`. `test/version.test.js` fails until all three match. Bump them together, move the `## Unreleased` entries under a `## v<version> - <date>` heading in `CHANGELOG.md`, and publish a GitHub release tagged `v<version>`. `release.yml` then runs `npm run verify` at the tag and checks that the tag matches `modinfo.json`'s version and that `CHANGELOG.md` has a `## v<version>` heading. It runs after the release is published, so it is an alarm rather than a gate: the checks are yours to make before clicking Publish.

`develop` carries the identifier `com.pa.quitch.gwaioverhaul-dev` and the display name `Galactic War Overhaul DEV`, so a working copy installs alongside the released mod rather than over it. `master` carries the release identifier and display name, and the release zip is built from `master`. Nothing in the code special-cases the `-dev` identifier.

### Available Libraries

- Those supported by Planetary Annihilation: TITANS - `media\ui\main\shared\js\thirdparty\`
  - Where multiple libraries exist use the following:
    - lodash 3.9.3
    - Knockout.js 3.5.1

### Function scoping in shipped UI code (Sonar S7721)

Keep module-private helpers inside the `define(...)` factory, and keep each scene script inside one IIFE. Sonar's `javascript:S7721` is accepted for `ui/**` for that reason. Why, and how tests reach logic that cannot load under the harness, are in [docs/constraints.md](docs/constraints.md) ("Function scoping, and Sonar S7721") and [docs/testing.md](docs/testing.md) ("The `typeof module` hook").

### Test coverage and new code

CI runs SonarCloud's quality gate, which requires 80% coverage on new code. What gets a test, what is excluded instead, and why, are in [docs/testing.md](docs/testing.md), "Coverage".
