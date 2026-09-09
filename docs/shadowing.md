# Shadowing and function hijacking

GWO changes base-game behaviour three ways. In order of preference:

1. **Inject into a scene** via `modinfo.json`'s `scenes` block. This is a new
   file in the mod's own namespace, and the game loads it alongside the stock UI.
2. **Hijack a function** the base game exposed on `self`/`model`.
3. **Shadow the file**: ship a file at the identical relative path, so the game
   loads GWO's copy instead of the stock one.

Shadowing is the last resort. This page is mostly about why.

## Why shadowing is expensive

A shadowed file is a **full copy**, not a diff. GWO silently loses any future
base-game update to the parts it did not touch. The loss lasts until somebody
notices and manually re-syncs. CI has no base install to diff against. That drift
is therefore invisible until it appears as an in-game bug.

Shadow only when neither injection nor hijacking can work. Two cases are typical.
The change alters markup or DOM structure that the base file owns outright. Or the
change touches logic that the base file keeps in a private closure and never
exposes.

### A shadowed path can only have one owner

Two mods that shadow one path do not merge. One wins outright, and the other's copy
simply is not there. **Check whether a third-party mod already shadows a path before
adding it to the inventory below.** The loser fails silently: its module still
loads. The symptom is therefore a missing function on an otherwise-working object,
and it appears far from the cause.

GWO hit this with `systems/template-loader.js`. Shared Systems for Galactic War
replaces that file wholesale to add `loadOptions`/`useSources`. GWO's shadow of the
same path won. That mod's whole Systems panel then rendered as a bare header, because
its `loadOptions()` call threw. The seeded loader now lives at
`shared/gwo_system_templates.js` in GWO's own namespace. When the base path carries
`loadOptions`, the loader defers to whatever owns that path.

The general shape is this. Where a mod might reasonably contend for a base path, put
the replacement in GWO's namespace. Then choose between the replacement and the base
module at the call site, rather than compete for the file.

## Function hijacking

The base game assigns functions onto `self`, usually in the context of the global
`model`. GWO can overwrite one such function without copying the file:

```js
model.someFunction = function () {
  /* GWO's version */
};
```

A prototype method works the same way. This is how GWO reaches galaxy generation:
`gw_start/galaxy_build.js` replaces `GWGalaxy.prototype.build` and
`GalaxyBuilder.prototype.buildGraph` rather than shadow either file. Both have
exactly one consumer in the base install. A full copy would freeze every other
method that GWO never calls.

`gw_play/cards.js` is the largest hijack. It replaces `model.explore`,
`model.win`, `model.rerollTech` and the `CardViewModel` global rather than the
files that own them. It also carries its own dealer in place of stock's
`gw_dealer`. Stock's dealer deals from a fixed card list with a fresh
`Math.seedrandom()`. It knows nothing of third-party decks, the war seed or
co-op per-player hands. There is therefore no single function in it to patch: the
deal is GWO's end to end.

This only works for functions that the base file actually assigns onto
`self`/`model` or a prototype. A function kept as a private closure variable with
no such assignment is unreachable this way. The need to reach such a function is a
legitimate reason to shadow instead.

Two hijacking traps are worth knowing. Both are recorded at their call sites:

- **Write into an existing observable. Do not replace it.** The base game's
  computeds subscribed to the _original_. A replacement leaves those subscriptions
  pointing at the old object. The patched value then only appears when some
  unrelated dependency happens to fire. See `live_game/menu.js`.
- **Write through the observableArray, not into the array it returns.** Assigning
  into the returned array skips `valueHasMutated`, so nothing is notified. See
  `gw_play/card_tooltips.js`.

## The complete shadowing inventory

`validate:docs` checks the four tables below against the tree. A file added or
removed without its row therefore fails `npm run verify`.

### `ui/main/` — everything but the cards

