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
  commanderTypes: {
    unitType: "UNITTYPE_Custom1",
    buildable: "CmdBuild & Custom1",
    metalExtractorNames: { basic: "LegionEcoBasicMetalExtractor", advanced: "…" },
  },
  engineKeys: { BasicVehicleFactory: "/pa/units/land/l_vehicle_factory/l_vehicle_factory.json", … }, // stock key the engine reads -> the race's unit, or null
  stockUnits: [paths], // optional: stock units the race builds with an MLA builder
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

## Unit tables

`units` and `unitNames` in every `race/` and `addon/` file are generated.
Everything above them in the file is hand-written.
`scripts/generate-race-tables.js` (`npm run generate:race-tables`) builds
the two tables from `test/fixtures/race_specs.json` and splices them in,
formatted as Prettier formats the repo. `npm run harvest:race-specs` writes that fixture
from the race and add-on mods on disk. `test/race_tables.test.js` runs the
generator in memory, calling `generateAll` from `scripts/lib/race-tables.js`,
the generator behind `scripts/generate-race-tables.js`. It requires every file
to come out byte for byte as committed, so a hand edit to a table fails the
suite.

The rules are in `scripts/lib/race-tables.js`, and the mods each table reads
are in `scripts/lib/race-table-inputs.js`:

- A race keys each unit that its own mod lists and ships and that carries its
  bit. The key is the display name, less the race's prefix, with "Advanced"
  moved last. A name two units share adds the unit's directory
  (`boomerBugBoomer`). A part is keyed by its owner's key plus the role its
  file name gives (`shankAmmo`, `crusherWeapon`). Bugs keys a research
  factory `<x>Research` and its token `<x>Unlock`.
- An add-on keys each unit its list has and the base game's lists do not. A
  name two units share takes the race word of each one's bit, then the unit's
  directory. Each unit is followed by its tools, ammo and death weapons. A
  part's key is its owner's key, what its file name adds, and its role:
  `Weapon`, `Ammo`, `BuildArm` or `DeathAmmo`. The role words in the file name
  (`tool`, `weapon`, `ammo`, `build_arm`, and `death` on a death weapon) are
  left out wherever they sit, so `orbital_anti_nuke_weapon_land.json` is
  `orbitalAntiNukeCannonLandWeapon`.
