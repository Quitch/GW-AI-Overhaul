# Architecture

GWO is a client mod for Planetary Annihilation: TITANS. It overhauls the
single-player Galactic War campaign. The mod ships as plain JS/CSS/JSON that the
game's embedded Chrome 40 loads. There is no build step, no bundler and no
transpiler. What is in the repo is what runs.

## The two halves of the tree

```text
ui/mods/com.pa.quitch.gwaioverhaul/   GWO's own namespace - preferred home
ui/main/                              shadowed base-game paths
pa/                                   AI build data (shadowed + GWO-authored)
scripts/                              Node-only tooling (lint/validate helpers)
test/                                 Node-only tests
```

Anything new should go in the mod's own namespace. `ui/main/` and `pa/` are for
files that must replace a base-game file at its exact path. See
[`shadowing.md`](shadowing.md).

## Entry points

The `scenes` block in `modinfo.json` is the mod's **real** entry-point list. The
game loads exactly the `coui://` files listed there, for the scene named, and
nothing else. `validate:docs` checks this table against that block:

| Scene                        | What it covers                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `gw_start`                   | War creation: the setup lobby, difficulty/AI pickers, loadout selection.                           |
| `gw_play`                    | The galaxy map and everything during a war: cards, referees, panels, intel, ping, co-op selection. |
| `gw_war_over`                | A won war only: records the highest difficulty won with its loadout, for the loadout's badge.      |
| `live_game`                  | Menu patches (surrender/continue past two teams; Report a Galactic War Bug); win-conditions text.  |
| `live_game_options_bar`      | Win-conditions text on the in-battle options bar.                                                  |
| `shared_build`               | Moves the Deep Space Radar's build-bar slot off the radar jammer's.                                |
| `start`                      | Main menu.                                                                                         |
| `gw_coop_per_player_loadout` | Per-player loadout selection for co-op viewers.                                                    |
| `gw_lobby`                   | The battle lobby: the referee's army specs win over stock's local rebuild.                         |
| `gw_reconnect_loading`       | Rejoining a battle: the same as `gw_lobby`, for the files the server sends again.                  |
| `global_mod_list`            | Every panel, before the scene's own scripts: translation registration only.                        |

`gw_play` carries most of the entries. Two of its entries own a panel outright.
`gwo_panel.js` builds GWO's own war panel. That panel shows the seed, the
difficulty, the AI brains, the war's game options, and each client's colour for
the next battle. `section_of_foreign_intelligence/` is the intel panel. It is
vendored code under its own licence, so the attribution at its head stays. Its
threat measure lives in `shared/star_threat.js`, under the same attribution,
because co-op AI players weigh it too.

`shared/mod_translations.js` is the sole `global_mod_list` entry and is in no scene
list: it registers GWO's translation files with the Mod Translations mod before the
stock scene's `document.ready`, so stock code that translates eagerly (star
descriptions in `gw_play`) sees them too, and does nothing when that mod is absent.
See [`translations.md`](translations.md).

Nothing under `ui/main/**` or `pa/**` appears in that list. Those files load by
_shadowing_, not by manifest.

A renamed or deleted file that `scenes` still references fails **silently**
in-game. No error appears that a contributor would see locally.
`npm run validate:manifest` exists exactly to catch that.

## How files reach each other

Files load as AMD modules. Within the mod's namespace, dependencies are full
`coui://` paths:

```js
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (gwoCard) { … });
```

Base-game modules use bare relative ids instead (`"shared/gw_common"`,
`"cards/gwc_minion"`). That is the engine's own scheme. A bare id that this repo
does not ship is a base-game module. The test harness reports such an id
distinctly. See [`testing.md`](testing.md).

A module in `shared/` never requires a module from a scene folder (`gw_start/`,
`gw_play/` and the other `scenes` keys). Several scenes load `shared/`, so such a
require pulls one scene's code into the others. A module that a scene and
`shared/` both need lives in `shared/`. `test/shared_layering.test.js` enforces
this.

