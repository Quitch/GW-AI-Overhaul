# CEF migration

PA is replacing Coherent UI (Chrome 40) with the Chrome Embedded Framework
(Chromium 151). The `feature/chrome-embedded-framework` branch prepares GWO for
that swap ahead of any published port details, so it is built on the documented
assumptions below, with every engine-specific touchpoint centralised so that a
wrong assumption is a small, mechanical fix once the real behaviour is known.

The branch is **CEF-only**. Stage 1 still parses and runs on the shipping
Coherent build — the last commit that does is tagged `cef-stage1-baseline` —
and everything after the stage 2 syntax modernisation does not. Do not merge
until PA ships the CEF runtime.

The work is staged:

1. **Must** — what the mod needs to survive the engine swap at all: the URL
   scheme strategy, the removed-web-API audit, this document.
2. **Should** — retarget the lint/stylelint toolchain from Chrome 40 to
   Chromium 151, then modernise syntax in the mod namespace.
3. **Can** — reduce reliance on jQuery/lodash where native JS now suffices.

## Keeping up with `develop`

All three stages are complete, so `develop` is merged in periodically rather
than the branch being rebased. Everything `develop` adds arrives in Chrome-40
idiom and has to be brought over the same boundary the stages drew, which is a
mechanical pass rather than a judgement call:

1. Resolve in favour of `develop` for anything whose conflict is only the ES5
   vs modern spelling of the same logic — its version is the newer behaviour.
   Keep this branch's version only where the file _is_ CEF work
   (`referee_ai.js`, `referee_game_file_paths.js`, `per_player_tech.js`,
   `stylelint.config.mjs` and its test), and hand-apply `develop`'s behaviour
   changes onto it.
2. Re-run the modernisation over every file taken from `develop`: `npx lebab
--replace <file> --transform let,arrow,arrow-return,template,obj-shorthand`,
   then `_.isArray` → `Array.isArray`, `_.assign({},` → `Object.assign({},`,
   the lodash-3-only names in the table below, and `_.constant(<primitive>)` →
   an arrow in mod-authored cards. lebab also turns every file-top-level `var`
   into `let`/`const`; put those back to `var` — the scene entry flags,
   `gwo_panel.js`'s `disposeGwoPanelLoader`, `section_of_foreign_intelligence.js`'s
   `gwoBuffType` — under the scene-scope rule in
   [constraints.md](constraints.md). `eslint` catches any that slip.
3. Re-apply the dynamic-URL routing by hand: a new `window.location.href`,
   `$.get`/`$.ajax` or `"coui:/" + path` site from `develop` must go through
   `shared/gwo_url.js`, and new fetching through `shared/gwo_fetch.js`.
4. Sweep before committing — no ES5 idiom left in the mod namespace outside the
   stock copies, and `npm run verify` green. `develop`'s _own_ files keep their
   own conventions; realigning those is drive-by.

| lodash 3 call              | Native form                    | Why it cannot stay                                     |
| -------------------------- | ------------------------------ | ------------------------------------------------------ |
| `_.first(a)` / `_.last(a)` | `a[0]` / `a[a.length - 1]`     | `_.first` is `_.head` in 4; `_.last` survives, aliased |
| `_.rest(a)`                | `a.slice(1)`                   | `_.rest` in 4 is a function wrapper, not `_.tail`      |
| `_.contains(a, x)`         | `a.includes(x)`                | removed in 4 (`_.includes`)                            |
| `_.any` / `_.all`          | `a.some` / `a.every`           | removed in 4 (`_.some` / `_.every`)                    |
| `_.pluck(a, "k")`          | `a.map((o) => o.k)`            | removed in 4 (`_.map` with a string)                   |
| `_.sum(a)`                 | `a.reduce((t, n) => t + n, 0)` | 4's `_.sum` drops the iteratee                         |
| `_.zipObject(pairs)`       | `Object.fromEntries(pairs)`    | 4 takes `(keys, values)` only; pairs is `_.fromPairs`  |
| `_.isArray(a)`             | `Array.isArray(a)`             | drop-in; spelled once                                  |
| `_.assign({}, ...)`        | `Object.assign({}, ...)`       | drop-in; spelled once                                  |

