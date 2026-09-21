# CEF migration

PA is replacing Coherent UI (Chrome 40) with the Chrome Embedded Framework
(Chromium 151). The port is a straight engine swap: the stock UI stack, lodash
3.9.3, jQuery 2.x, and the `coui://` and `spec://` schemes all carry over, and
the ES5 code on `develop` runs on modern Chromium unchanged. So `develop` is
the CEF line. This page covers what makes the swap a small fix if an assumption
turns out wrong: the scheme adapter, the scheme rewriter, the optional
modernisation pass, and the live test plan to run against a CEF build.

## Evidence baseline

A test against a CEF **v149** PA dev build (2026-08-12) drove launch → attach →
`start` → `gw_start` → `gw_play` end to end over CDP, with the stock UI stack
loading unchanged. Observed there:

- `coui://` stays registered: scenes navigated by `coui://` URL and populated
  the GW model, and `window.location.href` navigation works.
- The stock globals survive: `_` (lodash 3.9.3), `$` (jQuery 2.x), `ko`,
  `createjs`, `Math.seedrandom`, `loc`/`locTree`/`loadHtml`/`i18n`, the `api.*`
  surface (still promise-based), and the RequireJS/`requireGW` loader.
- `modinfo.json` scene injection and classic (non-module) scripts work.
- Knockout bindings render, so there is no eval-forbidding CSP (Knockout's
  binding parser uses `new Function`).
- The dev build takes `--ui-backend=cef`, and the debugger flag is
  `--webview-port <port>` in place of `--coherent_port=<port>`: CDP 1.3,
  `returnByValue` works, and pointing DevTools or `chrome://inspect` at the port
  is safe. Match targets by URL substring, never by cached id; one client per
  target.
- Arrow functions, `class` and spread all evaluate.

Unprobed on v149: `spec://` reads, whether the scheme is fetch-enabled and
CORS-permissive, the shared-scope collision behaviour (so the top-level
declaration rule in [constraints.md](constraints.md) stays), and the two-argument
`startsWith`/`endsWith` (PA's one-argument polyfill in
`ui/main/shared/js/helpers.js` is guarded by `typeof ... !== "function"`, so
it should no-op on a modern engine). The shipping target is v151, so nothing is
settled until the live test plan below has run against the real build.

## The scheme strategy

Scheme handling has three tiers:

1. **Dynamic URL builders** in the mod namespace go through
   `shared/gwo_url.js`, which owns the scheme constants and the single-slash
   `gameFile`/`specFile` forms (`"coui:/" + path` for a path that already
   starts with `/`). If the real scheme differs, that module is the only shipped
   code whose logic changes.
2. **Static literals** (AMD ids in `define()` arrays, card icon paths,
   `modinfo.json` scene entries, HTML `src` attributes, CSS `url()`) cannot go
   through a runtime adapter and stay literals. They are covered by the
   rewriter:

   ```bash
   npm run migrate:rewrite-scheme -- --from coui:// --to <real>:// --from spec:// --to <real-spec>://
   ```

   It rewrites `ui/**`, `modinfo.json`, `scripts/**` and `test/**` together,
   prints per-category counts, is idempotent, refuses a `--to` that contains
   another `--from` (a second run would corrupt every URL), and refuses to run
   on a dirty working tree. `docs/` is left alone. A test that spells a scheme
   must spell one the rewriter matches (`"spec://pa/..."`, never
   `"spec:/" + path`), or the rehearsal below fails that test.

3. **The Node-side tooling** (`scripts/lib/amd-loader.js`,
   `scripts/validate/manifest.js`) reads its scheme from
   `scripts/lib/scheme.js`, the Node-side source of truth. `test/gwo_url.test.js`
   asserts it and `gwo_url.js` match, since the ui module cannot import a Node
   module.

Shadowed base-game files under `ui/main/` keep their literal scheme strings
even at dynamic call sites: they follow stock's form, whatever that turns out
to be, and the rewriter covers them the same way it covers stock-shaped
statics. See [shadowing.md](shadowing.md).

### Rename rehearsal

Proves the "one command" remediation end to end, including that the harness
and validators follow the constants. Copy the tree to a scratch directory,
then in the copy:

```bash
git init && git config core.longpaths true && git add -A && git commit -q -m rehearsal
node scripts/migrate/rewrite-scheme.js --from coui:// --to couj:// --from spec:// --to sped://
npm run format:write && npm run verify
```

Equal-length throwaway schemes keep every line inside Prettier's print width;
a real scheme of a different length just needs that one `format:write` after
the real run. Discard the copy afterwards.

