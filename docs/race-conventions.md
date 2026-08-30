# Race conventions

What adding a race to GWO has needed so far, and the rules the race code
relies on. [`races.md`](races.md) explains the design; this is the checklist
and the list of things that must stay true. Update it whenever a race needs
something new.

## Adding a race

1. **Descriptor** `ui/mods/…/race/<id>.js`, listed in
   `shared/races_shipped.js`. Fields: `id`, `name`, `serverMods` (every
   identifier that counts as the mod active, a `-dev` build included),
   `unitTypeBit` (`Custom<N>`), `commanderTypes`, `commanders`,
   `commanderArtHue`, `playerIcon`, `ai`, `units`, `unitNames`.
2. **Unit table.** `units` keys every spec the race ships by a name of the
   race's own (`shank`, `crusher`), parts by owner plus role (`shankAmmo`,
   `crusherWeapon`, `hiveBuildArm`), research factories `<x>Research` and
   unlock tokens `<x>Unlock`. It exists for cards written for that race alone;
   nothing in the referee reads it. Generate it from the zip (a throwaway
   script reading `display_name` and each unit's `tools[].spec_id` /
   `ammo_id` / `death_weapon`), do not hand-write it.
3. **AI layout** under `ai.titans`: `unitMaps` (the mod's own map file) and
   `sources` (`{ dir, match }` prefixes under the five build directories - a
   file prefix for Legion's flat `legion_*`, a sub-directory for Bugs'
   `bugs/`). `ai.queller` only when the Queller mod ships the race
   (`unitMaps` relative to the tier, `exclude` the MLA side). Add the brain to
   `BRAINS` in `shared/races.js` if a brain gains a race.
4. **Fixture.** Add the server mod (and any companion that supplies base
   specs) to `RACE_MODS` in `scripts/harvest-unit-types.js`, in mount order,
   and re-run it so `test/fixtures/unit_types.json` carries the race's units
   and `buildable_types`.
5. **Tests** `test/race_<id>.test.js`: descriptor shape; the cells the starter
   set and the `gwc_` cards open all hold a race unit; any race-specific grant
   rule (Bugs' research); the withheld-card list is exactly the MLA-only set
   plus whatever the race lacks.
6. **Docs**: a section in `races.md`, a CHANGELOG line, and anything new
   here.
7. **Live**: a war as the race and against it - cells primed, the player's
   unit list, one group card landing once, the AI founding a base, deals.

## Conventions the code relies on

- **Race membership is the unit-type bit alone.** A unit is the race's when
  its effective `unit_types` carry `UNITTYPE_<bit>`; vanilla is `Custom58` or
  no `Custom*` at all. A commander's `buildable_types` is the race's `CmdBuild` expression;
  `races.commanderRetagMods` produces exactly that shape for a vanilla
  commander a race army keeps.
- **Cells decide what a race player fields**; nothing per race is hand-mapped.
  The classifier's domain and class precedence
  (`shared/unit_cells.js`) is validated against `shared/unit_groups.js` by
  `test/unit_groups_cells.test.js`; a new race vocabulary (Legion `Shield`,
  Bugs `TacticalDefense`, Exiles `Sub`) needs no change unless it names a
  domain or class the classifier does not know.
- **A part belongs to the unit whose directory holds it** when units of
  several cells share it (the Dox's ammo also arms an advanced vehicle).
- **`unit_list.json` is authoritative.** A race's units are the list's; a
  spec its AI unit map names but its list lacks is a bug in the mod's AI data
  (Bugs' Evolution Chambers), never patched around here.
- **A race unit in a cell vanilla never fills is granted only when something
  granted can build it** (`buildable_types`, evaluated by
  `shared/build_types.js`). That is how Bugs' research unlock tokens travel
  with its research factories; Legion's spawned helpers are reached through
  their parents and never granted.
- **Cards never change.** They name vanilla units; the race's units follow at
  launch. A card that cannot work by cell goes in
  `cards_deal_helpers.MLA_ONLY` (Paratrooper, Nomad, Killswitch, Deepspace
  Radar) - every `_upgrade_` card is MLA-only except the commander's.
- **The race tag travels with every inventory** (`global:playerRace`), the
  host's and each co-op viewer's, and every referee function takes the race
  per army. Viewers share the host's race in this pass.
- **Commanders.** The player and the AI draw from the descriptor's list. The
  boss keeps its Pumpkin, the Guardians their Unicorn, a co-op viewer its stock
  pick - all retagged. Commander cells receive mods but are never granted.
- **Commander art hue.** `commanderArtHue` is the hue the preview art ships
  in (MLA 210 blue, Legion 0 red); the picker rotates from there to the
  faction colour.
- **Player icon** is a 16px fill/outline pair the race's own mod ships,
  reached through GW Server Mods' root mount (`coui://ui/mods/<mod>/img/…`).
  Bugs' client mod ships Exiles' files under Exiles' name.
- **Brains.** Titans runs every race from the mod's own `/pa/ai/` files;
  Queller runs MLA and Legion; Penchant MLA. A brain that does not know a race
  in play is not offered, and `races.brainFor` falls back to Titans.
- **The enemy pool is every installed race plus MLA.** Keeping a race out of a
  war means disabling its mod. Cluster is always MLA and is not drawn for.
- **GW Server Mods** is the only source of which server mods are active and
  the only thing that mounts them. `gw_start` mounts at the root without the
  content remount (that remount freezes the UI); `gw_play` primes the race's
  cells after that mount, and never publishes an index read before it.

## Known mod-side issues

Each gets a bug report in Simplified Technical English (ASD-STE100) for the
mod's author, kept outside the repo (the user's Desktop).

- Bugs' `unit_list.json` lists `/pa/units/air/bug_siren/bug_siren.json`,
  which the zip does not ship (`Failed to load unit spec … .ai0`), and its
  `unit_maps/bugs.json` builds three specs the list lacks -
  `basic_research_station`, `advanced_research_station` (the Evolution
  Chambers) and `bug_turret_spray` - so its AI cannot research in GW until the
  mod lists them. Report upstream; the list stays authoritative.
- Exiles' `/pa/units/base/flare/flare.json` tool `flare_sd_Weapon` does not
  parse server-side (`CostStampSpec::parse failed`).
- All three race mods keep their AI files under `/pa/ai/`, so every MLA
  Titans AI merges their build entries at equal priorities - the Exiles
  collision in the plan; not addressed yet.
- Legion's GW theming stays off because stock leaves
  `model.player().commanders` as `[null]` in a GW battle.