| File                                                      | What GWO changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game/galactic_war/gw_play/gw_per_player_tech_referee.js` | Per-player tech in co-op. Validation is extracted to `gw_play/per_player_tech.js`. Viewer subcommanders continue the player-faction colour sequence rather than take raw faction colours. Viewers' units, mods and unit map follow the host's race.                                                                                                                                                                                                                                                                                             |
| `game/galactic_war/shared/js/gw_factions.js`              | Adds the Cluster faction (TITANS only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `game/galactic_war/shared/js/gw_faction_0.js`             | Overhauls personalities (Legonis Machina).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `game/galactic_war/shared/js/gw_faction_1.js`             | Overhauls personalities (Foundation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `game/galactic_war/shared/js/gw_faction_2.js`             | Overhauls personalities (Synchronous).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `game/galactic_war/shared/js/gw_faction_3.js`             | Overhauls personalities (Revenants).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `game/galactic_war/shared/js/gw_inventory.js`             | Adds the `aiMods` observable that the whole AI-mod pipeline depends on. Changes `removeUnits` to remove _every_ copy of a unit. Suspends loadout banking while a co-op viewer applies the host's inventory ([`coop.md`](coop.md)). Drops stock's `cards.subscribe(applyCards)`, which double-applied - every stock mutator (`gw_game.js` `winTurn`/`load`, `gw_play.js`'s discard splices, `gw_start.js`'s start card) already calls `applyCards`. The extra pass in `gw_start` marked the start card processed before `gw_play` ran its buffs. |
| `game/galactic_war/shared/js/systems/titans-normal.js`    | Changes the Players arrays and adds classic systems.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `game/galactic_war/shared/img/icon_faction_4.png`         | Added, not shadowed: the Cluster faction icon, at the path that stock's `icon_faction_<n>.png` pattern expects.                                                                                                                                                                                                                                                                                                                                                                                                                                 |

`gw_inventory.js`'s `removeUnits` change is a **reversal of documented base-game
behaviour**. Stock explicitly notes that it does not perform set removes. In stock,
multiple adds and a single remove therefore leave the unit available. Anyone who
reasons from base-game knowledge will be wrong here. At least one card's logic
(`gwc_start_allfactory.js`) depends on the new behaviour.

### `ui/main/game/galactic_war/cards/`

The prefix tells you exactly which is which. There are no exceptions in either
direction:

| Prefix   | Status                                     |
| -------- | ------------------------------------------ |
| `gwc_`   | **Shadows** a stock card of the same name  |
| `gwaio_` | GWO-authored, new file at a base-game path |
| `nem_`   | GWO-authored (Nemuneko set)                |
| `tgw_`   | GWO-authored (trialq set)                  |

A file at a base-game _path_ does not necessarily shadow a base-game _file_. Only
the `gwc_` cards replace something. The rest simply live in the same directory,
because that is where the game reads cards from.

### `pa/`

| Tree              | Status                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pa/ai/`          | Every file shadows base-game build data. See the re-sync table below for which copy each replaces.                                                                              |
| `pa/ai_penchant/` | GWO-authored in full.                                                                                                                                                           |
| `pa/ai_queller/`  | Shadows Queller's unit map in each tier GWO selects, merged with the tier's `unit_maps/mla.json` so that file needs no mounting of its own. See the second re-sync table below. |
| `pa/ai_tech/`     | GWO-authored. The files that AI-mod `load` descriptors name.                                                                                                                    |
| `pa/units/`       | GWO-authored. The CEO Commander's Colonel buildbar icon.                                                                                                                        |

That last one is the reminder that **a file at a base-game path is not a shadow**.
`bot_support_commander_ceo_icon_buildbar.png` sits in the stock unit's own
directory. The stock icon there is `bot_support_commander_icon_buildbar.png`. That
is a different name, so nothing is replaced.

#### Which copy each `pa/ai/` file replaces

All are written as `pa/ai/…` in this repo and addressed as `/pa/…` at runtime. The
base file to re-sync against is **not** always the one under `pa/`. TITANS is an
overlay. Where a path exists in both trees, the game loads the `pa_ex1/` copy. GWO's
copy was therefore derived from the `pa_ex1/` copy, and the diff must be against it.

| GWO file                              | Base copy to diff against |
| ------------------------------------- | ------------------------- |
| `factory_air_builds.json`             | `pa/` (the only one)      |
| `fabber_defense_builds.json`          | `pa_ex1/`                 |
| `factory_land_builds.json`            | `pa_ex1/`                 |
| `platoon_templates.json`              | `pa_ex1/`                 |
| `factory_air_builds_additional.json`  | `pa_ex1/`                 |
| `factory_land_builds_additional.json` | `pa_ex1/`                 |
| `factory_land_builds_x1.json`         | `pa_ex1/`                 |
| `factory_uc_builds_x1.json`           | `pa_ex1/`                 |

The `_additional` and `_x1` variants are TITANS-only and exist nowhere else, so
they are easy to get right. The trap is the middle three, which exist in **both**
trees under the same name. `pa/platoon_templates.json` is half the size of the
`pa_ex1/` one. A re-sync against the wrong copy therefore silently discards every
TITANS-era entry rather than fail. See [`ai-paths.md`](ai-paths.md) for why the
overlay is addressed as `/pa/…` regardless.

#### Which copy each `pa/ai_queller/` file replaces

Queller ships only under `pa_ex1/`, so there is one base copy of each. Every GWO
copy is that file plus the five `AnyMLA*Factory` entries from the same tier's
`unit_maps/mla.json`, which Queller's build orders reference. Merging them keeps
the map a single file, so `mla.json` needs no mounting of its own.