Every mod gets **one shared JS scope per scene**. Stock UI code and mod scripts
share a namespace. That is why several GWO values are deliberately globals.
Other mods hook them, and that is a supported contract, not an accident. The
full list is the globals table in [`tech-cards.md`](tech-cards.md),
"Third-party card mods".

## The major subsystems

Each subsystem has one doc. The table in [`docs/README.md`](README.md),
"Subsystems", is the list.

## Battle launch, end to end

This sequence ties most of the above together. `gw_play/referee.js` hijacks the
base referee and installs GWO's referee. The hire of GWO's referee runs these
steps in order:

0. `gw_play/referee.js` reads the connected clients once as `ref.hireClients`
   and fixes the battle's co-op AI players as `ref.coopAis`, from
   `model.gwoCoopAi.launchRoster(ref.hireClients)`. The steps below read the
   roster and the clients from there, never from the war or the live list. See
   [`coop.md`](coop.md), "AI players" and "The two referees".
1. `gw_play/referee_game_files.js` generates unit specs per army tag. It
   applies the AI tech that `gw_play/ai_tech.js` builds from the buffs the war
   recorded. See galaxy.md, "AI tech".
2. `gw_play/referee_ai.js` walks the AI build trees, applies AI-mod descriptors
   from every card held, and writes the results into the config.
3. `gw_play/referee_biomes.js` mounts the text-only server
   mods stamped on the battle's system. It cooks their JSON into the config's
   files. A stamped mod that GW Server Mods serves is already mounted. For such
   a mod, the function collects only its biomes. See galaxy.md, "Biome mods in
   a GW battle".
