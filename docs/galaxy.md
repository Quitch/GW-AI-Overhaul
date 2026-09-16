# Galaxy, factions and difficulty

War creation happens in `gw_start/setup.js`. It generates the galaxy, places AIs,
assigns personalities and minions, and stamps GWO's settings onto the save.

## Generation order

GWO deliberately replaces `model.makeGame` with an empty function. As a result, a
change to a setting does not regenerate the galaxy. Generation instead happens once,
when the player clicks **Go To War**.

Roughly, the order is:

1. Build the galaxy (stars, connections, distances).
2. Filter each team's minion pool for Queller compatibility, **before** anything is
   sampled from it. As a result, a Queller-incompatible minion can never be spread
   onto the galaxy as a worker AI.
3. Place the boss system, then non-boss AI systems, FFA foes, allied commanders.
4. Build each AI's personality from its template's id and the war's tier, draw
   its buffs, and add its minions.
5. Stamp war settings onto `originSystem.gwaio` for the `gw_play` scene to read.

Step 5 is a piggy-back channel rather than a real API. The origin system is simply
the one object guaranteed to survive into the play scene.

## The isolated-star bug

The base game's `GalaxyBuilder.buildGraph()` builds a Delaunay triangulation of the
stars, then discards every convex-hull edge. A hull star that belongs to exactly one
triangle has **only** hull edges. The strip therefore leaves it with zero connections.

The consequences are silent, not loud:

- It gets no entry in `self.gates()`, so `pathBetween` can never reach it.
- `Graph.calcDistance()` is a BFS over surviving connections, so it never visits the
  star. Its distance stays at `gw_star`'s `ko.observable(0)` default and its system
  generates at minimum size.
- **When the isolated star is the origin, the whole war is unplayable.** The origin
  is always a hull star, because the code chooses it as an extreme point (min of
  `x - y`). It is therefore drawn from exactly the population at risk.

`shared/gw_galaxy_connect.js` repairs this. An isolated star's incident Delaunay
edges are precisely the hull edges the strip removed. Restoring them reconnects the
star to both hull neighbours. Two isolated stars can share a hull edge, so the repair
restores each edge only once.

This can push a neighbouring star one connection above `config.maxConnections`.
GWO knowingly accepts that trade: an over-connected star beats an unreachable one.

`getConnections()` is **sparse**: a star that never appeared in any edge has no
entry at all rather than an empty one. Both cases mean "no gates", which is why the
check is `!links || links.length === 0`.

## Determinism and the war seed

The same seed rebuilds the same galaxy and the same enemies, given the same player
faction, difficulty, game options and mod set. The player enters the seed in the lobby
(`#game-seed`, which stock hides and `gw_start/ui.js` un-hides). GWO records the seed
on the save as `originSystem.gwaio.seed` and shows it in the `gw_play` panel.

**Out of the seed's reach**, deliberately or unavoidably:

- **Planet names**: `api.game.getRandomPlanetName()` is an engine call with no seed.
- **Unlocked loadouts**, which decide what the treasure planet can offer each player.
- **The Shared Systems / My Systems pool**, which lives in IndexedDB per machine.
- **The mod set**, and **the player faction**, which is an input rather than an output.

`gwo_system_templates.generate()` keeps stock's unseeded fallback. The module is a
drop-in for `template-loader.js`, and a non-GWO caller may reach it without a seed.
It `console.warn`s when it does. If it silently used `Math.random()` there, it would
produce a war that looks reproducible and is not.

### Why a bespoke PRNG

`shared/gwo_rng.js` implements cyrb128 + sfc32 rather than using `Math.seedrandom`.
The game ships `Math.seedrandom` but Node does not, so a seedrandom-based module could
not be unit-tested.

Reseeding `Math.random` is **not** a shortcut. At load, lodash 3.9.3 captures
`nativeRandom = Math.random`, so `_.sample`/`_.shuffle`/`_.random` keep drawing
from the original whatever is assigned afterwards. GWO had to replace every draw on
the generation path by hand. That is why the code threads the rng as an explicit
argument.

### Streams, not a single sequence

