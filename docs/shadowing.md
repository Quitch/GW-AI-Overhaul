# Shadowing and function hijacking

GWO changes base-game behaviour three ways. In order of preference:

1. **Inject into a scene** via `modinfo.json`'s `scenes` block — a new file in the
   mod's own namespace, loaded alongside the stock UI.
2. **Hijack a function** the base game exposed on `self`/`model`.
3. **Shadow the file** — ship a file at the identical relative path so the game
   loads GWO's copy instead of the stock one.

Shadowing is the last resort, and this page is mostly about why.

## Why shadowing is expensive

A shadowed file is a **full copy**, not a diff. Any future base-game update to the
parts GWO did not touch is silently lost until somebody notices and manually
re-syncs. There is no base install in CI to diff against, so that drift is
invisible until it surfaces as an in-game bug.

Shadow only when neither injection nor hijacking can work — typically when the
change alters markup or DOM structure the base file owns outright, or touches
logic the base file keeps in a private closure and never exposes.

### A shadowed path can only have one owner

Two mods shadowing one path do not merge — one wins outright and the other's copy
simply is not there. **Check whether a third-party mod already shadows a path before
adding it to the inventory above**, because the loser fails silently: its module still
loads, so the symptom is a missing function on an otherwise-working object, surfacing
far from the cause.

GWO hit this with `systems/template-loader.js`, which Shared Systems for Galactic War
replaces wholesale to add `loadOptions`/`useSources`. GWO shadowing the same path won,
and that mod's whole Systems panel rendered as a bare header — its `loadOptions()` call
threw. The seeded loader now lives at `shared/gwo_system_templates.js` in GWO's own
namespace and defers to whatever owns the base path when that path carries `loadOptions`.

The general shape: where a mod might reasonably contend for a base path, put the
replacement in GWO's namespace and choose between it and the base module at the call
site, rather than competing for the file.

## Function hijacking

Where the base game assigns something onto `self` — usually in the context of the
global `model` — GWO can overwrite that individual function without copying the
file:

```js
model.someFunction = function () {
  /* GWO's version */
};
```

A prototype method works the same way. `gw_galaxy.js` overrides
`GalaxyBuilder.prototype.buildGraph` to pass a seed into `reduceConnections`, rather
than shadowing `GalaxyBuilder.js`: that file has exactly one consumer in the base
install — `gw_galaxy.js` itself — and a full copy would freeze five other methods GWO
never calls.

This only works for functions the base file actually assigns onto `self`/`model`
or a prototype. A function kept as a private closure variable with no such
assignment is unreachable this way, and needing to reach it is a legitimate reason
to fall back to shadowing.

Two hijacking traps worth knowing, both recorded at their call sites:

- **Write into an existing observable; don't replace it.** The base game's
  computeds subscribed to the _original_, so a replacement leaves those
  subscriptions pointing at the old object and the patched value only appears when
  some unrelated dependency happens to fire. See `live_game/menu.js`.
- **Write through the observableArray, not into the array it returns.** Assigning
  into the returned array skips `valueHasMutated`, so nothing is notified. See
  `gw_play/card_tooltips.js`.

## The complete shadowing inventory

### `ui/main/` — 9 non-card files

