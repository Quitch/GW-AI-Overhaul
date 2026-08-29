# Races

A **race** is a unit faction: MLA, or one a server mod adds - Legion, Bugs,
Exiles. It is orthogonal to the Galactic War **faction** (Legonis Machina,
Foundation, …): any faction can field any race, and so can the player.

Races exist only when [GW Server Mods](https://github.com/Quitch/GW-Server-Mods)
is active alongside a race's server mod. Without both, nothing here injects any
UI or writes any field, and a war is what it always was.

## The registry

`shared/races.js` is the pure half: no engine globals, so it loads under the
Node harness. `shared/races_shipped.js` lists the descriptors GWO ships
(`race/<id>.js`), and `races.js` registers them as it loads, so any module that
depends on it sees them at once - the war panel reads them before any scene
script's `requireGW` callback has run. A third-party mod pushes its own onto
`model.gwoRaces` before GWO's scene scripts run, and `shared/race_mods.js`
registers those. MLA is always registered, as id `mla`, and an id nothing
registered reads as MLA - that is what keeps a war saved before races existed
behaving as it did.

A descriptor:

```js
{
  id: "legion",
  name: "!LOC:Legion",
  serverMods: ["com.pa.legion-expansion-server", "…-dev"], // any one active
  unitTypeBit: "Custom1",
  commanderTypes: { unitType: "UNITTYPE_Custom1", buildable: "CmdBuild & Custom1" },
  commanders: [{ spec: "/pa/units/commanders/l_raptor/l_raptor.json" }, …],
  playerIcon: { fill: "coui://…/icon_player_fill_l.png", outline: "…" },
  ai: {
    titans: { unitMaps: [paths], sources: [{ dir, match }] },
    queller: { unitMaps: [relative], exclude: [fragments] },
  },
  units: { shank: "/pa/units/land/l_tank_shank/l_tank_shank.json", … }, // race key -> race path
  mla: { shank: "ant", omniSilo: ["metalStorage", "energyStorage"], … }, // race key -> units.js key(s)
  unitNames: { shank: "!LOC:Shank", … }, // race key -> display name
}
```

`units` is the race's own table in the shape of `shared/units.js`: every spec
the race ships, under a key of the race's own naming, so a card written for
that race alone can address them. `mla` binds a race key to the published
`units.js` key(s) it stands in for; a race key with no binding is a unit MLA
has no counterpart of, and a `units.js` key no binding names is one the race
lacks. The vanilla-to-race path map the translation runs on is compiled from
the two.

## The inventory stays MLA

Every card, `gw_start/ai_tech.js`, `shared/ai_inventory.js` and
`gw_play/card_units.js` name vanilla units, and none of them changes. A race
player's inventory holds vanilla paths; the translation happens once, at battle
launch, in the referee:

| Rule                                                        | Result                   |
| ----------------------------------------------------------- | ------------------------ |
| A vanilla path the race maps (`units`)                      | the race's path          |
| A vanilla path the race does not map                        | dropped, warned once     |
| Anything `units.js` does not name (a race commander, a mod) | passed through untouched |

`races.translatePaths` does that to the player's unit list, and
`races.translateMods` to the spec mods, dropping a mod whose file is dropped.
The same happens to an AI's stat tech (`ai.inventory`) and to the Guardians'
borrowed player mods. An empty `units` table therefore fields a commander and
nothing else - a race descriptor is only complete once its table is.

Two kinds of card are withheld from a race player's deals by
`cards_deal_helpers.raceCanDeal`: every `_upgrade_` card, because those are
tuned to the MLA unit they name and a race gets upgrade cards of its own; and
any other card the race can own nothing of, judged from the same
`card_units.js` entry the tooltip uses through `races.cardUsable`. A card with
no entry - every loadout - passes.

## Race trees

An AI's build orders come from its `ai_path`. A race AI never reads the brain's
MLA build lists: it gets a **synthesised tree** at the brain's root with
`_race_<id>` inserted - `/pa/ai/` → `/pa/ai_race_legion/`,
`/pa/ai_queller/q_uber/` → `/pa/ai_queller_race_legion/q_uber/` - under the
same scope rules as every other destination (`player_guardians/`,
`player_.player0/`). `referee_ai.js`'s `raceTreeJobs` writes one tree per
distinct (source, destination):

- **Titans**: the files the descriptor's `sources` match (Legion's flat
  `legion_*`, Bugs' `bugs/` sub-directories), plus the brain's `ai_config.json`,
  which has no fallback, plus the brain's own `unit_maps/ai_unit_map*.json`.
- **A brain that carries the race** (Queller carries Legion): the tier minus
  the descriptor's `exclude` fragments - the MLA side.

The engine lists `unit_maps/` and loads each file it finds with the army's tag
appended. The race's map is therefore never copied as a file: it is merged over
the brain's map (`referee_game_file_paths.mergeUnitMaps`, race keys winning) and
written as the army's tagged `ai_unit_map[_x1].json.<tag>`, and the brain's
untagged map is copied so the engine has a name to derive the tagged one from.
Measured live: with only the tagged file present the engine looked for
`ai_unit_map.json.ai0.ai0` and found nothing.

No AI mod (`addAIMods`) is applied to a race tree in this pass: the descriptors
name MLA build entries, which a race tree does not have.

## Brains

| Brain    | Races                                                         |
| -------- | ------------------------------------------------------------- |
| Titans   | every race, from the race mod's own `/pa/ai/` files           |
| Queller  | MLA and Legion - both ship in every tier, stock copy included |
| Penchant | MLA                                                           |

`races.brainFor(brain, race)` is the one seam: the war's brain when it supports
the race, Titans otherwise. `gw_start` never offers a brain that cannot run a
race in play - the picker disables it and falls back to Titans - so the
fallback only fires for a save or a cheat that got past the picker.

## Commanders

A race army fields one of the race's commanders, drawn at war creation
(`setup.js`'s `giveRace`). Two keep a vanilla one and are **retagged** instead:
the boss keeps its Pumpkin and the Guardians keep the Unicorn.
`races.commanderRetagMods` swaps `UNITTYPE_Custom58` for the race's bit and
replaces `buildable_types` with the race's, which is exactly the shape every
real race commander has. `commanderModsFor` decides: nothing for one of the
race's own, the retag for anything else, so a player who somehow fields a
vanilla commander as a race gets the same treatment.

Sub Commanders follow the player's race: `gwc_minion` and the General
Commander's two draw a race commander, and `referee_config_setup.js` gives an
ally the player's race unless the war gave it one of its own.

## Cluster

Cluster is MLA-only in this pass: the picker locks the race to MLA while
Cluster is the faction, and `setup.js` never assigns a race to faction 4. That
is enforced in those two places only - the path, translation and tree code know
nothing of it - so a race that later ships its own Angels and Colonels needs
descriptor data, not a different design.

## Assignment and persistence

`gw_start/race_picker.js` offers the races GW Server Mods lists as active. The
player picks one; the enemy pool is the chosen "Enemy Races" plus MLA, or every
installed race when none is chosen. `races.assign` draws one race per faction
from the `teams` stream: independently by default, and under **Unique Races**
without replacement until the pool is spent, then refilled.

The war records `global:playerRace` on the inventory, `race` on every AI, and
`originSystem.gwaio.races = { player, byFaction, unique, mods }`. `mods` is the
identifier and version of each race server mod in play; `gw_play/races.js`
compares it with what GW Server Mods lists on resume and shows a warning on the
war panel when one is missing or has changed, since the war would otherwise lose
units silently.

Co-op viewers share the host's race in this pass. The referee reads a race off
each inventory (`races.raceOf` understands the live `getTag` and the serialised
`tags` shape), so a per-viewer race later is a record and a picker, not a
rewrite.

## Legion Expansion

`race/legion.js`. Server mod `com.pa.legion-expansion-server` (its `-dev` build
counts), unit-type bit `Custom1`, commanders Overwatch, Cyclops, Cataphract,
Raptor, Quad and Tank, player icon from the client mod's own
`icon_player_{fill,outline}_l.png`. Under Titans its build orders are the flat
`legion_*` files beside the stock ones plus `unit_maps/legion.json`; under
Queller every tier already carries a `legion/` side, so the tree is the tier
minus `mla/` and `unit_maps/mla.json`.

The table keys 375 Legion specs and binds 254 of them to 269 of GWO's 337
unit keys. Whole units are matched by role (Ant → Shank, Dox → Peacekeeper,
Bumblebee → Dauntless, …) and each unit's ammo, weapon and build-arm keys follow
from its tool slots; a Legion unit with no MLA role (Nova, Comet, Rampart,
Arsonist, Hive, Investigator, Sea Urchin) is keyed but unbound. Units Legion has no
counterpart for stay unmapped - Lob, Skitter, Spinner, Manhattan, Ward, Kraken,
Kessler, Icarus, Solar Array, Mend, Radar Jamming Station, Orbital and Deepspace
Radar, and the Cluster-only Angel - so a Legion player never owns them, and the
fifteen cards that touch only those are withheld (`test/race_legion.test.js`
pins the list). Where Legion reuses a vanilla tool (the Iron Dome's anti-nuke
weapon), the table maps the key to that vanilla file, which is a no-op.

## Where to look next

- [`ai-paths.md`](ai-paths.md) - the race roots beside the five trees.
- [`galaxy.md`](galaxy.md) - where the race is drawn during war generation.
- [`coop.md`](coop.md) - viewers under per-player tech.
- `test/races.test.js` - the rules above, pinned.
