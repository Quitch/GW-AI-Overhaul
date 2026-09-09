# Tech cards

Every file under `ui/main/game/galactic_war/cards/*.js` is a tech card. A tech
card is an AMD module that returns an object with a fixed shape.

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

| Field                                                              | Required?                                                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `visible`, `describe`, `summarize`, `icon`, `deal`, `buff`, `dull` | Always functions, on every card.                                                                                                                                               |
| `audio`, `getContext`                                              | On every card except one legacy exception.                                                                                                                                     |
| `keep`, `discard`                                                  | Optional. No card carries either today.                                                                                                                                        |
| `hint`                                                             | Optional, loadout cards only: the icon and text of the locked-loadout hover, read by stock `gw_start.js` and `gw_coop_per_player_loadout.js`. `gwoCard.lockedHint` builds one. |

The `audio`/`getContext` exception is `gwaio_enable_bot_aa.js`. GWO keeps it for
save-compatibility with GWO v5.9.0 and earlier. The card is deliberately invisible
and undiscardable. It exists only so that old saves that reference it still load.

The minion and card-slot redesigns dropped `keep` and `discard`. `gw_inventory.js`
and `gw_start/setup.js` still call them when a card has them. The contract validator
therefore continues to accept them. They are legitimate extension points, not typos.

`npm run validate:cards` enforces this shape. It checks what `define()` returns. It
does not call `deal`/`buff`/`dull`. The validator skips a card as `NOT_SHIPPED` when
the card depends on a base-game module absent from this repo. It skips one card as
`KNOWN_UNLOADABLE`.

The run prints the live tally. `MIN_CHECKED` is an enforced floor that must never be
lowered to make a run pass. `test/card_deal_unit_gate.test.js` reaches the skipped
cards. It stubs `shared/gw_common` and so loads every card except the
`KNOWN_UNLOADABLE` one. See [`testing.md`](testing.md).

## Which shape to write a card in

There are three shapes. The card's family decides which one to use:

| Family                            | Shape                       |
| --------------------------------- | --------------------------- |
| Unit upgrades (`gwaio_upgrade_*`) | `gwoCard.upgradeCard({})`   |
| Loadouts (`*_start_*`)            | `gwoCard.loadout(CARD, {})` |
| Everything else                   | The object literal above    |

The first two families each have a rigid frame that every member repeats. For an
upgrade, the frame is a slot and a `requires` gate. For a loadout, the frame is the
`buffCount` bank dance. The factory carries the frame, and the card supplies only
what differs. **Write a new card of either family through its factory**. A card that
cannot fit the frame stays a literal, and several do (see the factory's options, and
the notes at the end of this file).

Everything else is a literal because there is no shared frame to lift. The variety of
those cards lives in their `deal` weighting. A factory for them would need an
override for nearly every field. Apply that test to a fourth family if one appears:
a factory is worth it when the members differ in _data_, not in _logic_.

## `buff` and `dull`

`buff(inventory)` applies the card's effect. `dull(inventory)` reverses it. Two
mechanisms are available. A card may use either or both:

- `inventory.addMods([...])`: unit-spec stat changes. See [`specs.md`](specs.md).
- `inventory.addAIMods([...])`: AI build-order changes. See
  [`ai-pipeline.md`](ai-pipeline.md).

Both go through `gw_inventory.js`. Its `addMods`/`addAIMods` are
`mods().concat(mods)`. That form accepts a **bare descriptor** as readily as an
array. This is why the validators check for a bare descriptor. A card once passed a
single object rather than a one-element array. That card went entirely unvalidated
while production applied it without error.

Ordering matters and is not obvious:

- All `buff()`s run before any `dull()`. `gwoCard.applyDulls` relies on this. It
  also relies on the `""` context of `getTag`/`setTag` resolving to the current
  card.
- `buff()` runs with a units list that `applyCards` has just cleared and refilled
  with only the loadout's own grants. **No other card's units are visible yet**. A
  card that needs to know what else the player holds must therefore test `hasCard`,
  not `hasUnit`.
