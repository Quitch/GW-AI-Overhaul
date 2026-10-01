# The AI-mod pipeline

This page explains how a tech card changes what an AI builds.

A card's `buff()` calls `inventory.addAIMods([...])` with descriptor objects. At
battle launch, `ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js` reads
every AI build-order JSON file under the resolved source paths. It applies the
in-scope descriptors, and it writes the results into the config sent to the
server.

These descriptors have **no static JSON schema**. They only ever exist as objects
built at runtime. That is why `npm run validate:ai-mods` checks them by calling
every card's `buff()`/`dull()` against a mock inventory, not by validating a
file.

## Descriptor shape

```js
inventory.addAIMods([
  {
    type: "factory", // fabber | factory | platoon | template
    op: "replace", // see the op table below
    toBuild: "Bot", // which build_list entry this targets
    idToMod: "priority", // which field on that entry
    value: 100,
    refId: "test_type", // optional: narrows the match
    refValue: "HaveEcoForAdvanced",
    matchAll: false, // optional: at the condition level, every test
    treeOnly: false, // optional: skip files a `load` pulled in from /pa/ai_tech/
  },
]);
```

`type` names a build directory. A `load` finds its file's directory through
`managerPath()` in `shared/race_ai_mods.js`. Every other op applies to a file
whose path contains that directory: `pathTypeMap` in `gw_play/referee_ai.js`
maps each directory back to its `type`.

| `type`     | Directory            |
| ---------- | -------------------- |
| `fabber`   | `fabber_builds/`     |
| `factory`  | `factory_builds/`    |
| `platoon`  | `platoon_builds/`    |
| `template` | `platoon_templates/` |

Any other `type` has no directory. On a `load`, `managerPath()` returns
`undefined`, and the referee logs `Invalid AI file type in load mod` and adds
no file. It does not throw: its callers in the referee run in a deferred
callback, where a throw is swallowed and hangs the battle launch. On every other
op, the descriptor matches no file and does nothing, and nothing is logged.
`npm run validate:ai-mods` rejects an unknown `type` in a shipped card. Note
that there is no `unit_map` type, so no descriptor reaches a unit map. This pipeline copies a tree's untagged maps with its other
files, and `referee_game_files.js` writes the tagged ones.

## The op table

Seven ops work on `json.build_list` and are valid for `fabber`/`factory`/`platoon`
only. One works on `json.platoon_templates` and is valid for `template` only.

| Op        | Applies to        | Behaviour                                                                                                                                                                            |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `append`  | build lists       | Concatenates to an array field, or `+=` for a string/number.                                                                                                                         |
| `prepend` | build lists       | The mirror of `append`, value-first.                                                                                                                                                 |
| `replace` | build lists       | Overwrites the field outright.                                                                                                                                                       |
| `unset`   | build lists       | Deletes the field outright. Carries no `value`.                                                                                                                                      |
| `remove`  | build lists       | Removes deep-equal entries from each `build_conditions` test array.                                                                                                                  |
| `new`     | build lists       | Pushes a new entry into each test array if `idToMod` is truthy, otherwise into `build_conditions` itself. `idToMod` is a flag here, not a field name. `""` reads as the second form. |
| `silence` | build lists       | Sets `priority` to 0 on every build whose `builders` are all in `value.builders`, except a build whose `to_build` is in `value.except`.                                              |
| `squad`   | platoon templates | Pushes a unit into `platoon_templates[toBuild].units`.                                                                                                                               |

`silence` does not use the `toBuild` matcher. It selects a build by its
`builders`, and it reads only `value`. A build with one builder outside
`value.builders` stays as it is, and so does a build with no `builders`.

`load` is **not in this table**. It is not an op at all.
`addApplicableAiLoadModsToFileList` handles it separately. That function appends
`/pa/ai_tech/<managerPath(type)>/<value>` to the file list, so a whole extra
build file joins the walk. If a caller passes `load` to `applyAiMods`, the
function logs `"Invalid AI mod operation"` and does nothing. Nothing checks
that a third-party card's `value` names a file that exists, so a load file that
cannot be read is logged and skipped. Every other file that cannot be read
fails the battle.

The pipeline walks a loaded file like any other file. So every in-scope
descriptor also applies to it, **including the loading card's own**. That is
usually what a card wants: an upgrade held alongside the card should reach its
entries as well.