| GWO file                              | Base copy to diff against |
| ------------------------------------- | ------------------------- |
| `q_bronze/unit_maps/ai_unit_map.json` | `pa_ex1/` (the only one)  |
| `q_silver/unit_maps/ai_unit_map.json` | `pa_ex1/` (the only one)  |
| `q_uber/unit_maps/ai_unit_map.json`   | `pa_ex1/` (the only one)  |

## Marking a shadowed file

Every shadowed file should say, at the top, what GWO changed relative to stock.
These markers are the highest-value comments in the repo. They are the only thing
that tells a reader which of several hundred lines actually matters. They are also
what a re-sync after a PA patch is done against.

The convention is a `// GWO - …` prefix. Some older files use a bare descriptive
line.

The `gwc_` cards are the exception. Each is a wholesale rewrite onto `gwoCard`,
`gwoGroup` and `gwoUnit`, so a line-by-line marker would name every line; the
cards table above is their record. `gwc_start_orbital.js` carries one anyway,
because its unit list deliberately departs from stock's.

The marker goes on line 1. It replaces stock's `// !LOCNS:galactic_war` where the
upstream file has one. That directive is build-time only and has no consumer in
this repo. GWO therefore deliberately does not carry it. See
[`constraints.md`](constraints.md).

## Registry files have no append mechanism

A mod that adds entries to `pa/units/unit_list.json`,
`pa/units/commanders/commander_list.json` or their `pa_ex1/` equivalents must ship
the entire list. Those copies go stale when a game patch adds or renames stock
content. Check them first when a vanilla unit disappears with the mod enabled.

GWO does not currently ship any of these. The constraint applies the moment one is
added.

## Reaching shadowed logic from tests

A shadowed file usually cannot load under the Node AMD harness. Its `define()`
depends on base-game modules that this repo does not ship (`shared/gw_common`
above all). The pattern is to extract the testable logic into a **measured sibling
module** in the mod's own namespace. The glue file then requires that sibling. The
same split serves two files in GWO's own namespace that are not shadows but depend
on `shared/gw_common` all the same:

| Glue file                                   | Measured sibling                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gw_per_player_tech_referee.js` (shadow)    | `gw_play/per_player_tech.js`                                                        |
| `gw_faction_*.js` (shadows)                 | `faction/faction_builder.js`, `faction/faction_seed.js`, `shared/ai_personality.js` |
| `gw_play/referee_game_files.js` (GWO's own) | `gw_play/referee_game_file_paths.js`                                                |
| `gw_play/referee_config.js` (GWO's own)     | `gw_play/referee_config_setup.js`                                                   |

The glue file keeps only the `model`/`ko`/`api` glue and is coverage-excluded.
The sibling holds the logic and is unit-tested. Do **not** instead hoist helpers to
file top level. In PA's RequireJS runtime that creates a `window` global. See
[`constraints.md`](constraints.md).

## Galaxy generation is a hijack, and `pathBetween` is the base game's

GWO shadowed `gw_galaxy.js` until PA 124670. That patch added the
`neighborsMap[node] || []` guard that GWO carried in its own copy of the
constructor. With that guard upstream, stock's `pathBetween`, `neighborsMap` and
`areNeighbors` are equivalent to the copies GWO kept in `shared/gw_galaxy_graph.js`.
GWO therefore dropped both that module and the shadow. `gw_start/galaxy_build.js`
patches the two prototype methods that actually differ and leaves the rest of the
file to the base game.

The consequence is that **star routing is no longer GWO's code and is no longer unit
tested**. `shared/gw_galaxy` cannot load under the Node harness, so there is nothing
to load directly. `shared/gw_galaxy_connect.js` and `shared/gw_system_brackets.js`
remain measured and tested. `build` calls them, not the constructor.

This was measured on a live client rather than reasoned about. One seed built the
same galaxy before and after the swap: the same gate count, the same origin, and the
same distance for all 18 stars. Across the swap,
`model.game().galaxy().pathBetween.toString()` flips from GWO's body to stock's.
Routing still works on stock's body: `canSelect` returns the same paths that
`neighborsMap` implies, `move()` walks them, and `noFog` widens the reachable set.
**A file that appears or disappears needs a PA restart.** Only edits to files that
already existed at launch take effect live. A measurement without a restart
therefore reads the shadow as absent when it is on disk.

If a future PA patch changes `pathBetween` again, check it against these fog-of-war
rules. The last hop is allowed when either endpoint is explored, or under `noFog`.
An intermediate star is traversable when explored, or when visited at all under
`noFog`.

## Where to look next

- [`architecture.md`](architecture.md): how scenes and entry points work.
- [`testing.md`](testing.md): the harness, and why some files cannot load in it.
- CONTRIBUTING.md's "Test coverage and new code".
