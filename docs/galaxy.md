# Galaxy, factions and difficulty

War creation happens in `gw_start/setup.js`. It generates the galaxy, places AIs,
assigns personalities and minions, and stamps GWO's settings onto the save.

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

## Determinism and the war seed

The same seed rebuilds the same galaxy and the same enemies, given the same player
faction, difficulty, game options and mod set. The seed is entered in the lobby
(`#game-seed`, which stock hides and `gw_start/ui.js` un-hides), recorded on the save as
`originSystem.gwaio.seed`, and shown in the `gw_play` panel.

**Out of the seed's reach**, deliberately or unavoidably:

- **Planet names** — `api.game.getRandomPlanetName()` is an engine call with no seed.
- **Unlocked loadouts**, which decide what the treasure planet can offer each player.
- **The Shared Systems / My Systems pool**, which lives in IndexedDB per machine.
- **The mod set**, and **the player faction**, which is an input rather than an output.

`gwo_system_templates.generate()` keeps stock's unseeded fallback, because the module
is a drop-in for `template-loader.js` and a non-GWO caller may reach it without a seed.
It `console.warn`s when it does: silently substituting `Math.random()` there produces a
war that looks reproducible and is not.

### Why a bespoke PRNG

`shared/gwo_rng.js` implements cyrb128 + sfc32 rather than using `Math.seedrandom`, which
the game ships but Node does not, so a seedrandom-based module could not be unit-tested.

Reseeding `Math.random` is **not** a shortcut: lodash 3.9.3 captures
`nativeRandom = Math.random` at load, so `_.sample`/`_.shuffle`/`_.random` keep drawing
from the original whatever is assigned afterwards. Every draw on the generation path had
to be replaced by hand, which is why the rng is threaded as an explicit argument.

### Streams, not a single sequence

`rng.stream(label, index)` derives a child from the **seed text**, not from a counter, so a
stream's output does not depend on how much was drawn from its parent or its siblings
first. Two consequences worth relying on:

- Adding a draw to one phase of generation cannot shift the results of another.
- Anything reached through a promise, or visited in a varying order, can be **keyed**
  instead of drawn in sequence.

| Stream                                                                | Consumers                                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `factions` → `faction.<i>`                                            | the Random commander, boss `systemDescription`, Cluster planet biomes (`faction/faction_seed.js`) |
| `lore`                                                                | `neutralSystems` / `aiSystems` shuffles                                                           |
| `galaxy`                                                              | passed to `galaxy.build()` as `config.gwoRng`                                                     |
| ↳ `jitter`                                                            | each star's third coordinate (map layout)                                                         |
| ↳ `brackets`                                                          | `gwoSystemBrackets.selectorFor`                                                                   |
| ↳ `size.<i>`, `star.<i>`                                              | that star's system size, and the seed handed to `generate()`                                      |
| ↳↳ `planet.<i>`                                                       | that planet's biome and generator values                                                          |
| `teams`                                                               | faction scaling, the AI faction shuffle, `gwoTeams.getTeam`                                       |
| `breeder`                                                             | which star each faction spawns on, and the spawn order                                            |
| `boss.<team>`                                                         | the seed handed to `gwoTeams.makeBoss`                                                            |
| `workers`                                                             | `makeWorker`'s picks — ordered, see below                                                         |
| `ai.<team>` → `boss` / `worker.<n>` → `minion.<n>`, `foe.<n>`, `ally` | that AI's buffs, econ, game modes, minions, foes, ally, penchant                                  |
| `treasure`                                                            | the treasure planet's econ rate                                                                   |

The `factions` stream is the odd one out, because faction data is loaded, not
generated. Each `gw_faction_*.js` declares its random choices as a
`gwaioRandomSpec` and ships a fixed default alongside; `faction/faction_seed.js`
resolves the spec against the stream. `gw_start/setup.js` calls `reseed()` once
per war and **before anything reads `GWFactions`** — `getTeam` shallow-copies a
team, snapshotting `systemDescription` by value.