`rng.stream(label, index)` derives a child from the **seed text**, not from a counter.
A stream's output therefore does not depend on how much was drawn from its parent or
its siblings first. Two consequences are worth relying on:

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
| ↳ `races`                                                             | one race per faction (`races.assign`)                                                             |
| `race.<faction>` → `worker.<n>`                                       | that AI's race commander; the boss stream draws none                                              |
| `breeder`                                                             | which star each faction spawns on, and the spawn order                                            |
| `boss.<team>`                                                         | the seed handed to `gwoTeams.makeBoss`                                                            |
| `workers`                                                             | `makeWorker`'s picks: ordered, see below                                                          |
| `ai.<team>` → `boss` / `worker.<n>` → `minion.<n>`, `foe.<n>`, `ally` | that AI's buffs, econ, game modes, minions, foes, ally, penchant                                  |
| `treasure`                                                            | the treasure planet's econ rate                                                                   |

The `factions` stream is the odd one out, because faction data is loaded, not
generated. Each `gw_faction_*.js` declares its random choices as a
`gwaioRandomSpec` and ships a fixed default alongside. `faction/faction_seed.js`
resolves the spec against the stream. `gw_start/setup.js` calls `reseed()` once
per war and **before anything reads `GWFactions`**. The order matters: `getTeam`
shallow-copies a team and snapshots `systemDescription` by value.

`workers` is a single ordered stream rather than a keyed one, because the breeder's
spread loop is synchronous. Every `$.when` in it wraps an already-resolved value, which
jQuery 2 fires inline. It also _must_ stay ordered: `makeWorker` mutates
`remainingMinions`, so which minions are left depends on the order in which workers
were made. If `spawn`, `spread` or `canSpread` became genuinely async, both properties
would break at once.

### Play-scene streams

War generation is only half of it. The `gw_play` scene deals what the player actually
sees during a war. That includes the tech cards offered at each star, the cards on
enemy stars, the General Commander's Sub Commanders, and the AI's landing behaviour.
That scene re-derives the root from the seed stamped on the save:
`gwoRng.create(originSystem.gwaio.seed)`.

Every parent key lives in `gw_play/gwo_streams.js`, so a reader can check this table
against one place. Two children are minted where they are drawn: `minion.<n>` in
`cards_deal_helpers.js`'s `buildGeneralCommanderMinions`, and the `landing_*` streams in
`referee_config_setup.js`.

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

The goal is a war that reproduces **only when it is played the same way**. That
means the same seed, visiting the same stars, in the same order, winning at the same
speed, taking the same cards. Randomness has to keep feeling random. A retried battle must still reshuffle,
and a star must not have one predetermined hand waiting however late you arrive.

That is what `turn.<n>` is for. It is `game.stats().turns()`, which only
`GWGame.move()` increments and which persists with the save. It is the one monotonic
per-turn value on the game model. `currentStar()` was the obvious alternative and is
wrong: `loseTurn()` rewinds it to `previousStar()`, so it repeats. `loseTurn()` does
not touch `turns`, so a retry of a lost battle needs another `move()` and therefore
lands on a fresh turn. The reshuffle is a consequence of the key, not an exception to
it.

The rest of the components are:

- **`general_commander.<player>`**: `gw_play/cards_start_subcdr.js` draws it. That
  script picks the General Commander loadout's Sub Commanders. The key is per player,
  so a co-op viewer's retinue is their own and survives a reconnect.
- **`reroll.<n>`**: `model.rerollTech` empties the star's card list and re-enters
  `model.explore`, so the per-card iteration index restarts at 0. Without the reroll
  count in the key, every reroll would return the same cards.
- **`deal.<index>`**: this is `game.recordHostTechCardDeal`'s counter, which is
  host-monotonic and saved. It separates co-op catch-up deals that share a star.
- **`treasure_loadout`**: this is the only play-scene key with neither `turn` nor
  `deal`, and that is deliberate. The offer is derived rather than stored. A catch-up
  deal that replays a star a viewer was absent for therefore has to reproduce exactly
  what that viewer would have seen. The host's own draw uses the literal player key
  `host`. See [`coop.md`](coop.md).
- **`<player>`**: this is `record.playerId`, the uberId, not `client_id`. A viewer who
  reconnects must get their own minions and offers back. Whitespace in any label is
  squashed to `_`, because `gwo_rng` joins a label and index with a space. Otherwise
  `stream("a b")` would collide with `stream("a", "b")`.
- **`<cardId>`**: a deal calls `deal()` on every card in the deck and keeps one result.
  A shared sequential rng would therefore couple every card's draws to every other
  card's draw count. With a key per card id, adding or removing a draw inside one card
  moves nothing else.