`_.zipObject(keys, values)`, `_.map`, `_.filter`, `_.forEach`, `_.partial`,
`_.compact` and the rest of the shared 3/4 surface stay.

Merged to `develop`'s v6.10.3 (2026-08-16): `npm run verify` green, rename
rehearsal 1,080 occurrences and green in the rewritten copy.

Merged to `develop`'s v6.12.0 (2026-08-25): `npm run verify` green, rename
rehearsal 1,098 occurrences (modinfo.json 26, ui 927 in 297 files, scripts 9,
test 136) and green in the rewritten copy, 98.5% lines under
`npm run test:coverage`. What the pass had to do beyond the mechanical steps:

- `develop`'s new `shared/gwo_biome_mods.js` reads a mounted server mod with
  `$.ajax` on a `` `spec:/${mountPath}${entry}` `` URL — a `spec:/` + path form
  the rewriter's `spec://` pattern does not match, and which
  `referee_game_files.js` had been building the same way since stage 3.
  `gwo_url.js` gained `specFile` (and `scripts/lib/scheme.js` `SPEC_SCHEME`)
  and both sites route through it. See "The scheme strategy".
- Its `_.zipObject(pairs)` is the pairs overload lodash 4 moved to
  `_.fromPairs`; `Object.fromEntries` now, and the table above gained the row.
- `gw_play/systems.js` came back with `_.first`/`_.rest` on the inner-ring
  helper — the same two the previous merge replaced, since `develop`'s copy
  still has them. Expect that every merge until the branch lands.
- `gw_play/referee.js` keeps this branch's class and native `hire` chain;
  `develop`'s biome step (`stampedMods` and `gwoGenerateBiomes`, both on
  `$.Deferred`) is slotted into that chain, which assimilates the jQuery
  promise, and its `mountFiles` remount of the biome mods is applied inside
  the class method.
- `develop` added `eslint-plugin-es-x` to enforce ES5 in the mod namespace.
  This branch's `eslint.config.mjs` does not use it — the Chromium 151
  toolchain is the point of stage 2 — so the devDependency is dropped again
  and `package-lock.json` regenerated.
- `docs/README.md`'s trap list keeps `develop`'s new biome entry and not its
  Chrome-40 CSS ones (`filter`, `space-evenly`), which stage 2 retired.

Things that a bulk "take `develop`'s version" would have broken, and the
reason step 1 above names files rather than a rule:

- `shared/referee_coop.js` and `gw_play/gwo_panel.js` changed on both sides.
  `develop` has neither `clientsInPlayerOrder` nor the deletion of
  `gw_play/coop_colour.js` that moved it there, so its versions reintroduce a
  module this branch removed. Both keep this branch's version with
  `develop`'s guard removals applied by hand.
- `develop`'s new inner-ring colour helper in `gw_play/systems.js` uses
  `_.first`, already replaced here with `[0]`.
- Re-running lebab reverts `gw_play/gwo_panel.js`'s top-level
  `disposeGwoPanelLoader` to `const`, which the scene-scope rule rejects. It is
  `var` deliberately, as are the scene entry flags.
- `develop` dropped the belt-and-braces `console.error(e)` before the
  prefixed one in every scene entry's `catch`; take that, it is not CEF work.

## Evidence baseline

A test against a CEF **v149** PA dev build (relayed 2026-08-12) drove
launch → attach → `start` → `gw_start` → `gw_play` end to end over CDP and
read live Galactic War state, with the stock UI stack loading unchanged. That
upgrades several assumptions below from guesses to observations — but the
shipping target is v151, so every entry keeps its probe and nothing is settled
until the live test plan below has run against the real build.

## Assumptions register

Each entry: the assumption, the evidence (if any), the blast radius if wrong,
and the remediation. The probes in the live test plan below reference these by
number.

- **A1 — `coui://` remains a registered scheme.** Registering a legacy scheme
  in CEF is one call, and the stock UI itself contains thousands of `coui://`
  references, so the port keeping it is the likeliest outcome. _Evidence:_
  v149 scenes navigated by `coui://` URL and populated the GW model. _If
  wrong:_ one run of `scripts/migrate/rewrite-scheme.js` (see below).
