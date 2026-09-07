# Unit spec modification

`ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js` applies a card's
`inventory.addMods()` descriptors to unit specs before a battle launches.

## Descriptor shape

```js
inventory.addMods([
  { file: gwoUnit.dox, path: "max_health", op: "multiply", value: 1.5 },
]);
```

`shared/cards.js` provides `mods(file, op, props)` for the common case of one file
and op applied to several paths:

```js
gwoCard.mods(gwoUnit.dox, "replace", { max_health: 100, max_speed: 12 });
```

It also provides `flatMapMods(files, op, props)` for the same props over a list of
files. A single file is accepted too. It emits one file's entries before the
next's, in `props` key order. That order matters where a later descriptor overrides
an earlier one:

```js
gwoCard.flatMapMods(gwoGroup.botsAmmo, "multiply", {
  damage: 1.25,
  splash_damage: 1.25,
});
```

Where every path takes the **same** value, pass the paths as a list and give the
value last. This avoids repeating the value per key. The attribute sets that cards
scale together are published as `gwoCard.paths`: `navigation` (the four movement
stats), `damage` (`damage` and `splash_damage`) and `energyWeapon` (the ammo
triple). The example is therefore also:

```js
gwoCard.flatMapMods(gwoGroup.botsAmmo, "multiply", gwoCard.paths.damage, 1.25);
```

To scale one of those sets **and** something else in the same pass, build the map
with `eachPath(paths, value)` and merge the rest into it. Two concatenated
`flatMapMods` calls would emit every unit's navigation entries before any unit's
health. This form keeps each unit's entries together:

```js
gwoCard.flatMapMods(
  gwoGroup.botsMobile,
  "multiply",
  _.assign(gwoCard.eachPath(gwoCard.paths.navigation, 1.5), { max_health: 1.5 })
);
```

Vision and radar radii live in a unit's `recon.observer.items` array, one slot per
layer and channel. A radar card therefore scales the first few slots at once.
`observerPaths(count, field)` names that field on the first `count` slots:

```js
gwoCard.mods(
  gwoUnit.radar,
  "multiply",
  gwoCard.observerPaths(5, "radius"),
  1.5
);
```

## The op table

| Op                 | Behaviour                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `multiply`         | Numeric multiply. Warns and leaves unchanged if the target is missing or not a number.           |
| `add`              | Numeric add or string concat. A nullish target becomes the value.                                |
| `replace`          | Overwrites outright.                                                                             |
| `merge`            | `_.assign` into a plain object. Warns if the target is not one.                                  |
| `push`             | Appends to an array, wrapping a non-array target first.                                          |
| `pull`             | `_.pull`: removes values from an array.                                                          |
| `prepend`          | **GWO addition.** The counterpart to `push`, value-first.                                        |
| `wipe`             | **GWO addition.** String substitution: `[from, to]`, or a bare value to delete every occurrence. |
| `multiplyOrCreate` | **GWO addition.** Multiplies if numeric, creates the value if absent.                            |
| `clone`            | Deep-copies a spec to a new tagged id. Runs first, so other ops can target the copy.             |
| `tag`              | Rewrites a `.json` reference to carry the current `specTag`.                                     |
| `eval`             | Runs `new Function("attribute", value)`.                                                         |

`prepend` and `wipe` exist because the base ops cannot do those jobs. Order matters
for `buildable_types` and build lists, where the engine takes the **first** match.
To append an alternative and to prepend one are therefore genuinely different
operations. `wipe` substitutes _within_ a string value. Every base op replaces the
whole thing.

`multiplyOrCreate` is a GWO addition, but the behaviour it provides is not new. It
is what the base game's `multiply` did: `attribute !== undefined ? attribute * value : value`.
GWO's `multiply` no longer creates. A missing or non-numeric target now warns and is
left alone. A card that wants creation therefore has to ask for it by name. The
split turns a typo'd path into a warning rather than a silently invented stat. The
split is also why `multiplyOrCreate` runs before `multiply` in the op ordering.

`eval` is theoretically unsafe. It is also pointless to worry about it: mods can run
whatever code they like anyway, so the risk is not meaningful.