| File                                                      | What GWO changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game/galactic_war/gw_play/gw_per_player_tech_referee.js` | Per-player tech in co-op. Validation extracted to `gw_play/per_player_tech.js`; viewer subcommanders continue the player-faction colour sequence rather than taking raw faction colours.                                                                                                                                                                                                                                                                                                                                                           |
| `game/galactic_war/shared/js/gw_factions.js`              | Adds the Cluster faction (TITANS only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `game/galactic_war/shared/js/gw_faction_0.js`             | Overhauls personalities (Legonis Machina).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `game/galactic_war/shared/js/gw_faction_1.js`             | Overhauls personalities (Foundation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `game/galactic_war/shared/js/gw_faction_2.js`             | Overhauls personalities (Synchronous).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `game/galactic_war/shared/js/gw_faction_3.js`             | Overhauls personalities (Revenants).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `game/galactic_war/shared/js/gw_galaxy.js`                | System size scaling, including army brackets under Shared Systems for Galactic War; repairs stars the base builder leaves with no gates (see [`galaxy.md`](galaxy.md)). Graph core extracted to `shared/gw_galaxy_graph.js`.                                                                                                                                                                                                                                                                                                                       |
| `game/galactic_war/shared/js/gw_inventory.js`             | Adds the `aiMods` observable that the whole AI-mod pipeline hangs off; changes `removeUnits` to remove _every_ copy of a unit; suspends loadout banking while a co-op viewer applies the host's inventory ([`coop.md`](coop.md)); drops stock's `cards.subscribe(applyCards)`, which double-applied - every stock mutator (`gw_game.js` `winTurn`/`load`, `gw_play.js`'s discard splices, `gw_start.js`'s start card) already calls `applyCards`, and the extra pass in `gw_start` marked the start card processed before `gw_play` ran its buffs. |
| `game/galactic_war/shared/js/systems/titans-normal.js`    | Changes the Players arrays and adds classic systems.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

`gw_inventory.js`'s `removeUnits` change is a **reversal of documented base-game
behaviour** — stock explicitly notes that it does not perform set removes, so that
multiple adds and a single remove leave the unit available. Anyone reasoning from
base-game knowledge will be wrong here, and at least one card's logic
(`gwc_start_allfactory.js`) depends on the new behaviour.

### `ui/main/game/galactic_war/cards/` — 237 files, 69 shadowed

The prefix tells you exactly which is which, with no exceptions in either
direction:

| Prefix   | Count | Status                                     |
| -------- | ----- | ------------------------------------------ |
| `gwc_`   | 69    | **Shadows** a stock card of the same name  |
| `gwaio_` | 162   | GWO-authored, new file at a base-game path |
| `nem_`   | 4     | GWO-authored (Nemuneko set)                |
| `tgw_`   | 2     | GWO-authored (trialq set)                  |

Being at a base-game _path_ is not the same as shadowing a base-game _file_. Only
the `gwc_` cards replace something; the other 168 simply live in the same
directory because that is where the game looks for cards.

### `pa/` — 87 files, 8 shadowed

| Tree              | Files | Status                                                                                        |
| ----------------- | ----- | --------------------------------------------------------------------------------------------- |
| `pa/ai/`          | 8     | All 8 shadow base-game build data — see the re-sync table below for which copy each replaces. |
| `pa/ai_penchant/` | 70    | GWO-authored in full.                                                                         |
| `pa/ai_tech/`     | 8     | GWO-authored; the files that AI-mod `load` descriptors name.                                  |
| `pa/units/`       | 1     | GWO-authored; the CEO Commander's Colonel buildbar icon.                                      |

That last one is the reminder that **being at a base-game path is not shadowing**.
`bot_support_commander_ceo_icon_buildbar.png` sits in the stock unit's own
directory, but the stock icon there is `bot_support_commander_icon_buildbar.png` —
a different name, so nothing is replaced.

#### Which copy each `pa/ai/` file replaces

All eight are written as `pa/ai/…` in this repo and addressed as `/pa/…` at
runtime, but the base file to re-sync against is **not** always the one under
`pa/`. TITANS is an overlay: where a path exists in both trees, the `pa_ex1/`
copy is the one the game loads, and therefore the one GWO's copy was derived
from and must be diffed against.

| GWO file                              | Base copy to diff against |
| ------------------------------------- | ------------------------- |
| `factory_air_builds.json`             | `pa/` — the only one      |
| `fabber_defense_builds.json`          | `pa_ex1/`                 |
| `factory_land_builds.json`            | `pa_ex1/`                 |
| `platoon_templates.json`              | `pa_ex1/`                 |
| `factory_air_builds_additional.json`  | `pa_ex1/`                 |
| `factory_land_builds_additional.json` | `pa_ex1/`                 |
| `factory_land_builds_x1.json`         | `pa_ex1/`                 |
| `factory_uc_builds_x1.json`           | `pa_ex1/`                 |

The `_additional` and `_x1` variants are TITANS-only and exist nowhere else, so
they are easy to get right. The trap is the middle three, which exist in **both**
trees under the same name: `pa/platoon_templates.json` is half the size of the
`pa_ex1/` one, so a re-sync against the wrong copy silently discards every
TITANS-era entry rather than failing. See [`ai-paths.md`](ai-paths.md) for why
the overlay is addressed as `/pa/…` regardless.

## Marking a shadowed file

Every shadowed file should say, at the top, what GWO changed relative to stock.
These markers are the highest-value comments in the repo: they are the only thing
telling a reader which of several hundred lines actually matters, and they are
what a re-sync after a PA patch is done against.

The convention is a `// GWO - …` prefix, though some older files use a bare
descriptive line.