- **A2 — `spec://` remains registered** for unit-spec reads. Same remediation,
  same rewriter run.
- **A3 — the scheme is fetch-enabled and CORS-permissive**, so both `fetch`
  and XHR work against it. _Untested on v149_ — the most fragile assumption
  here. All native fetching goes through `shared/gwo_fetch.js` (stage 3), so a
  refutation is contained to that one module's transport.
- **A4 — the stock globals survive:** `_` (lodash 3.9.3), `$` (jQuery 2.x),
  `ko`, `createjs`, `Math.seedrandom`, `loc`/`locTree`/`loadHtml`/`i18n`, the
  `api.*` surface the mod uses, and the RequireJS/`requireGW` loader.
  _Evidence:_ v149 rendered scenes (so `ko` and the loader work) and
  `api.mods.getMounted` returned the real mod list; `api.*` calls remain
  promise-based.
- **A5 — scene mechanics are unchanged:** `modinfo.json` `scenes` injection,
  classic (non-module) scripts, one shared scope per scene. _Evidence:_ v149
  scene loading; the shared-scope collision behaviour is unprobed, which is
  why the top-level-declaration rule in [constraints.md](constraints.md)
  stays.
- **A6 — native two-argument `startsWith`/`endsWith` win under CEF.** PA's
  one-argument polyfill in `ui/main/shared/js/helpers.js` is what breaks them
  on Chrome 40, and it is guarded by `typeof ... !== "function"` (verified in
  the base install source), so it no-ops on a modern engine. _Probe:_
  `"abc".startsWith("b", 1) === true`.
- **A7 — the debugger flag is `--webview-port <port>`** (replacing
  `--coherent_port=<port>`), feeding Chromium's `remote_debugging_port`.
  _Evidence, all v149:_ confirmed working; CDP Protocol-Version 1.3 (Coherent
  is 1.1); `returnByValue` works properly; pointing a modern DevTools frontend
  or `chrome://inspect` at the port is safe (the Coherent host-kill hazard is
  gone); icon-atlas views appear as separate drivable targets. Unchanged on
  both engines: match targets by URL substring, never by cached id, and only
  one client may attach per target. The dev build also takes a backend
  selector (`--ui-backend=cef` observed; the shipping Coherent build rejects
  it).
- **A8 — stock still ships lodash 3.9.3**, matching the pinned devDependency.
  _If wrong:_ stage 3 already removes the lodash-3-only call sites, which are
  the surface a lodash 4+ bump breaks silently.
- **A9 — `window.location.href` scene navigation still works.** _Evidence:_
  v149, confirmed.
- **A10 — no eval-forbidding CSP.** Knockout's binding parser uses
  `new Function`; a strict CSP would kill every `data-bind` in the stock UI
  too. _Evidence:_ v149 rendered scenes with live bindings.
- **A11 — scheme path resolution keeps its current case and slash behaviour**,
  including the `"coui:/" + path` single-slash form normalising when `path`
  starts with `/`. `gwoUrl.gameFile` reproduces that form verbatim.
- **A12 — no layout regressions beyond cosmetics.** Modern Chromium is more
  standards-conforming, not less; the live plan sweeps every scene for visual
  breakage rather than trusting this.

Also observed on v149: arrow functions, `class` and spread all evaluate, so
the stage 2 syntax modernisation is exercising confirmed engine behaviour.

## The scheme strategy

Scheme handling has three tiers:

1. **Dynamic URL builders** in the mod namespace go through
   `shared/gwo_url.js`, which owns the scheme constants and the single-slash
   `gameFile` form. If the real scheme differs, that module is the only
   shipped code whose logic changes.
2. **Static literals** — AMD ids in `define()` arrays, card icon paths,
   `modinfo.json` scene entries, HTML `src` attributes, CSS `url()` — cannot
   go through a runtime adapter and stay literals. They are covered by the
   rewriter:

   ```bash
   node scripts/migrate/rewrite-scheme.js --from coui:// --to <real>:// --from spec:// --to <real-spec>://
   ```

   It rewrites `ui/**`, `modinfo.json`, the test harness and `gwo_url.js`
   together, prints per-category counts, is idempotent, and refuses to run on
   a dirty working tree. The rename rehearsal in the sign-off below proves the
   whole path at every stage close.

