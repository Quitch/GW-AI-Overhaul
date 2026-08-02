# Galaxy, factions and difficulty

War creation happens in `gw_start/setup.js` — at ~1,250 lines the largest file in
the mod. It generates the galaxy, places AIs, assigns personalities and minions,
and stamps GWO's settings onto the save.

## Generation order

`model.makeGame` is deliberately replaced with an empty function so that changing a
setting does not regenerate the galaxy. Generation instead happens once, when the
player clicks **Go To War**.

Roughly:

1. Build the galaxy (stars, connections, distances).
2. Filter each team's minion pool for Queller compatibility, **before** anything is
   sampled from it, so a Queller-incompatible minion can never be spread onto the
   galaxy as a worker AI.
3. Place the boss system, then non-boss AI systems, FFA foes, allied commanders.
4. Assign personalities, buffs and minions per AI.
5. Stamp war settings onto `originSystem.gwaio` for the `gw_play` scene to read.

Step 5 is a piggy-back channel rather than a real API — the origin system is simply
the one object guaranteed to survive into the play scene.

## The isolated-star bug

The base game's `GalaxyBuilder.buildGraph()` builds a Delaunay triangulation of the
stars, then discards every convex-hull edge. A hull star belonging to exactly one
triangle has **only** hull edges, so the strip leaves it with zero connections.

The consequences are silent, not loud:

- It gets no entry in `self.gates()`, so `pathBetween` can never reach it.
- `Graph.calcDistance()` — a BFS over surviving connections — never visits it, so
  its distance stays at `gw_star`'s `ko.observable(0)` default and its system
  generates at minimum size.
- **When the isolated star is the origin, the whole war is unplayable.** The origin
  is always a hull star, because it is chosen as an extreme point (min of `x - y`),
  so it is drawn from exactly the population at risk.

`shared/gw_galaxy_connect.js` repairs this. An isolated star's incident Delaunay
edges are precisely the hull edges the strip removed, so restoring them reconnects
it to both hull neighbours. Two isolated stars can share a hull edge, so each edge
is restored only once.

This can push a neighbouring star one connection above `config.maxConnections`,
which is a trade knowingly accepted — an over-connected star beats an unreachable
one.

`getConnections()` is **sparse**: a star that never appeared in any edge has no
entry at all rather than an empty one. Both cases mean "no gates", which is why the
check is `!links || links.length === 0`.

## System scaling

Whether system size tracks distance from the start is a user-facing option,
`gwoDifficultySettings.systemScaling()`:

```js
systemSize = systemScaling
  ? star.distance() + coopSystemPlayerBonus
  : Math.floor(_.random(13) + coopSystemPlayerBonus);
```

With scaling off — which is the default in one of the two places it is set, and is
forced off in another — size is **random**, not distance-based. Any statement that
planets grow with distance is only half true.

## Factions

Five factions ship. Four are base-game personalities that GWO overhauls; Cluster is
new and TITANS-only.

| Index | Faction         |
| ----- | --------------- |
| 0     | Legonis Machina |
| 1     | Foundation      |
| 2     | Synchronous     |
| 3     | Revenants       |
| 4     | Cluster         |

Faction index 0 being falsy has caused at least one real bug — a minion's colour
was handed out instead of index 0 — so code testing for a faction must use
`_.isUndefined` rather than truthiness.

`faction/personalities.js` holds the personality data per faction, plus a `Generic`
block whose entries (`uber`, `fabber`, `defender`, …) are faction-agnostic and
reused by every faction's `characterTypes`.

### Cluster

Cluster's Sub Commanders are Angels and Colonels — actual commander units rather
than the usual minions. `faction/cluster_setup.js` gives them the commander build
list and tags them `UNITTYPE_NoBuild` to keep them out of every other build list.

Consequences that surface elsewhere:

- Cards must exclude `NoBuild` when writing fabber `buildable_types`, or Cluster
  gets a buildable Sub Commander. See [`tech-cards.md`](tech-cards.md).
- Cluster gets additional commanders in place of minions, and in place of armies.
- Commander stat cards are worth less to Cluster, because its subcommanders do not
  inherit `base_commander`.
- Cluster resolves its AI build orders through `/pa/ai_cluster/`, which wins over
  every other path rule. See [`ai-paths.md`](ai-paths.md).

`cluster_setup.js` also carries deliberate oddities worth not "fixing":
`UNITTYPE_Land` on an air unit (without it the AI misbehaves), a cost of 25000
(because repair/reclaim), and health matched to a Commander's.

## Difficulty

`gw_start/difficulty_levels.js` is a `difficulties` array of nine tiers — Beginner,
Casual, Iron, Bronze, Silver, Gold, Platinum, Diamond, Uber — plus a minimal
`Custom` sentinel.

**Custom carries only `difficultyName` and `customDifficulty`.** It has none of the
econ fields the others do, which is a live trap: a `_.find` for it succeeds, so a
naive `difficultySettings.econBase + difficultySettings.econRatePerDist` yields
`NaN` and every battle of a Custom war gets `NaN` econ rates. `shared/ai.js`'s
`getAIEconFloor` checks the fields are numbers, not merely that the tier was found.

For the same reason `validate:schemas` checks **type consistency** rather than
required fields: the tiers legitimately do not share one key set, so any field
appearing with more than one `typeof` is almost certainly a typo.

Custom also has no difficulty _rating_, so it is excluded from victory-badge
recording — including it produced an index of -2, which no badge matches.

## AI personalities and penchants

`shared/ai.js`'s `penchants()` samples one of 14 personality flavours (Artillery,
Fortress, All-terrain, Assault, Boomer, Heavy, Infernodier, Raider, Sniper, Nuker,
Tactical, Platoon, Minelayer, plus a "Vanilla" no-change entry) and returns the
build-file tags that drive `/pa/ai_penchant/`.

The Vanilla entry's `tags` is `[]` rather than `""` because the caller concatenates
it onto `personality_tags` — and an empty string concats as one empty-string tag
rather than as nothing.

Personality display names support the _Show AI Personality Names_ mod, a dependency
that lives entirely outside this repo.

## Third-party mods that interact here

- **Bigger Galactic War** — adds galaxy sizes 5–8. The distance-threshold tables in
  `shared/cards.js` have nine entries to cover them.
- **Shared Systems for Galactic War** — GWO removes several of its own options when
  this is loaded, and changes how it watches `model.ready()` so the mod's lobby is
  not broken.

## Where to look next

- [`tech-cards.md`](tech-cards.md) — loadouts and the Cluster buildable-types rule.
- [`ai-paths.md`](ai-paths.md) — how a faction's AI directory is chosen.
