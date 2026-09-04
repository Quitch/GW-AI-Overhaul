# Architecture

GWO is a client mod for Planetary Annihilation: TITANS that overhauls the
single-player Galactic War campaign. It ships as plain JS/CSS/JSON loaded by the
game's embedded Chrome 40 — no build step, no bundler, no transpiler. What is in
the repo is what runs.

## The two halves of the tree

```text
ui/mods/com.pa.quitch.gwaioverhaul/   GWO's own namespace - preferred home
ui/main/                              shadowed base-game paths
pa/                                   AI build data (shadowed + GWO-authored)
scripts/                              Node-only tooling (lint/validate helpers)
test/                                 Node-only tests
```

Anything new should go in the mod's own namespace. `ui/main/` and `pa/` are for
files that must replace a base-game file at its exact path — see
[`shadowing.md`](shadowing.md).

## Entry points

`modinfo.json`'s `scenes` block is the mod's **real** entry-point list. The game
loads exactly the `coui://` files listed there, for the scene named, and nothing
else. `validate:docs` checks this table against it:

| Scene                        | What it covers                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `gw_start`                   | War creation: the setup lobby, difficulty/AI pickers, loadout selection.                           |
| `gw_play`                    | The galaxy map and everything during a war: cards, referees, panels, intel, ping, co-op selection. |
| `gw_war_over`                | Victory/defeat bookkeeping — records the highest difficulty defeated.                              |
| `live_game`                  | In-battle menu patches (surrender/continue with more than two teams).                              |
| `live_game_options_bar`      | Win-conditions text on the in-battle options bar.                                                  |
| `shared_build`               | Planetary radar behaviour.                                                                         |
| `start`                      | Main menu.                                                                                         |
| `gw_coop_per_player_loadout` | Per-player loadout selection for co-op viewers.                                                    |

`gw_play` carries most of it, and two of its entries own a panel outright:
`gwo_panel.js` builds GWO's own war panel — seed, difficulty, the AI brains, the
war's game options, and each client's colour for the next battle — and
`section_of_foreign_intelligence/` is the intel panel, vendored code under its
own licence, so the attribution at its head stays.

Nothing under `ui/main/**` or `pa/**` appears in that list — those load by
_shadowing_, not by manifest.

A renamed or deleted file still referenced in `scenes` fails **silently** in-game,
with no error a contributor would see locally. That is exactly what
`npm run validate:manifest` exists to catch.

## How files reach each other

Files load as AMD modules. Within the mod's namespace, dependencies are full
`coui://` paths:

```js
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (gwoCard) { … });
```

Base-game modules use bare relative ids instead (`"shared/gw_common"`,
`"cards/gwc_minion"`) — the engine's own scheme. A bare id that this repo does not
ship is a base-game module, and the test harness reports it distinctly; see
[`testing.md`](testing.md).

Every mod gets **one shared JS scope per scene**. Stock UI code and mod scripts
share a namespace, which is why several GWO values are deliberately globals —
other mods hook them, and that is a supported contract, not an accident. The
full list is the globals table in [`tech-cards.md`](tech-cards.md),
"Third-party card mods".

## The major subsystems

One per doc; the table in [`docs/README.md`](README.md), "Subsystems", is the
list.

## Battle launch, end to end

The sequence that ties most of the above together. `gw_play/referee.js` hijacks
the base referee and installs GWO's, whose hire runs these in order:

1. `gw_play/referee_game_files.js` generates unit specs per army tag, applying
   the AI tech `gw_start/ai_tech.js` builds from the buffs the war recorded —
   see galaxy.md, "AI tech".
2. `gw_play/referee_ai.js` walks the AI build trees, applies AI-mod descriptors
   from every card held, and writes the results into the config.
3. `referee.js`'s own `gwoGenerateBiomes` mounts the text-only server mods
   stamped on the battle's system and cooks their JSON into the config's
   files; a stamped mod GW Server Mods serves is already mounted, and only its
   biomes are collected — see galaxy.md, "Biome mods in a GW battle".
