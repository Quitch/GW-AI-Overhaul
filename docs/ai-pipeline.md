# The AI-mod pipeline

How a tech card changes what an AI builds.

A card's `buff()` calls `inventory.addAIMods([...])` with descriptor objects. At
battle launch, `ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js` reads
every AI build-order JSON file under the resolved source paths, applies the
in-scope descriptors, and writes the results into the config sent to the server.

These descriptors have **no static JSON schema** — they only ever exist as objects
built at runtime. That is why `npm run validate:ai-mods` checks them by actually
calling every card's `buff()`/`dull()` against a mock inventory rather than by
validating a file.

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

Anything else throws. Note there is no `unit_map` type — unit maps are written by
`referee_game_files.js`, not by this pipeline.

## The op table

Six ops work on `json.build_list` and are valid for `fabber`/`factory`/`platoon`
only. One works on `json.platoon_templates` and is valid for `template` only.

| Op        | Applies to        | Behaviour                                                                                                                                                                              |
| --------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `append`  | build lists       | Concatenates to an array field, or `+=` for a string/number.                                                                                                                           |
| `prepend` | build lists       | The mirror of `append`, value-first.                                                                                                                                                   |
| `replace` | build lists       | Overwrites the field outright.                                                                                                                                                         |
| `unset`   | build lists       | Deletes the field outright. Carries no `value`.                                                                                                                                        |
| `remove`  | build lists       | Removes deep-equal entries from each `build_conditions` test array.                                                                                                                    |
| `new`     | build lists       | Pushes a new entry — into each test array if `idToMod` is truthy, otherwise into `build_conditions` itself. `idToMod` is a flag here, not a field name; `""` reads as the second form. |
| `squad`   | platoon templates | Pushes a unit into `platoon_templates[toBuild].units`.                                                                                                                                 |

`load` is **not in this table**. It is not an op at all: it is handled separately
by `addApplicableAiLoadModsToFileList`, which appends
`/pa/ai_tech/<managerPath(type)>/<value>` to the file list so a whole extra build
file joins the walk. Passing `load` to `applyAiMods` would log
`"Invalid AI mod operation"` and do nothing.

A loaded file is walked like any other, so every in-scope descriptor lands on it
too - **including the loading card's own**. That is what a card usually wants (an
upgrade held alongside it should reach its entries as well), and it is a trap for
the "silence the stock builds, re-supply them from my file" pattern:
`gwaio_start_rapid` zeroes every brain's factory `priority` and loads a file that
carries the replacements, and until the descriptors opted out the zeroing reached
the replacements as well, leaving the Sub Commanders and the Guardians with no
factory they were allowed to build. `treeOnly: true` on a build-list descriptor
keeps it to files read from the AI's tree; `aiModsInScopeOfFile` drops it for any
file under `/pa/ai_tech/`. It is opt-in per descriptor, so nothing else changes.

The commonest descriptor lets one more builder build a list of things - a
fabber upgrade handing the basic fabber the advanced structures, a loadout letting
the Commander build defences. `shared/ai.js` builds that list:

```js
gwoAI.builderAppendMods(
  "fabber",
  ["BasicRadar", "BasicArtillery"],
  "Commander"
);
```

is one `append` to `builders` per name, with `matchAll` set so every list carrying
the build takes it. `gwoAI.advancedStructureBuilds` is the structure list the four
basic-fabber upgrades share.

### How a build op matches

Each of the six build ops walks `json.build_list` and skips any entry whose
`to_build` is not the descriptor's `toBuild`. Then:

```js
var validMatch =
  (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
  Object.prototype.hasOwnProperty.call(build, idToMod);
```

If that holds, the op applies to the build entry itself. If it does not, the op
descends into `build.build_conditions` — an array of arrays of test objects — and
applies to every test where `matchAll` is set, or where `test[refId] === refValue`.

So one descriptor can hit either the build level or the condition level depending
on the file it lands in, and the same descriptor is applied to every file in the
tree. That is the mechanism, and it is also the trap in the next section.

### The `prepend` array trap

`prepend` normalises its value into `arrayValue` **without reassigning `value`**:

```js
var arrayValue = _.isArray(value) ? value : [value];
```

