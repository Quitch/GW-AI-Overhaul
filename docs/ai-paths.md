# AI path resolution

Every AI in a Galactic War battle reads its build orders from a directory. This
page is about how GWO decides which directory, for each AI, in each battle.

Two modules do the work:

- **`ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js`** — pure
  string arithmetic. No engine globals, no `model`, no dependencies. This is the
  module the tests drive directly.
- **`ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js`** — the engine-coupled
  wrapper. It reads `model.game()` to work out what to pass to the pure module.

Keeping the split means the interesting logic is testable under Node while the
parts that need a running game stay thin.

## The five trees

| Path                   | Shipped here? | What it is                                                                                                                                         |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/pa/ai/`              | Partly        | The base game's stock Titans AI build data. This repo ships only the handful of files GWO shadows; the rest is base-game-owned and absent from CI. |
| `/pa/ai_penchant/`     | In full       | GWO's own personality-driven build trees. `shared/ai.js`'s `penchants()` maps a personality to build-file tags drawn from here.                    |
| `/pa/ai_queller/`      | No            | The base game's Queller AI data.                                                                                                                   |
| `/pa/ai_tech/`         | Partly        | Both a source and a destination. Ships the build files that `load` descriptors name (8 today); `referee_ai.js` also writes generated output here.  |
| `/pa/ai_subcommander/` | No            | Runtime-synthesised only. No on-disk existence anywhere.                                                                                           |
| `/pa/ai_cluster/`      | No            | Runtime-synthesised only. Same.                                                                                                                    |

**The `/pa/ai_queller/` path is a trap.** On disk in the game install those files
live under `pa_ex1/ai_queller/`, because Queller is TITANS content and TITANS is
stored as an overlay. But the overlay is _addressed_ through `/pa/…` at runtime.
The base game asks for `/pa/ai_queller/q_uber`, so GWO does too. Use `pa_ex1/`
only to find the file on disk; never write it into code.

## Source versus destination

These are resolved by two different functions with deliberately different rules,
and conflating them is the most likely way to break this subsystem.

**`getAIPathSource(type, aiInUse)`** — where build orders are _read from_:

```text
Penchant -> /pa/ai_penchant/
Queller  -> getQuellerPath(type, false)
otherwise-> /pa/ai/
```

Note the hardcoded `false`. The source tree **never** varies by
`smartSubcommanders`, so a subcommander's source is always `q_bronze/` even when
the destination its build orders get copied _to_ is `q_silver/`. The source is
also never scoped — no `player_…/` suffix is ever appended.

**`getAIPathDestination(type, aiInUse, options)`** — where the modified result is
_written to_. First match wins:

```text
type === "cluster"                              -> /pa/ai_cluster/
aiInUse === "Queller"                           -> getQuellerPath(type, smartSubcommanders)
type === "subcommander" && !guardians && aiMods -> /pa/ai_subcommander/
aiInUse === "Penchant"                          -> /pa/ai_penchant/
otherwise                                       -> /pa/ai/
```

…then `appendScope(basePath, scopeToken)` adds `player_<token>/` if a token was
supplied.

Two things worth pinning down. `type === "cluster"` wins over everything,
including `aiInUse` — a Cluster commander always reads from `/pa/ai_cluster/`
regardless of which AI brain the war is using. And the subcommander branch
requires a _non-empty_ `aiMods`: with no AI-modifying cards held there is nothing
to write, so the subcommander falls through and shares the enemy's path.

## Queller skill tiers

`getQuellerPath(type, smartSubcommanders)`:

| `type`                                    | Result                            |
| ----------------------------------------- | --------------------------------- |
| `"all"`                                   | `/pa/ai_queller/` (the bare root) |
| `"enemy"`                                 | `/pa/ai_queller/q_uber/`          |
| `"subcommander"` with Smart Subcommanders | `/pa/ai_queller/q_silver/`        |
| anything else                             | `/pa/ai_queller/q_bronze/`        |

Queller therefore structurally never hits the "enemy and subcommander share a
path" case that Titans and Penchant can — enemy is always `q_uber/`, subcommander
is always `q_bronze/` or `q_silver/`.

The tree ships six tiers (`q_bronze`, `q_casual`, `q_silver`, `q_gold`,
`q_platinum`, `q_uber`). There is no iron or diamond tier, despite those existing
as difficulty names elsewhere, and GWO only ever selects three of the six.

## Scope tokens, and a sanitisation asymmetry

Scoping is how two AIs that would otherwise share a destination get separate
trees — a Guardians enemy, or each co-op viewer's own subcommanders.

`getScopeToken(identity, fallbackToken)` accepts either a string or an object. For
an object it takes the first present of `playerTag`, `specTag`, `client_name`,
`playerName`, `name`, `id`, `client_id`, `role`. It then runs `sanitizeToken`,
which strips leading dots, replaces anything outside `[A-Za-z0-9_-]` with `_`, and
trims leading/trailing underscores. If nothing survives, the token is `"player"`.

**`appendScope` does not sanitise.** It concatenates whatever it is given:

```js
return basePath + "player_" + scopeToken + "/";
```

So whether a path is sanitised depends entirely on how the caller obtained its
token, and the two live call sites differ:

- `referee_ai.js` computes `viewerScopeToken` via `getScopeToken(".player0", …)`,
  which sanitises to `player0`. The Cluster path for that viewer is therefore
  `/pa/ai_cluster/player_player0/`.
- `shared/ai.js`'s `getSubcommanderPathForViewer` passes the **raw** player tag
  through as `scopeToken`, so the same viewer's subcommander destination is
  `/pa/ai_subcommander/player_.player0/` — with the dot.

Both are internally consistent (the same code generates and consumes them), so
this is not a live bug, but it is a real inconsistency and the tests pin it
deliberately. `getPlayerScopedUnitMapPath` sanitises; `getAIPathDestination` does
not. A refactor that "fixes" the asymmetry silently changes shipped mount paths.

`getPlayerScopedUnitMapPath(basePath, identity, fallbackToken, titans)` appends
`unit_maps/ai_unit_map.json`, or `ai_unit_map_x1.json` when `titans` is set —
the `_x1` suffix being the base game's own convention for TITANS content.

## What `shared/ai.js` adds

`aiInUse(alignment)` reads the origin system's `gwaio` blob — the settings
piggy-backed onto the galaxy at war creation by `gw_start/setup.js`. For
`alignment === "subcommander"` it prefers `gwaio.aiAlly` when set, which is what
makes mixed-brain fights possible (a Queller enemy against a Penchant ally). With
no `gwaio` blob at all — a war created before GWO, or by another mod — it returns
`"Titans"`.

`getAIPathDestination(type, options)` fills in the settings the pure module needs
from live game state: `guardians` from `ai.mirrorMode`, `aiMods` from the
inventory, `smartSubcommanders` from the tech cards held, and a `scopeToken` of
`"guardians"` when the enemy is in mirror mode. Callers can override any of it —
`options` is `_.assign`ed last.

`getSubcommanderPathForViewer(inventory, playerTag)` hardcodes `guardians: false`.
This is asymmetric with the wrapper above and is intentional: the function has no
guardians parameter and cannot react to the real fight's state. The per-viewer
`player_.playerN/` scope already gives each viewer the isolation that would
otherwise be needed.

`isCluster(ai)` returns false for Guardians unconditionally — the game guarantees
the Guardians are never Cluster — then checks faction 4. It handles `ai.faction`
being either a bare number or an array, the latter being the pre-v5.44.0 save
format.

## Invariants

Two hold across the whole subsystem and are relied on by code that has no way to
check them:

- **The player and the enemy are never simultaneously Cluster.** Confirmed with
  the mod author. `referee_config_setup.js` uses this to justify returning the
  same unscoped `/pa/ai_cluster/` path regardless of which side asked.
- **The Guardians are never Cluster.** Stated at `referee_ai.js`'s
  `processClusterJson`, and the reason `isCluster` can early-return on mirror mode.

## Where to look next

- [`ai-pipeline.md`](ai-pipeline.md) — what gets written to these paths.
- [`coop.md`](coop.md) — where per-viewer scoping comes from.
- `test/ai_path_invariants.test.js`, `test/referee_ai_paths.test.js`,
  `test/ai_path_filepath_safety.test.js` — the behaviour above, pinned.
