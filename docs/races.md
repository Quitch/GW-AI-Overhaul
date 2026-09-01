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
  commanderArtHue: 0, // the paint the preview art ships in; MLA's is 210 (blue)
  playerIcon: { fill: "coui://…/icon_player_fill_l.png", outline: "…" },
  ai: {
    titans: { unitMaps: [paths], sources: [{ dir, match }] },
    queller: { unitMaps: [relative], exclude: [fragments] },
  },
  units: { shank: "/pa/units/land/l_tank_shank/l_tank_shank.json", … }, // race key -> race path
  unitNames: { shank: "!LOC:Shank", … }, // race key -> display name
}
```

`units` is the race's own table in the shape of `shared/units.js`: every spec
the race ships, under a key of the race's own naming, so a card written for
that race alone can address them. Nothing else about the race's units is
written by hand: what a race player fields follows from **capability cells**.

## Capability cells

Every card, `gw_start/ai_tech.js`, `shared/ai_inventory.js` and
`gw_play/card_units.js` name vanilla units, and none of them changes. A race
player's inventory holds vanilla paths; the conversion happens once, at battle
launch, in the referee, by a rule rather than a table.

`shared/unit_cells.js` (pure, measured) reads a unit's **cell** off its
effective `unit_types` - the `base_spec` chain resolved, a child's array
replacing its base's - as domain / tier / class:

| Part   | Values, first match wins                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| domain | `Air`, `Orbital`, `Bot`, `Vehicle` (`Tank` or `Vehicle`), `Land`, `Naval`; `Land` by default                                                                                                                                                                                                                                                                                                                           |
| tier   | `Advanced`, else `Basic`                                                                                                                                                                                                                                                                                                                                                                                               |
| class  | `Titan`, `Commander` (`Commander`, `SupportCommander`), `Fabber` (mobile builder without `Offense`), `Combat` (any other `Mobile`), then for structures `Superweapon` (`Nuke`, `ControlModule`, `PlanetEngine`), `Defense` (`Defense`, `Wall`, `SurfaceDefense`, `AirDefense`), `Factory`, `Metal`, `Energy`, `Storage` (`Economy` with neither), `Intel` (`Recon`, `Radar`, `RadarJammer`), `Teleporter`, `Structure` |

Faction bits (`Custom*`), build permissions (`CmdBuild`, `FabBuild`, …) and
flavour (`Important`, `NoBuild`, …) are stripped first. `Orbital` outranks
`Land` so the launcher stays orbital; `Land` outranks `Naval` so the vanilla
mine, tagged both, shares a cell with a race's land-only mine. `Metal` and
`Energy` are separate because a loadout that changes extractors must not reach
power plants. `test/unit_groups_cells.test.js` checks the classifier against
every domain/tier/class-named group in `shared/unit_groups.js`, over
`test/fixtures/unit_types.json` (harvested by `scripts/harvest-unit-types.js`),
with the deviations pinned - each one a balance choice of the group, such as
the Anchor sitting in `structuresDefencesBasic` while typed Advanced.

At launch `shared/race_cells.js` reads the merged unit list and every spec it
reaches (through `spec_cache`, so `genUnitSpecs` fetches nothing twice) and
builds two indexes, vanilla (`Custom58` or no faction bit) and the race
(`UNITTYPE_<bit>`). Then:

| Rule                                                                                                                                                                                 | Result                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| A held vanilla unit                                                                                                                                                                  | every race unit of its cell (`raceUnitsFor`)                                |
| A held path that is not a vanilla unit (race commander, a mod)                                                                                                                       | passed through untouched                                                    |
| A race unit in a cell no vanilla unit fills                                                                                                                                          | granted when something granted can build it (`build_types`)                 |
| A held vanilla `Commander`-class unit (the Colonel)                                                                                                                                  | kept and retagged to the race's bit (`races.unitRetagMods`)                 |
| A `Commander` cell                                                                                                                                                                   | never granted; race commanders arrive as commanders do                      |
| A spec mod on a vanilla unit                                                                                                                                                         | one on each race unit of its cell (`expandMods`)                            |
| A spec mod on a vanilla weapon, ammo, build arm or death ammo                                                                                                                        | one on each race part of the same role under race units of the part's cells |
| A mod on a file the army still holds (a retagged Pumpkin, `model.gwoSpecs`)                                                                                                          | kept as well                                                                |
| A mod that changes what a unit is (`unit_types`, `buildable_types`, `tools`, `command_caps`, `si_name`, …) or says `exact: true` - and every other mod on that unit in the same list | stays on its own unit, never travels by cell                                |
| A unit-map `spec_id` the race maps left pointing at a vanilla unit                                                                                                                   | the first race unit of its cell (`unitMapFallback`)                         |

The build rule is what carries Bugs' research: its research factories share
the factories' cells, and the unlock tokens they build sit in cells of their
own, so a token is granted once its factory is. `shared/build_types.js`
evaluates `buildable_types` for it, the ES5 twin of `scripts/lib/build-types.js`.

A group card names several vanilla files of one cell - `gwoGroup.botsAmmo` is
eight - and must land once on a race ammo, not eight times. `expandMods`
emits a race target set once per **pass**, and a pass ends when a vanilla
source already seen recurs: one card is one pass, two copies stack. A mod
whose `path` a race file lacks is the no-op it always was in `specs.mod`.

A single-unit grant opens its whole cell (`gwc_start_subcdr`'s Ant brings
every basic race tank) - accepted. What no cell can carry is a hand-picked
list: `cards_deal_helpers.MLA_ONLY` names the cards a race player is never
dealt or offered as a loadout - the Paratrooper and Nomad loadouts, the
Killswitch protocol and the Deepspace Radar card - and every `_upgrade_` card
but the commander's (`ubercannon`, `subcommander`), since those are tuned to
the MLA unit they name. A race gets its own. `shared/loadouts.js` and
`gw_play/treasure_loadouts.js` apply the same list to the loadouts a race
player is shown. Any other card is dealt when `races.cardUsable` finds a race
unit in a cell its `card_units.js` entry names; a card with no entry - every
loadout - passes, and so does everything until the race's cells are built,
which `gw_play/races.js` starts as the scene loads.

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
the brain's map (`referee_game_file_paths.mergeUnitMaps`, race keys winning),
a vanilla `spec_id` the race map left falls back to a race unit of its cell,
and the result is written as the army's tagged `ai_unit_map[_x1].json.<tag>`,
with the brain's untagged map copied so the engine has a name to derive the
tagged one from. Measured live: with only the tagged file present the engine
looked for `ai_unit_map.json.ai0.ai0` and found nothing.

No AI mod (`addAIMods`) is applied to a race tree in this pass: the descriptors
name MLA build entries, which a race tree does not have. An AI's stat tech
(`ai.inventory`) expands onto the race's files the way a player's mods do, and
so do the Guardians' borrowed player mods.

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
vanilla commander as a race gets the same treatment. Commander cells receive
mods like any other, so a card on the commander's weapon reaches the race's.

Sub Commanders follow the player's race: `gwc_minion` and the General
Commander's two draw a race commander, and `referee_config_setup.js` gives an
ally the player's race unless the war gave it one of its own.

## Cluster

Cluster is MLA-only in this pass: the picker locks the race to MLA while
Cluster is the faction, and `setup.js` never assigns a race to faction 4. That
is enforced in those two places only - the path, cell and tree code know
nothing of it - so a race that later ships its own Angels and Colonels needs
descriptor data, not a different design.

## Assignment and persistence

`gw_start/race_picker.js` offers the races GW Server Mods lists as active. The
player picks one; the enemy pool is every installed race plus MLA - to keep a
race out of a war, disable its mod. `races.assign` draws one race per faction
from the `teams` stream: independently by default, and under **Unique Races**
without replacement until the pool is spent, then refilled.

The picker opens on the race the last war was started with, and on MLA when that
race's server mod is no longer active. The race rides the `gwoDifficultySettings`
snapshot with every other start setting, but the restored value has to be read at
script scope, before `ko.applyBindings`: until `installedRaces` resolves the
select holds only its MLA placeholder, and Knockout rejects a model value no
option can show, writing the placeholder back over it.

The war records `global:playerRace` on the inventory, `race` on every AI, and
`originSystem.gwaio.races = { player, byFaction, unique, mods }`. `mods` is the
identifier and version of each race server mod installed when the war was made -
every installed race, not only the ones drawn, so it is not on its own the list
of what the war needs.

On resume `gw_play/races.js` asks `race_check.warRaces` what the war actually
fields - `player`, the values of `byFaction`, every star's `ai().race` and,
under Separate races, the race stamped on each co-op player's record - and
hands that to `race_check.evaluate` along with what `race_mods.installedRaces`
found. A race with no descriptor, or one whose server mod is not active, is
**blocked**: the war says so in a dialog, lists the missing races on the war
panel, and `model.fight` refuses, since the player would otherwise field vanilla
units under a commander spec that does not exist. A race mod that has only
changed version **warns** and nothing more - a point release must not lock a
player out of a war in progress. A recorded mod for a race the war does not
field is ignored.

`installedRaces` reports `known`, and while it is false nothing that depends on
the installed list is decided. False means GW Server Mods could list nothing at
all - Community Mods absent and its IndexedDB fallback empty - which is "cannot
tell", not "not installed". It also reports `gwsm`, and that being false is not
the same thing: GW Server Mods is what mounts every race's files, so without it
no race can be had whatever is installed. The war is blocked by a single
race-neutral reason - the same sentence once per race would only repeat itself,
and naming a race mod would send the player to look at a mod that is already on.
A missing descriptor is a client-side registry fact and blocks either way.

The gate is `model.fight` and `model.restartFight`, wrapped: knockout reads a
click binding's value accessor at click time, so the swap holds however late the
scene script runs. `model.gwCampaignFightBlocked` and
`model.gwCampaignFightTooltip` are swapped too, to grey the button and give it a
reason, but those are bound once, so that half is installed ahead of
`ko.applyBindings` (or immediately, if `model.gwCampaignPlayStarted` says the
scene is already bound).

In co-op the war also records `perPlayerRace`, the **Separate races** setting.
With it off every viewer's inventory is stamped with the host's race; with it on
each viewer picks their own at the loadout screen, from the races the war
recorded rather than the ones that client has installed. Either way the referee
reads the race off each inventory (`races.raceOf` understands the live `getTag`
and the serialised `tags` shape), so nothing downstream has to know which mode
it is in. See [`coop.md`](coop.md).

## Legion Expansion

`race/legion.js`. Server mod `com.pa.legion-expansion-server` (its `-dev` build
counts), unit-type bit `Custom1`, commanders Overwatch, Cyclops, Cataphract,
Raptor, Quad and Tank, player icon from the client mod's own
`icon_player_{fill,outline}_l.png`. Under Titans its build orders are the flat
`legion_*` files beside the stock ones plus `unit_maps/legion.json`; under
Queller every tier already carries a `legion/` side, so the tree is the tier
minus `mla/` and `unit_maps/mla.json`.

The table keys 375 Legion specs by their Legion names (Shank, Peacekeeper,
Dauntless, …) for cards written for Legion alone. Under the cells Legion fills
every cell GWO's cards open, so nothing beyond the MLA-only set is withheld
(`test/race_legion.test.js` pins that). Where its types disagree with vanilla's
the cells follow the types: the OmniSilo is typed Advanced, so it arrives with
advanced economy rather than with a storage card; the nuke's projectile is a
`Custom1` orbital "unit" and rides along with basic orbital; helper units
(`l_vision`, the bombs, the spawners) sit in cells no vanilla unit occupies and
are reached only through their parents, as vanilla's own spawned units are.

## Bug Faction

`race/bugs.js`. Server mod `com.pa.ferretmaster.bugs` (its companion
`commander-merge` supplies the commander's base spec), unit-type bit
`Custom2`, one commander (the Bug Alpha Commander, whose art ships in green
paint, hue 120), player icon from the client
mod's own `bug_icon_{fill,outline}.png`. Titans only: its
build orders are the `bugs/` sub-directories under each build directory plus
`unit_maps/bugs.json` and `platoon_templates/bugs.json`; Queller and Penchant
fall back to Titans for it.

Research is data: a research factory (`research_crusher`, typed like the
factory it stands beside) builds an unlock token (`bug_crusher_unlock`) that
GW Server Mods' `research.js` turns into an unlock in the battle. The
factories arrive with the vanilla factories' cells and the tokens through the
build rule above, so a Bugs player researches in Galactic War as in a
skirmish. The table keys 252 Bugs specs (`crusher`, `crusherResearch`,
`crusherUnlock`, ...). Nothing beyond the MLA-only set is withheld
(`test/race_bugs.test.js`). See [`race-conventions.md`](race-conventions.md)
for the checklist a race follows.

## Exiles

`race/exiles.js`. Server mod `com.pa.nik.exiles` (companions `commander-merge`
and `build-bar-tabs`), unit-type bit `Custom6`, four commanders (Maxim,
Taurus, Blueberry, Brainiac; art in blue paint, hue 200), player icon from the
server mod's own `ui/mods/com.pa.nik.exiles/img/exiles_icon_{fill,outline}.png`.
Titans only: `exiles/` sub-directories under each build directory plus
`unit_maps/exiles.json`. Exiles fields no orbital unit beyond its launcher, so
the cells the orbital cards open stay empty and those cards are withheld
(`test/race_exiles.test.js` pins the list). The table keys 287 Exiles specs.

The mod also ships `platoon_templates.json` and `platoon_land_builds.json` at
the **vanilla** paths: copies of the TITANS files with the raid and attack
platoons tightened to exclude scouts, radars and anti-nukes (the land-builds
copy differs from `pa_ex1`'s only in the condition strings that follow). GW
Server Mods mounts the zip at the root after the client mods, so while Exiles
is active every MLA Titans AI reads those copies. The one thing that costs is
GWO's own `platoon_templates.json` shadow - a Suicide squad on the two Transfer
templates - which is not seen. Accepted for this pass: the change is a
tightening, not a break. See [`race-conventions.md`](race-conventions.md).

## Where to look next

- [`ai-paths.md`](ai-paths.md) - the race roots beside the five trees.
- [`galaxy.md`](galaxy.md) - where the race is drawn during war generation.
- [`coop.md`](coop.md) - viewers under per-player tech.
- [`race-conventions.md`](race-conventions.md) - the checklist and the rules
  the race code relies on.
- `test/unit_cells.test.js`, `test/unit_groups_cells.test.js`,
  `test/races.test.js` - the rules above, pinned.