- `removeUnits` strips _every_ copy of a unit. This is a GWO change to base
  behaviour. A `dull()` that removes a whole group can therefore wipe units that
  other cards granted.

## Referee-time cards

The three `gwaio_upgrade_subcommander_*` cards carry an empty `buff`/`dull`. They
are markers. `shared/referee_subcommander_tech.js` reads the live card list while
the battle config is being built. Nothing is written at acquisition time.

That is deliberate, and the reason is `gwc_minion.js`. Its `buff` pushes
`params.minion` into `inventory.minions()`. `params.minion` is the card's **own
persistent params object**. Anything written onto a minion is therefore saved with
the war. A tech bonus applied there would survive the discard of the card that
granted it, and would compound across battles. Both referees therefore copy before
they apply:

| Path                                    | Copy                                         |
| --------------------------------------- | -------------------------------------------- |
| Host, `gw_play/referee_config_setup.js` | `_.cloneDeep(liveAlly)` per ally             |
| Viewer, `gw_play/per_player_tech.js`    | `_.cloneDeep(minion.personality)` per minion |

The mutators write in place and return their argument. The copy is therefore the
callers' responsibility. Both copies have a regression test. The test asserts that
the saved minion is byte-identical after two battles. See
[`testing.md`](testing.md).

## Deal weighting

`deal(system, context, inventory, rng)` returns `{ chance, params }`. `chance` is a
weight, not a percentage. A higher weight means the dealer is more likely to offer
the card.

`rng` is **optional**. GWO's dealer supplies it as a seeded stream keyed by the
card's own id. `shared/deal.js dealCard`, the dev cheats and any third-party dealer
pass nothing. A card that draws must therefore use `_.sample`/`Math.random` when
`rng` is absent. Use `gwoCard.uniqueValue(rng)` for a `unique` marker rather than a
direct `Math.random()` call. `gw_inventory.hasCard` tests `!card.unique`, and a
seeded zero would permanently stop that card from being dealt again for that seed.

**`chance` must not depend on `rng`.** The dealer calls `deal()` on _every_ card in
the deck for _every_ card of a hand, and keeps one result. Only `params` may
therefore be random. A random `chance` would make the weighting depend on how many
times the dealer speculatively dealt the card. Keying per card id is what makes
those speculative calls free: a draw added or removed inside one card cannot move
any other card's result. See [`galaxy.md`](galaxy.md), "Play-scene streams".

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

`upgradeDeal` tests `chance` for `undefined` rather than for falsiness. A caller that
legitimately computes a weight of 0 (as `navalWeight` can) therefore gets the 0 it
asked for, not the 60 default.

An upgrade card is the whole contract built from a handful of values.
`gwoCard.upgradeCard(options)` returns it:

```js
return gwoCard.upgradeCard({
  name: "!LOC:Ant Upgrade Tech",
  description: "!LOC:Ant Upgrade Tech adds splash damage to the light tank.",
  icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
  audio: "/VO/Computer/gw/board_tech_available_ammunition",
  requires: gwoUnit.ant,
  buff: function (inventory) {
    inventory.addMods(
      gwoCard.mods(gwoUnit.antAmmo, "replace", { splash_damage: 63 })
    );
  },
});
```

That card is visible. The dealer deals it through `upgradeDeal` once `requires` is
held. `withSlot` describes it. It is buffed with the extra slot before `buff` runs.
The other options are:

- `unless` names a card that withholds it.
- `chance` is a weight or a function of the inventory.
- `available(inventory)` or `deal(...)` replace the test or the whole deal.
- `describe` replaces the description.
- `slot: false` drops the slot for a card the referee applies.

### A card must be worth something to whoever is offered it

A card offered to a player who owns none of the units it affects is invisible waste.
The dealer spends a hand slot and a system's reward on it. The tooltip greys out
every unit it names. Nothing in-game reports the problem. So **a card is dealable
only if the player can own at least one of the units it affects**. There are three
routes:

1. Every affected unit is in the guaranteed set that `gwc_start.js` grants. This is
   why the naval, radar, teleporter and basic-defence cards need no gate at all.