The marker goes on line 1, replacing stock's `// !LOCNS:galactic_war` where the
upstream file has one. That directive is build-time only and has no consumer in
this repo, so it is deliberately not carried — see
[`constraints.md`](constraints.md).

## Registry files have no append mechanism

A mod adding entries to `pa/units/unit_list.json`,
`pa/units/commanders/commander_list.json` or their `pa_ex1/` equivalents must ship
the entire list. Those copies go stale when a game patch adds or renames stock
content — check them first when a vanilla unit disappears with the mod enabled.

GWO does not currently ship any of these, but the constraint applies the moment
one is added.

## Reaching shadowed logic from tests

A shadowed file usually cannot load under the Node AMD harness, because its
`define()` depends on base-game modules this repo does not ship (`shared/gw_common`
above all). The pattern is to extract the testable logic into a **measured sibling
module** in the mod's own namespace, which the shadowed file then requires:

| Shadowed file                   | Measured sibling                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `gw_per_player_tech_referee.js` | `gw_play/per_player_tech.js`                                                               |
| `gw_galaxy.js`                  | `shared/gw_galaxy_graph.js`, `shared/gw_galaxy_connect.js`, `shared/gw_system_brackets.js` |
| `gw_faction_*.js`               | `faction/faction_seed.js`                                                                  |
| `gw_play/referee_game_files.js` | `gw_play/referee_game_file_paths.js`                                                       |
| `gw_play/referee_config.js`     | `gw_play/referee_config_setup.js`                                                          |

The shadowed file keeps only the `model`/`ko`/`api` glue and is coverage-excluded;
the sibling holds the logic and is unit-tested. Do **not** instead hoist helpers to
file top level — in PA's RequireJS runtime that creates a `window` global. See
[`constraints.md`](constraints.md).

## `gw_galaxy_graph.js`'s `pathBetween` looks redundant and is not

PA 124670 added the `|| []` guard on `neighborsMap[node]` to **both** of the base
game's copies of `pathBetween`, which is the fix GWO was already carrying. That
invites deleting GWO's copy in `shared/gw_galaxy_graph.js` as now-redundant. It
would leave `pathBetween` undefined and break star routing outright, because
neither stock copy is reachable — for two different reasons, which is what makes
this easy to get wrong:

- `shared/js/gw_galaxy.js` holds one, and GWO **shadows that exact file**, so
  stock's constructor never loads at all — guard included. GWO's shadow takes its
  constructor from `gw_galaxy_graph.js` instead, which is the only remaining
  source of `pathBetween`.
- `community_mods/states/gw_play.js` holds the other and does load, reassigning
  `galaxy.pathBetween` wholesale. But it is a `<script … defer>` in
  `gw_play.html`, so it runs after `gw_play.js`'s synchronous top level while the
  game is still loading asynchronously, and it opens with
  `if (!model.game()) return;`.

All three of these were measured on a live client, so the mechanism is confirmed
rather than inferred:

- `model.game().galaxy().pathBetween.toString()` gives GWO's body (`workList`,
  `canEnterTarget`) every time — PA 124667 and 124670, solo and co-op, host and
  viewer.
- Calling `window.CommunityModsGW()` by hand once the game is loaded _does_ flip
  it to stock's. The shim is not broken; it never gets the chance.
- Sampling straight after a scene reload shows why. `model.game()` is still falsy
  while `document.readyState` is `"loading"`, which is when a deferred script
  runs, and stays falsy for a while after it reaches `"complete"`. The galaxy does
  not exist that early, so there is not even an earlier galaxy the shim could have
  patched before GWO's replaced it.

`gw_play.js` only calls `pathBetween`, so those two are the whole field.

## Where to look next

- [`architecture.md`](architecture.md) — how scenes and entry points work.
- [`testing.md`](testing.md) — the harness, and why some files cannot load in it.
- CONTRIBUTING.md's "Node test reach for base-game-shadowed modules".
