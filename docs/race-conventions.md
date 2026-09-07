# Race conventions

This page lists what adding a race to GWO has needed so far, and the rules the
race code relies on. [`races.md`](races.md) explains the design. This page is
the checklist and the list of things that must stay true. Update it whenever a
race needs something new.

## Adding a race

1. **Descriptor.** Add `ui/mods/…/race/<id>.js` and list it in
   `shared/races_shipped.js`. Its fields are `id`, `name`, `serverMods` (every
   identifier that counts as the mod active, matched exactly), `unitTypeBit`
   (`Custom<N>`), `commanderTypes`, `commanders`, `commanderArtHue`,
   `playerIcon`, `ai`, `units`, `unitNames`.
2. **Unit table.** `units` keys every spec the race ships by a name of the
   race's own (`shank`, `crusher`). It keys parts by owner plus role
   (`shankAmmo`, `crusherWeapon`, `hiveBuildArm`), research factories as
   `<x>Research`, and unlock tokens as `<x>Unlock`. The table exists for cards
   written for that race alone. Nothing in the referee reads it. Generate it
   from the zip with a throwaway script that reads `display_name` and each
   unit's `tools[].spec_id` / `ammo_id` / `death_weapon`. Do not hand-write it.

   `unitNames` has one consumer: the card tooltips name a race unit from it,
   and they use `gw_play/unit_names.js` when it has no name. So every race
   unit in a cell that a vanilla unit fills needs a name, or the tooltip says
   "Unknown Unit".