4. `gw_play/referee_config.js` + `referee_config_setup.js` assemble the launch
   config: armies, personalities, planets, game modes. These files build every
   army's personality here through `shared/ai_personality.js`. The inputs are
   what the war recorded (its `personalityId`, `penchantName`, faction and
   brain) and the tier that `warTier()` in `shared/ai.js` resolves. The numbers
   that follow from the tier (a boss's commander count, the bounty value) are
   also built here. This step reads none of these values from the save. See
   galaxy.md, "Difficulty" and "AI personalities and penchants".
5. In co-op with per-player tech, `gw_play/per_player_tech_referee.js` runs afterwards
   and adds each viewer's own specs and subcommanders.
6. Every client then enters stock's `gw_lobby`, which mounts the referee's files.
   Stock first rebuilds each army tag's specs from local files, and that
   overlay would replace the referee's. `gw_lobby/specs.js` keeps the referee's
   copies. See [`specs.md`](specs.md), "The lobby overlay".

Memory files outlive the battle that mounted them, so step 1 starts with
`unmountAllMemoryFiles`: read as the base, the last battle's cooked specs would
be modded a second time. The referee's `mountFiles` then mounts this battle's
files. Each teardown costs seconds, because Community Mods remounts its client
mods and rebuilds the content catalogue inside it (about 10 s per teardown,
measured with ten server mods active). `mountFiles` therefore skips its own
teardown, because what has been mounted since the latest hire's teardown is GW
Server Mods' mounts, which the battle needs. The exception is a launch whose
latest hire mounted a stamped biome mod to cook it (step 3): a mod that then
fails to cook must not stay mounted for the server, so that launch keeps the
teardown, and `mountFiles` mounts only the mods that cooked. A co-op host hires
twice - a shared referee under Community Mods' restricted client mods, then its
own. Stock restores the full client mods before the second hire starts, so that
hire's teardown is the latest one, and the per-player tech referee that runs
after it mounts nothing.

Everything from the click to the hand-off to `connect_to_game` sits behind
`gw_play/launch_progress.js`. That file wraps `model.fight` and shows a loading
panel that `model.gwoLaunchProgress` drives. That object is a public surface:

- `visible`, `title`, `message`, `steps` are observables. `begin()`,
  `stage(text)` and `end()` drive them. `begin()` is idempotent, and `stage()`
  is a no-op outside a launch. So a mod may report from work that also runs on
  scene entry.
- Until `launch_progress_state.js` loads, the object is a placeholder whose
  `begin()`, `stage()` and `end()` do nothing, so what a mod reports before
  then is not shown. The loaded module replaces the object and keeps its
  observables. A mod therefore reads `model.gwoLaunchProgress` each time it
  reports, rather than keeping the object it first found.
- The referee reports its own stages through `gwoReferee.prototype.stage`. A
  co-op host's two hires are labelled "Co-op shared setup" and "Co-op host
  setup", so the repeat reads as intended. Besides its localised text, it
  passes `stage()` an optional second argument, `{ key, prefix, options }`:
  the stage's `!LOC:` key, the label's key, and any `loc()` arguments. The host
  shows the text as given; the keys are for viewers.
- In co-op, the host mirrors `begin()`/`stage()`/`end()` to every viewer via
  the `gwo_launch_progress` host operator, sending `begin` and `end` only when
  its own panel opens or closes. Viewers therefore see the same panel and
  stages during a launch. The mirroring is inside the methods themselves, so
  it also covers stages that other mods (e.g. GW Server Mods) report. A keyed
  stage is sent with its keys, and each viewer builds the line with its own
  `loc()`; plain text arrives as the host gave it. A stage that reaches a
  viewer whose panel is closed opens it first, so a viewer who joins after
  the host's `begin` still sees the launch.
- Stock sets `launchingFight` only once its checks pass and it starts saving
  the war. A mod may wrap `model.fight` to do slow work first (GW Server Mods
  mounts server mods there). The panel covers such a mod from the click only if
  GWO's wrapper is outside the mod's own wrapper. That means the mod must load
  before GWO, with a lower `priority` than GWO's 200. Such a mod resolves
  `model.gwoLaunchProgress` at call time, never at load, because the object
  does not exist yet when that mod runs. If a later-loading mod wraps
  `model.fight` instead, the panel still appears, but only once
  `launchingFight` turns true.

The same panel skeleton serves `gw_play/victory_wait.js` and
`victory_wait_state.js`. Those files are the "Waiting for players" modal that a
co-op host sees after the final battle. See [`coop.md`](coop.md), "War end".

A stage that fails must reject the hire, because stock waits on the hire with no
fail handler. A hire that never settles leaves `launchingFight` true, forever.
It also leaves the panel open on the last stage it reported, and the Fight
button dead. So `referee_game_files.js` routes every path that can throw into
one `fail` that rejects its deferred. Those paths are the synchronous prelude
and each nested spec-fetch chain. `referee_biomes.js` runs each callback as a
`gwoPromise.steps` step instead, so a rejection or a throw after an engine call
rejects the step. `referee_ai.js` holds every tree listing and file read as a
native promise, so a failed read, or a throw in the work on a file, rejects
too. The one read it skips instead is a card's `load` file (see
[`ai-pipeline.md`](ai-pipeline.md)). The hire's own fail handler in `referee.js`
logs the error through `gameFilePaths.describeError`, which formats a jqXHR
as its HTTP status rather than `[object Object]`, and clears
`launchingFight`, which closes the panel.

The per-player tech referee, `gw_play/per_player_tech_referee.js`, is waited on the
same way: stock calls its `apply` with no fail handler. But there stock aborts
on its own when `apply` resolves a falsy value, through `abortRefereeLaunch`,
which logs the reason and clears `launchingFight`. So a viewer whose unit maps
or specs could not be read resolves `false` with `per_player_tech_ready` set to
`false`, rather than rejecting, and a rejection would hang the launch exactly
as an unsettled hire does. The rule for the next referee is one `fail` per
chain, `gameFilePaths.describeError` for the message, and the stock-facing
outcome chosen by what that referee's stock caller listens for.

The throw itself is otherwise invisible. GW Server Mods remounts inside
`unmountAllMemoryFiles` and resolves GWO's deferred from a native promise. So an
exception in the callback surfaces only as a reason-less
`Unhandled promise rejection` in the client log. That line appears one line
after `[GW-SM] mounted server mods`. That is the signature to look for.

A co-op host hires the referee **twice** per battle, and none of the setup is
idempotent. So every setup function works on deep copies. See
[`coop.md`](coop.md), "The two referees".

### Returning from a battle