**Player inventory is deliberately not in any key.** It already reaches the deal through
each card's `chance` and through `doNotDealCard`. Keying on it as well would double-count,
and would make a hand depend on the order in which cards were acquired.

### What had to change

| Where                                                                    | Was                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GalaxyBuilder.buildGraph`                                               | `reduceConnections(max)` with no seed → `Math.seedrandom(undefined)` → autoseeded from `crypto`. Gate topology re-rolled every build, and with it every star's `distance()`. Hijacked on the prototype from `gw_start/galaxy_build.js`. See [`shadowing.md`](shadowing.md).                                                       |
| `template-loader.js`                                                     | System name and biome were `_.sample`. Worse, each planet's eight generator values were drawn from a shared stream _inside_ `$.when(biomeGet, nameGet).then(...)`, so a seeded stream was consumed in an unseeded order. Now keyed per planet, taken synchronously, in `shared/gwo_system_templates.js`, not a shadow. See below. |
| `gw_breeder.js`, `gw_teams.js`                                           | Spawn placement, team pick, and a `makeBoss` that generated its system with no seed at all. Copied into `gw_start/gwo_breeder.js` and `gw_start/gwo_teams.js` rather than shadowed. See below.                                                                                                                                    |
| `gw_faction_*.js`, `cluster_faction.js`, `cluster_planets.js`, `lore.js` | Sampled at `define()` time, so they re-rolled on every entry into `gw_start` rather than following the seed.                                                                                                                                                                                                                      |
| `shared/deal.js setupGwoDeck`                                            | Appended each card as `requireGW` resolved it, so the deck's array order was the loader's rather than `model.gwoCards`'. A deal walks the deck in array order subtracting each chance, so the same roll picked a different card run to run. Seeding the roll alone would have changed nothing.                                    |
| `gw_play/cards.js chooseCards`                                           | Built its own `Math.seedrandom` and no caller ever passed one, so every hand the player was offered and every card on an enemy star came from entropy.                                                                                                                                                                            |
| `gw_play/referee_config_setup.js`                                        | `setupAIArmy` shuffled the three landing policies with `_.shuffle` at every battle launch, so replaying the same battle from the same save gave the AI different landing behaviour.                                                                                                                                               |

### Copies, not shadows

Three base-game modules are **copied into GWO's namespace** rather than shadowed. The
call site chooses between the copy and the original:

| GWO module                       | Replaces                     | Why not a shadow                                                                                                                                 |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/gwo_system_templates.js` | `systems/template-loader.js` | Shared Systems for Galactic War replaces the same path, and a shadowed path can only have one owner                                              |
| `gw_start/gwo_teams.js`          | `pages/gw_start/gw_teams`    | The base game calls `getTeam` as `_.map(aiFactions, GWTeams.getTeam)`, so a shadow adding an `rng` parameter would receive the array index there |
| `gw_start/gwo_breeder.js`        | `pages/gw_start/gw_breeder`  | Nothing else needs GWO's version, and the base module stays available                                                                            |

Each copy stays line-for-line close to its original, with every change marked `GWO -`.
A diff against the base file after a PA patch therefore stays readable. That discipline
is not cosmetic. Restructuring `gwo_system_templates.js` while copying it once dropped
the `$.Deferred` wrapper around `getRandomPlanetName()`. `$.when` does not wait for an
engine promise (see [`constraints.md`](constraints.md)), so every war on the vanilla
path failed with "no usable star system".

Stock's own bugs are kept too, with one correction. `fromRandomList` reads as
filtering the pool by `isExplicit` and by the entries already drawn, but lodash 3's
`_.where` takes a source object, not a predicate, so stock's filter was inert. GWO's
copy uses `_.filter` there, marked `GWO -` like every other change, so a pool is drawn
without repeats and an explicit slot only draws explicit entries.

Nothing shipped can tell the difference. No stock or GWO system draws twice from one
pool, and the stock pool is entirely `isExplicit` with no slot that asks for it, so
the candidate list is the same either way and the same seed draws the same planet.
The correction is there for third-party templates that do either.
`test/gwo_system_templates.test.js` pins both behaviours.

### Shared Systems for Galactic War

That mod replaces `systems/template-loader.js` wholesale, so GWO's seeded loader lives at
`shared/gwo_system_templates.js` instead. Its `chooseFor()` returns the base module
whenever that module carries `loadOptions`, and GWO's seeded copy otherwise. That is the
same capability check `loadSystemBrackets` uses.