This looks redundant and is not. `append` does `build[idToMod].concat(value)` —
array first, so a scalar is absorbed correctly. `prepend` must do
`value.concat(build[idToMod])` — value first — so a scalar `value` would dispatch
to `String.prototype.concat` instead of `Array.prototype.concat`. Normalising by
overwriting the shared `value` parameter looked like the obvious fix and was a
bug: one descriptor can match both an array target and a string target, and the
wrapped array then leaked into every later string target.

A string target hides this (`['A'] + 'B'` and `'A' + 'B'` both give `'AB'`), which
is why `test/applyAiMods.test.js` pins it on a numeric target, where `[1] + 2` is
`'12'` and not `3`.

## Which AIs get modified

`whichAIsAreBeingModified(clusterPresence, inventory)`:

| Condition                                            | Result            |
| ---------------------------------------------------- | ----------------- |
| Has AI mods (or player is Cluster) **and** Guardians | `"All"`           |
| Has AI mods (or player is Cluster), no Guardians     | `"SubCommanders"` |
| Neither                                              | `"None"`          |

`"All"` exists because Guardians is mirror mode — the enemy is a copy of you, so
your tech has to reach the enemy tree too.

`whoIsCluster()` returns `"Player"` when the player's `global:playerFaction` tag
is 4 _and_ they field at least one ally, `"Enemy"` when the star's AI or any of
its foes is Cluster, else `"None"`.

## Writing the output

`processFilesInDirectory` resolves, per file, which destination path(s) the
contents belong at and which descriptors are in scope, then `writeConfigFiles`
applies and writes. Files are skipped unless they end in `.json`, and
`/neural_networks/` is skipped entirely because AIs fall back to
`/pa/ai/neural_networks/` regardless.

Three behaviours here are worth knowing before editing:

**The Cluster duplication is asymmetric on purpose.**
`applyClusterModsIfNeeded` takes two JSON objects. The player branch uses the
mutated `json`, because the player's own Cluster ally is _supposed_ to receive the
tech. The enemy branch uses `originalJson`, a pre-mod snapshot, so an enemy
Cluster foe never inherits tech the player bought. The deep clone that produces
`originalJson` is skipped entirely unless `clusterPresence === "Enemy"`, since
that is the only branch that reads it.

**A per-viewer pass must not write the enemy's scoped destination.** The base pass
walks the tree once and combines every connected player's mods into e.g.
`player_guardians/`. If each viewer's pass recomputed that too, they would race,
each clobbering the last with only their own mods. Hence
`forceSubCommanderScope` suppressing `scopedEnemyDestinationPath`.

**A shared source doubles as the subcommander's destination.** When enemy and
subcommander resolve to the same source path, the subcommander reads that path
directly. So when a scoped enemy path is also being written, the plain path has to
be pushed onto the write list explicitly — otherwise `writeConfigFiles`' "no paths
resolved, fall back to the original" branch would be skipped and the plain write
lost.

## The tree cache

One launch walks the same trees repeatedly: the enemy tree, the subcommander tree,
and one more pass per connected viewer. `createTreeCache()` memoises
`api.file.list` per path and `$.getJSON` per file, which makes co-op launch cost
flat rather than growing with player count.

Two details make it correct:

- **It hands out copies.** Every pass mutates the JSON it receives — `applyAiMods`
  writes in place and the result is stored in `configFiles` — so the cache keeps
  the pristine parse and `_.cloneDeep`s on the way out.
- **It re-chains rather than re-fetches.** `.then` on a jQuery promise returns a
  new promise each time, so one stored request can be chained off repeatedly
  without being consumed.

The cache is created inside the exported function, so it lives exactly one launch
and a later battle always re-reads from disk.

## Test hook

`referee_ai.js` exposes `applyAiMods` through a `typeof module !== "undefined"`
guard. That branch never executes in the game's Chromium runtime — it exists so
`test/applyAiMods.test.js` can reach a function `define()` never returns. Tests
get at it with `requireShippedModule`, not `loadCouiModule`. See
[`testing.md`](testing.md).

## Where to look next

- [`ai-paths.md`](ai-paths.md) — how the source and destination paths are chosen.
- [`tech-cards.md`](tech-cards.md) — where `addAIMods` gets called from.
- `scripts/validate/ai-mods-contract.js` — the shape checker, which mirrors this
  op table exactly and will fail if the two drift.
