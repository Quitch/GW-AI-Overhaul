# Submissions

This project welcomes any changes which aim to build upon existing features or simply improve current implementations.

## Tooling

Run `npm ci` once to install this project's tooling (eslint, stylelint, prettier, markdownlint) at the exact pinned versions CI checks against - versions are pinned in `package.json`/`package-lock.json` rather than floating on latest, so a local pass means CI will pass too. Dependabot proposes version bumps as reviewable PRs.

Before submitting a change, run:

- `npm run verify` - everything CI checks in one command: lint, structural/data validation, and unit tests.
- `npm run format:write` - formats Prettier onto the files you touched. Most of the repo predates Prettier being enforced and isn't reformatted, so only stage the files your change actually touches, per the "only modify what's necessary" rule below.

GitHub Actions runs the same checks automatically on every push, pull request, and release. `.stylelintrc.json` disables `color-function-alias-notation` entirely and scopes `declaration-block-no-redundant-longhand-properties` to ignore the `overflow` shorthand - both because PA's embedded Chrome 40 predates the modern CSS syntax those rules otherwise expect (an alpha channel on unprefixed `rgb()`, and the 2-value `overflow` shorthand, respectively). Don't remove those exclusions or "fix" the `rgba()`/`overflow-x`+`overflow-y` usages they cover as a drive-by.

SonarLint remains useful as an editor extension for local feedback beyond what the above covers.

## Submissions

Any pull request must only modify code necessary for the request, for example, a new feature should not be accompanied by additional clean-up or reformatting. Any such changes should be submitted separately.

Submissions must include a clear breakdown of the work done.

## Conventions

Any submissions should follow the requirements below:

- Code must comply with ES5/Chrome 40 support. `for...of` and `Promise` may be used.
- Indent using two spaces (soft tabs).
- All warnings and errors must be resolved prior to commit.
- HTML is loaded from a separate file, not included in the body of JavaScript.
- File shadowing must not be used unless unavoidable.
- Camel case must be used for JavaScript.
- Kebab case must be used for CSS.
- Code must be formatted using prettier.
- Commit summaries must be informative but concise, with any required detail in the body.

## Available Libraries

- Those supported by Planetary Annihilation: TITANS - `media\ui\main\shared\js\thirdparty\`
  - Where multiple libraries exist use the following:
    - lodash 3.9.3
    - Knockout.js 3.5.1