3. **AI layout** under `ai.titans` carries `unitMaps` (the mod's own map file)
   and `sources`. `sources` is `{ dir, match }` prefixes under the five build
   directories: a file prefix for Legion's flat `legion_*`, or a sub-directory
   for Bugs' `bugs/`. A race need not ship a complete AI. Its `sources` files
   are layered over the brain's base files, which fill the gaps. `sources`
   serves double duty. It selects the race's own layer, _and_ it is what every
   other race's tree subtracts. So it must cover everything the mod ships under
   race-specific names.

   Add `ai.queller` only when the Queller mod ships the race (`unitMaps`
   relative to the tier, `exclude` the MLA side). Add the brain to `BRAINS` in
   `shared/races.js` if a brain gains a race. The AI modal's per-race cells
   (`shared/brain_table.js`) offer it from there automatically.

4. **Fixture.** Add the server mod (and any companion that supplies base
   specs) to `RACE_MODS` in `scripts/harvest-unit-types.js`, in mount order.
   Then re-run the script, so `test/fixtures/unit_types.json` carries the
   race's units and `buildable_types`.
5. **Tests** in `test/race_<id>.test.js` cover four things. They check the
   descriptor shape. They check that the cells the starter set and the `gwc_`
   cards open all hold a race unit. They check any race-specific grant rule
   (Bugs' research). They check that the withheld-card list is exactly the
   MLA-only set plus whatever the race lacks.
6. **Docs**: add a section in `races.md`, a CHANGELOG line, and anything new
   here.
7. **Live**: play a war as the race and a war against it. Check the primed
   cells, the player's unit list, one group card landing once, the AI founding
   a base, and the deals.

## Conventions the code relies on

- **Race membership is the unit-type bit alone.** A unit is the race's when
  its effective `unit_types` carry `UNITTYPE_<bit>`. Vanilla is `Custom58` or
  no `Custom*` at all. A commander's `buildable_types` is the race's `CmdBuild`
  expression. `races.commanderRetagMods` produces exactly that shape for a
  vanilla commander that a race army keeps.
- **Cells decide what a race player fields.** Nothing per race is hand-mapped.
  `test/unit_groups_cells.test.js` validates the classifier's domain and class
  precedence (`shared/unit_cells.js`) against `shared/unit_groups.js`. A new
  race vocabulary (Legion `Shield`, Bugs `TacticalDefense`, Exiles `Sub`) needs
  no change unless it names a domain or class the classifier does not know.
- **A part belongs to the unit whose directory holds it** when units of
  several cells share it (the Dox's ammo also arms an advanced vehicle).
- **`unit_list.json` is authoritative.** A race's units are the list's. A
  spec that its AI unit map names but its list lacks is a bug in the mod's AI
  data (Bugs' Evolution Chambers). This repo never adds a workaround for it.
- **A race unit in a cell vanilla never fills is granted only when something
  granted can build it** (`buildable_types`, evaluated by
  `shared/build_types.js`). That is how Bugs' research unlock tokens travel
  with its research factories. Legion's spawned helpers are reached through
  their parents and never granted.
- **Identity mods never travel by cell.** A mod on `unit_types`,
  `buildable_types`, `base_spec`, `tools`, `command_caps`, `si_name`, `model`,
  `display_name`, `description`, `transportable`, `transporter` or `attachable`
  stays on the unit it names. So does any descriptor with `exact: true` (the
  Cluster commander conversions in `faction/cluster_setup.js`). And once a list
  remakes a unit that way, every other mod on that unit in the list (its new
  cost, health, storage) stays with it too. This rule was found the hard way.
  The Guardians of a Cluster war carry the Angel-to-commander mods, and by cell
  they turned Exiles' Heron into a broken commander.
- **Cards never change.** They name vanilla units. The race's units follow at
  launch. A card that cannot work by cell goes in
  `cards_deal_helpers.MLA_ONLY`, with a comment that says why. Every
  `_upgrade_` card is MLA-only except the commander's.
- **The race tag travels with every inventory** (`global:playerRace`), the
  host's and each co-op viewer's. Every referee function takes the race per
  army. Never read a race from `model.game().inventory()` when the thing being
  built belongs to a viewer. That inventory is the host's.
- **Commanders.** The player and the AI draw from the descriptor's list. So
  does a co-op viewer under Separate races. The boss keeps its Pumpkin, and the
  Guardians keep their Unicorn. A viewer that kept a stock commander keeps it.
  All of these are retagged. Commander cells receive mods but are never
  granted.
- **Commander art hue.** `commanderArtHue` is the hue that the preview art
  ships in (MLA 210 blue, Legion 0 red). The war setup's Commander picker and
  the co-op loadout scene both rotate from there to the faction colour.
- **Player icon** is a 16px fill/outline pair the race's own mod ships,
  reached through GW Server Mods' root mount (`coui://ui/mods/<mod>/img/…`).
- **Brains.** Titans runs every race, with the mod's own `/pa/ai/` files
  layered over the base game's. Queller runs MLA and Legion. Penchant runs
  MLA. A brain that does not know a race in play is not offered, and
  `races.brainFor` uses Titans instead.
- **The enemy pool is every installed race plus MLA.** To keep a race out of a
  war, disable its mod. Cluster is drawn for like any faction. `gwoAI.isCluster`
  gates its MLA-only mechanics.
- **GW Server Mods** is the only source of which server mods are active, and
  it is the only thing that mounts them. `gw_start` mounts at the root without
  the content remount (that remount freezes the UI). `gw_play` primes the
  race's cells after that mount. It never publishes an index read before that
  mount.

## Known mod-side issues

Each issue gets a bug report in Simplified Technical English (ASD-STE100) for
the mod's author. The report is kept outside the repo (the user's Desktop).

- Bugs' `unit_list.json` lists `/pa/units/air/bug_siren/bug_siren.json`,
  which the zip does not ship (`Failed to load unit spec … .ai0`). Its
  `unit_maps/bugs.json` builds three specs that the list lacks:
  `basic_research_station`, `advanced_research_station` (the Evolution
  Chambers) and `bug_turret_spray`. So its AI cannot research in GW until the
  mod lists them. Report this upstream. The list stays authoritative.
- Exiles' `/pa/units/base/flare/flare.json` tool `flare_sd_Weapon` does not
  parse server-side (`CostStampSpec::parse failed`). Its unit map names two
  specs that the zip does not ship (`adv_tank_hover`, `r_artillery`).
- All three race mods keep their AI files under `/pa/ai/`, so every MLA
  Titans AI merges their build entries at equal priorities. Exiles also ships
  `platoon_templates.json` and `platoon_land_builds.json` at the vanilla
  paths. A vanilla-path file is indistinguishable from a base file in the
  merged listing. So it also enters every Titans race tree's base layer with
  the merged content.

  The land builds differ from `pa_ex1`'s only in the condition strings that
  follow the template change. So the conflict is the template file. It shadows
  GWO's own `platoon_templates.json` while the mod is active (GWO loses its
  Suicide squad on the two Transfer templates). This is accepted for this
  pass. If it ever matters, an AI mod applied at launch would make GWO's edit
  survive whichever file is underneath.

- Legion's GW theming stays off because stock leaves
  `model.player().commanders` as `[null]` in a GW battle.