2. `deal()` gates on ownership. It uses `gwoCard.hasUnit(inventory.units(), …)`
   through `conditionalDeal`/`upgradeDeal`, or an early `missingAllUnits` test that
   returns `chance: 0`.
3. The card's own `buff()` grants them. This is what exempts the `gwc_enable_*`
   unlock cards. Their whole purpose is to be offered to a player who has none of
   the units.

Gate on the same units that the card's `card_units.js` entry declares. That entry is
the list the tooltip shows, and where the two differ, one of them is wrong.
`gwaio_cooldown_orbital` is the cautionary case. It halves a cooldown across both
orbital factories, but the Orbital Launcher has no such field. The card therefore
did nothing at all for a player without the advanced factory. Only its
`card_units.js` entry named that factory.

A race player narrows this further. The deal withholds a card whose `card_units.js`
entry names no unit in a cell the race fills. It also withholds every card in
`cards_deal_helpers.MLA_ONLY` (`cards_deal_helpers.raceCanDeal`). Cards keep naming
vanilla units, and the unit's capability cell decides.

The tooltip shows that same entry translated by cell: the race units of each cell a
named vanilla unit occupies. It never shows a second, race-written list. See
[`races.md`](races.md).

`test/card_deal_unit_gate.test.js` enforces this in both directions. A card must not
be dealable to a player who owns none of its units. A card must be dealable to a
player who owns all of them. A new card with no `card_units.js` entry fails the test
unless it is a loadout or is listed in `gwoCardsWithoutTooltip`.

`commanderWeight` scales because these cards mod `base_commander`, the spec that
every Sub Commander inherits. One card buffs your whole retinue. Retinue size rather
than distance travelled therefore decides its worth. Cluster is exempt: its
subcommanders are not commanders.

`subcommanderWeight` opens at _full_ base weight the moment you field one. It does
not creep from near-nothing the way a bare `minions * n` does. The earlier form kept
offering a card that just became useful at a throwaway weight.

`navalWeight` reserves full weight for the two states that flood every planet fought
on: a naval start, or Tsunami tech. A player who owns ships cannot always use them,
and most generated systems have little water. Elsewhere the dealer therefore offers
the card proportionately less, and does not withhold it outright.

### A deal that arrives late, or empty

`chooseCards` is async. By the time it resolves, the exploration that started it may
be over. A recorded deal is a standing obligation to every co-op viewer: a catch-up
hand for an offer never made. A stale deal must therefore not be recorded.
`cards_deal_helpers.explorationStillLive` tests the three ways `gw_game.js` can end
an exploration:

- `winTurn`: the turn state is no longer `explore`.
- `move`: the current star is no longer the one dealt to.
- The star's own state: `hasCard` is false.

A deal can also produce nothing: every card in a small third-party deck may be held,
withheld for the player's race, or refused by its own `deal()`. Stock offers no way
out of `explore` but a win. The acting client therefore ends the turn itself when
`explorationDealtNothing` says so. It never does so on a replayed host action, whose
own `win_choice` follows it.

### Distance thresholds

The `travelled*` wrappers ask one question at three escalating cutoffs: "is this
system distant enough, relative to how many systems the galaxy has, that a player
could plausibly have skipped this tech tree so far?"

The threshold tables are indexed by galaxy-size tier and have **nine** entries: the
base game's five sizes plus the four that Bigger Galactic War adds. The last entry
also covers anything larger. The tables are centred so that each branch fires for a
roughly consistent share of stars at every size (short ~45%, moderate ~30%, far
~18%).

`farForSize` is exported for cards that need a bespoke table, but no card needs one
today. Prefer the wrappers, which keep the tables private. `numberOfSystems` is
passed in rather than imported so that this module stays dependency-free. Every card
transitively depends on `shared/cards.js`. An import of `shared/gw_common` here
would make the whole card set unloadable under the test harness.

## Loadouts

Loadout cards are the war-start choice. Their ids live in one place,
`shared/loadout_ids.js`. The file splits them three ways: loadouts available from
the start, base-game loadouts unlocked by a war win, and GWO-added loadouts unlocked
the same way.

