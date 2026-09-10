# Races

A **race** is a unit faction. It is MLA, or a faction that a server mod adds:
Legion, Bugs or Exiles. A race is orthogonal to the Galactic War **faction**
(Legonis Machina, Foundation, …). Any faction can field any race, and so can
the player.

Races exist only when [GW Server Mods](https://github.com/Quitch/GW-Server-Mods)
is active alongside a race's server mod. Without both, nothing here injects any
UI or writes any field. A war is then what it always was.

## The registry

`shared/races.js` is the pure half. It uses no engine globals, so it loads
under the Node harness. `shared/races_shipped.js` lists the descriptors GWO
ships (`race/<id>.js`). `races.js` registers them as it loads, so any module
that depends on it sees them at once. The war panel reads them before any scene
script's `requireGW` callback runs.

A third-party mod pushes its own descriptors onto `model.gwoRaces` before GWO's
scene scripts run, and `shared/race_mods.js` registers those. The registry
always registers MLA, as id `mla`. An id nothing registered reads as MLA. That
rule keeps a war saved before races existed behaving as it did.

A descriptor:

```js
{
  id: "legion",
  name: "!LOC:Legion",
  serverMods: ["com.pa.legion-expansion-server"], // any one active
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

`units` is the race's own table in the shape of `shared/units.js`. It holds
every spec the race ships, under a key of the race's own naming. Those keys let
a card written for that race alone address the specs. Nobody writes anything
else about the race's units by hand. What a race player fields follows from
**capability cells**.

## Capability cells

Every card, `gw_start/ai_tech.js`, `shared/ai_inventory.js` and
`gw_play/card_units.js` name vanilla units. None of them changes. A race
player's inventory holds vanilla paths. The referee converts them once, at
battle launch, by a rule rather than a table.

`shared/unit_cells.js` (pure, measured) derives a unit's **cell** from its
effective `unit_types`. The effective `unit_types` is the resolved `base_spec`
chain, where a child's array replaces its base's. The cell is domain / tier /
class:

| Part   | Values, first match wins                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| domain | `Air`, `Orbital`, `Bot`, `Vehicle` (`Tank` or `Vehicle`), `Land`, `Naval`; `Land` by default                                                                                                                                                                                                                                                                                                                           |
| tier   | `Advanced`, else `Basic`                                                                                                                                                                                                                                                                                                                                                                                               |
| class  | `Titan`, `Commander` (`Commander`, `SupportCommander`), `Fabber` (mobile builder without `Offense`), `Combat` (any other `Mobile`), then for structures `Superweapon` (`Nuke`, `ControlModule`, `PlanetEngine`), `Defense` (`Defense`, `Wall`, `SurfaceDefense`, `AirDefense`), `Factory`, `Metal`, `Energy`, `Storage` (`Economy` with neither), `Intel` (`Recon`, `Radar`, `RadarJammer`), `Teleporter`, `Structure` |

The classifier first strips faction bits (`Custom*`), build permissions
(`CmdBuild`, `FabBuild`, …) and flavour (`Important`, `NoBuild`, …). `Orbital`
outranks `Land`, so the launcher stays orbital. `Land` outranks `Naval`, so the
vanilla mine, tagged both, shares a cell with a race's land-only mine. `Metal`
and `Energy` are separate because a loadout that changes extractors must not
reach power plants.

`test/unit_groups_cells.test.js` checks the classifier against every
domain/tier/class-named group in `shared/unit_groups.js`. It runs over
`test/fixtures/unit_types.json`, which `scripts/harvest-unit-types.js`
harvests. The test pins the deviations. Each deviation is a balance choice of
the group, such as the Anchor, which sits in `structuresDefencesBasic` while
typed Advanced.

At launch `shared/race_cells.js` reads the merged unit list and every spec it
reaches. It reads through `spec_cache`, so `genUnitSpecs` fetches nothing
twice. From those it builds two indexes: vanilla (`Custom58` or no faction bit)
and the race (`UNITTYPE_<bit>`). Then it applies these rules:

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

The build rule is what carries Bugs' research. Its research factories share the
factories' cells. The unlock tokens they build sit in cells of their own, so
the rule grants a token once it grants the token's factory.
`shared/build_types.js` evaluates `buildable_types` for it. It is the ES5 twin
of `scripts/lib/build-types.js`. Both implement the same grammar. The grammar
comes from the base game's own expressions. Both evaluate an expression against
a unit's tags with the `UNITTYPE_` prefix dropped:

```text
or   := and ("|" and)*
and  := atom (("&" | "-") atom)*     "-" is and-not
atom := IDENT | "(" or ")"
```

`|` binds loosest. `&` and `-` share the next level and associate left to
right, so `A & B - C | D` excludes C from the first alternative only. An
unknown token is absent from the tag set and so reads false. The engine treats
it the same way. An empty expression is false.

A group card names several vanilla files of one cell (`gwoGroup.botsAmmo`
names eight). It must land once on a race ammo, not eight times. `expandMods`
emits a race target set once per **pass**. A pass ends when a vanilla source
already seen recurs. One card is one pass, and two copies stack. A mod whose
`path` a race file lacks is the no-op it always was in `specs.mod`.

A single-unit grant opens its whole cell: `gwc_start_subcdr`'s Ant brings every
basic race tank. That is accepted. What no cell can carry is a hand-picked
list. `cards_deal_helpers.MLA_ONLY` names the cards the deal never gives a race
player, and each entry says why. `mlaOnlyCard` adds every `_upgrade_` card but
the commander's (`ubercannon`, `subcommander`), since those are tuned to the
MLA unit they name. A race gets its own.

The two loadout-picking scenes (`gw_start` and the co-op per-player loadout)
still show those loadouts, in their usual place. `shared/loadouts.js` marks
each one that `raceLocksLoadout` returns true for as `gwoRaceLocked`.
`shared/loadouts.css` dims a locked loadout, its click is inert, and each
scene's `ready` refuses it. When the race changes,
`shared/loadout_selection.js`'s `selectableIndex` moves a selection resting on
a locked card to the first usable one. `gw_play/treasure_loadouts.js` still
excludes them from a race player's treasure pool, because they would be an
unusable prize.

The deal gives any other card when `races.cardUsable` finds a race unit in a
cell its `card_units.js` entry names. A card with no entry passes, and every
loadout has no entry. Everything passes until the race's cells are built.
`gw_play/races.js` starts building them as the scene loads. Deals are
synchronous and gate on the cells, so the cells are built as soon as the
installed list is read. That is once GW Server Mods has the race zip mounted,
or once a unit list read returns with no race unit in it.

One unit list read serves every race. A read taken before the mount has no race
unit, and it is discarded. If each race took its own read, some reads would
land either side of the mount and prime only some races.

The two card tooltips (the hand hover and a star's "Which Units?") follow the
same rule. `gw_play/card_tooltips.js` lists the race units of each cell a
card's `card_units.js` entry names (`unit_cells.cardUnitsFor`). That lookup has
no build reach, so a factory card lists Bugs' research factories but not their
unlock tokens. A Commander-cell path is kept.

The tooltip names the units from the descriptor's `unitNames`, and otherwise
from `gw_play/unit_names.js`. It highlights whatever `raceUnitsFor` would not
field for the inventory's vanilla paths. The tooltip lists each name once
(Legion has two units each called Purger, Spoiler and Meteoroid). A name is
plain when any unit behind it is owned.

The inventory is the client's own: a viewer's record under per-player tech.
Until the cells land, the tooltip shows the MLA list. `gw_play/races.js` sets
`model.gwoRaceCellsPrimed` once priming completes, and the open star's and the
hovered card's tooltips are rebuilt.

## Race trees

An AI's build orders come from its `ai_path`. A race AI never reads the brain's
MLA build lists. It gets a **synthesised tree** at the brain's root with
`_race_<id>` inserted: `/pa/ai/` → `/pa/ai_race_legion/`, and
`/pa/ai_queller/q_uber/` → `/pa/ai_queller_race_legion/q_uber/`. The tree
follows the same scope rules as every other destination (`player_guardians/`,
`player_.player0/`). `referee_ai.js`'s `raceTreeJobs` writes one tree per
distinct (source, destination):

- **Titans**: the tree is the race's `sources` files (Legion's flat `legion_*`,
  Bugs' `bugs/` sub-directories) layered over the brain's base files. No race
  mod ships a complete AI, and the base files fill its gaps the way they do in
  a skirmish.

  The source listing is the merged filesystem, so a race file that shadows a
  base path already reads as the race's. The race's own **layer** is its
  `sources` plus every add-on's layer for it (`races.layersFor`, see
  "Add-ons"). The base layer drops three sets of files. It drops every
  **other** layer's `sources`, MLA's add-on files included, because they ride
  in the same merged listing. A file the race's own layer and another both
  claim (Second Wave's aux map) stays. It drops everything under `unit_maps/`
  but the brain's own `ai_unit_map*.json`. It drops `neural_networks/`. Files
  a race ships at vanilla paths are indistinguishable from base files.
  Examples are Exiles' `platoon_templates.json` and `platoon_land_builds.json`,
  and Bugs' `platoon_builds/platoon_misc_builds.json`. They enter every race
  tree's base layer with the merged content.

  `scripts/validate-race-trees.js` checks the tree against a manual mount-order
  merge of the real files on disk. `referee_ai.js`'s sweep writes an MLA tree
  to a scoped destination (`/pa/ai/player_guardians/`, a viewer's Sub
  Commanders). That tree is the base layer plus MLA's own add-on layer, by the
  same rule. It drops every file a race's layer claims and MLA's does not
  (`races.inAnyRaceLayer`), so an MLA army's `unit_maps/` never lists a
  race's map. An add-on's MLA map, and a map both MLA and a race claim, ride
  along untagged, as the live `/pa/ai/` listing has them.

- **A brain that carries the race** (Queller carries Legion): the tree is the
  tier minus the descriptor's `exclude` fragments, which are the MLA side.

The referee's "no race build orders" warning fires when the race mod itself
contributed nothing to the tree (`races.raceLayerFilter`). The base layer is
always present, so an empty tree can no longer show that.

The engine lists `unit_maps/` and loads each file it finds with the army's tag
appended. The referee therefore never copies the race's map as a file. It
merges the race's map over the brain's map
(`referee_game_file_paths.mergeUnitMaps`), and race keys win. A vanilla
`spec_id` the race map left resolves to a race unit of its cell. The referee
writes the result as the army's tagged `ai_unit_map[_x1].json.<tag>`. It also
copies the brain's untagged map, so the engine has a name to derive the tagged
one from. This was measured live: with only the tagged file present, the engine
looked for `ai_unit_map.json.ai0.ai0` and found nothing.

No AI mod (`addAIMods`) is applied to a race tree in this pass. The descriptors
name MLA build entries, which a race tree does not have. An AI's stat tech
(`ai.inventory`) expands onto the race's files the way a player's mods do, and
so do the Guardians' borrowed player mods.

## Brains

| Brain    | Races                                                         |
| -------- | ------------------------------------------------------------- |
| Titans   | every race, its `/pa/ai/` files layered over the base game's  |
| Queller  | MLA and Legion - both ship in every tier, stock copy included |
| Penchant | MLA                                                           |

The player picks the brain **per race and per side** in `gw_start`'s AI modal
(`ai_picker.js` + `shared/brain_table.js`). The modal has one row per
installed race, and an Opponent and an Ally cell per row. Each cell offers only
`brainsFor([race])`, minus Queller on classic content. The MLA row is the
war-wide `gwoDifficultySettings.ai`/`aiAlly` pair. The other rows live in
`gwoDifficultySettings.aiByRace`, and the war records them, coerced, as
`gwaio.aiByRace` beside the strings.

`shared/ai.js`'s `warBrain(alignment, race)` reads the race's row, and
otherwise uses the strings. So a war saved before the table behaves exactly as
it always did.

`races.brainFor(brain, race)` stays the safety net inside
`aiInUse`/`brain_table.resolve`. The modal only offers supported brains, so the
coercion fires only for a save or hand-edit that bypassed it. It also fires for
an old save whose war-wide brain never supported a race. There it reproduces
the pre-table fallback.

## Commanders

A race army fields one of the race's commanders, drawn at war creation
(`setup.js`'s `giveRace`). Two armies keep a vanilla one and are **retagged**
instead. The boss keeps its Pumpkin and the Guardians keep the Unicorn.
`races.commanderRetagMods` swaps `UNITTYPE_Custom58` for the race's bit and
replaces `buildable_types` with the race's. That is exactly the shape every
real race commander has.

`commanderModsFor` decides. It gives nothing for one of the race's own, and the
retag for anything else. So a player who somehow fields a vanilla commander as
a race gets the same treatment. Commander cells receive mods like any other, so
a card on the commander's weapon reaches the race's.

Sub Commanders follow the player's race. `gwc_minion` and the General
Commander's two draw a race commander. `referee_config_setup.js` gives an ally
the player's race unless the war gave it one of its own.

## Cluster

The AI Cluster faction draws a race like the other four. Cluster-ness is a
derived fact: `gwoAI.isCluster` is faction 4 _and_ an MLA race. Every
Cluster-only mechanic is gated on it, at war creation and at launch alike. An
MLA Cluster is the Cluster of old. It has commander stacks in place of minions,
the Angel and Colonel Sub Commanders, and build orders from `/pa/ai_cluster/`.

A Cluster of any other race is an ordinary faction. Its non-boss AIs field the
race's own commanders, it gets regular minions, and it reads the race tree.
Neither the Angel/Colonel conversion mods nor the tech aimed at those two units
reach its army (`ai_tech.loadoutFor` drops them). The boss keeps its Pumpkin
either way.

The player side is still MLA-only. The picker locks the race to MLA while
Cluster is the player's faction. A race id the registry does not know reads as
MLA. So a Cluster record of a race whose mod is gone defaults to MLA Cluster.
`race_check` blocks fighting such a war anyway.

## Assignment and persistence

`gw_start/race_picker.js` offers the races GW Server Mods lists as active. The
player picks one. The enemy pool is every installed race plus MLA. To exclude a
race from a war, disable its mod.

`races.assign` draws one race per faction from the `teams` stream. By default
each draw is independent. Under **Unique Races** it draws without replacement
until the pool is spent, then refills the pool. The host's race counts as the
first draw, so no enemy takes it until every other race is drawn. A refill is
the whole pool. A co-op viewer makes their Separate-races pick after the draw,
so it is not counted.

The picker opens on the race the player used to start the last war, and on MLA
when that race's server mod is no longer active. The race rides the
`gwoDifficultySettings` snapshot with every other start setting. The picker has
to read the restored value at script scope, before `ko.applyBindings`. Until
`installedRaces` resolves, the select holds only its MLA placeholder. Knockout
rejects a model value no option can show, and overwrites it with the
placeholder.

The war records `global:playerRace` on the inventory, `race` on every AI, and
`originSystem.gwaio.races = { player, byFaction, unique, mods }`. `mods` is the
identifier and version of each race server mod installed when the war was made.
It covers every installed race, not only the ones drawn, so on its own it is
not the list of what the war needs.

On resume `gw_play/races.js` asks `race_check.warRaces` what the war actually
fields. That is `player`, the values of `byFaction`, every star's `ai().race`
and, under Separate races, the race stamped on each co-op player's record. It
hands that to `race_check.evaluate` along with what `race_mods.installedRaces`
found.

A race with no descriptor, or one whose server mod is not active, is
**blocked**. The war says so in a dialog and lists the missing races on the war
panel. `model.fight` refuses, since the player would otherwise field vanilla
units under a commander spec that does not exist. A race mod whose only change
is its version **warns** and nothing more. A point release must not bar a
player from a war in progress. The check ignores a recorded mod for a race the
war does not field.

`installedRaces` reports `known`. While `known` is false, nothing that depends
on the installed list is decided. False means GW Server Mods could list nothing
at all: Community Mods was absent and its IndexedDB fallback was empty. That is
"cannot tell", not "not installed".

`installedRaces` also reports `gwsm`, and a false `gwsm` is not the same thing.
GW Server Mods is what mounts every race's files, so without it no race is
available, whatever is installed. Then a single race-neutral reason blocks the
war. The same sentence once per race would only repeat itself. Naming a race
mod would send the player to inspect a mod that is already on. A missing
descriptor is a client-side registry fact and blocks either way.

The gate is `model.fight` and `model.restartFight`, wrapped. Knockout reads a
click binding's value accessor at click time, so the swap holds however late
the scene script runs. `gw_play/races.js` also swaps
`model.gwCampaignFightBlocked` and `model.gwCampaignFightTooltip`, to grey the
button and give it a reason. Those two are bound once, so it installs that half
ahead of `ko.applyBindings`. If `model.gwCampaignPlayStarted` says the scene is
already bound, it installs that half immediately.

Map packs share the gate. `gw_play/biomes.js` fills `model.gwoBiomeBlock` and
`model.gwoBiomeWarning`, which `races.js` creates beside the race pair and
reads in the same `blocked()`. `biomes.js` raises the same dialog through
`model.gwoShowFightBlock`. See [`galaxy.md`](galaxy.md), "Biome mods in a GW
battle".

In co-op the war also records `perPlayerRace`, the **Separate races** setting.
With it off, every viewer's inventory is stamped with the host's race. With it
on, each viewer picks their own race at the loadout screen. The choice comes
from the races the war recorded that the host still runs, never from that
client's own installed list.

The active set is the host's, asked of `GwServerMods.hostServerMods()`. That is
the capability API over what its connect gate captured on the way into the
session. The active set is not asked of `race_mods.installedRaces`, which
answers with this client's own list. The host mounts the server mods a battle
fields, so its set is the authority. The intersection is
`race_check.activeRaces`. No answer is "cannot tell" and removes nothing. No
answer means a host without GW Server Mods, a build without the API in this
scene, or the empty set the API returns when the host published nothing.

The recorded list alone is not enough either. A race disabled since the war was
made has no units in the battle, and the resume check does not block a race
nobody fields. Either way the referee reads the race from each inventory
(`races.raceOf` understands the live `getTag` and the serialised `tags` shape).
So nothing downstream has to know which mode it is in. See
[`coop.md`](coop.md).

## Legion Expansion

The descriptor is `race/legion.js`. The server mod is
`com.pa.legion-expansion-server`, and the unit-type bit is `Custom1`. The
commanders are Overwatch, Cyclops, Cataphract, Raptor, Quad and Tank. The
player icon comes from the client mod's own `icon_player_{fill,outline}_l.png`.

Under Titans its build orders are the flat `legion_*` files beside the stock
ones, plus `unit_maps/legion.json`. Under Queller every tier already carries a
`legion/` side, so the tree is the tier minus `mla/` and `unit_maps/mla.json`.

The table keys 375 Legion specs by their Legion names (Shank, Peacekeeper,
Dauntless, …) for cards written for Legion alone. Under the cells Legion fills
every cell GWO's cards open, so the deal withholds nothing beyond the MLA-only
set (`test/race_legion.test.js` pins that).

Where its types disagree with vanilla's, the cells follow the types. The
OmniSilo is typed Advanced, so it arrives with advanced economy rather than
with a storage card. The nuke's projectile is a `Custom1` orbital "unit", so it
arrives with basic orbital. Helper units (`l_vision`, the bombs, the spawners)
sit in cells no vanilla unit occupies. They are reached only through their
parents, as vanilla's own spawned units are.

## Bug Faction

The descriptor is `race/bugs.js`. The server mod is `com.pa.ferretmaster.bugs`,
and its companion `commander-merge` supplies the commander's base spec. The
unit-type bit is `Custom2`. There is one commander, the Bug Alpha Commander,
whose art ships in green paint (hue 120). The player icon comes from the client
mod's own `bug_icon_{fill,outline}.png`.

Bugs is Titans only. Its build orders are the `bugs/` sub-directories under
each build directory, plus `unit_maps/bugs.json` and
`platoon_templates/bugs.json`. Queller and Penchant default to Titans for it.

Research is data. A research factory (`research_crusher`, typed like the
factory it stands beside) builds an unlock token (`bug_crusher_unlock`). GW
Server Mods' `research.js` converts that token into an unlock in the battle.
The factories arrive with the vanilla factories' cells, and the tokens arrive
through the build rule above. So a Bugs player researches in Galactic War as in
a skirmish.

The table keys 252 Bugs specs (`crusher`, `crusherResearch`, `crusherUnlock`,
...). The deal withholds nothing beyond the MLA-only set
(`test/race_bugs.test.js`). See [`race-conventions.md`](race-conventions.md)
for the checklist a race follows.

## Exiles

The descriptor is `race/exiles.js`. The server mod is `com.pa.nik.exiles`, with
companions `commander-merge` and `build-bar-tabs`. The unit-type bit is
`Custom6`. There are four commanders: Maxim, Taurus, Blueberry and Brainiac,
whose art is in blue paint (hue 200). The player icon comes from the server
mod's own `ui/mods/com.pa.nik.exiles/img/exiles_icon_{fill,outline}.png`.

Exiles is Titans only. Its build orders are the `exiles/` sub-directories under
each build directory, plus `unit_maps/exiles.json`. Exiles fields no orbital
unit beyond its launcher, so the cells the orbital cards open stay empty. The
deal withholds those cards (`test/race_exiles.test.js` pins the list). The
table keys 287 Exiles specs.

The mod also ships `platoon_templates.json` and `platoon_land_builds.json` at
the **vanilla** paths. They are copies of the TITANS files, with the raid and
attack platoons tightened to exclude scouts, radars and anti-nukes. The
land-builds copy differs from `pa_ex1`'s only in the condition strings that
follow. GW Server Mods mounts the zip at the root after the client mods, so
while Exiles is active every MLA Titans AI reads those copies.

The one cost is GWO's own `platoon_templates.json` shadow, which is not seen.
That shadow is a Suicide squad on the two Transfer templates. This is accepted
for this pass, because the change is a tightening, not a break. See
[`race-conventions.md`](race-conventions.md).

## Add-ons

An **add-on** is a server mod that adds units to races that already exist,
rather than being one: Second Wave, Section 17 and Osmech. It has no
unit-type bit of its own, no commanders and no tree of its own. Its
descriptor lives in `addon/<id>.js`, `shared/addons_shipped.js` lists the
shipped ones, and a third-party mod pushes its own onto `model.gwoAddons`
the way it pushes a race onto `model.gwoRaces`. `races.registerAddon`,
`addonById`, `addons` and `detectAddons` mirror the race registry, in a
registry of their own. An add-on id never reads as a race.

```js
{
  id: "second_wave",
  name: "!LOC:Second Wave",
  serverMods: ["pa.mla.unit.addon"], // any one active
  layers: {
    mla: { titans: { unitMaps: [paths], sources: [{ dir, match }] } },
    legion: { titans: { unitMaps: [paths], sources: [{ dir, match }] } },
  },
  units: { rex: "/pa/units/addon/rex/rex.json", … }, // add-on key -> path
  unitNames: { rex: "!LOC:Rex", … }, // add-on key -> display name
}
```

`units` is the add-on's table, in the shape of a race's. For MLA it is also
the membership rule: an add-on unit carries `Custom58` like any vanilla unit,
so the only thing that says it is an add-on's is this table
(`races.addonUnitPaths`). Legion and Bugs units an add-on ships carry the
race's bit and belong to that race by the ordinary rule, so a Legion player
already fields Second Wave's Legion units. The table gives them names for the
tooltips (`races.unitName` reads the race's table, then every add-on's).

**Layers.** `layers[raceId][brain]` is the AI data the add-on ships for that
race, in the shape of a race descriptor's `ai[brain]`. `races.layersFor(brain)`
adds every add-on's layer for a race to the race's own, and gives MLA a layer
too. That table is what `treeFilter`, `inAnyRaceLayer` and `unitMapsFor`
read. A race tree keeps its own layer and subtracts every other, MLA's
included, so a Legion tree holds Second Wave's `factory_builds/legion/` files
and none of its `mla/` ones, and its merged map carries the
`second_wave_legion.json` keys. Before add-ons, a Legion-only add-on map rode
untagged into every scoped MLA tree; now it is Legion's and stays out. A
file two layers claim belongs to each of them: Second Wave's
`second_wave_aux.json` holds the builder aliases both its MLA and its Legion
build files read, so both layers name it. `unitMapsFor` gives MLA no maps at
all. An MLA army's `unit_maps/` is the live listing, where an add-on's map
already sits untagged, so nothing is merged for it.

**What an MLA player fields** (`unit_cells.addonUnitsFor`) is additive. Every
held path stays, parts and commander-class units included. Each held vanilla
unit brings every add-on unit of its cell: an extractor brings Second Wave's
Metal Generator, the Atlas brings Juno and Osmech's bot titans. Add-on units
in cells no vanilla unit fills (the fabrication towers, the advanced
storages, Section 17's gantry, Poseidon) arrive through the build rule, from
a held vanilla builder or an add-on unit already granted. The vanilla side of
the index is the base game's units alone: an add-on's vanilla-typed units are
kept out of it, or they would fill exactly those cells and nothing could ever
reach them, for MLA or for the race twins Legion and Bugs get. A spec mod on
a vanilla unit lands on its add-on cell-mates too, and the original stays
because the army still holds its file. No commander is retagged and no unit
map falls back for MLA. An MLA AI army and a co-op viewer get the same
treatment. `unit_cells.addonCardUnitsFor` lists a card's own units and the
add-on units of their cells for the tooltips.

**Exclusive units** carry a `Custom` bit nothing registered owns and none
that is: Section 17's Big Bill, Pineapple, Floater and Horntail are
`Custom17`, built only by its gantries (`buildable_types: "Mobile &
FactoryBuild & Custom17"`). `unit_cells.exclusiveMember(races.knownBits())`
marks them in every index. They get a cell, tags and a build list, but sit in
`index.exclusive` rather than `units` or `unitsByCell`, so no cell grant, no
card and no mod ever reaches them. They arrive only through the build rule,
from any granted unit whose `buildable_types` matches, whatever their cell
holds. Both gantries reach them: the MLA one from a held advanced fabber, the
Legion one from Legion's. A cell whose vanilla occupants are all `NoBuild`
counts as unfilled for that rule.

**The fallback set.** A unit-map `spec_id` a race's maps left on a vanilla
unit still falls back to a race unit of its cell, but `unitMapFallback` now
takes an `avoid` set - every add-on unit path - and prefers a unit outside
it. `/pa/units/l_addon/` sorts before `/pa/units/land/`, so without it the
base map keys Legion leaves vanilla would land on Second Wave's units, which
Legion's own AI data does not know.

**Priming.** `race_cells.indexFor("mla")` builds the add-on index. It does
nothing while no add-on is registered, and resolves `undefined` without a
word when the list holds no add-on unit - none mounted, the usual case.
`gw_play/races.js` primes MLA only while `installedRaces` reports an active
add-on: the shipped descriptors are registered whether or not their mods
are, and every MLA war must not crawl every spec for nothing.

**Recording.** `installedRaces` also reports `addons` and `addonMods`; `mods`
stays race-only, since `race_check`, `host_war.js` and `setup.js` read it as
the race mods. The war records `gwaio.races.addons`, the identifier, name
and version of each add-on server mod active at creation. On resume
`race_check.evaluate` **warns** for each one no longer active, and never
blocks: every inventory holds vanilla paths, so the add-on's units simply
stop arriving. The war panel joins that line with the race-version line. A
war saved before add-ons recorded none and says nothing. The check runs for
an all-MLA war too.

### Second Wave

The descriptor is `addon/second_wave.js`. The server mod is
`pa.mla.unit.addon`, with a client companion. It adds 23 MLA units under
`/pa/units/addon/`, 15 Legion units under `/pa/units/l_addon/` and 6 Bugs
units under `/pa/units/b_addon/`, and shadows the two vanilla AA towers to
rebalance them. Its AI data is an MLA layer (`fabber_builds/mla/`,
`factory_builds/mla/`, `unit_maps/second_wave.json`) and a Legion layer
(`legion/` sub-directories, `unit_maps/second_wave_legion.json`), plus the
shared `unit_maps/second_wave_aux.json`. It ships no Bugs AI. Its Bugs units
reach a Bugs player by cell; its Bugs AI armies never build them.

### Section 17

The descriptor is `addon/section17.js`. The server mod is
`com.pa.daedelus.experimentals`. Everything sits under `/pa/units/paeiou/`:
MLA units, the Legion units Ligma, Ægir and the Legion gantry, a NoBuild
larva and drones no cell grants, and the four `Custom17` exclusives. Its AI
data is MLA only: flat files named for the unit each builds
(`factory_builds/dolfin.json`, `fabber_builds/solar_cell.json`, …) and
`unit_maps/s17_paeiou.json`. The layer names each file in full, the way
Bugs' `platoon_templates/bugs.json` is named; no base file starts with any
of them.

### Osmech

The descriptor is `addon/osmech.js`. The server mod is
`com.pa.loloares.thorosmen`, with a client companion. It adds 45 MLA units
under `/pa/units/thorosmen/`, many of them titans, and shadows five vanilla
specs to rebalance them without changing their types. It ships no AI data at
all, so it has no layers: its units reach a player by cell and never an AI.

The known upstream issues these three carry are listed in
[`race-conventions.md`](race-conventions.md).

## Where to look next

- [`ai-paths.md`](ai-paths.md): the race roots beside the five trees.
- [`galaxy.md`](galaxy.md): where the race is drawn during war generation.
- [`coop.md`](coop.md): viewers under per-player tech.
- [`race-conventions.md`](race-conventions.md): the checklist and the rules
  the race code relies on.
- `test/unit_cells.test.js`, `test/unit_groups_cells.test.js`,
  `test/races.test.js`: the rules above, pinned.