4. `gw_play/referee_config.js` + `referee_config_setup.js` assemble the launch
   config — armies, personalities, planets, game modes. Every army's
   personality is built here through `shared/ai_personality.js` from what the
   war recorded (its `personalityId`, `penchantName`, faction and brain) and
   the tier `shared/ai.js`'s `warTier()` resolves, as are the numbers that
   follow from the tier (a boss's commander count, the bounty value) — none of
   it is read from the save. See galaxy.md, "Difficulty" and "AI personalities
   and penchants".
5. In co-op with per-player tech, `gw_per_player_tech_referee.js` runs afterwards
   and adds each viewer's own specs and subcommanders.

Everything from the click to the hand-off to `connect_to_game` sits behind
`gw_play/launch_progress.js`, which wraps `model.fight` and shows a loading
panel driven by `model.gwoLaunchProgress`. That object is a public surface:

- `visible`, `title`, `message`, `steps` are observables; `begin()`,
  `stage(text)` and `end()` drive them. `begin()` is idempotent and `stage()` is
  a no-op outside a launch, so a mod may report from work that also runs on
  scene entry.
- The referee reports its own stages through `gwoReferee.prototype.stage`; a
  co-op host's two hires are labelled "Co-op shared setup" and "Co-op host
  setup" so the repeat reads as intended.
- In co-op, the host mirrors `begin()`/`stage()`/`end()` to every viewer via
  the `gwo_launch_progress` host operator, so viewers see the same panel and
  stages during a launch. The mirroring wraps the methods themselves, so
  stages reported by other mods (e.g. GW Server Mods) are covered too. Stage
  text arrives already localised in the host's language.
- Stock sets `launchingFight` only after the war is saved, so a mod that wraps
  `model.fight` to do slow work first (GW Server Mods mounts server mods there)
  is only covered from the click if GWO's wrapper is outside its own, which
  means it must load before GWO - a lower `priority` than GWO's 200. Such a mod
  resolves `model.gwoLaunchProgress` at call time, never at load, because it
  does not exist yet when that mod runs. If a later-loading mod wraps
  `model.fight` instead, the panel still appears, but only once
  `launchingFight` turns true.

The same panel skeleton serves `gw_play/victory_wait.js` and
`victory_wait_state.js`, the "Waiting for players" modal a co-op host sees
after the final battle. See [`coop.md`](coop.md), "War end".

A stage that fails must reject the hire, because stock waits on it with no fail
handler: a hire that never settles leaves `launchingFight` true, the panel open
on the last stage it reported and the Fight button dead, forever. So
`referee_game_files.js` routes every path that can throw - the synchronous
prelude and each nested spec-fetch chain - into one `fail` that rejects its
deferred, and the hire's own fail handler in `referee.js` logs the error and
clears `launchingFight`, which closes the panel. The throw itself is otherwise
invisible: GW Server Mods remounts inside `unmountAllMemoryFiles` and resolves
GWO's deferred from a native promise, so an exception in the callback surfaces
only as a reason-less `Unhandled promise rejection` in the client log, one line
after `[GW-SM] mounted server mods`. That is the signature to look for.

A co-op host hires the referee **twice** per battle, and none of the setup is
idempotent, so every setup function works on deep copies. See
[`coop.md`](coop.md), "The two referees".

### Returning from a battle

**A real battle that beats the last boss does not win a GWO war while any other
AI star remains.** Known since 2026-09-04, not yet fixed. `live_game_patch.js`
records the outcome as `game.lastBattleResult("win")`; gw_play consumes it at
startup (`gw_play.js`, "startup battleResult" in the log), where `winTurn`'s boss
branch calls `game.defeatTeam`. That runs 1.8 s before `loadMods`, so the
`defeatTeam` override in `gw_play/systems.js` - which wins the war once no boss
is left - is not installed yet, and stock's runs instead. Stock wins only when
_no AI star of any team_ remains, which a GWO galaxy never satisfies at that
point. Only the in-scene paths (the Cheat button's Win, an explore) reach
GWO's rule. The log proves the order: `winTurn applied` precedes `War created
using Galactic War Overhaul`.

## Galaxy map redraw throttling

`gw_play/galaxy_map_perf.js` wraps `model.galaxy.stage.update()` with a dirty
check. Background: the base game's galaxy-map canvas (an EaselJS
`createjs.Stage`) is cleared and fully redrawn on every `requestAnimationFrame`
tick, uncapped — see `updateStage()` in `gw_play.js`. Its backing buffer is sized
to the real viewport, so that cost scales with display resolution and refresh
rate. `gw_play.js` is a base-game file and `updateStage()` is a private closure,
but `model.galaxy.stage` is a shared instance a mod script can reach.

Only three things change what is drawn without going through `update()` itself:
the stage transform (pan/zoom), the canvas backing size, and
`model.galaxy.parallax` (a mouse-tracking offset applied to the nebula layer on
every `body` mousemove, from `gw_play.js`'s `self.setup`). Diffing those against
the last real draw is therefore a sound dirty check.

While the camera or mouse is moving the wrapper still draws, capped to 60 FPS
rather than the uncapped monitor refresh. Once everything is static it falls back
to a 10 FPS heartbeat, which is slow enough to matter and still picks up
hover-highlight changes, since EaselJS runs its own mouseover hit testing inside
`update()`.

Two traps:

- **The idle heartbeat is not idle.** `systems.js` rotates the selection icon on
  every tick, and the heartbeat is what keeps that animating — coarser when idle,
  not stopped. Do not treat "nothing animates here" as an invariant.
- The same file also halves EaselJS's mouseover hit-test rate to 10/sec (the base
  game takes the 20/sec default). Every check hit-tests the whole interactive
  display list, up to 234 systems. This is independent of the redraw loop.

## Repairing wars made by older GWO versions

A war is a save, and a save outlives the version that made it.
`gw_play/bugfixes.js` runs once per entry into `gw_play` (guarded by
`gwoBugfixesLoaded`, skipped for tutorials) and retroactively repairs wars whose
generation had a bug GWO has since fixed.

The shape is worth knowing before adding a fix to it:

- **A fix is gated by a flag, not by a version alone.** `treasurePlanetFixed`,
  `clusterFixed` and `treasureLoadoutDerived` live on `originSystem.gwaio`, and
  `gwaio_lucky_commander_fixed` in `localStorage`. Once a repair has run, or been
  ruled unnecessary, the flag says so and the scan is skipped for good.
- **`checkIfPatchesNeeded` sets those flags from `gwoSettings.version`** via
  `atLeastVersion`, so a war created after a fix shipped never pays for the scan.
  A war with no recorded version compares as older than everything, which is the
  safe direction.
- **`applyFixes` sets the flags unconditionally after the sweep**, because "the
  thing this fix targets does not exist in this war" and "it has been fixed" want
  the same outcome — a war with no treasure planet should not re-scan forever.
- It finishes by calling `gw_play/save.js`, so a repaired war is persisted rather
  than repaired again on the next visit.
- **A repair edits only what the save still owns.** The Cluster commander repair
  rewrites `ai.inventory` descriptors in place, and a war that records
  `typeOfBuffs` has none — its descriptors are built at launch from the live
  Cluster mods, so the repair returns early for it.

`gw_play/save.js` is the shared save wrapper used here and by the card code. It
drives `model.driveAccessInProgress` around the write, and **no-ops for campaign
viewers** — only the host owns the campaign, so a viewer that saved would be
writing a war it does not own.

## Where state lives

- **The war save** — the campaign game object. GWO piggy-backs its own settings
  onto the origin star system as `originSystem.gwaio` (AI brain, difficulty,
  scaling options, and for a Custom war the `customDifficulty` value snapshot
  that `shared/ai.js`'s `warTier()` resolves — see galaxy.md, "Difficulty").
  `shared/ai.js`'s `aiInUse()` reads it; a missing blob means a non-GWO war and
  defaults to Titans.
- **`localStorage`** — start-card unlocks, victory badges and favourited
  loadouts, under `gwaio_`-prefixed keys so that uninstalling GWO does not
  corrupt the base game's loadout list with 404s. See `shared/bank.js` and
  `shared/favourites.js`, which reads `gwaio_favourite_loadouts`.
  `shared/favourite_loadouts.js` is the id arithmetic behind that key —
  `isFavourite`, `toggleId` and `sortCardsByFavourite`, kept free of engine
  globals so it is testable. Its sort puts favourites in the order they were
  favourited, not the order the cards happen to be in.
- **The inventory** — cards, units, minions and AI mods for the current war.
  Under co-op with per-player tech there is one inventory per player, and
  `model.game().inventory()` is always the _host's_ — a real source of bugs when
  card code needs the viewer's.

## Conventions

Covered in full by CONTRIBUTING.md; the load-bearing ones:

- Shipped `ui/**` code must be ES5 / Chrome 40 safe — see
  [`constraints.md`](constraints.md).
- camelCase JS, kebab-case CSS, 2-space indent, HTML in its own file (never
  inline in JS).
- `pa/**` JSON is intentionally minified to one line, matching the base game, and
  is excluded from Prettier.
- PRs touch only what the request needs. `format:write` is repo-wide, so run it
  and stage only your own files.
