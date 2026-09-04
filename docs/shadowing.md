# Shadowing and function hijacking

GWO changes base-game behaviour three ways. In order of preference:

1. **Inject into a scene** via `modinfo.json`'s `scenes` block — a new file in the
   mod's own namespace, loaded alongside the stock UI.
2. **Hijack a function** the base game exposed on `self`/`model`.
3. **Shadow the file** — ship a file at the identical relative path so the game
   loads GWO's copy instead of the stock one.

Shadowing is the last resort, and this page is mostly about why.

## Why shadowing is expensive

A shadowed file is a **full copy**, not a diff. GWO silently loses any future
base-game update to the parts it did not touch, until somebody notices and manually
re-syncs. There is no base install in CI to diff against, so that drift is
invisible until it surfaces as an in-game bug.

Shadow only when neither injection nor hijacking can work — typically when the
change alters markup or DOM structure the base file owns outright, or touches
logic the base file keeps in a private closure and never exposes.

### A shadowed path can only have one owner

Two mods shadowing one path do not merge — one wins outright and the other's copy
simply is not there. **Check whether a third-party mod already shadows a path before
adding it to the inventory below**, because the loser fails silently: its module still
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

A prototype method works the same way, and it is how GWO reaches galaxy
generation: `gw_start/galaxy_build.js` replaces `GWGalaxy.prototype.build` and
`GalaxyBuilder.prototype.buildGraph` rather than shadowing either file. Both have
exactly one consumer in the base install, and a full copy would freeze every other
method GWO never calls.

`gw_play/cards.js` is the largest hijack. It replaces `model.explore`,
`model.win`, `model.rerollTech` and the `CardViewModel` global rather than the
files that own them, and carries its own dealer in place of stock's
`gw_dealer`. Stock's deals from a fixed card list with a fresh
`Math.seedrandom()` and knows nothing of third-party decks, the war seed or
co-op per-player hands, so there is no single function in it to patch: the
deal is GWO's end to end.

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

`validate:docs` checks the three tables below against the tree, so a file added
or removed without its row fails `npm run verify`.

### `ui/main/` — everything but the cards

| File                                                      | What GWO changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game/galactic_war/gw_play/gw_per_player_tech_referee.js` | Per-player tech in co-op. Validation extracted to `gw_play/per_player_tech.js`; viewer subcommanders continue the player-faction colour sequence rather than taking raw faction colours; viewers' units, mods and unit map follow the host's race.                                                                                                                                                                                                                                                                                                 |
| `game/galactic_war/shared/js/gw_factions.js`              | Adds the Cluster faction (TITANS only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `game/galactic_war/shared/js/gw_faction_0.js`             | Overhauls personalities (Legonis Machina).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `game/galactic_war/shared/js/gw_faction_1.js`             | Overhauls personalities (Foundation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `game/galactic_war/shared/js/gw_faction_2.js`             | Overhauls personalities (Synchronous).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `game/galactic_war/shared/js/gw_faction_3.js`             | Overhauls personalities (Revenants).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `game/galactic_war/shared/js/gw_inventory.js`             | Adds the `aiMods` observable that the whole AI-mod pipeline hangs off; changes `removeUnits` to remove _every_ copy of a unit; suspends loadout banking while a co-op viewer applies the host's inventory ([`coop.md`](coop.md)); drops stock's `cards.subscribe(applyCards)`, which double-applied - every stock mutator (`gw_game.js` `winTurn`/`load`, `gw_play.js`'s discard splices, `gw_start.js`'s start card) already calls `applyCards`, and the extra pass in `gw_start` marked the start card processed before `gw_play` ran its buffs. |
| `game/galactic_war/shared/js/systems/titans-normal.js`    | Changes the Players arrays and adds classic systems.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `game/galactic_war/shared/img/icon_faction_4.png`         | Added, not shadowed: the Cluster faction icon, at the path stock's `icon_faction_<n>.png` pattern looks for.                                                                                                                                                                                                                                                                                                                                                                                                                                       |

`gw_inventory.js`'s `removeUnits` change is a **reversal of documented base-game
behaviour** — stock explicitly notes that it does not perform set removes, so that
multiple adds and a single remove leave the unit available. Anyone reasoning from
base-game knowledge will be wrong here, and at least one card's logic
(`gwc_start_allfactory.js`) depends on the new behaviour.

### `ui/main/game/galactic_war/cards/`

The prefix tells you exactly which is which, with no exceptions in either
direction:

| Prefix   | Status                                     |
| -------- | ------------------------------------------ |
| `gwc_`   | **Shadows** a stock card of the same name  |
| `gwaio_` | GWO-authored, new file at a base-game path |
| `nem_`   | GWO-authored (Nemuneko set)                |
| `tgw_`   | GWO-authored (trialq set)                  |

Being at a base-game _path_ is not the same as shadowing a base-game _file_. Only
the `gwc_` cards replace something; the rest simply live in the same directory
because that is where the game looks for cards.

### `pa/`

| Tree              | Status                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pa/ai/`          | Every file shadows base-game build data — see the re-sync table below for which copy each replaces.                                      |
| `pa/ai_penchant/` | GWO-authored in full.                                                                                                                    |
| `pa/ai_queller/`  | Added, not shadowed: a unit map per tier GWO selects, carrying the unit names GWO's build entries reference and Queller's own maps lack. |
| `pa/ai_tech/`     | GWO-authored; the files that AI-mod `load` descriptors name.                                                                             |
| `pa/units/`       | GWO-authored; the CEO Commander's Colonel buildbar icon.                                                                                 |

