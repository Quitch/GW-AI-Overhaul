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

### Function scoping in shipped UI code (Sonar S7721)

Shipped `ui/**` code is loaded by the game through stock RequireJS, which runs each module file by injecting a `<script>` element (`req.load` -> `req.createNode`; `node.src = url; head.appendChild(node)`). A `<script>` executes in **global scope**, so anything declared at a file's top level - outside its `define(...)` factory - becomes a property of the global `window` object. The mod's non-AMD scene scripts (e.g. `function gwoSetup()`) rely on exactly this. GWO's convention is therefore:

- **Keep module-private helpers inside the `define(...)` factory.** Do not hoist a helper to file top level just to satisfy Sonar `javascript:S7721` ("Move function to the outer scope"). The factory body runs once per load, so a factory-scoped helper is created once regardless - there is no performance win - whereas hoisting it leaks a globally-named function (`multiply`, `isNullish`, `luminance`, ...) that can silently collide (last-loaded-wins) with the base game, other mods, or GWO's own files. S7721 is unsatisfiable in this runtime without creating such a global (hoisting only _within_ the factory does not clear it - the rule wants the outermost scope), so it is **accepted** (won't-fix) and scoped out of `ui/**`. It stays active for `scripts/**` and `test/**`, which are real CommonJS modules where Node wraps each file and hoisting is both safe and beneficial.
- **Exception - Node test reach for base-game-shadowed modules.** A module whose `define(...)` dependencies cannot resolve in the Node test harness - it depends on an unshipped base-game module, so `amd-loader` throws `NotShippedError` before the factory can run (e.g. `gw_per_player_tech_referee.js`, `gw_galaxy.js`, `referee_game_files.js`) - may declare its testable helpers above `define(...)` and expose them through the dead-in-production `module.exports` hook. Such hoisted helpers must take their collaborators as explicit parameters (never close over the factory's injected modules) and use collision-resistant names.

## Available Libraries

- Those supported by Planetary Annihilation: TITANS - `media\ui\main\shared\js\thirdparty\`
  - Where multiple libraries exist use the following:
    - lodash 3.9.3
    - Knockout.js 3.5.1