With that mod active, the systems are real `.pas` files chosen by
`gwoSystemBrackets.selectorFor`, which the `brackets` stream already seeds. The loader
is therefore only reached for boss systems built from a `systemTemplate`.

### Retries

`warGenerationFailure` used to re-roll the seed at random, which discarded what the
player typed. It now derives `<base>-<attempt>`, and `gwaio.seed` records whichever
link succeeded. The string the panel shows is therefore the string to re-enter to get
that war back on the first attempt.

## System scaling

Whether system size tracks distance from the start is a user-facing option,
`gwoDifficultySettings.systemScaling()`, which defaults to **on** (`gw_start/ui.js`):

```js
systemSize = systemScaling
  ? star.distance() + coopSystemPlayerBonus
  : Math.floor(rng.stream("size", index).int(0, 13) + coopSystemPlayerBonus);
```

If you turn it off, size is random: seeded, but not distance-based. Any statement that
planets grow with distance therefore describes the default only.

The `false` in `gw_start/ui.js`'s `gwoGameOptionsDraft` is not a second default. That
value is the options modal's draft, and `syncGwoGameOptionsDraft()` overwrites it from
the live settings every time the modal opens.

`systemSizeFor` is keyed by star index rather than drawing in sequence, because the two
passes over the stars visit them in different orders. The order is distance order under
Shared Systems, and array order otherwise. Without the key, one seed would give two
different galaxies depending on whether that mod is mounted.

`coopSystemPlayerBonus` is `coopPlayers - 1`, so a solo war contributes nothing and the
scale starts at 0. It reads like an off-by-one and is not one. The reasoning is at its
declaration in `gw_start/galaxy_build.js`.

### System brackets, under Shared Systems for Galactic War

With that mod mounted, the pool is real `.pas` systems and `systemSize` reaches
wondible's `template-loader.js`. That loader reads it as a **surface-area** window
(`players*0.5 < surface_area < players*4`). That window never looks at spawn points, so
a compact six-army map reads as early-game and a sprawling duel map reads as late-game.
At the origin the window is empty and every system is equally likely. System Scaling
had nothing real to scale, which is why GWO used to remove it from the DOM.

`shared/gw_system_brackets.js` replaces that. Each system resolves to an **army**
range, and systems that share a range become one bracket. The range is resolved in
this order:

1. The declared `players`.
2. A capacity scan of `landing_zones.rules`.
3. `numArmies`.

A system that yields none of them is dropped with a warning.

A system is also dropped, with a warning naming the biome, when any planet's
`generator.biome` is not one the Galactic War server can load. Map packs carry biomes
from server mods (`oasis` from _multiple Biomes for System Designers_, for one). GW
never gives its local server server mods. Community Mods' `api.net.startGame` wrapper
mounts them for a skirmish and skips that step for any `gw` mode. The server's
`sim_utils.js` `validatePlanet` then `file.load`s `/pa/terrain/<biome>.json` behind a
deferred that only settles on success. The battle therefore hangs at loading with no
error.

`shared/gwo_biomes.js` holds the stock list. `referee_config.js` re-checks at launch
and switches such a planet to `earth`, which is what repairs a war saved before this
screen existed.

A modded biome is kept when an enabled server mod provides it and something can carry
that mod to the server. `shared/gwo_biome_mods.js` catalogs each enabled server zip
mod once, at war creation. It reads GW Server Mods' manifest when that mod is loaded.
Otherwise it reads the Community Mods manager where the scene loads that manager. In
`gw_start`, which does not load the manager, it reads the manager's own IndexedDB
store.

A mod that ships **only JSON** under `pa/` is always a provider, because GWO can hand
text to the server itself. A mod carrying anything else there (`.papa` meshes,
textures) is a provider only with GW Server Mods active, which mounts every active
server mod for a GW battle. Without GW Server Mods such a system is dropped as before.
`selectorFor` stamps the providing mods onto the placed copy as `gwoBiomeMods`, so
battle launch reads that stamp instead of resolving again.

### Biome mods in a GW battle

Each stamped provider record carries `served`: `"cook"` when GWO carries the mod into
the battle itself, `"gwsm"` when GW Server Mods does. `gwo_biomes.js`'s `serviceFor`
decides that split in one place. Text is always cooked. Anything else is `"gwsm"` when
GW Server Mods is present, and no provider at all when it is not. A later change of
policy is therefore a one-line change. A stamp written before `served` existed reads
as `"cook"`.