- A table holds only the files the race's or add-on's own mod ships. A
  base-game file its units reuse (the Havoc fires the Gil-E's beam ammo) is
  left out: a card reaches it by its stock key where `shared/units.js` has one,
  otherwise by its path, and changes it as a stock file. A part that no mod
  ships is left out too. The generator refuses an input that pins a base-game
  file the harvest read (a `baseGame` table's).
- A file the race's mod ships over a base-game path stays in the table, but it
  is a stock path to everything else: `shared/units.js` leaves it out of the
  published table, and it is never foreign. Keep base-game paths out of a
  third-party table too: one that `shared/units.js` does not key would become
  foreign in every war, and drop out of every other race's army.
- Every name is written as a `!LOC:` key. The tooltips pass it through
  `loc()`, so the English name shows wherever no table translates it.

What no rule derives is written in the inputs, each with its reason: Legion's
keys for the units it names twice and for its storage, and the entries its
first, hand-mapped table carried that no rule reaches; the Bugs rule that reads only a unit's own
types; and Exiles' Jelly, which keeps its first key although Exiles 0.8.4
renamed it Navigator. A key is what a race-only card addresses, as
`gwoUnit.<race or add-on>.<key>` through `shared/units.js`, so a table
changes after a mod update on purpose, not as a side effect: re-harvest, run
the generator, and review the diff.

## Capability cells

Every card, `gw_play/ai_tech.js`, `shared/ai_inventory.js` and
`gw_play/card_units.js` name vanilla units. None of them changes. A race
player's inventory holds vanilla paths, and whatever race or add-on paths a
third-party card adds. The referee converts the vanilla ones once, at battle
launch, by a rule rather than a table.

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

At launch `gw_play/race_cells.js` reads the merged unit list and every spec it
reaches. It reads through `spec_cache`, so `genUnitSpecs` fetches nothing
twice. From those it builds two indexes: vanilla (`Custom58` or no faction bit)
and the race (`UNITTYPE_<bit>`). Then it applies these rules:

| Rule                                                                                                                                                                                 | Result                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A held vanilla unit                                                                                                                                                                  | the race units it stands for: every race unit of its cell, or in a mobile `Combat` cell those the job rule gives it (`raceUnitsFor`, "Jobs" below)                                                 |
| A held path that is not a vanilla unit (race commander, a mod)                                                                                                                       | passed through untouched, unless another race's or add-on's (`races.ownedPaths`)                                                                                                                   |
| A held vanilla unit that stands for no race unit, but that the race can build                                                                                                        | itself ("Units a race builds itself" below)                                                                                                                                                        |
| A held vanilla unit the race names in `stockUnits`, when something fielded can build it                                                                                              | itself, beside the race units it stands for (`buildableStockUnits`, "Units a race builds itself" below)                                                                                            |
| A race unit in a cell no vanilla unit fills                                                                                                                                          | granted when something granted can build it (`build_types`)                                                                                                                                        |
| A held vanilla `Commander`-class unit (the Colonel)                                                                                                                                  | kept and retagged to the race's bit (`races.unitRetagMods`)                                                                                                                                        |
| A `Commander` cell                                                                                                                                                                   | never granted; race commanders arrive as commanders do                                                                                                                                             |
| A spec mod on a vanilla unit                                                                                                                                                         | one on each race unit it stands for (`expandMods`)                                                                                                                                                 |
| A spec mod on a vanilla weapon, ammo, build arm or death ammo                                                                                                                        | one on each race part of the same role under the race units that the part's units stand for                                                                                                        |
| A mod on a file the army still holds (a retagged Pumpkin, `model.gwoSpecs`)                                                                                                          | kept as well                                                                                                                                                                                       |
| A mod that changes what a unit is (`unit_types`, `buildable_types`, `tools`, `command_caps`, `si_name`, …) or says `exact: true` - and every other mod on that unit in the same list | stays on its own unit, never travels to a race unit                                                                                                                                                |
| A unit-map `spec_id` the race maps left pointing at a vanilla unit                                                                                                                   | the first race unit it stands for, or left as it is when it stands for none (`unitMapFallback`) or is in the race's `stockUnits`; a key in the race's `engineKeys` takes that unit (`raceUnitMap`) |

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

A group card names several vanilla files that can stand for the same race
unit (`gwoGroup.botsAmmo` names eight). It must land once on a race ammo, not
eight times. `expandMods` emits a race target set once per **pass**. A pass
ends when a vanilla source already seen recurs. One card is one pass, and two
copies stack. A mod on a race path is passed through, so a card that makes one
change to the Ant and to a race tank it stands for changes that tank twice. The
passes carry no card, so they cannot tell that case from two cards, nor two
cards that make one change to two vanilla units standing for the same race
unit from one card: that race unit takes the change once. Jobs make that
rarer, since fewer vanilla units share a race unit; the homes of a cell still
share theirs (see "Jobs" below). A card that means the Ant's change for
the Ant alone marks it `stockOnly`, which keeps it off the race tank
([`tech-cards.md`](tech-cards.md), "Which races a card reaches"). A
`stockOnly` change sits outside the passes. A mod whose `path` a race file
lacks is the no-op it always was in `specs.mod`.

A race can mount a vanilla part itself. Legion's commanders mount the stock
commander main gun, AA, and torpedo weapons, so they fire the stock ammo. Such a
file is both a file the army holds and one of the race's parts. A mod on it that
is kept, because the army holds the file, joins the pass for that file, like any
race part. One card that names the file and a vanilla unit that stands for its
owner therefore changes the file once, whichever it reaches first. The limit
above applies to the file too: a card that changes such a unit, and a second
card that makes the same change to the file, change it once, as they change
every race part of that pass once.
`test/unit_cells.test.js` pins both.

A single-unit grant brings the race units its unit stands for:
`gwc_start_subcdr`'s Ant brings Legion's Shank and Stoke, and not the Corsair,
the Maul, or Second Wave's Lynx. What no job can carry is a hand-picked list.
`cards_deal_helpers.MLA_ONLY` names the cards the deal never gives a race
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

The deal gives any other card when `races.cardUsable` finds a race unit that a
unit its `card_units.js` entry names stands for. A card with no entry passes,
and every loadout has no entry. Every card that names a stock unit passes until the
race's cells are built, and `gw_play/races.js` starts building them as the
scene loads. Deals are
synchronous and gate on the cells, so the cells are built as soon as the
installed list is read. That is once GW Server Mods has the race zip mounted,
or once a unit list read returns with no race unit in it.

One unit list read serves every race. A read taken before the mount has no race
unit, and it is discarded. If each race took its own read, some reads would
land either side of the mount and prime only some races. A read in which a spec
failed is used but not kept, cells included, so the next caller reads that spec
again.

**Race and add-on cards.** A card whose entry names a race or add-on unit is
written for that race or add-on. A foreign unit is any path in a registered
`units` table that is not a `shared/units.js` stock path. `races.fieldsUnit`
counts a foreign unit for a race when the race's own table lists it, or when
the race's index holds it (for MLA, the add-on index). An exclusive unit sits
in every race's index, so it counts only when the race could build it holding
every vanilla unit (Section 17's `Custom17` units for MLA and Legion, never for
Bugs). An add-on table mixes races (Second Wave ships MLA, Legion, and Bugs
units), and only the index knows whose each of its units is, so an add-on unit
counts only once the index exists. A unit no faction bit marks (Section 17's
drones, the Horntail larva) is in MLA's add-on index, so it counts for MLA
alone. The gate reads units: a weapon or ammo counts only where the race's
table or index lists it, which an exclusive unit's parts and an add-on's
projectile specs never are.

Such a card is dealt when any foreign unit it names counts for the player's
race, or when any other unit it names passes the rule above. The gate asks what
the race fields, not what the player holds; the card's `deal` asks that. It
applies to MLA too, and `raceCanDeal` skips `MLA_ONLY` and the `_upgrade_` rule
for such a card: a third-party `mym_upgrade_shank` naming a Legion unit is dealt
to Legion players only. A card with no foreign unit is gated exactly as before.
An entry's `races` list overrides both: the card is offered only to the races
listed, and still needs a unit that stands for one of the race's.
The entry may nest lists (a card's own group beside single paths); every reader
flattens it (`unit_cells.unitList`) and ignores a whole `gwoUnit` race table in
it. So do the unit lists a card hands `inventory.addUnits`,
`inventory.removeUnits`, `gwoCard.flatMapMods`, and the has/missing helpers.

One boundary serves the referees, the tooltips, and the deal.
`races.ownedPaths` keeps the held paths a player owns: every stock path, and a
race or add-on path its race fields. `races.fieldedFor` applies the cell rule
above to those, with the war's `model.gwoSpecs` and the ally commander added
unfiltered. `races.modsFor` drops a spec mod on a race or add-on path the
player neither owns nor holds a spec for, so a Bugs unit a mixed card adds
never reaches a Legion army, while a stale key of the race's own still warns in
`specs.js`. A mod on a race or add-on path is applied as named, never re-aimed
by cell, and `gw_play/race_cells.js` keeps every foreign unit out of the
vanilla index, as it keeps add-on units out: some carry no faction bit. A
foreign part can still reach the vanilla index through a bitless helper unit a
race ships but does not list (Bugs' Matriarch death unit), which is why
`modsFor` passes foreign files through rather than trusting the index. Each
helper reads the index its caller holds, and `fieldsUnit` falls back to the
published one when the caller holds none.
`gwoCard.fieldedUnits(inventory)` gives a card's `deal` the same view: the paths
held that the race owns, plus what `raceUnitsFor`, or `addonUnitsFor` for MLA,
brings for them. `upgradeCard` reads it, so `requires` may name a race unit.

The two card tooltips (the hand hover and a star's "Which Units?") follow the
same rule. `gw_play/card_tooltips.js` lists what `races.cardUnitsFor` gives:
the race or add-on units the entry names that the race fields, and the race
units each stock unit in it stands for (`unit_cells.cardUnitsFor`).
That lookup has no build reach, so a factory card lists Bugs' research factories but not their
unlock tokens. A Commander-cell path is kept.

The tooltip names the units from the descriptor's `unitNames`, and otherwise
from `gw_play/unit_names.js`. It highlights whatever `races.fieldedFor` would
not field for the paths the inventory owns. The tooltip lists each name once
(Legion has two units each called Purger, Spoiler and Meteoroid). A name is
plain when any unit behind it is owned.

The inventory is the client's own: a viewer's record under per-player tech.
Until the cells land, the tooltip shows the MLA list. `gw_play/races.js` sets
`model.gwoRaceCellsPrimed` once priming completes, and the open star's and the
hovered card's tooltips are rebuilt.

### Jobs

A mobile `Combat` cell mixes units with different jobs: with Second Wave,
Legion's basic tanks are the Lynx (anti-air), the Corsair, the Maul, the
Shank, and the Stoke.
Within such a cell a vanilla unit stands for the race units that do its job,
not for the whole cell. Every other class keeps its cell whole: titans,
commanders, fabbers, factories, and structures.

`unit_cells.classify` reads a mobile combat unit's jobs off its stripped
types, in this order:

| Order | Jobs                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `Heavy`                                                                                                                                                                                                                                                                                                                                                                                  |
| 2     | `SelfDestruct`, `Fighter`, `Bomber`, `Gunship`, `LaserPlatform`, `Tactical`, `AirDefense`, `OrbitalDefense`, `MissileDefense`, `NukeDefense`, `Defense`, `SurfaceDefense`, `Shield`, `Artillery`, `TacticalDefense`, `Transport`, `Teleporter`, `Scout` (`Scout` or `Recon`), `RadarJammer`, `Radar`, `Construction`, `Deconstruction`, `MetalProduction`, `EnergyProduction`, `Economy` |
| 3     | `Hover`, `WaterHover`, `Amphibious`, `Sub`                                                                                                                                                                                                                                                                                                                                               |

Each bit is one job, except that `Recon` is `Scout` too. A unit with none of
them has no job. `Heavy` comes first, what a unit is for next, and how it
moves last: the Ward, typed `Heavy`, `NukeDefense`, and `Hover`, lists
`Heavy` first, and the Locusts, typed `Deconstruction` and `Hover`, list
`Deconstruction` first.

Only a vanilla unit a commander can build counts. `buildIndex` marks as
`fieldable` what the index's `Commander`-cell units can build, and what that
builds in turn, through `buildable_types`. Each distinct expression is
evaluated once. A vanilla unit outside that set stands for its whole cell, as
every unit did before jobs, and plays no part in the rule below. Such units are
base specs such as `base_orbital` (the Rapid start changes its spawn layers),
spawned units such as the Squall's drone, and the portal's ammo. When no
commander has a build list, nothing is `fieldable`, every cell stays whole,
and `gw_play/race_cells.js` warns.

`unit_cells.standInsFor` applies the rule within each mobile `Combat` cell:

1. A vanilla unit's job is its first job.
2. A race unit **matches** the first of its jobs that is a vanilla unit's job
   in the cell. The Corsair is `Artillery` and `Hover`. No basic vanilla tank
   is artillery, so the Corsair matches `Hover`, the Drifter's job. A race
   unit with no such job is **unmatched**, whether or not it has jobs: the
   Stoke is `Amphibious`, and no basic vanilla tank is.
3. A vanilla unit stands for the race units that match its job.
4. The unmatched race units belong to the cell's **homes**. The homes are the
   vanilla units with no job. If there are none, they are the **leftover**
   units, whose job no race unit matches. If there are none of those either,
   every vanilla unit of the cell is a home.
5. Any other vanilla unit stands for **nothing**, unless the race builds it
   itself ("Units a race builds itself" below). For Legion the Skitter does:
   no basic Legion tank scouts, and the Ant and the Stryker, which have no
   job, are the homes.

So for Legion with Second Wave, the Ant stands for the Shank and the Stoke,
the Spinner for the Lynx, the Drifter for the Corsair, and the Inferno for the
Maul. Without Second Wave, Legion has no anti-air tank, and the Spinner stands
for nothing. The homes rule
leaves no race unit of a cell a vanilla unit fills without a vanilla unit to
stand for it, so the build rule and `unfilledByVanilla` are unchanged.
`test/unit_jobs.test.js` checks that for every shipped race and the add-on
index, and that a card can grant a vanilla unit that stands for each one.

Every reader asks `standInsFor`: `raceUnitsFor`, `addonUnitsFor`,
`expandMods`, `cardUsable`, `cardUnitsFor`, and `unitMapFallback`. A part
follows the units that mount it (`partIndex[path].units`, narrowed to the unit
whose directory holds the part), so a mod on the Spinner's ammo lands on the
Lynx's ammo alone.

The AI unit map follows the same rule. A stock key the race's maps leave on a
vanilla unit that stands for nothing keeps pointing at that unit, which the
race army cannot build. The Skitter's `LandScout` is one for Legion and Bugs.
The stock build items that name it lose their race builders with the rest of
MLA's orders (see "Race trees"), so no race factory is ordered to build it.

The rule has two known limits:

- It reads the race mods' own bits. Legion's Stoke is typed `Amphibious`, not
  `Artillery`, so it belongs to the Ant, not to an artillery unit.
- The Squall's drone sits in the basic air cell and no commander builds it, so
  a naval card that names it reaches a race's whole basic air cell. That
  predates jobs.

### Units a race builds itself

Some race builders build MLA units, as they do in a skirmish: Bugs' naval
hives build MLA ships, and Exiles' orbital launcher builds MLA orbital units.
Those units stand for no race unit, so the cells alone would drop them. So a
vanilla unit that stands for no race unit, but that the race can build, stands
for itself. "Can build" is `unit_cells.raceBuiltVanilla`: what the race's
`Commander`-cell units build, and what that builds in turn, each builder by
its own `buildable_types`, MLA builders included. Each distinct expression is
evaluated once, and the result is kept for the last few index pairs, because
the deal asks once per card. A builder stands for itself only when it can build
something the army fields, another such unit or a race unit. MLA's fabrication
barge builds only the mine and teleporter, which Bugs field as their own, so a
Bugs army does not field the barge.

Every reader of `standInsFor` follows. The army fields such a unit only when
it holds it, so tech gating is unchanged. The deal (`cardUsable`) and the
tooltips (`cardUnitsFor`) count it, and `expandMods` lands a mod on it only
when the army holds its file. A part of such a unit has no race part of the
same role, so a mod on it lands only when held too. `MLA_ONLY` and the
`_upgrade_` rule are unchanged, so those units' upgrade cards stay withheld.

`test/unit_jobs.test.js` pins each shipped race's list:

- Bugs: the nine MLA ships its naval hives build, the fabrication barge aside.
- Exiles: the MLA orbital fabber, fighter, lander, probe, and radar satellite
  its launcher builds, and the thirteen units the orbital fabber leads on to:
  the orbital factory and its units, the Anchor, the orbital mine, the mining
  platform, the solar array, and the Zeus, Ares, and Helios titans.
- Legion: none.

The rule applies only while the unit's cell holds no race unit it would stand
for. If an add-on shipped a Bugs naval combat unit, the MLA ships would stand
for it instead of themselves, and the hives would lose them. The pinned lists
catch that.

A descriptor's `stockUnits` names the exceptions: stock units the race builds
with an MLA builder it fields, although a race unit shares their cell. Exiles
names MLA's teleporter and basic metal extractor, which the stock build orders
have MLA's orbital fabber build: the teleporter on a planet where the army has
no fabber, and the extractor on a free metal spot. A player fields
such a unit, beside the race unit it stands for, when they hold it and
something they field can build it (`unit_cells.buildableStockUnits`, which
`races.fieldedFor` applies after `raceUnitsFor`). "Can build" reads each
builder's own `buildable_types`, so a held Colonel counts too: the retag
changes its `unit_types` only, and its build list still names `Custom58`
units. The army's map keeps each key on such a unit (`raceUnitMap`), so the
stock items that build it stay in the race's tree (see "Race trees").
`standInsFor` does not change, so the deal and the tooltips do not either:
the teleporter card's tooltip lists the Exiles teleporter alone.

## Race trees

An AI's build orders come from its `ai_path`. A race AI never reads the brain's
MLA build lists. It gets a **synthesised tree** at the brain's root with
`_race_<id>` inserted: `/pa/ai/` → `/pa/ai_race_legion/`, and
`/pa/ai_queller/q_uber/` → `/pa/ai_queller_race_legion/q_uber/`. The tree
follows the same scope rules as every other destination (`player_guardians/`,
`player_.player0/`). `referee_ai.js`'s `raceTreeJobs` writes one tree per
distinct (source, destination). `shared/race_trees.js` picks each tree's
files, from one read of the race's layers per tree (`race_trees.treeContext`):

- **Titans**: the tree is the race's `sources` files (Legion's flat `legion_*`,
  Bugs' `bugs/` sub-directories) layered over the brain's base files. No race
  mod ships a complete AI, and the base files fill its gaps the way they do in
  a skirmish.

  **The stock factory and fabber lists lose MLA's orders.** The army's map
  (below) points most stock keys at race units, so a stock item would order
  the race's builders to build race units by MLA's lists: the stock air scout
  item built Legion Marauders, and Bugs' research tokens were ordered to build
  air units and refused tens of thousands of times a battle. In every
  base-layer file under `fabber_builds/` and `factory_builds/`
  (`race_trees.stockBuildFilter`), the referee takes from each item every builder
  the race's map re-points, and drops the item when none is left or when it
  builds a re-pointed unit, which the stock builder left cannot build
  (`referee_game_file_paths.stripStockBuilds`, with the keys from
  `repointedFor`). What stays is what a skirmish runs for the race: the items
  for an MLA builder the race builds itself, such as Exiles' orbital fabber
  and orbital factory. For Exiles those include the stock teleporter and
  orbital metal extractor items: Exiles names their targets in `stockUnits`,
  so its map keeps `Teleporter` and `BasicMetalExtractor` on MLA's units.
  Items whose builders are unit-type classes (`AnyBasicFabber`, `Commander`)
  stay too, and never run, because the classes require `Custom58`. Without
  the race's cells (its zip not mounted yet) the lists are copied whole.

  The source listing is the merged filesystem, so a race file that shadows a
  base path already reads as the race's. The race's own **layer** is its
  `sources` plus every active add-on's layer for it (`races.layersFor`, see
  "Add-ons"). The base layer drops three sets of files. It drops every
  **other** layer's `sources`, MLA's add-on files included, because they ride
  in the same merged listing. A file the race's own layer and another both
  claim (Second Wave's aux map) stays. It drops everything under `unit_maps/`
  but the brain's own `ai_unit_map*.json`. It drops `neural_networks/`. Files
  a race ships at vanilla paths are indistinguishable from base files.
  Examples are Exiles' `platoon_templates.json` and `platoon_land_builds.json`,
  and Bugs' `platoon_builds/platoon_misc_builds.json` and
  `platoon_builds/platoon_orbital_builds.json`. They enter every race tree's
  base layer with the merged content.

  **Platoon templates are never dropped.** Every tree carries every layer's
  `platoon_templates/` files, as a skirmish loads them all, because a build
  file at a vanilla path can name another layer's templates. Bugs' orbital
  and misc builds name the `Bugs_Orbital_*` and `Bugs_UnitCannon` templates
  in Bugs' own `bugs.json`. Without them no orbital platoon formed in any
  other race's tree or in an MLA scoped tree, so radar satellites and orbital
  fighters never left their planet. A template does nothing until a build
  names it.

  `scripts/validate-race-trees.js` checks the tree against a manual mount-order
  merge of the real files on disk. `referee_ai.js`'s sweep writes an MLA tree
  to a scoped destination (`/pa/ai/player_guardians/`, a viewer's Sub
  Commanders). That tree is the base layer plus MLA's own add-on layer, by the
  same rule. It drops every file a race's layer claims and MLA's does not
  (`race_trees.raceLayerTest`), templates aside, so an MLA army's `unit_maps/`
  never lists a race's map. An add-on's MLA map, and a map both MLA and a race claim, ride
  along untagged, as the live `/pa/ai/` listing has them. The engine never
  reads those untagged copies; their keys reach the army through its merged
  map ("Add-ons").

- **A brain that carries the race** (Queller carries Legion): the tree is the
  tier minus the descriptor's `exclude` fragments, which are the MLA side,
  templates aside. The race's own unit maps and `neural_networks/` are dropped
  too.

The referee's "no race build orders" warning fires when the race mod itself
contributed nothing to the tree (`race_trees.raceLayerFilter`). The base layer is
always present, so an empty tree can no longer show that.

The engine lists `unit_maps/` and loads each file it finds with the army's tag
appended. The referee therefore never copies the race's map as a file. It
merges the race's map over the brain's map
(`referee_game_file_paths.mergeUnitMaps`), and race keys win. A vanilla
`spec_id` the race map left resolves to a race unit it stands for, unless the
race names it in `stockUnits` ("Units a race builds itself"). Then the
race's `engineKeys` apply (`raceUnitMap`): the race's own unit for each stock
key the engine reads by name, `BasicVehicleFactory`, `BasicBotFactory`,
`BasicAirFactory`, `BasicNavalFactory`, `OrbitalLauncher`, `AntiNukeSilo`, and
`ControlModule`, or `null` to keep the stock unit. The cells choose by type,
and Bugs' research tokens carry factory types, so without the table the
engine would read a token as Bugs' land, air, and orbital factory. The
extractor pair has its own hook (see "Commanders"). These keys matter most
under low tech: in a Casual war whose Legion player held no advanced factory,
Legion Sub Commanders whose stock keys stayed on MLA units built one factory
and never left their planet, while with the keys translated they built 57-66
factories and spread to six planets.

The referee writes the result as the army's tagged
`ai_unit_map[_x1].json.<tag>`. It also copies the brain's untagged map, so
the engine has a name to derive the tagged one from. With only the tagged
file present, the engine looks for `ai_unit_map.json.ai0.ai0` and finds
nothing.

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
installed race, and an Opponent, an Ally and a Co-op cell per row. The Co-op
cell is the brain of the AI players a co-op host adds
([`coop.md`](coop.md), "AI players"). Each cell offers only
`brainsFor([race])`. The MLA row is the war-wide
`gwoDifficultySettings.ai`/`aiAlly`/`aiCoop` trio. The other rows live in
`gwoDifficultySettings.aiByRace`, and the war records them, coerced, as
`gwaio.aiByRace` beside the strings. An unset co-op brain follows the
opponent's, and so does a row stored before the column.

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
(`ai_population.js`'s `giveRace`). Two armies keep a vanilla one and are **retagged**
instead. The boss keeps its Pumpkin and the Guardians keep the Unicorn.
`races.commanderRetagMods` swaps `UNITTYPE_Custom58` for the race's bit and
replaces `buildable_types` with the race's. It also sets
`ai_metal_extractor_names` to the race's `commanderTypes.metalExtractorNames`,
so the AI's metal-spot logic names the race's extractors
(`Found faction replacement 'BasicMetalExtractor' => …` with `--ai-log`). That
is exactly the shape every real race commander has. A race that declares no
names gets no such mod.

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

The commander list and the preview tint stay MLA's until `raceMods.mountRoot()`
settles, as they do in the co-op loadout scene. A race commander's spec read
before its zip is mounted fails, and its tile shows the spec path until a later
render reads it again: `race_picker_view.js` keeps a read that succeeded and
forgets one that failed. The race setting itself is not held back.

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
commanders are Overwatch, Cyclopes, Cataphract, Scion, Core, and Reclaimer
(`l_overwatch`, `l_cyclops`, `l_cataphract`, `l_raptor`, `l_quad`, and
`l_tank`). The player icon comes from the client mod's own
`icon_player_{fill,outline}_l.png`.

Under Titans its build orders are the flat `legion_*` files beside the stock
ones, plus `unit_maps/legion.json`. Under Queller every tier already carries a
`legion/` side, so the tree is the tier minus `mla/` and `unit_maps/mla.json`.

The table keys 367 Legion specs by their Legion names (Shank, Peacekeeper,
Dauntless, …) for cards written for Legion alone. Under the cells Legion fills
every cell GWO's cards open, so the deal withholds nothing beyond the MLA-only
set (`test/race_legion.test.js` pins that).

Where its types disagree with vanilla's, the cells follow the types. The
OmniSilo is typed Advanced, so it arrives with advanced economy rather than
with a storage card. The nuke's projectile carries a `Custom1` orbital unit's
types, but it is the launcher's ammo, not a unit the list names, so no cell
holds it. Helper units (`l_vision`, the bombs, the spawners) sit in cells no
vanilla unit occupies. They are reached only through their parents, as
vanilla's own spawned units are.

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
`Custom6`. There are three commanders: Maxim, Blueberry, and Brainiac,
whose art is in blue paint (hue 200). The player icon comes from the server
mod's own `ui/mods/com.pa.nik.exiles/img/exiles_icon_{fill,outline}.png`.

Exiles is Titans only. Its build orders are the `exiles/` sub-directories under
each build directory, plus `unit_maps/exiles.json`. Exiles has no orbital
unit beyond its launcher, which builds MLA's orbital units, so those stand for
themselves (see "Units a race builds itself"), and so do the units MLA's
orbital fabber builds, the Zeus, Ares, and Helios titans among them. Its
`stockUnits` adds MLA's teleporter and basic metal extractor, which the stock
build orders have that fabber build. An MLA teleporter links with an Exiles
one of the same army, so Exiles fabbers can use it. The deal withholds nothing
beyond the MLA-only set (`test/race_exiles.test.js` pins the orbital cards).
The table keys 281 Exiles specs.

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
registry of their own. An add-on id never reads as a race. Registered is not
active: `races.activateAddons(ids)` records which add-ons' server mods are
enabled, `activeAddons` lists them in registration order, and only those
contribute a layer. `race_mods.installedRaces` does the activating, from
the GW Server Mods manifest, so `races.js` stays engine-free.

```js
{
  id: "second_wave",
  name: "!LOC:Second Wave",
  serverMods: ["pa.mla.unit.addon"], // any one active
  layers: {
    mla: { titans: { unitMaps: [paths], sources: [{ dir, match }] } },
    legion: { titans: { unitMaps: [paths], sources: [{ dir, match }] } },
    bugs: { titans: { unitMaps: [paths], sources: [{ dir, match }] } },
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
adds every **active** add-on's layer for a race to the race's own, and gives
MLA a layer too. An inactive add-on's files are not on disk, and
`unitMapsFor` names files the referee reads: before activation existed, a
Legion player could not Fight while Second Wave was disabled, because the
hire tried to read `second_wave_legion.json` and failed. That table is what
`treeContext`, `raceLayerTest` and `unitMapsFor`
read. A race tree keeps its own layer and subtracts every other, MLA's
included, so a Legion tree holds Second Wave's `factory_builds/legion/` files
and none of its `mla/` ones, and its merged map carries the
`second_wave_legion.json` keys. Before add-ons, a Legion-only add-on map rode
untagged into every scoped MLA tree; now it is Legion's and stays out. A
file two layers claim belongs to each of them, and both name it (Second
Wave's `second_wave_aux.json` was one until 0.16.1, when its Legion build
files stopped reading it; it is MLA's alone now). `unitMapsFor` gives MLA its
active add-ons' maps, and the referee merges them into every MLA army's
tagged map untranslated: `raceUnitMap` is the merge alone for MLA. The engine
loads only `<file>.<tag>`, so the add-on's own untagged map beside the brain's
is never read, and each attempt logs a failed `UnitMapSpec` open. Before the
merge, no MLA army had the add-on keys that Second Wave's and Section 17's MLA
build files name.

**What an MLA player fields** (`unit_cells.addonUnitsFor`) is additive. Every
held path MLA owns stays, parts and commander-class units included. Each held vanilla
unit brings the add-on units it stands for: an extractor brings Second Wave's
Metal Generator, the Atlas brings Juno and Osmech's bot titans, and the Spark
brings Osmech's Spartak. Add-on units in cells no vanilla unit fills (the fabrication towers, the advanced
storages, Section 17's gantry, Poseidon) arrive through the build rule, from
a held vanilla builder or an add-on unit already granted. The vanilla side of
the index is the base game's units alone: an add-on's vanilla-typed units are
kept out of it, or they would fill exactly those cells and nothing could ever
reach them, for MLA or for the race twins Legion and Bugs get. So is a vanilla
unit whose types say nothing once `stripTypes` drops its faction bit
(`unit_cells.classifiable`): the Deep Space Radar's stub, typed
`UNITTYPE_Custom58` alone, would otherwise fill the basic fabrication towers'
cell, and a mod on it would land on them. A spec mod on a vanilla unit lands
on the add-on units it stands for too, and the original stays because the army
still holds its file. No commander is retagged and no unit
map falls back for MLA. An MLA AI army and a co-op viewer get the same
treatment. For the tooltips, `unit_cells.addonCardUnitsFor` lists a card's
own units and the add-on units they stand for.

**Exclusive units** carry a `Custom` bit nothing registered owns and none
that is: Section 17's Big Bill, Pineapple, Floater and Horntail are
`Custom17`, built only by its gantries (`buildable_types: "Mobile &
FactoryBuild & Custom17"`). `unit_cells.exclusiveMember(races.knownBits())`
marks them in every index. They get a cell, tags and a build list, but sit in
`index.exclusive` rather than `units` or `unitsByCell`, so no cell grant and
no mod on a vanilla file reaches them. They arrive only through the build rule,
from any granted unit whose `buildable_types` matches, whatever their cell
holds. Both gantries reach them: the MLA one from a held advanced fabber, the
Legion one from Legion's. A cell whose vanilla occupants are all `NoBuild`
counts as unfilled for that rule. A card that names one directly is dealt to a
race that can build it (`races.fieldsUnit`, "Capability cells").

**The fallback set.** A unit-map `spec_id` a race's maps left on a vanilla
unit still falls back to a race unit it stands for, but `unitMapFallback` now
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

**Activation.** `installedRaces` also calls `races.activateAddons` with the
detected add-ons' ids (none without GW Server Mods), so the registry agrees
with what the player was told. `gw_play/races.js` runs it once per scene
load, and `GWReferee.hire` runs it again before the game-files stage, so a
hire never depends on scene-load ordering and an add-on disabled mid-session
drops out of the next Fight. It does no I/O while Community Mods is present.

**Recording.** `installedRaces` reports `addons` and `addonMods` too; `mods`
stays race-only, since `race_check`, `host_war.js` and `war_record.js` read it
as the race mods. The war records `gwaio.races.addons`, the identifier, name
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
`factory_builds/mla/`, `unit_maps/second_wave.json` and the MLA builder
aliases in `unit_maps/second_wave_aux.json`), a Legion layer (`legion/`
sub-directories, `unit_maps/second_wave_legion.json`) and, since 0.16.1, a
Bugs layer (`fabber_builds/bugs/`, `unit_maps/second_wave_bugs.json`; no
factory builds). The Bugs build files name the Bugs mod's own builder
aliases (`BugCommander`, `AnyBugFabberBasic`, `AnyBugFabberAdvanced`), which
the Bugs race's `unit_maps/bugs.json` supplies in every Bugs tree.

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