## The optional modernisation pass

Only after PA ships CEF, and only if wanted: `develop`'s ES5 runs on Chromium
151 as it is, and this pass is cosmetic. It cannot be verified in-game until a
CEF build exists, which is why it is a tool and not a branch.

```bash
npm run migrate:modernise
```

`scripts/migrate/modernise.js` runs lebab (`let`, `arrow`, `arrow-return`,
`template`, `obj-shorthand`) over every mod-side `ui/**/*.js` in place. Two
rules shape the output:

- **The ES5 boundary.** `ui/main/game/galactic_war/gw_play/**` and
  `ui/main/game/galactic_war/shared/**` are untouched: they are the shadowed
  stock files, and they keep minimal diffs against stock. Everything else is
  mod-side, including every card under `ui/main/game/galactic_war/cards/` (the
  `gwc_` cards are already overhauled onto `gwoGroup` and need not match stock)
  and the stock-derived copies under `ui/mods/`.
- **Scene scope.** Every scene shares one script scope, so a top-level `let`,
  `const` or `class` in one script collides with the next. The pass restores
  top-level declarations to `var`; function-scope declarations modernise.

The result does not lint on `develop`: drop `eslint-plugin-es-x` and its blocks
from `eslint.config.mjs` at that point, then `npm run format:write`.

## Live CEF test plan

Run when a CEF build of PA is available. Steps 1–2 are scripted CDP; the rest
are driven interactively with the console captured per scene.

1. **Launch and attach.** PA-CEF with the mod mounted,
   `--webview-port <port>`. Attach over CDP 1.3, capture
   `Runtime.consoleAPICalled` per scene or read the client log.
2. **Assumption probes, before anything else:** `fetch` and XHR of a known
   `coui://` JSON and a known `spec://` unit spec; `requireGW` of a mod AMD
   module; a card icon PNG load; `"abc".startsWith("b", 1)`; any KO binding
   rendering; presence of each stock global above; one call per `api.*` family
   the mod uses. If either scheme is gone, run the rewriter with the real scheme
   and restart this plan from step 1.
3. **Scene sweep.** `start` (menu injection) → `gw_start` (war setup, faction
   and difficulty UI, commander modal tint `filter`, `gwo_start.css` layout)
   → `gw_play` (galaxy map and its perf wrapper, card deal and tooltips,
   `planets.html` biome images, the KO-concatenated URLs, Foreign Intelligence
   panel `mask-*` rendering, systems panel) → battle launch (referee:
   memory-file unmount/mount, AI tree cache, `setUnitSpecTag`, `spec://`
   resolution in-game) → `live_game` menu → `gw_war_over` stats.
4. **Co-op.** Host plus viewer client: per-player tech (the
   `gw_per_player_tech_referee.js` shadow), colour allocation order, loadout
   banking suspension.
5. **Determinism.** Two wars generated from one seed compare equal through
   the `gwo_rng` paths.
6. **Widgets.** `selectPicker` dropdowns open/select/close; `tooltip` and
   `sound` bindings fire.
7. **Close out.** Every assumption above verified, or refuted with its
   remediation applied.

## Removed-web-API audit

Chromium removed a handful of platform features between 40 and 151 that ES5
code could legally use. Audited with these grep patterns over `ui/**`: mutation
events (`DOMSubtreeModified`, `DOMNodeInserted`, `DOMNodeRemoved`,
`DOMAttrModified`, `DOMCharacterDataModified`), `Object.observe`, `event.path`,
`showModalDialog`, `webkitRequestAnimationFrame`, `webkitIndexedDB`,
`webkitURL`, `webkitAudioContext`, synchronous XHR.

Result: **no occurrences.** The mod's platform surface is jQuery, Knockout,
lodash, createjs and the `api.*` façade, none of it touching removed APIs
directly.

## History

The `feature/chrome-embedded-framework` branch prepared GWO for CEF in three
stages before the port's shape was known: the scheme strategy above, a
lebab-based syntax modernisation of the mod namespace, and a partial move off
jQuery and lodash (a native referee chain, `shared/gwo_fetch.js`). Once it was
clear the port keeps lodash 3.9.3 and runs ES5 unchanged, the branch was
retired in favour of `develop`, and the portable pieces landed here. Two tags
keep it reachable:

- `cef-stage1-baseline`: the last commit that runs on the shipping Coherent
  build, live-tested there on 2026-08-12 (new war, explore, deal, battle launch,
  zero GWO errors).
- `cef-branch-final`: the branch's final state (stages 1–3, `develop` merged to
  v7.3.2), should the stage-2/3 work ever be wanted.