The record's `mountPath` is built from the manifest's `rawIdentifier`, not its
lower-cased `identifier`. Community Mods mounts under the installed case, and `spec:/`
reads are path-sensitive.

Two channels carry a **cooked** mod into the battle, because the server needs it before
the clients do.

The server validates `config.system` **before** it mounts `config.files`
(`server-script/states/gw_lobby.js`, `set_config`). A biome cooked into the files
alone would therefore arrive too late. A skirmish instead calls `api.file.zip.mount`
on each server mod at `/server_mods/<id>/` before `localserver.startGame`. Per
`api/file.js`, zip mounts are memory files, and the local server it spawns inherits
them. `referee.js`'s `mountFiles` does the same for the stamped mods. It runs after
the `unmountAllMemoryFiles` there (which Community Mods turns into a client-mod
remount) and before `gw_play` navigates to `connect_to_game`.

Clients get the same files through `config.files`. `gwoGenerateBiomes` mounts the
stamped mods and reads every `pa/**/*.json` they ship through `spec:`, the only scheme
that resolves a `/server_mods/` mount client-side. It adds the text to `self.files()`,
which the host mounts and the `gw_config` payload hands to every joiner. That is why
only text-only mods can be cooked: a `.papa` has no way through either channel.

A cooked mod that cannot be mounted or fully read at launch is dropped from both
channels. `referee_config.js` then treats its biomes as unservable and switches those
planets to `earth`. The mod is not a dependency of the war. Once its zip cannot be
read, the planet falls to `earth` and nothing more happens. (Disabling alone does not
do that. The stamp mounts the zip by path, so a disabled mod whose zip is still in
`download/` keeps serving, verified 2026-09-04.)

A **GW Server Mods-served** mod goes through neither channel. GW Server Mods mounts
every active server mod at `/server_mods/<id>/` before the local server spawns. It
wraps `model.fight` so the mount precedes the referee, and its connect gate excludes a
co-op viewer lacking any client-relevant server mod. `gwoGenerateBiomes` therefore only
asks `gwo_biome_mods.js`'s `serve` which of the stamped mods GW Server Mods lists as
active. It catalogs the live manifest row (the stamp's `installedPath` is stale after
a reinstall) and adds their biomes to `biomeServed`. A stamped mod it no longer lists
falls to `earth` like an unreadable cooked one.

Such a mod **is** a dependency of the war. `gw_start/setup.js` records the ones
stamped on any placed star as
`originSystem.gwaio.biomeMods = [{ identifier, displayName, version }]`.

On resume, `gw_play/biomes.js` asks `shared/biome_check.js` what the stars are stamped
with. The stamps carry names and versions, and the recorded list substitutes for a
star whose system lost its stamp. `gw_play/biomes.js` compares that with `installedBiomeMods`
and blocks the war through the same gate `gw_play/races.js` built for races. That gate
is the dialog, a "Missing Map Packs" list on the war panel, and `model.fight` refusing.
The same rules apply. Without GW Server Mods there is a single mod-neutral line, an
unreadable mod list decides nothing, and a version change only warns. A war saved
before the record existed has neither stamp nor list, so nothing blocks.

A war saved before the stamp existed has none. A system there with a modded biome
resolves providers at launch instead (`stampedMods` in `referee.js`). It writes the
result onto the star's system, and the save then carries it. That is still one
resolution per system, just deferred. Only a biome that no enabled text-only mod
provides falls to `earth`. Such a system is re-checked each launch, so installing the
mod later is enough.

Verified live (PA 124673, 2026-08-25): a "Rolling Hills 2v2 NS" battle on tetctree's
`mountain` biome reached `live_game` in 18 seconds. The server log showed
`Mounted zip file /download/uk.pa.tetctree.server.zip as /server_mods/uk.pa.tetctree.server/`,
and the client reported the planet as `mountain`. With that zip removed, the same star
logged the two warnings above, launched on `earth`, and loaded in the same time. A
co-op viewer with no biome mod installed at all (`gwo_viewer`: GWO and no_gw_video
only) joined that battle. It reported `arePlanetsReady` true and the planet as
`mountain`, and could fetch `coui://pa/terrain/mountain.json`, the cooked copy from
`gw_config`. `api.file.zip.catalog` returns `[{name, crc32, size}]`.

