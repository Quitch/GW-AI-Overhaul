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
| `/pa/ai_subcommander/` | No            | Runtime-synthesised only. No on-disk existence anywhere.                                                                                           |
| `/pa/ai_cluster/`      | No            | Runtime-synthesised only. Same.                                                                                                                    |

`/pa/ai_tech/` is deliberately **not** in that table. It is never handed to an AI
as an `ai_path`: it is a file source the pipeline pulls extra build files out of
when a card's AI mod carries a `load`, and a place `referee_ai.js` writes
generated output. See [`ai-pipeline.md`](ai-pipeline.md), "The op table".

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

## Why scoped trees can nest safely

Scoping nests one `ai_path` inside another. A Guardians fight on the Titans brain
gives the enemy `/pa/ai/player_guardians/` while the subcommander keeps plain
`/pa/ai/`. That looks alarming, because the engine merges **every** `.json` it
finds under an `ai_path` and there is no manifest to exclude one.

It is safe, and the reason is worth stating precisely: **the recursive scan is
rooted at `<ai_path>/<data-dir>`, not at `<ai_path>`.** Per the Queller-AI repo's
`docs/ai-engine.md` §3 ("The load pipeline"), `AIBrain`
reads `<ai_path>/unit_maps`, `<ai_path>/platoon_templates`,
`<ai_path>/fabber_builds`, `<ai_path>/factory_builds` and
`<ai_path>/platoon_builds`, and recurses below each. So `/pa/ai/`'s five scan roots
are `/pa/ai/unit_maps/` and friends — and `player_guardians/` is a **sibling** of
those five, never a child of one. Nothing under it is reachable from `/pa/ai/`'s
scan. Since `player_<token>` can never collide with a data-directory name, this
holds for every path the module can emit.

The corollary is the rule to follow when adding data: content that is _meant_ to
merge goes **inside** a data directory and is gated by a personality tag — the base
game's `pa_ex1/ai/platoon_builds/tutorial/`, this repo's
`pa/ai_penchant/factory_builds/penchants/` — and never gets an `ai_path` of its
own. A tree that wants its own build orders gets its own root instead. Get that
backwards and one AI silently inherits another's build orders, with no load error
to show for it.

The other half of the same rule: a nested root is only safe because it is
self-contained. `referee_ai.js` copies the whole source tree to a scoped
destination, `ai_config.json` included, for exactly this reason — that file has no
fallback (§3, "What does not inherit"), so a tree that omitted it would run with no
unit cap.

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

`gw_play/per_player_tech.js`'s `getViewerSubcommanderAiPath` follows the same
rule, and for the same reason also never routes a Cluster-faction viewer to the
`"cluster"` type — unlike `referee_config.js`'s `setupAlliedCommanders` and
`referee_game_files.js`'s `buildPlayerFiles`, which do check the host's
`playerFaction` tag. The Cluster destination exists only to stop a Cluster
player's AI-mod writes leaking into the shared brain-based tree that other allies
and enemies read from. A per-player-tech viewer already has that isolation from
their own scope, whatever their faction, so a second mechanism would be redundant.

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

A third is not an external assumption but a property of the paths themselves, so
unlike those two it _is_ machine-checkable and is checked:

- **No `ai_path` root ever lands inside another `ai_path`'s five scanned
  directories.** See [above](#why-scoped-trees-can-nest-safely) for why that is the
  rule that matters rather than "nothing nests". Swept over the full option matrix,
  and over the file paths `referee_ai.js` really writes, by
  `test/ai_path_invariants.test.js`.

## Where to look next

- [`ai-pipeline.md`](ai-pipeline.md) — what gets written to these paths.
- [`coop.md`](coop.md) — where per-viewer scoping comes from.
- `test/ai_path_invariants.test.js`, `test/referee_ai_paths.test.js`,
  `test/ai_path_filepath_safety.test.js` — the behaviour above, pinned.