`workers` is a single ordered stream rather than a keyed one, because the breeder's spread
loop is synchronous — every `$.when` in it wraps an already-resolved value, which jQuery 2
fires inline. It also _must_ stay ordered: `makeWorker` mutates `remainingMinions`, so
which minions are left depends on the order workers were made in. Making `spawn`, `spread`
or `canSpread` genuinely async would break both properties at once.

### Play-scene streams

War generation is only half of it. What the player actually sees during a war — the tech
cards offered at each star, the cards sitting on enemy stars, the General Commander's Sub
Commanders, the AI's landing behaviour — is dealt in the `gw_play` scene, which re-derives
the root from the seed stamped on the save: `gwoRng.create(originSystem.gwaio.seed)`.

Every key lives in `gw_play/gwo_streams.js`, so this table has one place to be checked
against.

| Stream                                            | Consumers                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| `general_commander.<player>` → `minion.<n>`       | the General Commander loadout's two Sub Commanders |
| `explore.<star>` → `turn.<n>` → `reroll.<n>`      | the host's own tech offer at that star             |
| `ai_star.<star>` → `turn.<n>`                     | the card shown on a selectable AI star that turn   |
| `coop_ai_star.<player>` → `star.<n>` → `turn.<n>` | that star's card for one co-op viewer              |
| `treasure_loadout.<player>` → `star.<n>`          | that player's treasure-planet loadout offer        |
| `coop_deal.<player>` → `deal.<index>`             | a co-op viewer's pending offer                     |
| ↳ `reroll.<n>`                                    | that viewer's rerolled offer                       |
| ↳ `iteration.<i>`                                 | the roll picking the i-th card of a hand           |
| ↳↳ `<cardId>`                                     | that card's own draws inside `deal()`              |
| `battle.<star>` → `turn.<n>` → `landing_*`        | each army's landing policy                         |

The goal is a war that reproduces **only when it is played the same way**: same seed,
visiting the same stars, in the same order, winning at the same speed, taking the same
cards. Randomness has to keep feeling random — retrying a battle must still reshuffle, and
a star must not have one predetermined hand waiting however late you arrive.

That is what `turn.<n>` is for. It is `game.stats().turns()`, incremented only by
`GWGame.move()` and persisted with the save — the one monotonic per-turn value on the game
model. `currentStar()` was the obvious alternative and is wrong: `loseTurn()` rewinds it to
`previousStar()`, so it repeats. Because `loseTurn()` does not touch `turns`, retrying a
lost battle needs another `move()` and therefore lands on a fresh turn — the reshuffle is a
consequence of the key, not an exception to it.

The rest of the components:

- **`general_commander.<player>`** — drawn by `gw_play/cards_start_subcdr.js`, which
  is where the General Commander loadout's Sub Commanders are picked. Keyed per
  player so a co-op viewer's retinue is their own and survives a reconnect.
- **`reroll.<n>`** — `model.rerollTech` empties the star's card list and re-enters
  `model.explore`, so the per-card iteration index restarts at 0. Without the reroll count
  in the key every reroll would hand back the same cards.
- **`deal.<index>`** — `game.recordHostTechCardDeal`'s counter, host-monotonic and saved,
  so it separates co-op catch-up deals that share a star.
- **`treasure_loadout`** — the only play-scene key with neither `turn` nor `deal`, and
  deliberately so. The offer is derived rather than stored, so a catch-up deal replaying a
  star a viewer was absent for has to reproduce exactly what they would have been shown.
  The host's own draw uses the literal player key `host`. See [`coop.md`](coop.md).
- **`<player>`** — `record.playerId`, the uberId, not `client_id`: a viewer who reconnects
  must get their own minions and offers back. Whitespace in any label is squashed to `_`,
  because `gwo_rng` joins a label and index with a space and `stream("a b")` would
  otherwise collide with `stream("a", "b")`.