But it is a trap for the "silence the stock builds, re-supply them from my file"
pattern. `gwaio_start_rapid` zeroes every brain's factory `priority` and loads a
file that carries the replacements. It also uses `silence` on the factory side,
to zero every unit the brain orders from a factory except the fabbers, because a
Rapid factory builds only fabbers. Until the descriptors excluded the loaded
file, the zeroing reached the replacements as well. That left the Sub Commanders
and the Guardians with no factory they were allowed to build.

`treeOnly: true` on a build-list descriptor keeps it to files read from the AI's
tree. `aiModsInScopeOfFile` drops such a descriptor for any file under
`/pa/ai_tech/`. The flag is opt-in per descriptor, so nothing else changes.

The commonest descriptor lets one more builder build a list of things. Examples
are a fabber upgrade that hands the basic fabber the advanced structures, or a
loadout that lets the Commander build defences. `shared/ai.js` builds that list:

```js
gwoAI.builderAppendMods(
  "fabber",
  ["BasicRadar", "BasicArtillery"],
  "Commander"
);
```

That call is one `append` to `builders` per name. It sets no `refId`, so every
entry for the name with a `builders` list takes it, in every file the pipeline
walks. It also sets `matchAll`, so where an entry keeps `builders` in its
conditions instead, every test that has one takes it (see below).
`gwoAI.advancedStructureBuilds` is the structure list that the four
basic-fabber upgrades share.

### How a build op matches

`append`, `prepend`, `replace`, and `unset` share one walk
(`forEachMatchingTarget`). It goes through `json.build_list` and skips any
entry whose `to_build` is not the descriptor's `toBuild`. Then:

```js
var validMatch =
  (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
  Object.prototype.hasOwnProperty.call(build, idToMod);
```

If that holds, the op applies to the build entry itself. If it does not, the op
descends into `build.build_conditions`, which is an array of arrays of test
objects. There the op applies to every test where `matchAll` is set, or where
`test[refId] === refValue`.

`remove` and `new` skip the same entries, but ignore `refId`, `refValue`, and
`matchAll`: every entry left takes the op, as the op table describes it.

So one descriptor can hit either the build level or the condition level,
depending on the file it is applied to. And the pipeline applies the same descriptor
to every file in the tree. That is the mechanism. It is also the trap in the
next section.

### The `prepend` array trap

`prepend` normalises its value into `arrayValue` **without reassigning `value`**:

```js
var arrayValue = _.isArray(value) ? value : [value];
```

This looks redundant, and it is not. `append` does `build[idToMod].concat(value)`,
with the array first, so it absorbs a scalar correctly. `prepend` must do
`value.concat(build[idToMod])`, with the value first. So a scalar `value` would
dispatch to `String.prototype.concat` instead of `Array.prototype.concat`.

Normalising by overwriting the shared `value` parameter looked like the obvious
fix, and it was a bug. One descriptor can match both an array target and a
string target. The wrapped array then leaked into every later string target.

A string target hides this bug: `['A'] + 'B'` and `'A' + 'B'` both give `'AB'`.
That is why `test/applyAiMods.test.js` pins the bug on a numeric target, where
`[1] + 2` is `'12'` and not `3`.

## Which AIs get modified

`whichAIsAreBeingModified(clusterPresence, inventory)`:

| Condition                                            | Result            |
| ---------------------------------------------------- | ----------------- |
| Has AI mods (or player is Cluster) **and** Guardians | `"All"`           |
| Has AI mods (or player is Cluster), no Guardians     | `"SubCommanders"` |
| Neither                                              | `"None"`          |

`"All"` exists because Guardians is mirror mode. The enemy is a copy of you, so
your tech has to reach the enemy tree too.

`whoIsCluster()` returns `"Player"` when the player's `global:playerFaction` tag
is 4 _and_ they field at least one ally. It returns `"Enemy"` when the star's AI
or any of its foes is Cluster. Otherwise it returns `"None"`.

## Writing the output

`resolveWrites` resolves, per file, which destination path(s) the contents
belong at and which descriptors are in scope. Then `writeConfigFiles` applies
and writes. Three kinds of file are skipped:

- A file is skipped unless it ends in `.json`.
- `/neural_networks/` is skipped entirely, because AIs use
  `/pa/ai/neural_networks/` regardless.
- A file that a registered race's layer claims is skipped, because it belongs to
  that race's own tree ([`races.md`](races.md), "Race trees").

Three behaviours here are worth knowing before editing:

**The Cluster duplication is asymmetric on purpose.**
`writeClusterCopy` takes two JSON objects. The player branch uses the
mutated `json`, because the player's own Cluster ally is _supposed_ to receive the
tech. The enemy branch uses `originalJson`, a pre-mod snapshot, so an enemy
Cluster foe never inherits tech the player bought. The code skips the deep clone
that produces `originalJson` entirely unless `clusterPresence === "Enemy"`. That
is the only branch that reads it. The enemy branch also skips `/pa/ai_tech/` files
outright. Under a shared source every file reads as `"shared"`, so the snapshot
alone would not stop a `load` file being copied into the Cluster tree.

**A per-viewer pass must not write the enemy's scoped destination.** The base pass
walks the tree once. It combines every connected player's mods into one
destination, for example `player_guardians/`. If each viewer's pass recomputed
that too, the passes would race. Each would clobber the last with only its own
mods. That is why `forceSubCommanderScope` suppresses
`scopedEnemyDestinationPath`.

**A shared source doubles as the subcommander's destination.** When the enemy
and the subcommander resolve to the same source path, the subcommander reads that
path directly. So when a scoped enemy path is also written, the code has to push
the plain path onto the write list explicitly. Otherwise `writeConfigFiles`' "no
paths resolved, fall back to the original" branch would be skipped, and the plain
write would be lost.

## Race trees

A race AI reads a race tree ([`races.md`](races.md), "Race trees"). Each tree
takes the AI mods of the inventories whose mods the MLA tree in its place takes
(`referee_ai.js`'s `raceTreeJobs`):

- An enemy and its foes take none. Under Guardians they take every player's:
  the host's, the connected viewers', and the co-op AI players'.
- The host's Sub Commanders and the star's ally take the host's. Under
  Guardians they take every player's.
- A viewer's Sub Commanders take the viewer's.
- A co-op AI player's tree, and its Sub Commanders' tree under per-player
  tech, take its own inventory's. Under shared tech that is the host's.

A tree's destination changes whenever its list does, so the (source,
destination) key that joins two jobs into one never joins two lists.

