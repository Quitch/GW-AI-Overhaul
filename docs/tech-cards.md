# Tech cards

Every file under `ui/main/game/galactic_war/cards/*.js` is a tech card: an AMD
module returning an object with a fixed shape. 237 of them ship today.

## The contract

```js
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: function () { … },
    describe: function () { … },
    summarize: function () { … },
    icon: function () { … },
    deal: function (system, context, inventory) { … },
    buff: function (inventory) { … },
    dull: function (inventory) { … },
    audio: function () { … },
    getContext: gwoCard.getContext,
  };
});
```

| Field                                                              | Required?                                  |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `visible`, `describe`, `summarize`, `icon`, `deal`, `buff`, `dull` | Always functions, on every card.           |
| `audio`, `getContext`                                              | On every card except one legacy exception. |
| `keep`, `discard`                                                  | Optional. No card carries either today.    |

The `audio`/`getContext` exception is `gwaio_enable_bot_aa.js`, kept for
save-compatibility with GWO v5.9.0 and earlier. It is deliberately invisible and
undiscardable; the card exists only so old saves referencing it still load.

`keep` and `discard` were dropped in the minion and card-slot redesigns, but
`gw_inventory.js` and `gw_start/setup.js` still call them when present, so the
contract validator continues to accept them. They are legitimate extension points,
not typos.

`npm run validate:cards` enforces this shape. It checks what `define()` returns —
it does not call `deal`/`buff`/`dull`. Of the 237 cards it shape-checks 175; 61 are
excluded as `NOT_SHIPPED` (they depend on base-game modules absent from this repo)
and 1 as `KNOWN_UNLOADABLE`. The run prints the live tally, and `MIN_CHECKED` is an
enforced floor that must never be lowered to make a run pass.

## `buff` and `dull`

`buff(inventory)` applies the card's effect; `dull(inventory)` reverses it. Two
mechanisms are available, and a card may use either or both:

- `inventory.addMods([...])` — unit-spec stat changes. See [`specs.md`](specs.md).
- `inventory.addAIMods([...])` — AI build-order changes. See
  [`ai-pipeline.md`](ai-pipeline.md).

Both go through `gw_inventory.js`, whose `addMods`/`addAIMods` are
`mods().concat(mods)`. That accepts a **bare descriptor** as readily as an array,
which is why the validators check for it: a card passing a single object rather
than a one-element array once went entirely unvalidated while production applied it
perfectly happily.

Ordering matters and is not obvious:

- All `buff()`s run before any `dull()`. `gwoCard.applyDulls` relies on this, and
  on `getTag`/`setTag`'s `""` context resolving to the current card.
- `buff()` runs with a units list that `applyCards` has just cleared and refilled
  with the loadout's own grants only. **No other card's units are visible yet**, so
  a card that needs to know what else the player holds must test `hasCard`, not
  `hasUnit`.
- `removeUnits` strips _every_ copy of a unit (a GWO change to base behaviour), so
  a `dull()` that removes a whole group can wipe units other cards granted.

## Deal weighting

`deal(system, context, inventory)` returns `{ chance, params }`. `chance` is a
weight, not a percentage; higher means more likely to be offered.

`shared/cards.js` provides the shared shapes so cards do not each invent their own:

| Helper                                            | Use                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `startCard()`                                     | A loadout card: `chance: 0`, `allowOverflow: true`. Never randomly dealt. |
| `upgradeDeal(available, chance)`                  | Standard upgrade. `chance` defaults to **60**.                            |
| `conditionalDeal(available, chance)`              | Weight if available, 0 if not.                                            |
| `commanderWeight(inventory, chance)`              | Scales with retinue size, capped at `chance * 2`.                         |
| `subcommanderWeight(inventory, chance)`           | 0 until you field one, then full base weight, capped at 90.               |
| `navalWeight(inventory, chance, dryChance)`       | Full weight only when planets flood.                                      |
| `antiTechDeal(inventory, base, excludedId)`       | The `gwaio_anti_*` counter-tech shape.                                    |
| `travelledShort/Moderate/Far(system, context, n)` | Distance-gated availability.                                              |

`upgradeDeal` tests `chance` for `undefined` rather than for falsiness, so a caller
that computes a weight of 0 legitimately (as `navalWeight` can) gets the 0 it asked
for instead of the 60 default.

`commanderWeight` scales because these cards mod `base_commander`, the spec every
Sub Commander inherits — one card buffs your whole retinue, so retinue size rather
than distance travelled decides its worth. Cluster is exempt: its subcommanders are
not commanders.

`subcommanderWeight` opens at _full_ base weight the moment you field one, rather
than creeping up from near-nothing the way a bare `minions * n` does. The earlier
form left a card that had just become useful still being offered at a throwaway
weight.

`navalWeight` reserves full weight for the two states that flood every planet
fought on — a naval start, or Tsunami tech. Owning ships is not the same as being
able to use them, and most generated systems have little water, so elsewhere the
card is offered proportionately less rather than withheld outright.

### Distance thresholds

The `travelled*` wrappers ask "is this system distant enough, relative to how many
systems the galaxy has, that a player could plausibly have skipped this tech tree
so far?" — at three escalating cutoffs.

The threshold tables are indexed by galaxy-size tier and have **nine** entries: the
base game's five sizes plus the four that Bigger Galactic War adds, with the last
entry also covering anything larger. They are centred so each branch fires for a
roughly consistent share of stars at every size (short ~45%, moderate ~30%, far
~18%).

`farForSize` is exported for cards needing a bespoke table, but no card needs one
today — prefer the wrappers, which keep the tables private. `numberOfSystems` is
passed in rather than imported so this module stays dependency-free: every card
transitively depends on `shared/cards.js`, and pulling in `shared/gw_common` here
would make the whole card set unloadable under the test harness.

## Loadouts

Loadout cards are the war-start choice. Their ids live in one place,
`shared/loadout_ids.js`, split three ways: available from the start, base-game
loadouts unlocked by winning a war, and GWO-added loadouts unlocked the same way.

`loadout_ids.js` exists separately from `loadouts.js` because the latter touches
`model.makeKnown` and `GW.bank` at load time, neither of which exists in the
`gw_play` scene.

Unlocks and victory badges live in `localStorage` under `gwaio_`-prefixed keys.
Badge indices run from **-1 (Beginner)** so that Casual is 0 — see the
`loadoutIcon` switch in `shared/cards.js`, and `gw_war_over/stats.js`, which reads
tiers from the difficulty data rather than restating them so that renaming or
inserting a tier cannot silently shift everyone's badge history.

## Cluster and buildable types

Cluster's Angels and Colonels **are** Sub Commanders, and `faction/cluster_setup.js`
tags them `UNITTYPE_NoBuild` to keep them out of every build list.

Card replacements run _after_ that tagging (`gwc_start` is always buffed first), so
a card writing a bare `Mobile & <layer>` clause into a fabber's `buildable_types`
would match a Sub Commander and hand Cluster a buildable one — with no error
anywhere, in-game or in CI. Cards that touch advanced fabber build lists therefore
carry an explicit `- NoBuild` exclusion. Basic fabbers need no guard: their clauses
require `Basic`, which no Sub Commander carries.

This is swept by `test/cluster_subcommander_buildable.test.js`, which evaluates
every card's emitted `buildable_types` expression with
`scripts/lib/build-types.js`.

## Where to look next

- [`ai-pipeline.md`](ai-pipeline.md) — what `addAIMods` descriptors do.
- [`specs.md`](specs.md) — what `addMods` descriptors do.
- [`coop.md`](coop.md) — why card code must read the passed inventory, not
  `model.game().inventory()`.