That last one is the reminder that **being at a base-game path is not shadowing**.
`bot_support_commander_ceo_icon_buildbar.png` sits in the stock unit's own
directory, but the stock icon there is `bot_support_commander_icon_buildbar.png` —
a different name, so nothing is replaced.

#### Which copy each `pa/ai/` file replaces

All are written as `pa/ai/…` in this repo and addressed as `/pa/…` at
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
module** in the mod's own namespace, which the glue file then requires. The same
split serves two files in GWO's own namespace that are not shadows but depend on
`shared/gw_common` all the same:

| Glue file                                   | Measured sibling                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gw_per_player_tech_referee.js` (shadow)    | `gw_play/per_player_tech.js`                                                        |
| `gw_faction_*.js` (shadows)                 | `faction/faction_builder.js`, `faction/faction_seed.js`, `shared/ai_personality.js` |
| `gw_play/referee_game_files.js` (GWO's own) | `gw_play/referee_game_file_paths.js`                                                |
| `gw_play/referee_config.js` (GWO's own)     | `gw_play/referee_config_setup.js`                                                   |

The glue file keeps only the `model`/`ko`/`api` glue and is coverage-excluded;
the sibling holds the logic and is unit-tested. Do **not** instead hoist helpers to
file top level — in PA's RequireJS runtime that creates a `window` global. See
[`constraints.md`](constraints.md).

## Galaxy generation is a hijack, and `pathBetween` is the base game's

`gw_galaxy.js` was shadowed until PA 124670, which added the `neighborsMap[node] ||
[]` guard GWO was carrying in its own copy of the constructor. With that guard
upstream, stock's `pathBetween`, `neighborsMap` and `areNeighbors` are equivalent to
the copies GWO kept in `shared/gw_galaxy_graph.js`, so both that module and the
shadow were dropped: `gw_start/galaxy_build.js` patches the two prototype methods
that actually differ and leaves the rest of the file to the base game.

The consequence is that **star routing is no longer GWO's code and is no longer unit
tested** — `shared/gw_galaxy` cannot load under the Node harness, so there is nothing
to load directly. `shared/gw_galaxy_connect.js` and `shared/gw_system_brackets.js`
remain measured and tested; they are called from `build`, not from the constructor.

Measured on a live client rather than reasoned about: one seed built the same galaxy
before and after the swap — same gate count, same origin, same distance for all 18
stars — and `model.game().galaxy().pathBetween.toString()` flips from GWO's body to
stock's across it. Routing still works on stock's: `canSelect` returns the same paths
`neighborsMap` implies, `move()` walks them, and `noFog` widens the reachable set.
**A file appearing or disappearing needs a PA restart** — only edits to files that
already existed at launch are picked up live, so measuring this without one reads the
shadow as absent when it is on disk.

If a future PA patch changes `pathBetween` again, the fog-of-war rules to check it
against are: the last hop is allowed when either endpoint is explored, or under
`noFog`; an intermediate star is traversable when explored, or when visited at all
under `noFog`.

## Where to look next

- [`architecture.md`](architecture.md) — how scenes and entry points work.
- [`testing.md`](testing.md) — the harness, and why some files cannot load in it.
- CONTRIBUTING.md's "Test coverage and new code".