**GWO's `defeatTeam` is installed from the `GWGamePatches.patch` hijack, not
from a scene script, because a scene script is too late.**
`live_game_patch.js` records the outcome of a battle as
`game.lastBattleResult("win")`. gw_play consumes it at startup (`gw_play.js`,
"startup battleResult" in the log). There, the boss branch of `winTurn` calls
`game.defeatTeam`. That call runs 1.8 s before `loadMods`. The log proves the
order: `winTurn applied` precedes `War created using Galactic War Overhaul`.

`GWGame.load` calls `patch(self, …)` on every game it loads, before `gw_play.js`
reads `lastBattleResult`. The shadowed `gw_inventory.js` already hijacks `patch`
([`coop.md`](coop.md), "Whose unlocks are whose"), so the same hijack calls
`shared/defeat_team.js`'s `install(game)`. That sets `defeatTeam` on the game
instance, except for the tutorial. The module is dependency-free for the reason
`coop.md` gives: `shared/gw_game` and `shared/gw_common` would close a cycle
back onto `gw_inventory`.

GWO's rule differs from stock's in three ways:

- Stock wins only when _no AI star of any team_ remains. GWO wins when no boss
  remains. A GWO galaxy never satisfies stock's test when the last boss falls.
- Stock clears every star of the defeated team. GWO promotes the first of a
  star's `foes` whose faction still has a boss. The new owner takes that boss's
  `team`, because a foe carries a `faction` but no `team`. A star with no such
  foe is cleared. A star also matches when it has a `team` and the defeated
  boss's `faction`, which heals a save whose promoted owners kept a dead team.
- Stock leaves pre-dealt cards on the stars it clears. GWO empties their
  `cardList`, except the Guardians'.

All three results are saved as soon as `winTurn` returns, so none can be
repaired on scene entry: by then the save no longer holds the `foes`.

## Galaxy map filter cache

The galaxy map tints its icons with EaselJS `ColorFilter`s. A filtered bitmap is
drawn into its own cache canvas, and every pixel of that canvas is filtered in
JavaScript: `getImageData`, a loop, `putImageData`. Stock does this for every
star's owner icon, and `gw_play/systems.js` does it for every star's inner ring,
each several times per scene load: when the bitmap is cached, when its image
loads, and when its colour is set. On a 234-star map that was 4.6 seconds of
every `gw_play` load.

`gw_play/galaxy_map_filter_cache.js` replaces `createjs.Bitmap.prototype.updateCache`
with one that keeps each result. A bitmap whose cache would come out the same
gets a copy of it instead: the same image source, the same loaded state, the
same cache rectangle, and a single `ColorFilter` with the same multipliers. Only
a handful of colours and two images are in use, so a map needs some 25 passes,
not 700. Anything else still goes to stock: a second filter, a colour offset, a
source rectangle, a cache scale, an image that is not an `<img>`, such as a
video, or a bitmap with a `draw` of its own. It keeps at most 64 results, so a
colour that animated would cost filter passes, not memory.

It cannot reach the passes that run before mod scripts load. Stock builds the
map, owner icons included, inside the `GameViewModel` constructor, and calls
`loadMods` after it, so the first pass of each owner icon and the one its colour
causes are stock's. The cache takes the image-load passes and every pass of
`systems.js`'s rings: 1.7 to 2.6 seconds of a 234-star load.

## Galaxy map redraw throttling

`gw_play/galaxy_map_perf.js` wraps `model.galaxy.stage.update()` with a dirty
check. Background: the base game clears and fully redraws the galaxy-map canvas
(an EaselJS `createjs.Stage`) on every `requestAnimationFrame` tick, uncapped.
See `updateStage()` in `gw_play.js`. The canvas's backing buffer is sized to the
real viewport, so that cost scales with display resolution and refresh rate.
`gw_play.js` is a base-game file, and `updateStage()` is a private closure. But
`model.galaxy.stage` is a shared instance that a mod script can reach.

Only three things change what is drawn without going through `update()` itself.
They are the stage transform (pan/zoom), the canvas backing size, and
`model.galaxy.parallax`. The last is a mouse-tracking offset that `self.setup`
in `gw_play.js` writes on every `body` mousemove, and that the
`galaxyTransform` computed applies to the nebulae and every star. Diffing those
three against the last real draw is therefore a sound dirty check.

