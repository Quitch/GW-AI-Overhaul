# AI path resolution

Every AI in a Galactic War battle reads its build orders from a directory. This
page explains how GWO chooses that directory for each AI in each battle.

Two modules do the work:

- **`ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js`**: this
  module is pure string arithmetic. It has no engine globals, no `model`, and no
  dependencies. The tests drive this module directly.
- **`ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js`**: this module is the
  engine-coupled wrapper. It reads `model.game()` to decide what to pass to the
  pure module.

The split keeps the interesting logic testable under Node. The parts that need a
running game stay thin.

## The five trees

| Path                   | Shipped here? | What it is                                                                                                                                                                                 |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/pa/ai/`              | Partly        | The base game's stock Titans AI build data. This repo ships only the handful of files GWO shadows. The rest is base-game-owned and absent from CI.                                         |
| `/pa/ai_penchant/`     | In full       | GWO's own personality-driven build trees. `shared/ai.js`'s `penchants()` maps a personality to build-file tags drawn from here.                                                            |
| `/pa/ai_queller/`      | Partly        | The base game's Queller AI data. This repo shadows the unit map of each tier GWO selects, merged with the tier's `mla.json` entries. The build data is base-game-owned and absent from CI. |
| `/pa/ai_subcommander/` | No            | Runtime-synthesised only. No on-disk existence anywhere.                                                                                                                                   |
| `/pa/ai_cluster/`      | No            | Runtime-synthesised only. No on-disk existence anywhere.                                                                                                                                   |

A race adds a sixth kind of root, synthesised per battle. The root is the
brain's root with `_race_<id>` inserted, for example `/pa/ai_race_legion/`,
`/pa/ai_queller_race_legion/q_uber/`, or `/pa/ai_subcommander_race_legion/`. It
carries the race's build orders layered over the brain's base files.
`races.aiRoot` applies it inside `getAIPathDestination` when `options.race` is
set. Sources never change, because the tree is written from the brain's files.
See [`races.md`](races.md).

An add-on (Second Wave, Section 17, Osmech) adds no root. Its files under
`/pa/ai/` join the tree of the race each of its layers names: a Legion layer
rides into `/pa/ai_race_legion/`, an MLA layer stays in the brain's base and
in every scoped MLA tree. See [`races.md`](races.md), "Add-ons".

`/pa/ai_tech/` is deliberately **not** in that table. It is never handed to an AI
as an `ai_path`. It is a file source. The pipeline reads extra build files from
it when a card's AI mod carries a `load`. It is also a place where
`referee_ai.js` writes generated output. See [`ai-pipeline.md`](ai-pipeline.md),
"The op table".

`/pa/ai_tech/` is also not `gw_start/ai_tech.js`. That file shares the name and
nothing else. It is the AI's own stat tech, applied as unit-spec mods at war
creation. See [`galaxy.md`](galaxy.md), "AI tech".

**The `/pa/ai_queller/` path is a trap.** On disk in the game install, those
files live under `pa_ex1/ai_queller/`. Queller is TITANS content, and TITANS is
stored as an overlay. But the game _addresses_ the overlay through `/pa/…` at
runtime. The base game asks for `/pa/ai_queller/q_uber`, so GWO does too. Use
`pa_ex1/` only to find the file on disk. Never write it into code.

## Source versus destination

Two different functions resolve the source and the destination, with
deliberately different rules. Conflating them is the most likely way to break
this subsystem.

**`getAIPathSource(type, aiInUse, smartSubcommanders)`** returns the path that
build orders are _read from_:

```text
Penchant -> /pa/ai_penchant/
Queller  -> getQuellerPath(type, smartSubcommanders)
otherwise-> /pa/ai/
```

Source and destination take the same `smartSubcommanders` flag, so a Smart
Subcommander reads the tier it writes to. Earlier, the source function passed a
hardcoded `false`. That meant the tech copied `q_bronze/` into the `q_silver/`
path, and the game never loaded silver's own build data at all. The source is
never scoped, though. No `player_…/` suffix is ever appended to it.

**`getAIPathDestination(type, aiInUse, options)`** returns the path that the
modified result is _written to_. First match wins:

```text
type === "cluster"                              -> /pa/ai_cluster/
aiInUse === "Queller"                           -> getQuellerPath(type, smartSubcommanders)
type === "subcommander" && !guardians && aiMods -> /pa/ai_subcommander/
aiInUse === "Penchant"                          -> /pa/ai_penchant/
otherwise                                       -> /pa/ai/
```

Then `appendScope(basePath, scopeToken)` adds `player_<token>/` if the caller
supplied a token.

Two points are worth stating precisely. First, `type === "cluster"` wins over
everything, including `aiInUse`. An MLA Cluster commander always reads from
`/pa/ai_cluster/`, regardless of which AI brain the war uses. A Cluster of any
other race is not `cluster` and routes like any race AI. Second, the
subcommander branch requires a _non-empty_ `aiMods`. With no AI-modifying cards
held, there is nothing to write, so the subcommander does not take that branch
and shares the enemy's path.

## Queller skill tiers

`getQuellerPath(type, smartSubcommanders)`:

| `type`                                    | Result                            |
| ----------------------------------------- | --------------------------------- |
| `"all"`                                   | `/pa/ai_queller/` (the bare root) |
| `"enemy"`                                 | `/pa/ai_queller/q_uber/`          |
| `"subcommander"` with Smart Subcommanders | `/pa/ai_queller/q_silver/`        |
| anything else                             | `/pa/ai_queller/q_bronze/`        |

Queller therefore structurally never hits the "enemy and subcommander share a
path" case that Titans and Penchant can hit. The enemy is always `q_uber/`. The
subcommander is always `q_bronze/` or `q_silver/`.

The tree ships six tiers (`q_bronze`, `q_casual`, `q_silver`, `q_gold`,
`q_platinum`, `q_uber`). There is no iron or diamond tier, although those exist
as difficulty names elsewhere. GWO only ever selects three of the six.

## Scope tokens, and a sanitisation asymmetry

Scoping gives separate trees to two AIs that would otherwise share a
destination. Examples are a Guardians enemy, or each co-op viewer's own
subcommanders.

`getScopeToken(identity, fallbackToken)` accepts either a string or an object.
For an object, it takes the first present of `playerTag`, `specTag`,
`client_name`, `playerName`, `name`, `id`, `client_id`, `role`. It then runs
`sanitizeToken`, which does three things:

1. It strips leading dots.
2. It replaces anything outside `[A-Za-z0-9_-]` with `_`.
3. It trims leading and trailing underscores.

If nothing survives, the token is `"player"`.

**`appendScope` does not sanitise.** It concatenates whatever it receives:

```js
return basePath + "player_" + scopeToken + "/";
```

So whether a path is sanitised depends entirely on how the caller obtained its
token. The two live call sites differ:

- `referee_ai.js` computes `viewerScopeToken` via `getScopeToken(".player0", …)`,
  which sanitises to `player0`. The Cluster path for that viewer is therefore
  `/pa/ai_cluster/player_player0/`.
- `shared/ai.js`'s `getSubcommanderPathForViewer` passes the **raw** player tag
  as `scopeToken`. So the same viewer's subcommander destination is
  `/pa/ai_subcommander/player_.player0/`, with the dot. The pure module's own
  `getViewerSubcommanderPath` has one special case. The host's tag, `.player`,
  yields no scope at all, because the host's subcommanders already own the
  unscoped destination.

Both are internally consistent, because the same code generates and consumes
them. So this is not a live bug. But it is a real inconsistency, and the tests
pin it deliberately. `getScopeToken` sanitises. `getAIPathDestination` does not.
A refactor that "fixes" the asymmetry silently changes shipped mount paths.

## Why scoped trees can nest safely

Scoping nests one `ai_path` inside another. A Guardians fight on the Titans brain
gives the enemy `/pa/ai/player_guardians/`. The subcommander keeps plain
`/pa/ai/`. That looks alarming, because the engine merges **every** `.json` it
finds under an `ai_path`. There is no manifest to exclude one.

It is safe, and the reason is worth stating precisely. **The recursive scan is
rooted at `<ai_path>/<data-dir>`, not at `<ai_path>`.** Per the Queller-AI repo's
`docs/ai-engine.md` §3 ("The load pipeline"), `AIBrain` reads five directories:
`<ai_path>/unit_maps`, `<ai_path>/platoon_templates`, `<ai_path>/fabber_builds`,
`<ai_path>/factory_builds` and `<ai_path>/platoon_builds`. It recurses below
each. So `/pa/ai/`'s five scan roots are `/pa/ai/unit_maps/` and the other four.
`player_guardians/` is a **sibling** of those five, never a child of one. Nothing
under it is reachable from `/pa/ai/`'s scan. `player_<token>` can never collide
with a data-directory name, so this holds for every path the module can emit.

The corollary is the rule to follow when you add data. Content that is _meant_
to merge goes **inside** a data directory, and a personality tag gates it.
Examples are the base game's `pa_ex1/ai/platoon_builds/tutorial/` and this
repo's `pa/ai_penchant/factory_builds/penchants/`. Such content never gets an
`ai_path` of its own. A tree that wants its own build orders gets its own root
instead. If you get that backwards, one AI silently inherits another's build
orders, with no load error to show for it.

The other half of the same rule is that a nested root is only safe because it is
self-contained. For exactly this reason, `referee_ai.js` copies the whole source
tree to a scoped destination, `ai_config.json` included. That file has no
fallback (§3, "What does not inherit"), so a tree that omitted it would run with
no unit cap.

## What `shared/ai.js` adds

`aiInUse(alignment, race)` reads the origin system's `gwaio` blob. That blob
holds the settings that `gw_start/setup.js` attaches to the galaxy at war
creation. The brain is per race and per side (`shared/brain_table.js`). The
function reads the race's `gwaio.aiByRace` row: `ally` for
`alignment === "subcommander"`, and `enemy` otherwise. It falls back to the
war-wide `gwaio.aiAlly`/`gwaio.ai` strings in three cases:

- for MLA,
- for a race with no row, and
- for every war saved before the table existed.

This per-race resolution is what makes mixed-brain fights possible, for example
a Queller Legion enemy against a Penchant MLA foe in one battle. With no `gwaio`
blob at all, the function returns `"Titans"`. A war created before GWO, or by
another mod, has no blob. If the brain has no build orders for the given `race`,
the function also returns `"Titans"` (`races.brainFor`). Titans is the only
brain that knows every race.

`getAIPathSource(type)` supplies `smartSubcommanders` from the tech cards held.
`getAIPathDestination(type, options)` supplies the settings the pure module needs
from live game state:

- `guardians` from `ai.mirrorMode`,
- `aiMods` from the inventory,
- `smartSubcommanders` from the tech cards held, and
- a `scopeToken` of `"guardians"` when the enemy is in mirror mode.

Callers can override any of it, because `options` is `_.assign`ed last.

`getSubcommanderPathForViewer(inventory, playerTag)` hardcodes `guardians: false`.
This is asymmetric with the wrapper above, and it is intentional. The function
has no guardians parameter and cannot react to the real fight's state. The
per-viewer `player_.playerN/` scope already gives each viewer the isolation that
would otherwise be needed.

`gw_play/per_player_tech.js`'s `getViewerSubcommanderAiPath` follows the same
rule. For the same reason, it also never routes a Cluster-faction viewer to the
`"cluster"` type. This differs from `referee_config.js`'s
`setupAlliedCommanders` and `referee_game_files.js`'s `buildPlayerFiles`, which
do check the host's `playerFaction` tag. The Cluster destination exists only to
stop a Cluster player's AI-mod writes from leaking into the shared brain-based
tree. Other allies and enemies read from that tree. A per-player-tech viewer
already has that isolation from their own scope, whatever their faction. So a
second mechanism would be redundant.

`isCluster(ai)` returns false for Guardians unconditionally, because the game
guarantees the Guardians are never Cluster. It then requires faction 4 _and_ an
MLA race. The race check is `races.isMla(ai.race)`, so a record with no race, or
a race no longer registered, reads as MLA. It handles `ai.faction` as either a
bare number or an array. The array is the pre-v5.44.0 save format.

## Invariants

Two invariants hold across the whole subsystem. Code that has no way to check
them relies on them:

- **The player and the enemy are never simultaneously Cluster.** The mod author
  confirmed this. `referee_config_setup.js` uses this to justify returning the
  same unscoped `/pa/ai_cluster/` path, regardless of which side asked.
- **The Guardians are never Cluster.** `referee_ai.js`'s `processClusterJson`
  states this. It is the reason `isCluster` can return early on mirror mode.

A third invariant is not an external assumption but a property of the paths
themselves. So, unlike those two, it _is_ machine-checkable, and a test checks
it:

- **No `ai_path` root ever lands inside another `ai_path`'s five scanned
  directories.** See [above](#why-scoped-trees-can-nest-safely) for why that is
  the rule that matters, rather than "nothing nests".
  `test/ai_path_invariants.test.js` sweeps it over the full option matrix, and
  over the file paths `referee_ai.js` really writes.

## Where to look next

- [`ai-pipeline.md`](ai-pipeline.md): what is written to these paths.
- [`coop.md`](coop.md): where per-viewer scoping comes from.
- `test/ai_path_invariants.test.js`, `test/referee_ai_paths.test.js`,
  `test/ai_path_filepath_safety.test.js`: the tests that pin the behaviour
  above.