The descriptors name stock unit-map keys, and a race tree does not use them.
Its stock items are stripped, and its race's own items name the race's keys.
No race key equals a stock key, and the stock class keys (`Commander`,
`AnyBasicFabber`, `AnyAdvancedFabber`, `AnyBasicFactory`, `AnyAdvancedFactory`,
and Titans' `SupportCommander`) require `Custom58`, which no race unit
carries. So `writeRaceTree` first aims the descriptors at the race's keys
(`shared/race_ai_mods.js`). It works from the context
`referee_game_file_paths.raceKeysFor` resolves: the brain's stock maps, the
race's maps, the stock keys the army's map re-points, the race's cells, and
its `engineKeys`. The cells are the tree's own read, through
`race_cells.indexFor`, not the ones `gw_play/races.js` primes, so a tree does
not depend on priming having finished before Fight. Without the race's cells
(no race unit in the unit list read) nothing is aimed, and the tree takes no AI
mods. A failed unit list read fails the battle.

**A key's targets.** Each `toBuild` and each builder key is aimed by the first
rule that fits:

1. A key the stock maps lack is kept as written: a race's key, or a third
   party's.
2. A class key (a `unit_types` expression) becomes the race keys whose units
   all stand in for the class's vanilla members. `Commander` becomes Legion's
   `LegionCommander`.
3. A spec key the army's map keeps is kept as written. The map keeps a key
   whose `engineKeys` entry is `null`, a `stockUnits` unit, a unit the race
   builds itself, and a unit that stands for nothing, unless it is an intel
   unit (races.md, "Jobs"). Exiles keeps `BasicMetalExtractor` this way.
4. A spec key whose unit the inventory's own cards remake is dropped (below).
5. Any other spec key becomes the race keys that name the race's `engineKeys`
   unit for it, or else its stand-ins.

A race key names a set of units when its units are not empty and all of them
are in the set. Its units are its `spec_id`, or the race's units its
`unit_types` expression matches. So `OrbitalLauncher` becomes Legion's
`LegionFactoryBasicOrbital` and not `AnyLegionFactoryOrbital`, which also
covers the advanced orbital factory.

**The guard.** A builder key joins a target only when every unit it covers has
`buildable_types` that match every unit of the target. A key that covers no
unit fails, and so does a unit with no `buildable_types`, such as Bugs'
research tokens. A stock structure key stands for its whole race cell
(`BasicLandDefense` for seven Legion keys), so without the guard a builder
would be ordered to build what it cannot, and the engine repeats a refused
order. An `append`, `prepend`, or `replace` of `builders` that has no builder
left for a target lands nothing there.

**Remade units.** A card that remakes a unit keeps every change it makes to
that unit on the MLA file ([`tech-cards.md`](tech-cards.md), "Which races a
card reaches"), and a descriptor that names the unit stays on MLA with it. The
units are `unit_cells.remadeFiles` over the same inventories' spec mods.
Defense Tech Commander's builder appends name the defences it remakes, so a
race tree would take none of them. That is why the loadout is in
`cards_deal_helpers.MLA_ONLY`, with the other loadouts that remake MLA units.

**Kept as written.** `refId` and `refValue`, which name one stock item.
Conditions and their `string0` keys, which the army's map resolves. `platoon`
and `template` descriptors. `silence` has its `builders` and `except` aimed
without the guard, and is dropped when no builder is left.

**Passes.** As `expandMods` lands a spec mod ([`races.md`](races.md),
"Capability cells"), a target and a change land once per pass. Two stock keys
that reach one race key change it once. A pass ends when a stock key already
seen for it comes again, so a second copy of a card stacks.

**Load files.** Each `load` file is read from `/pa/ai_tech/` through the tree
cache and aimed. The in-scope descriptors are then walked over it, `treeOnly`
ones excepted, and it is written at the tree's destination. A file that cannot
be read is logged and skipped. The aim copies each item once per target, with
the builders that pass the guard for that target, and drops an item left with
no builder. An item with no `to_build`, such as Tourist Commander's `GiveUp`,
keeps its aimed builders without the guard. A `platoon` or `template` load's
file is written as it is: a platoon item names a template and has no builders.

A co-op AI player of a race counts only the AI mods its race's tree takes
([`tech-cards.md`](tech-cards.md), "A race's units").

## The tree cache

One launch walks the same trees repeatedly: the enemy tree, the subcommander tree,
and one more pass per connected viewer. `createTreeCache()` memoises
`api.file.list` per path and `$.getJSON` per file. That makes the co-op launch
cost flat instead of growing with player count.

Two details make it correct:

- **It returns copies.** Every pass mutates the JSON it receives: `applyAiMods`
  writes in place, and the result is stored in `configFiles`. So the cache keeps
  the pristine parse and `_.cloneDeep`s on the way out. Listings are copied too:
  `processDirectories` pushes the pass's `load` paths onto its listing. A shared
  array would carry the host's `/pa/ai_tech/` files into every later pass, a
  viewer's tree and a race tree included.
- **It holds native promises and re-chains rather than re-fetches.** Each
  request, the engine's `api.file.list` and jQuery's `$.getJSON`, is adopted
  into a native promise when it is made. `.then` returns a new promise each
  time, so the cache can chain from one stored request repeatedly without
  consuming it. Native, because neither original settles a failure safely: the
  engine's promise never settles a `.then` given no error callback when the
  call fails, and jQuery's lets a callback's throw escape rather than reject.
  Either would leave a failed listing or a file that throws in the per-file
  work hanging the launch.

The cache lives exactly one launch. `gw_play/referee.js` creates it on the first
hire after `launchingFight` becomes true. It passes the same cache to every hire
of that launch through `ref.treeCache`. So a co-op host's shared and own referee
passes read each tree file once between them. The next Fight starts from disk
again. A run that receives no cache (tests, the console) creates its own.

## Test hook

`referee_ai.js` exposes `applyAiMods`, `raceTreeJobs`, `coopAiTreeRequests`, and
`writeRaceTree` through a `typeof module !== "undefined"` guard. That branch
never executes in the game's Chromium runtime. It exists so tests can reach
functions that `define()` never returns: `test/applyAiMods.test.js` and
`test/rapid_builders.test.js` take `applyAiMods`, and
`test/referee_ai_race_trees.test.js`, `test/referee_ai_coop_trees.test.js`, and
`test/referee_ai_file_processing.test.js` take the rest. Tests reach them with `requireShippedModule`, not
`loadCouiModule`. See [`testing.md`](testing.md).

## Where to look next

- [`ai-paths.md`](ai-paths.md): how GWO chooses the source and destination paths.
- [`tech-cards.md`](tech-cards.md): where `addAIMods` gets called from.
- `scripts/validate/ai-mods-contract.js`: the shape checker. It mirrors this op
  table by hand, and nothing compares the two, so change both together. It also
  carries `load`. `load` is not an op here, but it is a descriptor a card can
  emit, so the checker checks its shape too.
