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
    matchAll: false, // optional: match every test, ignore refId/refValue
    treeOnly: false, // optional: skip files a `load` pulled in from /pa/ai_tech/
  },
]);
```

`type` maps to a directory via `managerPath()`:

| `type`     | Directory            |
| ---------- | -------------------- |
| `fabber`   | `fabber_builds/`     |
| `factory`  | `factory_builds/`    |
| `platoon`  | `platoon_builds/`    |
| `template` | `platoon_templates/` |

Anything else throws. Note that there is no `unit_map` type.
`referee_game_files.js` writes unit maps, not this pipeline.

## The op table

Six ops work on `json.build_list` and are valid for `fabber`/`factory`/`platoon`
only. One works on `json.platoon_templates` and is valid for `template` only.

| Op        | Applies to        | Behaviour                                                                                                                                                                            |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `append`  | build lists       | Concatenates to an array field, or `+=` for a string/number.                                                                                                                         |
| `prepend` | build lists       | The mirror of `append`, value-first.                                                                                                                                                 |
| `replace` | build lists       | Overwrites the field outright.                                                                                                                                                       |
| `unset`   | build lists       | Deletes the field outright. Carries no `value`.                                                                                                                                      |
| `remove`  | build lists       | Removes deep-equal entries from each `build_conditions` test array.                                                                                                                  |
| `new`     | build lists       | Pushes a new entry into each test array if `idToMod` is truthy, otherwise into `build_conditions` itself. `idToMod` is a flag here, not a field name. `""` reads as the second form. |
| `squad`   | platoon templates | Pushes a unit into `platoon_templates[toBuild].units`.                                                                                                                               |

`load` is **not in this table**. It is not an op at all.
`addApplicableAiLoadModsToFileList` handles it separately. That function appends
`/pa/ai_tech/<managerPath(type)>/<value>` to the file list, so a whole extra
build file joins the walk. If a caller passes `load` to `applyAiMods`, the
function logs `"Invalid AI mod operation"` and does nothing.

The pipeline walks a loaded file like any other file. So every in-scope
descriptor also applies to it, **including the loading card's own**. That is
usually what a card wants: an upgrade held alongside the card should reach its
entries as well.

But it is a trap for the "silence the stock builds, re-supply them from my file"
pattern. `gwaio_start_rapid` zeroes every brain's factory `priority` and loads a
file that carries the replacements. Until the descriptors excluded the loaded
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

That call is one `append` to `builders` per name. It sets `matchAll`, so every
list that carries the build takes it. `gwoAI.advancedStructureBuilds` is the
structure list that the four basic-fabber upgrades share.

### How a build op matches

Each of the six build ops walks `json.build_list` and skips any entry whose
`to_build` is not the descriptor's `toBuild`. Then:

```js
var validMatch =
  (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
  Object.prototype.hasOwnProperty.call(build, idToMod);
```

If that holds, the op applies to the build entry itself. If it does not, the op
descends into `build.build_conditions`, which is an array of arrays of test
objects. There the op applies to every test where `matchAll` is set, or where
`test[refId] === refValue`.

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

`processFilesInDirectory` resolves, per file, which destination path(s) the
contents belong at and which descriptors are in scope. Then `writeConfigFiles`
applies and writes. Three kinds of file are skipped:

- A file is skipped unless it ends in `.json`.
- `/neural_networks/` is skipped entirely, because AIs use
  `/pa/ai/neural_networks/` regardless.
- A file that a registered race's layer claims is skipped, because it belongs to
  that race's own tree ([`races.md`](races.md), "Race trees").

Three behaviours here are worth knowing before editing:

**The Cluster duplication is asymmetric on purpose.**
`applyClusterModsIfNeeded` takes two JSON objects. The player branch uses the
mutated `json`, because the player's own Cluster ally is _supposed_ to receive the
tech. The enemy branch uses `originalJson`, a pre-mod snapshot, so an enemy
Cluster foe never inherits tech the player bought. The code skips the deep clone
that produces `originalJson` entirely unless `clusterPresence === "Enemy"`. That
is the only branch that reads it.

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

## The tree cache

One launch walks the same trees repeatedly: the enemy tree, the subcommander tree,
and one more pass per connected viewer. `createTreeCache()` memoises
`api.file.list` per path and `$.getJSON` per file. That makes the co-op launch
cost flat instead of growing with player count.

Two details make it correct:

- **It returns copies.** Every pass mutates the JSON it receives: `applyAiMods`
  writes in place, and the result is stored in `configFiles`. So the cache keeps
  the pristine parse and `_.cloneDeep`s on the way out.
- **It re-chains rather than re-fetches.** `.then` on a jQuery promise returns a
  new promise each time. So the cache can chain from one stored request
  repeatedly without consuming it.

The cache lives exactly one launch. `gw_play/referee.js` creates it on the first
hire after `launchingFight` becomes true. It passes the same cache to every hire
of that launch through `ref.treeCache`. So a co-op host's shared and own referee
passes read each tree file once between them. The next Fight starts from disk
again. A run that receives no cache (tests, the console) creates its own.

## Test hook

`referee_ai.js` exposes `applyAiMods` through a `typeof module !== "undefined"`
guard. That branch never executes in the game's Chromium runtime. It exists so
`test/applyAiMods.test.js` can reach a function that `define()` never returns.
Tests reach it with `requireShippedModule`, not `loadCouiModule`. See
[`testing.md`](testing.md).

## Where to look next

- [`ai-paths.md`](ai-paths.md): how GWO chooses the source and destination paths.
- [`tech-cards.md`](tech-cards.md): where `addAIMods` gets called from.
- `scripts/validate/ai-mods-contract.js`: the shape checker. It mirrors this op
  table and fails if the two drift. It also carries `load`. `load` is not an op
  here, but it is a descriptor a card can emit, so the checker checks its shape
  too.