The quantity is armies, not humans. Map makers use `players` to count humans, and
humans share an army, so a declared `[2,10]` on two landing zones is two armies of
five. The zone count caps the declared maximum, and the minimum follows it down rather
than inverting. Without that cap, two structurally identical maps land eight brackets
apart purely because one carries a `players` key.

Two rules make the brackets cover the galaxy. The lowest-minimum, smallest-range bracket
has its minimum set to **0**, because `star.distance()` starts at 0 and no derived range
starts below 2. A distance above every bracket **clamps** to the highest. That is the
same membership-plus-clamp shape the stock template-loader uses.

Selection is **ordered consumption**, not a draw. The pool is ordered by maximum armies
(shuffled within equal maxima, from the seeded `rng`, once). Stars are served in
distance order, and each takes the first unused system that still fits. Nearer stars
therefore claim the smaller systems, and no system repeats until every eligible one is
placed. A pool smaller than the galaxy exhausts and starts reusing rather than leaving
a star empty.

`bracketsFrom` **sorts the pool by name** before grouping, and that sort is load-bearing
for determinism rather than cosmetic. Shared Systems assembles the pool as its sources
resolve. It pushes remote servers and map packs in completion order, so the order
differs between scene loads. This was observed directly, with one source moving from
third to twelfth. The shuffle keys above are assigned in pool order. Without the sort,
the same seed would therefore place different systems whenever more than one source
was selected.

This path bypasses wondible's `withoutBrokenSystems`, so its name and `_.matches`
blocklists no longer apply, and the screen above replaces its stock-biome whitelist.
The `starting_planet` backfill is reproduced on the returned copy. The pool is never
mutated, because My Systems is a live IndexedDB row.

## Factions

Five factions ship. Four are base-game personalities that GWO overhauls. Cluster is
new and TITANS-only.

| Index | Faction         |
| ----- | --------------- |
| 0     | Legonis Machina |
| 1     | Foundation      |
| 2     | Synchronous     |
| 3     | Revenants       |
| 4     | Cluster         |

Faction index 0 is falsy, and that has caused at least one real bug: a minion's colour
was handed out instead of index 0. Code that tests for a faction must therefore use
`_.isUndefined` rather than truthiness.

`faction/personalities.js` holds the personality data per faction, plus a `Generic`
block. The `Generic` entries (`uber`, `fabber`, `defender`, …) are faction-agnostic,
and every faction's `characterTypes` reuses them.

### Cluster

Cluster's Sub Commanders are Angels and Colonels, which are actual commander units
rather than the usual minions. `faction/cluster_setup.js` gives them the commander
build list and tags them `UNITTYPE_NoBuild` to exclude them from every other build
list.

These consequences surface elsewhere:

- Cards must exclude `NoBuild` when writing fabber `buildable_types`, or Cluster
  gets a buildable Sub Commander. See [`tech-cards.md`](tech-cards.md).
- An MLA Cluster gets additional commanders in place of minions, and in place of
  armies. A Cluster of any other race gets regular minions. See
  [`races.md`](races.md).
- Commander stat cards are worth less to Cluster, because its subcommanders do not
  inherit `base_commander`.
- An MLA Cluster resolves its AI build orders through `/pa/ai_cluster/`, which
  wins over every other path rule. See [`ai-paths.md`](ai-paths.md).

`cluster_setup.js` also carries deliberate oddities that are worth not "fixing":

- `UNITTYPE_Land` on an air unit (without it the AI misbehaves).
- A cost of 25000 (because repair/reclaim).
- Health matched to a Commander's.

### Races

A faction's race is the unit faction it fields. It is drawn per faction from the
`teams` stream's `races` child once the factions are shuffled, and stamped onto
every AI that faction spawns (`ai.race`). Each non-boss AI takes one of the
race's commanders from `warRng.stream("race", faction)`. The boss keeps its
Pumpkin and the Guardians keep the Unicorn, retagged at launch.

Cluster draws a race like any other faction, and takes a Unique Races slot. Under
Unique Races the first pass through the pool is seeded with the player's race
removed. The player's race is `global:playerRace` on the inventory, and the whole
choice is recorded as `originSystem.gwaio.races`. See [`races.md`](races.md).

## Difficulty

`gw_start/difficulty_levels.js` is a `difficulties` array of tiers (Beginner,
Casual, Iron, Bronze, Silver, Gold, Platinum, Diamond, Uber), plus a minimal
`Custom` sentinel.

