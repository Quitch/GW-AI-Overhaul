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

## The op table

| Op                 | Behaviour                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `multiply`         | Numeric multiply. Warns and leaves unchanged if the target is missing or not a number.           |
| `add`              | Numeric add or string concat. A nullish target becomes the value.                                |
| `replace`          | Overwrites outright.                                                                             |
| `merge`            | `_.assign` into a plain object. Warns if the target is not one.                                  |
| `push`             | Appends to an array, wrapping a non-array target first.                                          |
| `pull`             | `_.pull` — removes values from an array.                                                         |
| `prepend`          | **GWO addition.** The counterpart to `push`, value-first.                                        |
| `wipe`             | **GWO addition.** String substitution: `[from, to]`, or a bare value to delete every occurrence. |
| `multiplyOrCreate` | **GWO addition.** Multiplies if numeric, creates the value if absent.                            |
| `clone`            | Deep-copies a spec to a new tagged id.                                                           |
| `tag`              | Rewrites a `.json` reference to carry the current `specTag`.                                     |
| `eval`             | Runs `new Function("attribute", value)`.                                                         |

`prepend` and `wipe` exist because the base ops cannot do those jobs. Order matters
for `buildable_types` and build lists, where the engine takes the **first** match —
so appending an alternative and prepending one are genuinely different operations.
`wipe` substitutes _within_ a string value; every base op replaces the whole thing.

`multiplyOrCreate` is a GWO addition, but the behaviour it provides is not new — it
is what the base game's `multiply` did: `attribute !== undefined ? attribute * value
: value`. GWO's `multiply` no longer creates. A missing or non-numeric target now
warns and is left alone, so a card that wants creation has to ask for it by name.
Splitting the two turns a typo'd path into a warning rather than a silently invented
stat, and it is why `multiplyOrCreate` runs before `multiply` in the op ordering.

`eval` is theoretically unsafe. It is also pointless to worry about: mods can run
whatever code they like anyway, so the risk is not meaningful.

### Writing a spec reference

Mods run **after** `genUnitSpecs` has tagged the army's specs, so a `.json` path
written by a mod arrives untagged. Untagged paths still resolve — to the stock file —
which is why the mistake is invisible: the weapon fires, the unit spawns, and none of
the player's other tech touches it.

Every mod whose value is a spec reference therefore needs a second mod, `op: "tag"`,
on the same path:

```js
{ file: gwoUnit.wyrm, path: "tools.0.spec_id", op: "replace", value: gwoUnit.typhoonWeapon },
{ file: gwoUnit.wyrm, path: "tools.0.spec_id", op: "tag" },
```

Two things follow from this.

The tag needs the **final** index. `replace` runs before `push`, `prepend` and `tag`
(see the op ordering), so a tool pushed onto a four-tool unit is tagged at
`tools.4.spec_id`. The index comes from the stock spec, not the card.

The target must **exist tagged**, or the tag points at nothing and the tool is lost
outright. A file the unit already references is covered — `tagSpec` walked it. A file
borrowed from another unit is not, and belongs in `additionalSpecs`, which is
concatenated onto every army's spec list. Tagging cascades from there: tag a weapon
and its `ammo_id`, and any `spawn_unit_on_death` that ammo has, come with it.

The reference fields that count are the ones `tagSpec` renames — `base_spec`,
`tools[].spec_id`, `ammo_id`, `replaceable_units`, `buildable_projectiles`,
`factory.initial_build_spec`, `death_weapon.ground_ammo_spec`,
`death_weapon.air_ammo_spec` and `spawn_unit_on_death`.

### Pathless mods

```js
var opsWithoutPath = { eval: true, clone: true };
```

Only these two do something useful when applied to a whole spec with no path,
because they mutate their target in place or write to `specs` directly. Every other
op merely returns a new value, so a pathless mod for it is a silent no-op.

## Path segments

A `path` walks into nested spec structure. Two conventions:

- A **numeric** segment indexes into an array.
- `"+"` **appends** — the base game's own convention for adding an array element.

When an intermediate segment is missing, the walker creates a container: an array
if the _next_ segment indexes into one, otherwise a plain object. The leaf segment
is treated differently — it is allowed to see a real "missing" signal, so that ops
like `multiplyOrCreate` and `add` can tell "absent" from "present".

## Arrays replace, they do not merge

`_.merge`'s default behaviour for arrays is index-by-index, which is wrong for PA
specs. Arrays here represent **complete lists** — ammo layers, unit type tags,
target priorities — so a derived spec's array must fully replace the base's rather
than being merged element-wise. Merging index-by-index was the root cause of the
`ammo_id` string/array corruption.

The customiser handles arrays and returns `undefined` for everything else, which
falls through to `_.merge`'s default. That is deliberate: objects _should_ merge
key-by-key, which is what `events` and `audio` need.

No defensive `cloneDeep` is needed around this. Specs contain only plain objects,
arrays and primitives; `_.merge` creates a new object without mutating its
arguments; and the array replacer clones any array it returns.

## The empty-navigation trap

The game treats any unit with a `navigation` object — **even an empty one** — as
mobile. A mod that writes into `navigation` and then removes the value leaves
`navigation: {}` behind once JSON serialisation drops the now-`undefined` key. The
result is a structure wrongly marked mobile, adding needless Nav Agent load.

`pruneEmptyNavigation` handles this, and must inspect the _file's top-level_ spec —
which is why the reference to it is captured before the path walk reassigns `spec`
to a nested container. The first path segment (e.g. `"navigation"`) is always
created on the top-level spec.

Note that "empty" here means _empty after serialisation_: a key whose value is
`undefined` is dropped by `JSON.stringify`, so `navigation` counts as non-empty
only if at least one value survives it.

## Spec caching

Galactic War calls the base game's `GW.specs.genUnitSpecs(units, tag)` once per AI
faction **and** once for the player. Each call re-fetches and re-parses every spec
file it walks. `shared/spec_cache.js` is a drop-in replacement that fetches and
parses each file at most once and reuses it across every tag.

The invariant that makes it safe: **tag a clone, never the cached pristine copy.**
A failed fetch is deliberately not cached, so a later tag can retry rather than
inheriting a permanent failure.

`tagSpec()` mirrors the base game's `gw_specs.js:tagSpec` and must be kept in sync
with it — including the list of fields that count as spec references. Projectiles
such as Lob ammo can spawn units when they expire, so `spawn_unit_on_death` is one
of them.

## Where to look next

- [`tech-cards.md`](tech-cards.md) — where `addMods` gets called from.
- `test/specs.test.js` — the op semantics, pinned.
