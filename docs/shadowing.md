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

## Function hijacking

Where the base game assigns something onto `self` — usually in the context of the
global `model` — GWO can overwrite that individual function without copying the
file:

```js
model.someFunction = function () {
  /* GWO's version */
};
```

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

| File                                                      | What GWO changed                                                                                                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game/galactic_war/gw_play/gw_per_player_tech_referee.js` | Per-player tech in co-op. Validation extracted to `gw_play/per_player_tech.js`; viewer subcommanders continue the player-faction colour sequence rather than taking raw faction colours. |
| `game/galactic_war/shared/js/gw_factions.js`              | Adds the Cluster faction (TITANS only).                                                                                                                                                  |
| `game/galactic_war/shared/js/gw_faction_0.js`             | Overhauls personalities (Legonis Machina).                                                                                                                                               |
| `game/galactic_war/shared/js/gw_faction_1.js`             | Overhauls personalities (Foundation).                                                                                                                                                    |
| `game/galactic_war/shared/js/gw_faction_2.js`             | Overhauls personalities (Synchronous).                                                                                                                                                   |
| `game/galactic_war/shared/js/gw_faction_3.js`             | Overhauls personalities (Revenants).                                                                                                                                                     |
| `game/galactic_war/shared/js/gw_galaxy.js`                | System size scaling; repairs stars the base builder leaves with no gates (see [`galaxy.md`](galaxy.md)). Graph core extracted to `shared/gw_galaxy_graph.js`.                            |
| `game/galactic_war/shared/js/gw_inventory.js`             | Adds the `aiMods` observable that the whole AI-mod pipeline hangs off; changes `removeUnits` to remove _every_ copy of a unit.                                                           |
| `game/galactic_war/shared/js/systems/titans-normal.js`    | Changes the Players arrays and adds classic systems.                                                                                                                                     |

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
| `tgw_`   | 2     | GWO-authored                               |

Being at a base-game _path_ is not the same as shadowing a base-game _file_. Only
the `gwc_` cards replace something; the other 168 simply live in the same
directory because that is where the game looks for cards.

### `pa/` — 86 files, 8 shadowed

| Tree              | Files | Status                                                                                       |
| ----------------- | ----- | -------------------------------------------------------------------------------------------- |
| `pa/ai/`          | 8     | All 8 shadow base-game build data — 4 against `pa/`, 4 against the TITANS overlay `pa_ex1/`. |
| `pa/ai_penchant/` | 70    | GWO-authored in full.                                                                        |
| `pa/ai_tech/`     | 8     | GWO-authored; the files that AI-mod `load` descriptors name.                                 |

The four shadowing `pa_ex1/` are the `_additional` and `_x1` variants —
`factory_air_builds_additional.json`, `factory_land_builds_additional.json`,
`factory_land_builds_x1.json`, `factory_uc_builds_x1.json`. They are stored under
`pa_ex1/` in the install but addressed as `/pa/…` at runtime; see
[`ai-paths.md`](ai-paths.md).

## Marking a shadowed file

Every shadowed file should say, at the top, what GWO changed relative to stock.
These markers are the highest-value comments in the repo: they are the only thing
telling a reader which of several hundred lines actually matters, and they are
what a re-sync after a PA patch is done against.

The convention is a `// GWO - …` prefix, though some older files use a bare
descriptive line.

**Do not displace a base-game directive to make room for the marker.** Stock line
1 of most files under `cards/` and `shared/js/` is `// !LOCNS:galactic_war`, the
string-extraction namespace for that file's `!LOC:` strings. It has no runtime
effect (see [`constraints.md`](constraints.md)), but it is stock content in a file
whose whole purpose is to be diffable against stock. The marker goes on line 2.

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

| Shadowed file                   | Measured sibling                                           |
| ------------------------------- | ---------------------------------------------------------- |
| `gw_per_player_tech_referee.js` | `gw_play/per_player_tech.js`                               |
| `gw_galaxy.js`                  | `shared/gw_galaxy_graph.js`, `shared/gw_galaxy_connect.js` |
| `gw_play/referee_game_files.js` | `gw_play/referee_game_file_paths.js`                       |
| `gw_play/referee_config.js`     | `gw_play/referee_config_setup.js`                          |

The shadowed file keeps only the `model`/`ko`/`api` glue and is coverage-excluded;
the sibling holds the logic and is unit-tested. Do **not** instead hoist helpers to
file top level — in PA's RequireJS runtime that creates a `window` global. See
[`constraints.md`](constraints.md).

## Where to look next

- [`architecture.md`](architecture.md) — how scenes and entry points work.
- [`testing.md`](testing.md) — the harness, and why some files cannot load in it.
- CONTRIBUTING.md's "Node test reach for base-game-shadowed modules".