3. **The Node-side tooling** (`scripts/lib/amd-loader.js`,
   `scripts/validate/manifest.js`) reads its scheme from
   `scripts/lib/scheme.js`, the single Node-side source of truth. The rewriter
   keeps it and `gwo_url.js` in lockstep — the ui module cannot import a Node
   module, so the script enforces the pairing instead.

`gwoUrl.specFile` is `gameFile`'s twin for the `spec:` scheme, and is the
only place a `spec:/` + path form is spelled: `gw_play/referee_game_files.js`
(the AI unit-map reads) and `shared/gwo_biome_mods.js` (reading a mounted
server mod) both build through it. A single-slash template such as
`` `spec:/${path}` `` is not something the rewriter's `spec://` pattern
matches, which is why those sites do not concatenate it themselves.

Shadowed base-game files and the two deliberate line-for-line stock copies
keep their literal scheme strings even at dynamic call sites — they follow
stock's form, whatever that turns out to be, and the rewriter covers them the
same way it covers stock-shaped statics. See
[shadowing.md](shadowing.md).

## Sign-off

Per commit: `npm run verify` green.

Per stage close, in order:

1. `npm run test:coverage` — the 80% new-code floor holds locally before
   SonarCloud sees the push.
2. **Rename rehearsal:** in a scratch copy of the repo, run the rewriter with
   equal-length throwaway schemes
   (`--from coui:// --to couj:// --from spec:// --to sped://` — equal length so
   the rewrite cannot move any line past Prettier's print width, and the
   rewriter refuses a replacement that contains a searched scheme), check the
   reported counts against the previous rehearsal, then run `npm run verify`
   in the rewritten copy and discard it. This proves the "one command later"
   remediation for A1/A2 end to end, including that the harness and
   validators follow the constants. A real scheme of a different length just
   means one repo-wide `format:write` after the real run.
3. Stage-specific checks, recorded below.

### Stage 1 — must

- [x] `npm run verify` green at every commit
- [x] Rename rehearsal passes — 2026-08-12, `couj://`/`sped://`: 1,076
      occurrences (modinfo.json 23, ui 913 in 293 files, scripts 8, test
      132), full verify green in the rewritten copy
- [x] Removed-web-API audit recorded (see below)
- [x] **Live baseline on the shipping Coherent build** — 2026-08-12, driven
      over CDP (`--coherent_port`): `start` → new war in `gw_start`
      (generation and the `gwo_url`-routed navigation) → `gw_play` (18 stars,
      235 cards, GWO panel) → explore/deal/take card → battle launch (referee
      memory-file mounts observed as `.ai0` spec loads, AI tree walk through
      `gwoUrl.gameFile`) → local server → `live_game` loaded. Zero GWO errors
      in the client log. This is the last commit that can be live-tested
      before a CEF build exists, hence the `cef-stage1-baseline` tag.
      (Unrelated stock trap met on the way: `fight()` immediately after a
      dev-cheat star jump throws inside a jQuery `.always` on
      `model.currentSystem()` and hangs silently — the swallowed-throw trap
      constraints.md documents, present on develop too.)

### Stage 2 — should

- [x] `npm run verify` green at every commit
- [x] Rename rehearsal passes — 2026-08-12, counts identical to stage 1
      (1,076), full verify green in the rewritten copy
- [x] `npm run test:coverage` floor holds (96% lines overall)
- [x] Recorded: **the branch no longer parses on the shipping Coherent build**
      from the first modern-syntax commit (`Modernise shared module syntax`)
      onward. Live checks against the shipping game happen on the
      `cef-stage1-baseline` tag, nothing later.

### Stage 3 — can

