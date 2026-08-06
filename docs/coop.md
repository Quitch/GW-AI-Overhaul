# Co-op

Galactic War co-op has one **host** and any number of **viewers**. The host owns
the campaign; viewers join battles. GWO adds per-player tech cards, per-player
loadouts, and colour allocation that keeps everyone distinguishable.

## Shared tech versus per-player tech

The default is **shared control**: one inventory, the host's, for everybody. This
is also what solo play uses, so most code paths never see anything else.

With **per-player tech cards** enabled, each viewer gets their own inventory,
their own cards, and their own subcommanders. That changes several assumptions:

- `model.game().inventory()` is **always the host's**. Card code that needs the
  acting player's inventory must use the one passed to it. `antiTechDeal` and the
  `gwaio_anti_*` cards get this right deliberately; it is an easy thing to break.
  The same rule is why viewers get their own pre-dealt star cards and their own
  treasure loadouts; both have their own sections below.
- Viewers only field their own subcommanders under per-player tech. Without it
  there is one shared inventory and no co-op records to read at all, so the viewer
  half of `getOrderedSubcommanders` is gated on it.
- A second referee runs. See below.

## The two referees

A co-op host hires the referee **twice** per battle — the base game's
`hireRefereesForLaunch` creates a clean shared referee plus a local one. On top of
that:

1. **The main referee** (`gw_play/referee_config.js`) builds the battle config:
   armies, personalities, planets, modes.
2. **The per-player-tech referee**
   (`ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js`, shadowed)
   runs afterwards, generating each viewer's unit specs and subcommanders and
   adding them to that config.

Because the setup runs more than once and a failed launch can leave mutated state
behind, **none of it is idempotent** — eco mods and fabber caps multiply, tags get
pushed. Every setup function therefore works on `_.cloneDeep` copies of the live
war objects. `test/referee_config_ai_paths.test.js` pins this by running the setup
twice and asserting `×1.5` fabber caps once, not `×2.25`.

The per-player-tech referee's validation lives in `gw_play/per_player_tech.js` as
`validatePerPlayerTechInputs`, because the shadowed file cannot load under the Node
harness. That function is the executable, unit-tested statement of the referee's
input contract.

It distinguishes two kinds of rejection, which is why the two branches log
differently: `writeFailure` marks a genuine failure that must disable per-player
tech and stamps `per_player_tech_ready = false`, while "no co-op" and "feature
disabled" are benign no-ops that still resolve successfully.

## Player tags

The host is `.player`. Subsequent players are `.player0`, `.player1`, and so on —
note the host is _not_ `.player0`, which is why viewer indexing carries an offset.

These tags scope both unit specs and AI paths. Under per-player tech each viewer's
subcommander build orders are written to a path scoped by their own tag, so two
viewers can never collide on build orders or `ai_unit_map`. See
[`ai-paths.md`](ai-paths.md) for how the scope token is derived — and for the
sanitisation asymmetry that means the subcommander path keeps the leading dot while
the Cluster path does not.

The host's minions are skipped in the per-player pass because the main referee
already included them; the check is `tag === ".player"`.

## Colour allocation

The hardest part of co-op, because GWO has to _predict_ colours the base game
assigns privately.

Shared armies are a single army, so every co-op commander flies the host's
colour — the `playerColor` global tag, written once at war creation. Unshared
armies are split one per client by `gw_coop_referee.js`, which colours army 0
with the host's faction colour and draws the rest from the lobby palette.

`gw_play/coop_colour.js` mirrors the lobby palette from the base game's
`server-script/lobby/color_table.js`. That makes it a **third copy** of the same
data, and the table, the brightness rule and the sort must be kept in sync with
`gw_coop_referee.js`. The brightness rule applies only when a channel is saturated,
matching the server.

`shared/referee_coop.js` provides the ordering:

- `getOrderedSubcommanders(inventory, game, connectedClients)` returns every allied
  AI commander that draws from the player faction's palette, **in the order the
  battle config numbers their colours**: the host's subcommanders first, then each
  connected viewer's. Order in equals order out, so callers that care which colour
  lands where must pass clients host-first (see `coop_colour.js`'s
  `clientsInPlayerOrder`). Callers that only want a count can pass any order.
- `alliedColourIndex(position)` returns `position + 1`. Index 0 is reserved for the
  player, whose army takes the faction's own colour pair rather than a palette
  entry.

A star's `ai.ally` is **deliberately absent** from that list: it is numbered last,
after every subcommander, so that a per-star commander never shifts the colour of
anything the war panel already shows. Its index is
`alliedColourIndex(list.length)`.

Duplicated subcommanders share one colour, matching how the host's duplication tech
produces a single army with several commander slots.

The palette can run out. `pick()` falls back to the caller's colour, and the
referee treats "no pair available" as a reason to refuse the battle rather than
letting two armies collide.

## Resolving viewers

`getConnectedViewerInventories(game, connectedClients)` returns `{client,
inventory}` pairs for connected **viewer-role** clients, dropping any client whose
inventory is not resolvable yet.

Two failure modes it guards against:

- A viewer whose PA profile has never been loaded by an authenticated user has an
  empty `uberId`/`displayName`. That is reported rather than silently mishandled.