- **`<cardId>`** — a deal calls `deal()` on every card in the deck and keeps one result, so
  a shared sequential rng would couple every card's draws to every other card's draw count.
  Keyed per card id, adding or removing a draw inside one card moves nothing else.

**Player inventory is deliberately not in any key.** It already reaches the deal through
each card's `chance` and through `doNotDealCard`. Keying on it as well would double-count,
and would make a hand depend on the order cards were acquired in.

### What had to change

| Where                                                                    | Was                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GalaxyBuilder.buildGraph`                                               | `reduceConnections(max)` with no seed → `Math.seedrandom(undefined)` → autoseeded from `crypto`. Gate topology re-rolled every build, and with it every star's `distance()`. Hijacked on the prototype from `gw_galaxy.js`; see [`shadowing.md`](shadowing.md).                                                                    |
| `template-loader.js`                                                     | System name and biome were `_.sample`. Worse, each planet's eight generator values were drawn from a shared stream _inside_ `$.when(biomeGet, nameGet).then(...)`, so a seeded stream was consumed in an unseeded order. Now keyed per planet, taken synchronously — in `shared/gwo_system_templates.js`, not a shadow; see below. |
| `gw_breeder.js`, `gw_teams.js`                                           | Spawn placement, team pick, and a `makeBoss` that generated its system with no seed at all. Copied into `gw_start/gwo_breeder.js` and `gw_start/gwo_teams.js` rather than shadowed; see below.                                                                                                                                     |
| `gw_faction_*.js`, `cluster_faction.js`, `cluster_planets.js`, `lore.js` | Sampled at `define()` time, so they re-rolled on every entry into `gw_start` rather than following the seed.                                                                                                                                                                                                                       |
| `shared/deal.js setupGwoDeck`                                            | Appended each card as `requireGW` resolved it, so the deck's array order was the loader's rather than `model.gwoCards`'. A deal walks the deck in array order subtracting each chance, so the same roll picked a different card run to run — seeding the roll alone would have changed nothing.                                    |
| `gw_play/cards.js chooseCards`                                           | Built its own `Math.seedrandom` and no caller ever passed one, so every hand the player was offered and every card on an enemy star came from entropy.                                                                                                                                                                             |
| `gw_play/referee_config_setup.js`                                        | `setupAIArmy` shuffled the three landing policies with `_.shuffle` at every battle launch, so replaying the same battle from the same save gave the AI different landing behaviour.                                                                                                                                                |

### Copies, not shadows

Three base-game modules are **copied into GWO's namespace** rather than shadowed, and
chosen between at the call site:

| GWO module                       | Replaces                     | Why not a shadow                                                                                                                                 |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/gwo_system_templates.js` | `systems/template-loader.js` | Shared Systems for Galactic War replaces the same path, and a shadowed path can only have one owner                                              |
| `gw_start/gwo_teams.js`          | `pages/gw_start/gw_teams`    | The base game calls `getTeam` as `_.map(aiFactions, GWTeams.getTeam)`, so a shadow adding an `rng` parameter would receive the array index there |
| `gw_start/gwo_breeder.js`        | `pages/gw_start/gw_breeder`  | Nothing else needs GWO's version, and the base module stays available                                                                            |

Each is kept line-for-line close to its original, with every change marked `GWO -`, so a
diff against the base file after a PA patch stays readable. That discipline is not
cosmetic: restructuring `gwo_system_templates.js` while copying it once dropped the
`$.Deferred` wrapper around `getRandomPlanetName()`, and because `$.when` does not wait
for an engine promise (see [`constraints.md`](constraints.md)) every war on the vanilla
path failed with "no usable star system".

### Shared Systems for Galactic War

