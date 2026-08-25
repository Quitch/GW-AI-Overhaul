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
    deal: function (system, context, inventory, rng) { … },
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
enforced floor that must never be lowered to make a run pass. The other 61 are
reached by `test/card_deal_unit_gate.test.js`, which stubs `shared/gw_common` and so
loads all but one — see [`testing.md`](testing.md).

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

## Referee-time cards

The three `gwaio_upgrade_subcommander_*` cards carry an empty `buff`/`dull`. They
are markers: `shared/referee_subcommander_tech.js` reads the live card list while
the battle config is being built, and nothing is written at acquisition time.

That is deliberate, and the reason is `gwc_minion.js`. Its `buff` pushes
`params.minion` — the card's **own persistent params object** — into
`inventory.minions()`, so anything written onto a minion is saved with the war. A
tech bonus applied there would survive discarding the card that granted it, and
would compound across battles. Both referees therefore copy before applying:

| Path                                    | Copy                                         |
| --------------------------------------- | -------------------------------------------- |
| Host, `gw_play/referee_config_setup.js` | `_.cloneDeep(liveAlly)` per ally             |
| Viewer, `gw_play/per_player_tech.js`    | `_.cloneDeep(minion.personality)` per minion |

The mutators write in place and return their argument, so this is the callers'
responsibility. Both copies have a regression test asserting the saved minion is
byte-identical after two battles — see [`testing.md`](testing.md).

## Deal weighting

`deal(system, context, inventory, rng)` returns `{ chance, params }`. `chance` is a
weight, not a percentage; higher means more likely to be offered.

`rng` is **optional**: a seeded stream keyed by the card's own id, supplied by GWO's
dealer. `shared/deal.js dealCard`, the dev cheats and any third-party dealer pass
nothing, so a card that draws must fall back to `_.sample`/`Math.random` when it is
absent. Use `gwoCard.uniqueValue(rng)` for a `unique` marker rather than calling
`Math.random()` directly — `gw_inventory.hasCard` tests `!card.unique`, and a seeded
zero would permanently stop that card being dealt again for that seed.

**`chance` must not depend on `rng`.** The dealer calls `deal()` on _every_ card in the
deck for _every_ card of a hand and keeps one result, so only `params` may be random. A
random `chance` would make the weighting depend on how many times the card had been
speculatively dealt. Keying per card id is what lets those speculative calls be free:
adding or removing a draw inside one card cannot move any other card's result. See
[`galaxy.md`](galaxy.md), "Play-scene streams".

`shared/cards.js` provides the shared shapes so cards do not each invent their own:

| Helper                                            | Use                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `startCard()`                                     | A loadout card: `chance: 0`, `allowOverflow: true`. Never randomly dealt. |
| `upgradeDeal(available, chance)`                  | Standard upgrade. `chance` defaults to **60**.                            |
| `conditionalDeal(available, chance)`              | Weight if available, 0 if not.                                            |
| `commanderWeight(inventory, chance)`              | Scales with retinue size, capped at `chance * 2`.                         |
| `subcommanderWeight(inventory, chance)`           | 0 until you field one, then full base weight, capped at 90.               |
| `navalWeight(inventory, chance, dryChance)`       | Full weight only when planets flood.                                      |
| `floodsPlanets(inventory)`                        | The flooding test `navalWeight` uses, for a card that gates on it.        |
| `playerIsCluster(inventory)`                      | The player picked Cluster. Read the passed inventory, not the host's.     |
| `antiTechDeal(inventory, base, excludedId)`       | The `gwaio_anti_*` counter-tech shape.                                    |
| `travelledShort/Moderate/Far(system, context, n)` | Distance-gated availability.                                              |

`upgradeDeal` tests `chance` for `undefined` rather than for falsiness, so a caller
that computes a weight of 0 legitimately (as `navalWeight` can) gets the 0 it asked
for instead of the 60 default.

### A card must be worth something to whoever is offered it

A card offered to a player who owns none of the units it affects is invisible waste:
the dealer spends a hand slot and a system's reward on it, the tooltip greys out
every unit it names, and nothing in-game reports the problem. So **a card is dealable
only if the player can own at least one of the units it affects** — by one of three
routes:

1. Every affected unit is in the guaranteed set `gwc_start.js` grants, which is why
   the naval, radar, teleporter and basic-defence cards need no gate at all.
2. `deal()` gates on ownership — `gwoCard.hasUnit(inventory.units(), …)` through
   `conditionalDeal`/`upgradeDeal`, or an early `missingAllUnits` returning
   `chance: 0`.
3. The card's own `buff()` grants them. This is what exempts the `gwc_enable_*`
   unlock cards, whose whole purpose is being offered to a player who has none.

Gate on the same units the card's `card_units.js` entry declares — the list the
tooltip shows. Where the two differ, one of them is wrong. `gwaio_cooldown_orbital`
is the cautionary case: it halves a cooldown across both orbital factories, but the
Orbital Launcher has no such field, so the card did nothing at all without the
advanced factory that only its `card_units.js` entry named.