### Creating an attribute that doesn't exist

No op ever learns whether the attribute was there. The path walker creates the leaf
key _before_ it calls the op. The key is created as `undefined`, or as an empty
container for `push`, `pull` and `merge`. An op therefore branches only on the value
it was handed. A missing attribute and one that explicitly holds `null` reach the op
looking the same. That distinction only appears in one place, noted under the table.

The walker creates missing intermediate segments too. A path that goes several
levels deeper than the stock spec therefore still lands. `replace` writes whatever it
is given regardless. It is therefore the op to use, unless the new value has to be
derived from the old one.

| Op                        | Attribute missing                             | Attribute present, holding `null` |
| ------------------------- | --------------------------------------------- | --------------------------------- |
| `replace`                 | Writes the value.                             | Writes the value.                 |
| `multiplyOrCreate`        | Writes the value.                             | Writes the value.                 |
| `add`                     | Writes the value.                             | Writes the value.                 |
| `push`, `prepend`, `pull` | Creates the array.                            | Creates the array.                |
| `wipe`                    | Creates the string.                           | Creates the string.               |
| `multiply`                | **Warns, writes nothing.**                    | **Warns, writes nothing.**        |
| `merge`                   | Creates the object. The walker seeds it `{}`. | **Warns, writes nothing.**        |

`multiply` is the one to watch. It deliberately does not create (see above). A card
that wants creation asks for `multiplyOrCreate` by name.

`merge` is the exception: for it, a missing attribute and a `null` value do not
behave alike. It needs a plain object to `_.assign` into, and a `null` is not one.
The two cases therefore diverge. To seed over an explicit `null`, use a `replace`
first, or a `replace` alone.

### Writing a spec reference

Mods run **after** `genUnitSpecs` tags the army's specs. A `.json` path that a mod
writes therefore arrives untagged. Untagged paths still resolve, to the stock file.
That is why the mistake is invisible: the weapon fires, the unit spawns, and none of
the player's other tech touches it.

Every mod whose value is a spec reference therefore needs a second mod, `op: "tag"`,
on the same path:

```js
{ file: gwoUnit.wyrm, path: "tools.0.spec_id", op: "replace", value: gwoUnit.typhoonWeapon },
{ file: gwoUnit.wyrm, path: "tools.0.spec_id", op: "tag" },
```

Three things follow from this.

The tag needs the **final** index. `clone` and `replace` run before `push`, `prepend`
and `tag` (see the op ordering). A tool pushed onto a four-tool unit is therefore
tagged at `tools.4.spec_id`. The index comes from the stock spec, not the card.

The target must **exist tagged**. Otherwise the tag points at nothing, and the tool
is lost outright. A file that the unit already references is covered, because
`tagSpec` walked it. A file borrowed from another unit is not covered. It belongs in
`additionalSpecs`, which is concatenated onto every army's spec list. Tagging
cascades from there: tag a weapon, and its `ammo_id` comes with it, and so does any
`spawn_unit_on_death` that ammo has.

`tag` **rewrites** the suffix rather than append one. A second application is
therefore harmless. It has to be idempotent, because the op ordering hoists every
`replace` ahead of every `tag`. When two cards tag the same path, the paired
`replace` that would reset the value no longer sits between them. The second `tag`
then sees a value that the first already tagged. `gwaio_protocol_killswitch` and
`gwaio_upgrade_colonel` both tag the Colonel's `death_weapon.ground_ammo_spec`, so
a player who holds both hits this.

Co-op per-player tech hits it too. There, `guardianMods` concatenates every viewer's
mods, and two players who hold one card contribute its `tag` twice.

The reference fields that count are the ones `tagSpec` renames: `base_spec`,
`tools[].spec_id`, `ammo_id`, `replaceable_units`, `buildable_projectiles`,
`factory.initial_build_spec`, `death_weapon.ground_ammo_spec`,
`death_weapon.air_ammo_spec` and `spawn_unit_on_death`.

### Pathless mods

```js
var opsWithoutPath = { eval: true, clone: true };
```