That mod replaces `systems/template-loader.js` wholesale, so GWO's seeded loader lives at
`shared/gwo_system_templates.js` instead.
Its `chooseFor()` returns the base module whenever that module carries `loadOptions` —
the same capability check `loadSystemBrackets` uses — and GWO's seeded copy otherwise.

With that mod active the systems are real `.pas` files chosen by
`gwoSystemBrackets.selectorFor`, which the `brackets` stream already seeds, so the loader
is only reached for boss systems built from a `systemTemplate`.

### Retries

`warGenerationFailure` used to re-roll the seed at random, discarding what the player
typed. It now derives `<base>-<attempt>`, and `gwaio.seed` records whichever link
succeeded — so the string the panel shows is the string to re-enter to get that war back on
the first attempt.

## System scaling

Whether system size tracks distance from the start is a user-facing option,
`gwoDifficultySettings.systemScaling()`, which defaults to **on** (`gw_start/ui.js`):

```js
systemSize = systemScaling
  ? star.distance() + coopSystemPlayerBonus
  : Math.floor(rng.stream("size", index).int(0, 13) + coopSystemPlayerBonus);
```

Turn it off and size is random — seeded, but not distance-based — so any statement that
planets grow with distance describes the default only.

The `false` in `gw_start/ui.js`'s `gwoGameOptionsDraft` is not a second default: that is
the options modal's draft, and `syncGwoGameOptionsDraft()` overwrites it from the live
settings every time the modal opens.

`systemSizeFor` is keyed by star index rather than drawing in sequence because the two
passes over the stars visit them in different orders — distance order under Shared
Systems, array order otherwise. Without the key, one seed would give two different
galaxies depending on whether that mod is mounted.

`coopSystemPlayerBonus` is `coopPlayers - 1`, so a solo war contributes nothing and the
scale starts at 0. It reads like an off-by-one and is not one; the reasoning is at its
declaration in `gw_galaxy.js`.

### System brackets, under Shared Systems for Galactic War

With that mod mounted the pool is real `.pas` systems and `systemSize` reaches
wondible's `template-loader.js`, which reads it as a **surface-area** window
(`players*0.5 < surface_area < players*4`). That never looks at spawn points, so a
compact six-army map reads as early-game and a sprawling duel map reads as late-game;
at the origin the window is empty and every system is equally likely. System Scaling had
nothing real to scale, which is why it used to be removed from the DOM.

`shared/gw_system_brackets.js` replaces that. Each system resolves to an **army** range —
declared `players`, else a capacity scan of `landing_zones.rules`, else `numArmies`,
else dropped with a warning — and systems sharing a range become one bracket.

A system is also dropped, with a warning naming the biome, when any planet's
`generator.biome` is not one the Galactic War server can load. Map packs carry biomes
from server mods (`oasis` from _multiple Biomes for System Designers_, for one), and GW
never gives its local server server mods: Community Mods' `api.net.startGame` wrapper
mounts them for a skirmish and skips that step for any `gw` mode. The server's
`sim_utils.js` `validatePlanet` then `file.load`s `/pa/terrain/<biome>.json` behind a
deferred that only settles on success, so the battle hangs at loading with no error.
`shared/gwo_biomes.js` holds the stock list; `referee_config.js` re-checks at launch and
switches such a planet to `earth`, which is what repairs a war saved before this screen
existed.

A modded biome is kept when an enabled server mod that ships **only JSON** provides it.
`shared/gwo_biome_mods.js` catalogs each enabled server zip mod once, at war creation -
through the Community Mods manager where the scene loads it, and through the manager's
own IndexedDB store in `gw_start`, which does not - and a mod carrying anything else
under `pa/` (`.papa` meshes, textures) is not a provider, because only text can be
handed to the server. `selectorFor` stamps the providing mods onto the placed copy as
`gwoBiomeMods`, so battle launch reads that stamp instead of resolving again.