`loadout_ids.js` exists separately from `loadouts.js` because `loadouts.js` touches
`model.makeKnown` and `GW.bank` at load time. Neither exists in the `gw_play` scene.

A treasure planet's loadout is drawn from those same unlockable ids. The draw
happens at exploration rather than at war creation, and from the acting player's
own locked pool. See [`coop.md`](coop.md), "Treasure loadouts".

Every loadout's `buff` and `dull` are the same frame.
`gwoCard.loadout(CARD, options)` returns the pair:

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

The first buff of the war runs `start.buff` and then `apply`. Every later buff of
the start card only adds the card slot (`repeatSlot: false` drops that). A copy
dealt later in the war adds its slot and goes to `bank`. `always(inventory, context)`
runs on every buff of the start card, for work that must repeat. `dull` is
`applyDulls` over `dulls`. `gwoCard.lockedHint(description)` is the `hint` a locked
loadout shows.

Unlocks and victory badges live in `localStorage` under `gwaio_`-prefixed keys.
Badge indices run from **-1 (Beginner)** so that Casual is 0. See the `loadoutIcon`
switch in `shared/cards.js`, and `gw_war_over/stats.js`. `stats.js` reads tiers from
the difficulty data rather than restating them. A renamed or inserted tier therefore
cannot silently shift everyone's badge history.

## Third-party card mods