While the camera or mouse is moving, the wrapper still draws, capped to 60 FPS
rather than the uncapped monitor refresh. Once everything is static, it drops to
a 10 FPS heartbeat. That rate is slow enough to matter and still registers
hover-highlight changes, because EaselJS runs its own mouseover hit testing
inside `update()`.

Three traps:

- **The idle heartbeat is not idle.** `systems.js` rotates the selection icon on
  every tick, and the heartbeat is what keeps that animation running. When idle,
  the animation is coarser, not stopped. Do not treat "nothing animates here" as
  an invariant.
- The wrapper file also halves EaselJS's mouseover hit-test rate to 10/sec (the
  base game takes the 20/sec default). Every check hit-tests the whole
  interactive display list, up to 234 systems. This is independent of the redraw
  loop.
- The wrapper file also holds back `model.galaxy.parallax`'s notifications
  until it draws a frame. Every star's position, scale, and lane graphics
  depend on `galaxyTransform`, so each notification re-evaluates some 2,000
  computeds: about 20 ms on a 234-star map. A mouse reports far more often than
  once a frame, and a notification per mousemove stalled the map for seconds
  while it moved. The value itself changes at once, so the dirty check sees the
  move. The held notification goes out just before the draw, so the frame shows
  the stars where the new value puts them.

## Repairing wars made by older GWO versions

A war is a save, and a save outlives the version that made it.
`gw_play/bugfixes.js` runs once per entry into `gw_play` (skipped for tutorials).
It retroactively repairs wars whose generation had a bug that GWO has since
fixed.

Know the shape before you add a fix to it:

- **A flag, not a version alone, gates a fix.** `treasurePlanetFixed`,
  `treasureLoadoutDerived`, and `planetPositionFixed` live on
  `originSystem.gwaio`.
  `gwaio_lucky_commander_moved` lives in `localStorage`. Once a repair runs, or
  is ruled unnecessary, the flag says so. The file then skips the scan for good.
- **`checkIfPatchesNeeded` sets the war's flags from `gwoSettings.version`** via
  `atLeastVersion`. So a war created after a fix shipped never pays for the
  scan. A war with no recorded version compares as older than everything. That
  is the safe direction. `planetPositionFixed` has no version: its defect also
  comes from Shared Systems for GW, which replaces GWO's system loader, so a war
  of any version can need it. Each war pays for one sweep of its planets.
  `gwaio_lucky_commander_moved` has no version either: it records the profile's
  bank, which a war's version says nothing about, so its repair runs once per
  profile. It replaced `gwaio_lucky_commander_fixed`, which versions up to 7.4.1
  set from the war's version without moving the card. The repair removes the
  card through the base game's `GW.bank`, not from `gw_bank` itself: that
  bank read `gw_bank` when the scene loaded, and its next unlock writes its
  whole list back.
- **`applyFixes` sets the flags unconditionally after the sweep.** The reason is
  that "the thing this fix targets does not exist in this war" and "it has been
  fixed" want the same outcome. A war with no treasure planet should not re-scan
  forever.
- It finishes by calling `gw_play/save.js`, so a repaired war is persisted rather
  than repaired again on the next visit.
- **A repair edits only what a battle still reads.** A war that records
  `typeOfBuffs` builds each army's spec mods from them at launch, and an AI's
  baked `inventory` counts only where the war recorded no `typeOfBuffs` for it.
  See galaxy.md, "AI tech". There is no repair of old wars' Cluster commander
  mods.

## Saving the war

`gw_play/save.js` is the shared save wrapper that the repairs above and the card
code use. It drives `model.driveAccessInProgress` around the write, and it
**no-ops for campaign viewers**. Only the host owns the campaign, so a viewer
that saved would write a war it does not own. A viewer's save always resolves.