**Custom carries only `difficultyName` and `customDifficulty`.** It has none of the
econ fields the others do, which is a live trap. A `_.find` for it succeeds, so a
naive `difficultySettings.econBase + difficultySettings.econRatePerDist` yields
`NaN`, and every battle of a Custom war gets `NaN` econ rates. `shared/ai.js`'s
`getAIEconFloor` checks that the fields are numbers, not merely that the tier was
found.

For the same reason `validate:schemas` checks **type consistency** rather than
required fields. The tiers legitimately do not share one key set, so any field that
appears with more than one `typeof` is almost certainly a typo.

Custom also has no difficulty _rating_, so it is excluded from victory-badge
recording. Including it produced an index of -2, which no badge matches.

**What the save records.** `originSystem.gwaio.difficulty` is the tier's
`difficultyName` only. Every battle resolves the tier by that name through
`shared/ai.js`'s `warTier()`, so a retune of a tier reaches wars in progress.

A Custom war has no tier to resolve, so generation also records
`gwaio.customDifficulty`. That snapshot holds the `tierSettings` values keyed by
their `difficulty_levels.js` key names, in a named tier's shape. Numbers are
numbers, the three booleans are the `"true"`/`"false"` strings the tiers hold, and
`personality_tags` is an array. `warTier()` prefers that snapshot when present. A Custom war saved before snapshots existed resolves no tier. It keeps the
fallbacks each reader had before: an econ floor of 1, and the values baked into its
AI records.

Two per-AI numbers follow from the tier and are derived at launch rather than
recorded. They are a boss's commander count (`tier.bossCommanders` per player in
`gwaio.coopPlayerScalingCount`) and the bounty value. Both come through
`shared/ai.js`'s `commanderCount()` and `bountyValue()`. An AI saved before this
carries `bossCommanders` and `bountyModeValue`, which those read when the war
resolves no tier. `galaxy.difficultyIndex` is no longer written. Stock's
`GWGalaxy.prototype.load` never restored it, so nothing ever read it back.

## AI personalities and penchants

`shared/ai.js`'s `penchants()` samples one personality flavour and returns the
build-file tags that drive `/pa/ai_penchant/`. The flavours are Artillery, Fortress,
All-terrain, Assault, Boomer, Heavy, Infernodier, Raider, Sniper, Nuker, Tactical,
Platoon, Minelayer, plus a "Vanilla" no-change entry.

The Vanilla entry's `tags` is `[]` rather than `""` because the caller concatenates
it onto `personality_tags`. An empty string concats as one empty-string tag rather
than as nothing.

Personality display names support the _Show AI Personality Names_ mod, a dependency
that lives entirely outside this repo.

**Every template carries a `personalityId`.** `faction/faction_builder.js`'s
`fromBaseline()` finds the declaration's `personality` reference in
`personalities.js` by identity. It records that key on the merged minion or boss.
The Cluster faction builds through the same helper. `faction_seed.js` copies the id
along with the personality it draws for a Random commander.

Every AI record is a deep clone of a template, so the id reaches the save for free.
Those records are workers, minions, foes, an `ai.ally`, the Guardians, and a dealt
Sub Commander. `shared/ai_personality.js`'s `base(id, faction)` rebuilds the same
object from the id. `test/faction_personality_ids.test.js` pins that the two merges
agree for every shipped template.

**Generation never edits a template.** The base game's own `makeGame` still runs
once per `gw_start` load (it starts before any mod script exists). Its difficulty
ramp writes into the templates' shared `personality` objects, so the templates are
dirty by the time GWO generates.

`setAIPersonality` therefore assigns `ai.personality = gwoPersonality.resolve(ai, …)`,
a fresh object. That object is the template `personalityId` names, with the tier's
AI settings written over it (`applyTier()`). Its `personality_tags` are the tier's
tags followed by the brain's. The brain's tags are `Default` for TITANS, the
faction's arm plus `queller` for Queller, and the drawn penchant's tags plus
`Default` for Penchant. An `ai.ally` resolves as an ally: template tags plus its
penchant, no tier. Queller's FFA tags are appended per entity afterwards, as before.

The war records the id and the `penchantName`. The resolved object is written too,
for stock readers and as the fallback for an AI whose id no longer resolves. Only
`works_with_queller` is ever read from a template, and stock never writes it. A
template declares no `econ_rate`. Generation rolls one for every enemy. An ally or a dealt Sub Commander carries none
at all, since every reader gives them the Sub Commander rate. The clone paths still delete the field, because the base game's
ramp writes one onto the template minions it samples.