Part of this mod is a public API. The sibling
[New-GW-Cards](https://github.com/Quitch/New-GW-Cards) template is the starter kit
for third-party card mods. It documents this surface in its own README and card
templates.

A renamed or dropped part of the API breaks every mod written from that template,
and breaks it **silently**. A card that reads a helper GWO no longer exports just
gets `undefined`. A global GWO stops reading simply has no effect. If you change any
of it, update that repo in step.

`test/modder_api.test.js` pins the whole surface. It includes a check that the
globals below are _adopted_ rather than assigned over. A mod's scene script runs
synchronously at scene load. It therefore always pushes before GWO's own `requireGW`
callbacks run. A bare assignment in place of an `_.isArray(...) ? ... : []` guard
silently discards everything the mod registered.

| Global                         | Scene                     | Read by                                         |
| ------------------------------ | ------------------------- | ----------------------------------------------- |
| `gwoCards`                     | play                      | `shared/deal.js` `setupGwoCards`                |
| `gwoCardsToUnits`              | play                      | `gw_play/card_tooltips.js`                      |
| `gwoCardsWithoutTooltip`       | play                      | `gw_play/card_tooltips.js`                      |
| `gwoCardsGrantingAdvancedTech` | play                      | `shared/cards.js` `hasT2Access`                 |
| `gwoSpecs`                     | play                      | `referee_game_files.js`, the per-player referee |
| `gwoNewStartCards`             | start, play, coop loadout | `shared/loadouts.js`, `treasure_loadouts.js`    |
| `gwoStartingCards`             | start, coop loadout       | `shared/loadouts.js`                            |
| `gwoStarCardsWhichBreakAllies` | start                     | `gw_start/setup.js`                             |
| `gwoLoadoutBanks`              | start, play, coop loadout | `shared/loadout_banks.js`                       |
| `gwoDecks`                     | start, play               | `shared/deck_mods.js`                           |

The public API goes beyond the globals. The helper names that `shared/cards.js`
returns are equally published. So are the **key** names in `shared/units.js` and
`shared/unit_groups.js`, and the signature of
`deal(system, context, inventory, rng)`. The values behind those keys are not
published. Re-point a unit path whenever the base game moves a file.

**Register in every scene the data is read in.** `model` is a fresh page per scene.
A mod that pushes its loadouts only in `gw_start` is therefore missing from the
treasure pool in `gw_play`. It is also missing from the per-player loadout picker in
co-op.

### Third-party decks

A mod can offer a whole deck in the TECHS picker rather than add cards to every
deck. It pushes a descriptor onto `model.gwoDecks` in `gw_start` (the picker),
`gw_play` (the deal) and `gw_coop_per_player_loadout` (viewer deals):

```js
model.gwoDecks.push({
  id: "mym-nomad", // unique; persisted into the war save as techCardDeck
  name: "!LOC:Nomad", // picker option and war panel; the UI already labels
  // it "Deck", so don't put Deck in the name
  tooltip: "!LOC:Nomad-only tech.", // optional TECHS tooltip line
  include: ["Basic"], // optional: ids of other REGISTERED decks to compose
  cards: ["mym_card_a", "gwc_minion"], // optional: individual card ids
});
```

- `cards` takes **any** card id without naming a whole deck: the mod's own ids, or
  cherry-picked stock `gwc_*`/`gwaio_*` ids. A missing module costs one card at
  deal time, never a hang.
- `include` takes the id of any **already registered** deck: `Basic`, `Expanded`,
  or another mod's. Registration order is mod `priority` order (ascending). A mod
  that includes another mod's deck therefore declares that mod under
  `dependencies` in its `modinfo.json` and uses a higher `priority` number. GWO
  refuses an id not yet registered. Includes resolve when the deal is built. A
  later re-registration of an included deck is therefore honoured.
- The resolved deck is deduplicated end to end. Overlap between included decks
  (Basic is a subset of Expanded), among `cards`, and between the two collapses to
  one copy. Order is include expansions first, then own cards.
- A deck must resolve to at least one card, and must not claim a built-in id. GWO
  logs and skips a bad descriptor. When two mods claim one id, the later
  registration wins, with a warning.
- `model.gwoCards` pushes reach **every** deck, built-in or third-party. A card mod
  therefore needs no knowledge of which deck mods are installed or of their load
  order.
- Fallback: a war save with no `techCardDeck` (non-GWO, pre-v5.36) deals Expanded
  silently. A save that names an unregistered deck (its mod uninstalled) deals
  Expanded with one console warning, and the picker restores to the full GWO deck.

### Third-party loadout banks

A mod records its loadout unlocks in its own `localStorage` key rather than in
`gwaio_bank`. Removal of the mod then takes its records with it. GWO cannot find
that key by itself, so the mod registers it:

```js
model.gwoLoadoutBanks.push({
  prefix: "mym_start_",
  path: "coui://ui/mods/com.pa.YOURNAME.MODNAME/bank.js",
});
```

The entry carries the bank's **path**, not the loaded module. The reason is that a
mod that `requireGW`d its own bank before it registered would resolve after the
loadout list was already built. `shared/loadout_banks.js` resolves the paths once.
Every later reader reads the result: the unlock test in `shared/loadouts.js`,
`startCardUnlocked` in `gw_play/cards.js`, and `bankStartCard` /
`localUnlockedLoadoutIds` in `treasure_loadouts.js`. The module at `path` need only
expose `hasStartCard` and `addStartCard`.

`prefix` routes a won loadout back to the mod that shipped it. Ids that begin
`gwc_start` are tested first and always go to the base game's bank. The base game
reads that bank directly, so a mod cannot capture them. This is also why a mod's
loadout ids must contain `_start_` but must not begin `gwc_start`.

## Cluster and buildable types

Cluster's Angels and Colonels **are** Sub Commanders. `faction/cluster_setup.js` tags
them `UNITTYPE_NoBuild` to keep them out of every build list.

Card replacements run _after_ that tagging (`gwc_start` is always buffed first). A
card that writes a bare `Mobile & <layer>` clause into a fabber's `buildable_types`
would therefore match a Sub Commander. That would hand Cluster a buildable Sub
Commander, with no error anywhere, in-game or in CI. Cards that touch the build
lists of advanced fabbers therefore carry an explicit `- NoBuild` exclusion. Basic
fabbers need no guard: their clauses require `Basic`, which no Sub Commander carries.

`test/cluster_subcommander_buildable.test.js` sweeps this. It evaluates every card's
emitted `buildable_types` expression with `scripts/lib/build-types.js`.

## Where to look next

- [`ai-pipeline.md`](ai-pipeline.md): what `addAIMods` descriptors do.
- [`specs.md`](specs.md): what `addMods` descriptors do.
- [`coop.md`](coop.md): why card code must read the passed inventory, not
  `model.game().inventory()`.