The quantity is armies, not humans. Map makers use `players` to count humans and humans
share an army, so a declared `[2,10]` on two landing zones is two armies of five; the
zone count caps the declared maximum, and the minimum follows it down rather than
inverting. Without that cap two structurally identical maps land eight brackets apart
purely because one carries a `players` key.

Two rules make the brackets cover the galaxy. The lowest-minimum, smallest-range bracket
has its minimum set to **0**, because `star.distance()` starts at 0 and no derived range
starts below 2. A distance above every bracket **clamps** to the highest — the same
membership-plus-clamp shape the stock template-loader uses.

Selection is **ordered consumption**, not a draw: the pool is ordered by maximum armies
(shuffled within equal maxima, from the seeded `rng`, once), stars are served in distance
order, and each takes the first unused system that still fits. Nearer stars therefore
claim the smaller systems, and no system repeats until every eligible one is placed. A
pool smaller than the galaxy exhausts and starts reusing rather than leaving a star
empty.

`bracketsFrom` **sorts the pool by name** before grouping, and that sort is load-bearing
for determinism rather than cosmetic. Shared Systems assembles the pool as its sources
resolve, pushing remote servers and map packs in completion order, so the order differs
between scene loads — observed directly, with one source moving from third to twelfth.
Because the shuffle keys above are assigned in pool order, without the sort the same seed
would place different systems whenever more than one source was selected.

This path bypasses wondible's `withoutBrokenSystems`, so its name and `_.matches`
blocklists no longer apply and its stock-biome whitelist is replaced by the screen above;
the `starting_planet` backfill is reproduced on the returned copy, and the pool is never
mutated because My Systems is a live IndexedDB row.

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

## AI tech

Distinct from the player's tech cards, and from `/pa/ai_tech/`: this is the AI's
own stat tech, drawn at war creation and applied as **unit-spec mods** on the
AI's inventory. Two modules:

- `gw_start/ai_tech.js` returns `factionTechs[faction][tech]` — arrays of
  `addMods`-shaped descriptors, the same shape [`specs.md`](specs.md) documents.
- `shared/ai_inventory.js` holds the per-faction unit, ammo and weapon groupings
  those descriptors multiply over, so each faction's tech hits only what that
  faction fields.

`setup.js`'s `aiBuffType` names the tech indices: cost 0, damage 1, health 2,
speed 3, build 4, combat 6, cooldown 7. **Index 5 is deliberately absent** — that
tech was removed, and the gap is preserved rather than closed so existing saves
keep meaning what they meant. A contributor renumbering it to tidy the sequence
would silently repoint every war already carrying a 6 or a 7.

One ordering constraint: combat (6) is built by concatenating ammunition (1) and
armour (2), so `setupAITech6CombatTech()` must run after both. The call sequence
at the foot of the file is load-bearing for that reason alone.

How much tech an AI gets is `Math.floor(distance / 2 - buffDistanceDelay)`, so it
scales with distance from the origin and goes negative near it — `rng.sample`
clamps that to none. The draw comes from the `ai.<team>` streams above, which is
what keeps a seed's enemies reproducible.

## Third-party mods that interact here

- **Bigger Galactic War** — adds galaxy sizes 5–8. The distance-threshold tables in
  `shared/cards.js` have nine entries to cover them.
- **Shared Systems for Galactic War** — GWO removes Easy Systems when this is loaded,
  and changes how it watches `model.ready()` so the mod's lobby is not broken. System
  Scaling and Large Planets both stay, served by the brackets above.
- **New-GW-Cards** — the template third-party card mods are written from, rather than
  a mod itself. It is the reason the `model.gwo*` globals are additive and the
  `shared/cards.js` helper names are fixed; see
  [`tech-cards.md`](tech-cards.md), "Third-party card mods".

## Where to look next

- [`tech-cards.md`](tech-cards.md) — loadouts and the Cluster buildable-types rule.
- [`ai-paths.md`](ai-paths.md) — how a faction's AI directory is chosen.