A dealt Sub Commander records its penchant as `penchantName` alone
(`gw_play/cards_deal_helpers.js`, `gwc_minion.js`), as an enemy does. Its
`character` stays the template's, and the war panel, the minion card and the
referee's display name show the penchant after it. A Sub Commander dealt before
this carries the penchant's name inside `character` and its tags in its stored
personality. The resolver keeps those as they are.

**Launch resolves the same way.** `gw_play/referee_config_setup.js` builds every
army's personality through the same `resolve()` from the record. The inputs are the id, the tier by name, the brain the army's race runs, and its
penchant. For a Queller army whose star has foes, the FFA tags are an input too. A change to `personalities.js`, a tier or a
brain's tags therefore reaches a war in progress on its next battle. The resolved
object is what the army holds. The war's own record is never edited.

An AI saved without an id (or whose id no longer ships) keeps its stored personality
as the base and still takes the live tier's settings. Its stored tags are kept as
they are, FFA tags included. An ally resolves against the player's faction, since a
Sub Commander record carries none.

## AI tech

This is distinct from the player's tech cards, and from `/pa/ai_tech/`. It is the
AI's own stat tech, drawn at war creation and applied as **unit-spec mods** when the
battle is launched. The war records only the draw: `typeOfBuffs`, the buff indices,
on every boss, worker and foe. `gw_start/ai_tech.js`'s `loadoutFor()` builds the
descriptors from the live tables at launch (`referee_game_file_paths.js`'s
`armyInventory()`), so a rebalance reaches wars in progress.

A war saved before this carries the built descriptors as `ai.inventory` and no
`typeOfBuffs` on its foes. `armyInventory()` uses those as they are, and
`gw_play/bugfixes.js`'s Cluster commander repair only ever touches such a baked
inventory. The Guardians take the faction tech of the worker they replaced but never
the Cluster commander mods. They field the Unicorn, which those mods do not name.

Two modules are involved:

- `gw_start/ai_tech.js` returns `factionTechs[faction][tech]`: arrays of
  `addMods`-shaped descriptors, the same shape [`specs.md`](specs.md) documents.
- `shared/ai_inventory.js` holds the per-faction unit, ammo and weapon groupings
  those descriptors multiply over, so each faction's tech hits only what that
  faction fields.

`setup.js`'s `aiBuffType` names the tech indices: cost 0, damage 1, health 2,
speed 3, build 4, combat 6, cooldown 7. **Index 5 is deliberately absent**: that
tech was removed, and the gap is preserved rather than closed so existing saves
keep meaning what they meant. A contributor who renumbered it to tidy the sequence
would silently repoint every war already carrying a 6 or a 7.

There is one ordering constraint. Combat (6) is built by concatenating ammunition (1)
and armour (2), so `setupAITech6CombatTech()` must run after both. The call sequence
at the foot of the file is load-bearing for that reason alone.

How much tech an AI gets is `Math.floor(distance / 2 - buffDistanceDelay)`. It
therefore scales with distance from the origin and goes negative near it, and
`rng.sample` clamps that to none. The draw comes from the `ai.<team>` streams above,
which is what keeps a seed's enemies reproducible.

## Third-party mods that interact here

- **Bigger Galactic War** adds galaxy sizes 5–8. The distance-threshold tables in
  `shared/cards.js` have nine entries to cover them.
- **Shared Systems for Galactic War**: a real-system pool has no simpler template set
  for Easy Systems to swap to, so `galaxy_build.js` asks for the lowest bracket
  instead, after System Scaling and Large Planets have had their say. GWO also changes
  how it watches `model.ready()` so the mod's lobby is not broken. System Scaling and
  Large Planets both stay, served by the brackets above. Map-pack systems
  whose biome comes from a server mod are kept only when that mod ships JSON alone.
  Otherwise they are excluded, because the GW server never mounts server mods.
- **New-GW-Cards** is the template that third-party card mods are written from, rather
  than a mod itself. It is the reason the `model.gwo*` globals are additive and the
  `shared/cards.js` helper names are fixed. See [`tech-cards.md`](tech-cards.md),
  "Third-party card mods".

## Where to look next

- [`tech-cards.md`](tech-cards.md): loadouts and the Cluster buildable-types rule.
- [`ai-paths.md`](ai-paths.md): how a faction's AI directory is chosen.