Only these two do something useful when applied to a whole spec with no path. They
mutate their target in place or write to `specs` directly. Every other op merely
returns a new value, so a pathless mod for it is a silent no-op.

A pathless `clone` is the only way to mint a new spec id. That is why it leads the
op ordering. A mod that names the copy has to find it already in `specs`. Otherwise
`load` returns nothing, and the mod is dropped with
`"Warning: File not found in mod"`. The ordering also means `replace`, `multiply`,
`multiplyOrCreate` and `add` can all target a copy. The ops after them (`merge`,
`push`, `pull`, `prepend`, `wipe`, `tag`) apply to the copy in the order the card
declares them.

## Path segments

A `path` walks into nested spec structure. There are two conventions:

- A **numeric** segment indexes into an array.
- `"+"` **appends**. This is the base game's own convention for adding an array
  element.

When an intermediate segment is missing, the walker creates a container. It creates
an array if the _next_ segment indexes into one, otherwise a plain object. The
walker treats the leaf segment differently. The leaf is allowed to see a real
"missing" signal, so that ops like `multiplyOrCreate` and `add` can tell "absent"
from "present".

## Arrays replace, they do not merge

`_.merge`'s default behaviour for arrays is index-by-index, which is wrong for PA
specs. Arrays here represent **complete lists**: ammo layers, unit type tags, target
priorities. A derived spec's array must therefore fully replace the base's rather
than merge element-wise. An index-by-index merge was the root cause of the
`ammo_id` string/array corruption.

The customiser handles arrays and returns `undefined` for everything else. That
`undefined` falls through to `_.merge`'s default. This is deliberate: objects
_should_ merge key-by-key, which is what `events` and `audio` need.

No defensive `cloneDeep` is needed around this. Specs contain only plain objects,
arrays and primitives. `_.merge` creates a new object without mutating its
arguments. The array replacer clones any array it returns.

## The empty-navigation trap

The game treats any unit with a `navigation` object as mobile, **even an empty
one**. A mod that writes into `navigation` and then removes the value leaves
`navigation: {}` behind, once JSON serialisation drops the now-`undefined` key. The
result is a structure wrongly marked mobile, which adds needless Nav Agent load.

`pruneEmptyNavigation` handles this. It must inspect the _file's top-level_ spec.
That is why the reference to that spec is captured before the path walk reassigns
`spec` to a nested container. The first path segment (e.g. `"navigation"`) is
always created on the top-level spec.

Note that "empty" here means _empty after serialisation_. `JSON.stringify` drops a
key whose value is `undefined`. `navigation` therefore counts as non-empty only if
at least one value survives it.

## Spec caching

Galactic War calls the base game's `GW.specs.genUnitSpecs(units, tag)` once per AI
faction **and** once for the player. Each call re-fetches and re-parses every spec
file it walks. `shared/spec_cache.js` is a drop-in replacement that fetches and
parses each file at most once and reuses it across every tag.

The invariant that makes it safe is this: **tag a clone, never the cached pristine
copy.** A failed fetch is deliberately not cached. A later tag can therefore retry
rather than inherit a permanent failure. `fetchRaw` hands a caller the pristine
parsed spec through the same cache. `references` lists a spec's untagged references
without touching it. `shared/race_cells.js` uses both to read every spec ahead of
the referee, which then fetches nothing twice.

The per-player tech referee generates each viewer's specs through the same cache
too. A co-op launch therefore fetches a spec file once, however many players hold
it. The stock `GW.specs.genUnitSpecs` that it replaced re-fetched all of them per
viewer. `gw_play/referee_game_file_paths.js` does the same for AI unit maps with
`loadMap`, which both referees share.

`forEachReference()` carries the field list that the base game's
`gw_specs.js:tagSpec` renames. GWO must keep it in sync with that list. `tagSpec`
and `references` are both walks over it, so the two cannot disagree about what
counts as a reference. Projectiles such as Lob ammo can spawn units when they
expire, so `spawn_unit_on_death` is one of them.

## Where to look next

- [`tech-cards.md`](tech-cards.md): where `addMods` gets called from.
- `test/specs.test.js`: the op semantics, pinned.