- `game.findCoopPlayerInventoryData` never returns a record for the **host** — the
  host's own loadout is resolved locally via `model.gwoLoadout`.

Minion counting deliberately includes players who are not currently in the game, so
that a player who leaves and rejoins does not have their minions vanish and
reappear.

## Rerolls

A viewer requesting a reroll is a round trip: viewer → host → viewer, implemented as
two operators in `gw_play/cards_coop_reroll.js`. The size of the remaining hand
encodes how many rerolls have been used, since each reroll spends one more of the
offered cards.

The host's own reroll path and the viewer path both keep the new cards hidden
behind the scanning overlay for a cosmetic two-second beat, scheduled but not
awaited.

## Per-player pre-dealt cards

Under per-player tech each viewer gets their **own** card on every selectable AI
star, dealt by the host from that viewer's inventory
(`gw_play/cards_coop_star_cards.js`) and folded into their hand when they explore.
`star.cardList()` remains the host's own; a viewer never sees it.

The transport is a top-level `gwaioStarCards` field on the co-op player inventory
record, `{turn, cards: {"<star>": card}}`. Three things rule out the alternatives:

- Host→viewer operators reach only **connected** clients and are never replayed, so
  they cannot carry state a late joiner needs.
- `applyCampaignSnapshot` calls `game.load()`, which rebuilds every star object.
  Anything written into `star.ai().cardName` on a viewer is wiped by the next
  snapshot — which is why the intelligence panel reads the record through
  `gw_play/coop_star_cards_view.js` rather than the field
  `gwo_sync_star_card_name` maintains for the host.
- Records **are** in the game save, and therefore in every snapshot.

Note the asymmetry that makes this work: anything added inside `pendingTechCards`
is dropped, because the server rebuilds that object as
`{star, cards, dealIndex, updatedAt}`. Every merge of the _record_ is an `_.assign`
over the existing one, on both the server and the client, so a novel top-level
field survives. `cardsOffered`/`rerollsUsed` are the standing example of the first
half: they only persist on the reroll path, which writes the record locally.

Two ordering rules the refresh depends on:

- **Re-read the record immediately before writing it.** `upsertCoopPlayerInventoryData`
  replaces the whole record and `chooseCards` is async, so a catch-up deal can land
  `pendingTechCards` in the window. Writing over a clone captured before the deal
  erases it and leaves that viewer waiting forever on an offer the host thinks it sent.
- **A refresh must not run while anyone is catching up.** `gwCampaignPlayerSetupBlocked`
  is not sufficient on its own: it keys off `client.loading_status`, which arrives on
  `gw_campaign_control` broadcasts that are deliberately never queued and can lag the
  record update. `viewersReadyForStarRefresh` therefore also requires every connected
  viewer to be level with `game.hostTechCardDealCount()` — the server's own catch-up
  predicate. That is what closes the loop, because the snapshot a refresh publishes
  makes the server sweep every client for catch-up, and the gate guarantees that sweep
  finds nothing. Without it, a viewer rejoining ten deals behind would drive ten full
  re-deals of every selectable star.

Hand sizing: the pre-dealt card is passed as `systemCards` and the draw count is
reduced by one, so the stored hand is still `cardsOffered` long. `computeRerollDeal`
reads the spent rerolls back out of that length, so lengthening it would hand the
viewer a free reroll. A reroll drops the pre-dealt card, matching `model.rerollTech`
emptying the star's card list for the host.

## Treasure loadouts

The treasure planet's loadout is **not** pre-dealt at war creation. It is derived at
exploration from the acting player's own locked pool — the same code for the host and
every viewer, each judged by their own unlock record (`gw_play/treasure_loadouts.js`).
A player who owns every loadout gets an ordinary tech deal there instead.

Deriving rather than storing is what lets a catch-up deal replay a star for a viewer
who was absent when it was explored: keyed on `(player, star)` alone, the offer
reproduces exactly. It also means a host who has unlocked everything no longer denies
the planet to everyone else.

The pool is `loadout_ids.lockedBase + unlockable`. `gw_start/setup.js` drew from
`model.gwoNewStartCards`, which a third-party mod can push into; `model` is a fresh
page in `gw_play`, so that route is not available here.

**A viewer's unlocks arrive by a GWO route, not the base game's.** Both
`normalizeStartCardIds` and the server's `normalizeUnlockedStartCardIds` filter to ids
beginning `gwc_start`, so `record.unlockedStartCardIds` can never hold a
`gwaio_start_*`, `nem_start_*` or `tgw_start_*` id — 16 of the 21 cards in the pool.
`model.recordHasUnlockedStartCard` returns false for all of them. Viewers therefore
report their own list over the `gwo_report_unlocked_loadouts` operator, and the host
stores it as `gwaioUnlockedStartCardIds`; `recordHasUnlockedLoadout` reads both fields
plus `loadoutCardId`.

## Where to look next

- [`ai-paths.md`](ai-paths.md) — per-viewer path scoping.
- [`tech-cards.md`](tech-cards.md) — why `deal()` must read the passed inventory.
- [`shadowing.md`](shadowing.md) — why the per-player-tech referee is shadowed.