`test/card_deal_unit_gate.test.js` enforces this, in both directions: a card must not
be dealable to a player owning none of its units, and must be dealable to one owning
all of them. A new card with no `card_units.js` entry fails it unless it is a loadout
or listed in `gwoCardsWithoutTooltip`.

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

A treasure planet's loadout is drawn from those same unlockable ids, but at
exploration rather than at war creation, and from the acting player's own locked
pool — see [`coop.md`](coop.md), "Treasure loadouts".

Every loadout's `buff` and `dull` are the same frame, and `gwoCard.loadout(CARD,
options)` returns the pair:

```js
var loadout = gwoCard.loadout(CARD, {
  bank: gwoBank, // GW.bank for a base-game loadout, a mod's own bank otherwise
  start: GWCStart, // cards/gwc_start, buffed first
  apply: function (inventory) {
    inventory.addUnits(gwoGroup.airBasic);
  },
  dulls: [gwoUnit.inferno], // or a function of the inventory; optional
});
```

The first buff of the war runs `start.buff` and then `apply`; every later buff of
the start card only adds the card slot (`repeatSlot: false` drops that), and a
copy dealt later in the war adds its slot and goes to `bank`. `always(inventory,
context)` runs on every buff of the start card, for work that must repeat.
`dull` is `applyDulls` over `dulls`. `gwoCard.lockedHint(description)` is the
`hint` a locked loadout shows.

Unlocks and victory badges live in `localStorage` under `gwaio_`-prefixed keys.
Badge indices run from **-1 (Beginner)** so that Casual is 0 — see the
`loadoutIcon` switch in `shared/cards.js`, and `gw_war_over/stats.js`, which reads
tiers from the difficulty data rather than restating them so that renaming or
inserting a tier cannot silently shift everyone's badge history.

## Third-party card mods

Part of this mod is a public API. The sibling
[New-GW-Cards](https://github.com/Quitch/New-GW-Cards) template is the starter kit
third-party card mods are written from, and it documents this surface in its own
README and card templates. Renaming or dropping any of it breaks every mod written
from that template, and breaks it **silently** — a card reading a helper GWO no
longer exports just gets `undefined`, and a global GWO stops reading simply has no
effect. Change any of it and update that repo in step.

`test/modder_api.test.js` pins the whole surface, including that the globals below
are _adopted_ rather than assigned over. A mod's scene script runs synchronously at
scene load, so it has always pushed before GWO's own `requireGW` callbacks run;
replacing an `_.isArray(...) ? ... : []` guard with a bare assignment silently
discards everything the mod registered.

| Global                         | Scene                     | Read by                                         |
| ------------------------------ | ------------------------- | ----------------------------------------------- |
| `gwoCards`                     | play, coop loadout        | `shared/deal.js` `setupGwoCards`                |
| `gwoCardsToUnits`              | play                      | `gw_play/card_tooltips.js`                      |
| `gwoCardsWithoutTooltip`       | play                      | `gw_play/card_tooltips.js`                      |
| `gwoCardsGrantingAdvancedTech` | play                      | `shared/cards.js` `hasT2Access`                 |
| `gwoSpecs`                     | play                      | `referee_game_files.js`, the per-player referee |
| `gwoNewStartCards`             | start, play, coop loadout | `shared/loadouts.js`, `treasure_loadouts.js`    |
| `gwoStartingCards`             | start, coop loadout       | `shared/loadouts.js`                            |
| `gwoStarCardsWhichBreakAllies` | start                     | `gw_start/setup.js`                             |
| `gwoLoadoutBanks`              | start, play, coop loadout | `shared/loadout_banks.js`                       |

Beyond the globals: the helper names `shared/cards.js` returns, and the **key**
names in `shared/units.js` and `shared/unit_groups.js`, are equally published. The
values behind those keys are not — re-point a unit path whenever the base game
moves a file. So is `deal(system, context, inventory, rng)`'s signature.

**Register in every scene the data is read in.** `model` is a fresh page per scene,
so a mod that pushes its loadouts only in `gw_start` is missing from the treasure
pool in `gw_play` and from the co-op per-player loadout picker.

### Third-party loadout banks

A mod records its loadout unlocks in its own `localStorage` key rather than in
`gwaio_bank`, so that removing the mod takes its records with it. GWO cannot find
that key by itself, so the mod registers it:

```js
model.gwoLoadoutBanks.push({
  prefix: "mym_start_",
  path: "coui://ui/mods/com.pa.YOURNAME.MODNAME/bank.js",
});
```

The entry carries the bank's **path**, not the loaded module, because a mod that
`requireGW`d its own bank before registering would resolve after the loadout list
was already built. `shared/loadout_banks.js` resolves the paths once and every
later reader — the unlock test in `shared/loadouts.js`, `startCardUnlocked` in
`gw_play/cards.js`, and `bankStartCard` / `localUnlockedLoadoutIds` in
`treasure_loadouts.js` — reads the result. The module at `path` need only expose
`hasStartCard` and `addStartCard`.

`prefix` routes a won loadout back to the mod that shipped it. Ids beginning
`gwc_start` are tested first and always go to the base game's bank, which the base
game reads directly, so a mod cannot capture them — which is also why a mod's
loadout ids must contain `_start_` but must not begin `gwc_start`.

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