- [x] `npm run verify` green at every commit
- [x] Rename rehearsal passes — 2026-08-12, 1,082 occurrences (the growth
      over stage 2 is `gwo_fetch`'s own references), full verify green in the
      rewritten copy. The rehearsal caught two test files whose own fixtures
      the rewriter rewrites; both are now built to move with it.
- [x] `npm run test:coverage` floor holds (96% lines; the functions metric
      dipped locally because the card sweep introduced arrows in
      Sonar-excluded files, which the quality gate does not measure)
- [x] Converted async code's stock boundaries carry a comment naming the
      consumer that requires the `$.Deferred` (see "Deliberately still
      jQuery" below for what was not converted, and why)

## Deliberately still jQuery

The referee pipeline and the spec transports moved to native promises and
`gwo_fetch`. The cards/deal/co-op subsystem (`gw_play/cards*.js`,
`shared/deal.js`, `gw_coop_per_player_loadout/`, `gw_play/victory.js`,
`gw_start/setup.js`'s war generation) **stays on `$.Deferred`/`$.when`
deliberately**: it is one interlocked promise graph with several stock
touchpoints (`model.exitGate`, the deal invoked from stock `gw_play.js`,
`$.when`'s argument-splat resolution shapes that several callbacks rely on),
so a partial conversion breaks it and a full one cannot be runtime-verified
until a CEF build exists. Converting it is a follow-up for after the live CEF
test plan has run, with the boundary rule in
[constraints.md](constraints.md) as the guide.

`shared/gwo_biome_mods.js` (from `develop` v6.12.0) is in the same position:
it wraps the engine's `api.file.zip.*` promises in `$.Deferred` so `$.when`
can collect them, and the referee's biome step is built on it. It sits inside
the native `hire` chain, which assimilates a jQuery promise, so it works as
shipped and converts with the rest.

## Live CEF test plan

Run when a CEF build of PA is available. Steps 1–2 are scripted CDP; the rest
are driven interactively with the console captured per scene.

1. **Launch and attach.** PA-CEF with the mod mounted,
   `--webview-port <port>` (A7). Attach over CDP 1.3, capture
   `Runtime.consoleAPICalled` per scene or read the client log.
2. **Assumption probes, before anything else:** `fetch` and XHR of a known
   `coui://` JSON (A1, A3); `requireGW` of a mod AMD module (A4); a card icon
   PNG load (A1); `"abc".startsWith("b", 1)` (A6); any KO binding rendering
   (A10); presence of each A4 global; one call per `api.*` family the mod
   uses. If A1/A2 are refuted, run the rewriter with the real scheme and
   restart this plan from step 1.
3. **Scene sweep.** `start` (menu injection) → `gw_start` (war setup, faction
   and difficulty UI, commander modal tint `filter`, `gwo_start.css` layout)
   → `gw_play` (galaxy map and its perf wrapper, card deal and tooltips,
   `planets.html` biome images — the KO-concatenated URLs, Foreign
   Intelligence panel `mask-*` rendering, systems panel) → battle launch
   (referee: memory-file unmount/mount, AI tree cache, `setUnitSpecTag`,
   `spec://` resolution in-game) → `live_game` menu → `gw_war_over` stats.
4. **Co-op.** Host plus viewer client: per-player tech (the
   `gw_per_player_tech_referee.js` shadow), colour allocation order, loadout
   banking suspension.
5. **Determinism.** Two wars generated from one seed compare equal through
   the `gwo_rng` paths.
6. **Widgets.** `selectPicker` dropdowns open/select/close; `tooltip` and
   `sound` bindings fire.
7. **Close out.** Every assumption above marked verified, or refuted with its
   remediation applied. Only then does the branch leave draft.

## Removed-web-API audit

Chromium removed a handful of platform features between 40 and 151 that ES5
code could legally use. Audited in stage 1, with these grep patterns over
`ui/**`: mutation events (`DOMSubtreeModified`, `DOMNodeInserted`,
`DOMNodeRemoved`, `DOMAttrModified`, `DOMCharacterDataModified`),
`Object.observe`, `event.path`, `showModalDialog`, `webkitRequestAnimationFrame`,
`webkitIndexedDB`, `webkitURL`, `webkitAudioContext`, synchronous XHR.

Result: **no occurrences.** The mod's platform surface is jQuery, Knockout,
lodash, createjs and the `api.*` façade, none of it touching removed APIs
directly.