Stock's `GW.manifest.saveGame` never rejects: when the write fails, its
IndexedDB error handler calls `result.fail(event)`, which only adds a callback,
so the save stays pending and the Saving indicator stays on.
`gw_play/save_limit.js` therefore fails a save that has not landed in 30
seconds, and drops a result that lands later. Real saves take under a second.
`save.js` saves through it. In `save.js`, only the latest save clears the
indicator, so an earlier save that settles or times out does not clear it while
a later one is still writing.

`gw_play/save_limit_install.js` also puts the limit on stock's own saves in
`gw_play.js`, by replacing `GW.manifest.saveGame`, which stock reads at every
call. The replacement returns a jQuery promise, because stock passes saves to
`$.when`. Stock's callers handle a rejection: a move and a tech delete clear the
indicator, and a lost war opens the exit gate to `gw_war_over`. The exception is
the save in stock `fight`, whose `$.when(...).always` reads its inputs by
position. A rejection there throws on the missing script text and leaves
`launchingFight` true. Stock sets `launchingFight` in the same synchronous step
as that save, so the save made in the step where `launchingFight` turns true is
the launch's, however a mod defers stock `fight`, as GW Server Mods does. When
that save times out, it is logged and never settled, and its launch is called
off: `launchingFight` is cleared, which closes the launch panel and lets the
player press Fight again. Every other save, such as a move's still writing
when Fight is pressed, rejects as usual.

The call-off waits for the launch's referee hires to settle, so a second Fight
cannot hire while the first launch still does. On a co-op host, two hires'
client-mod restriction windows would otherwise overlap, and one launch's
restore could remount the full mod set under the other's shared referee.
Stock's `hireRefereesForLaunch` is private to `gw_play.js`, so
`gw_play/launch_hires.js` infers its end from the hires `referee.js` reports:
one hire, or two on a co-op host, the same test stock uses, and no other hire
still running. The second starts only once the first has resolved and stock
has remounted the client mods. A
failed hire ends the launch: `referee.js` has already cleared `launchingFight`,
even while a co-op host's restore remount still runs. The call-off clears
`launchingFight` only if its launch is still the current one. Without GWO's referee no launch is tracked, and the
call-off is immediate.

`gw_play/save_debt.js` wraps `save.js` for the host's save after a win, which
waits for the deal, the star-card refresh, and any co-op AI pass so the war is
written once (coop.md, "One save per win").

## Where state lives

- **The war save** is the campaign game object. GWO attaches its own settings to
  the origin star system as `originSystem.gwaio`. The blob holds the AI brain,
  the difficulty, and the scaling options. For a Custom war it also holds the
  `customDifficulty` value snapshot that `warTier()` in `shared/ai.js` resolves
  (see galaxy.md, "Difficulty"). `aiInUse()` in `shared/ai.js` reads it. A
  missing blob means a non-GWO war and defaults to Titans.
- **`localStorage`** holds start-card unlocks, victory badges and favourited
  loadouts. They sit under `gwaio_`-prefixed keys, so that uninstalling GWO does
  not corrupt the base game's loadout list with 404s. See `shared/bank.js` and
  `gw_start/favourites.js`, which reads `gwaio_favourite_loadouts`.
  `gw_start/favourite_loadouts.js` is the id arithmetic behind that key:
  `isFavourite`, `toggleId` and `sortCardsByFavourite`, kept free of engine
  globals so it is testable. Its sort puts favourites in the order they were
  favourited, not the order the cards happen to be in.
- **The inventory** holds cards, units, minions and AI mods for the current war.
  Under co-op with per-player tech there is one inventory per player.
  `model.game().inventory()` is always the _host's_ inventory. That is a real
  source of bugs when card code needs the viewer's inventory.

## Conventions

CONTRIBUTING.md covers them in full. The load-bearing ones are:

- Shipped `ui/**` code must be ES5 / Chrome 40 safe. See
  [`constraints.md`](constraints.md).
- Use camelCase in JS, lower-case kebab-case or snake_case in CSS, and a
  2-space indent. Put HTML in its
  own file (never inline in JS).
- `pa/**` JSON is intentionally minified to one line, matching the base game. It
  is excluded from Prettier.
- PRs touch only what the request needs. `format:write` is repo-wide, so run it
  and stage only your own files.
