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

Viewers share the host's race in this pass: the loadout scene stamps the host's
race onto the viewer's starting inventory so its deals gate by race, and the
per-player referee expands each viewer's units and mods onto the race's files by
capability cell, retags the stock commander the viewer picked (and its Sub
Commanders') the way the Guardians' Unicorn is, and routes their subcommanders
to the race tree. The race is read per inventory, so a per-viewer race later is a
record field and a picker. See [`races.md`](races.md).

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

Human army colours come from the base game. `model.gwCoopPlayerColors` in
`gw_play.js` is the authoritative source: a host-first record per connected client,
each carrying the `color` pair that client's army will be given. `gwo_panel.js`
reads it rather than working the answer out again, so the swatch cannot disagree
with what the referee assigns.

Shared armies are a single army, so every co-op commander flies the host's
colour — the `playerColor` global tag, written once at war creation. Unshared
armies are split one per client by `gw_coop_referee.js`, which colours army 0 with
the host's faction colour, then prefers the faction's own `coopPlayerColors` before
falling back to the custom-lobby palette in `shared/gw_coop_player_colors.js`.
That module is why GWO no longer keeps a copy of the palette: before PA 124670 it
was private to `gw_coop_referee.js`, which exported only `apply()`.

**Every faction therefore needs a `coopPlayerColors` array**, including GWO's own
Cluster in `faction/cluster_faction.js`. It is optional as far as the base game is
concerned — a faction without one silently drops to the generic lobby palette.

Subcommander colours are a separate system and still GWO's own; see
`gw_play/commander_colour.js`. `shared/referee_coop.js` provides the ordering:

- `getOrderedSubcommanders(inventory, game, connectedClients)` returns every allied
  AI commander that draws from the player faction's palette, **in the order the
  battle config numbers their colours**: the host's subcommanders first, then each
  connected viewer's. Order in equals order out, so callers that care which colour
  lands where must pass clients host-first (see this module's
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

Which palette entry lands where is `gw_play/commander_colour.js`, and it is shared
rather than per-caller for a reason: `referee_config_setup.js`, the shadowed
per-player-tech referee, `gwo_panel.js` and the intel panel must all agree, or the
panel promises a colour the battle does not deliver. It orders a palette by
`contrastScore` — squared RGB distance plus a luminance term weighted 16× — so the
commanders most likely to be confused are the ones pushed furthest apart.

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

## Addressing a host's reply

A host→viewer operator carrying one player's result is addressed with
`target_client_id`, and **the server is the enforcement point**. It resolves the
id against its own connected clients, refuses the send outright when that client
is not connected, and relays only to the clients that matched. It also rebuilds
the envelope as `{type, payload, request_id, timestamp}` on the way through, so
`target_client_id` never reaches the viewer at all.

That is why the handlers do not check who a result is for. `payload.client_id` is
the host echoing back which player it acted on, and it is what the handler uses
to find the record — not a claim to be validated against local identity.
Re-validating it would be worse than redundant: `client.id` is per-connection, so
the check would start rejecting a player's own results the moment they reconnect.
That is the same reason `gwo_streams.coopPlayerKey` prefers `record.playerId`.

Every reply that concerns one player addresses itself, including the failure
replies (`failPendingTechReroll`, `failGeneralCommanderSetup`) — an unaddressed
error would put one viewer's refusal on every viewer's screen. The two host→viewer
operators that carry **no** target are broadcasts by design: the ping, which
self-identifies and deduplicates by `ping_id`, and the star-card name sync.

## Rerolls

A viewer requesting a reroll is a round trip: viewer → host → viewer, implemented as
two operators in `gw_play/cards_coop_reroll.js`. The size of the remaining hand
encodes how many rerolls have been used, since each reroll spends one more of the
offered cards.

The host's own reroll path and the viewer path both keep the new cards hidden
behind the scanning overlay for a cosmetic two-second beat, scheduled but not
awaited.

## Whose selection is whose

A viewer's selection follows the host's moves, which is right until the viewer has
picked a star of their own to look at. `gw_play/coop_selection_follow.js` hijacks
`applyCampaignAction` and puts the viewer's own choice back once the replayed action
settles. The scene entry is the thin `gw_play/coop_selection.js`, which exists only
to `_.defer` into it — `systems.js` replaces `model.selection` outright, so the
subscription can only be taken once every `gw_play` mod has loaded.

It has to be restored **afterwards** rather than defended: `applyCampaignAction`
writes the destination into `selection.star` itself, because the base game's `move()`
reads its destination from there. Blocking that write would break the replay.

A viewer counts as having chosen while its selection is neither empty nor the star
the host is standing on — so selecting the host's own star is how a viewer starts
following again, and a selection the host has since moved onto needs no restoring.
The tracking subscription ignores writes made while `gwCampaignReplayingAction` is
set, which is exactly the host-driven ones.

## Pings

A viewer selects a star and presses Ping; the host and every other viewer get a
pulsing marker on that star, the game's own ping cue, and a chat line naming the
sender. Two operators, viewer → host → every viewer:
`gwo_ping_star` and `gwo_ping_star_broadcast` (`gw_play/coop_ping_operators.js`).

A ping changes nothing. That is what shapes the whole subsystem:

- **Both handlers return nothing.** A returned promise joins
  `gwCampaignStateApplyTail`, and a ping has no business sitting in the queue that
  orders authoritative updates. Nothing sets `stale_snapshot`, writes a record, or
  saves.
- **The relay broadcasts with no options object at all.** Omitting both
  `target_client_id` and `target_client_ids` is what makes the server fan it out to
  every connected viewer.
- **It needs no inventory record**, so it works for the unauthenticated viewer whose
  empty `uberId` breaks every record-keyed path above. The cooldown and the chat
  label fall back through `client_name` to the `id::name` composite key.

The pinger renders locally on send and drops the returning broadcast by `ping_id`,
rather than waiting for the round trip. That buys instant feedback on the click, and
means a host on an older GWO — which logs the unknown operator type and ignores it —
degrades to "only the pinger sees it" rather than to a dead button.

Rate limiting is on both sides because the relay has none of its own. The viewer's
3s cooldown is UI feedback, greying the button; the host's is the real one, and is
deliberately **shorter** at 2.5s, because the viewer's clock starts at the click and
the host's at receipt. The ping cue is throttled separately again, at 250ms: pings
from different clients can legitimately land together.

### The marker

`gw_play/coop_ping_marker.js` hangs an expanding ring and an exclamation icon off
`system.systemDisplay`, one per star, restarting rather than stacking if the star is
pinged again. Three things about it are not obvious:

- **`z = 2` is load-bearing.** `systems.js`'s `sortContainer` orders an undefined `z`
  ahead of every number, so an unlabelled container sinks below the star icon.
- **There is no `createjs.Tween`** — `gw_play.html` loads EaselJS alone — so the
  pulse runs off a `tick` listener reading the wall clock, like `systems.js`'s
  rotating selection icon. `galaxy_map_perf.js` would otherwise render it at the idle
  10fps, hence `model.gwoRequestInteractiveFrames`.
- **The `_.delay` cleanup is not belt-and-braces.** `updateStage` stops re-arming its
  `requestAnimationFrame` while `hidingUI()` is true, so ticks stop dead during a
  battle launch and a tick-only marker would still be frozen on the map on return.

### What can be pinged

`canPing` drives both the button's visibility and the send, so a click landing as
the war moves on cannot get past it. A star is pingable when this client is a
connected viewer, the star index is one the galaxy has, and `star.explored()` is
false — an explored star has been taken, and there is nothing left there to ask the
host for. That observable travels in `syncViewerStarFromGame`'s copy list, so a
viewer's own is maintained rather than inferred.

It also refuses while the turn state is `explore` or `fight`: where to go next stops
being a question once the host has committed to one. Testing for those two rather than
for `begin` is deliberate — **the state only returns to `begin` on the next `move()`**,
so a finished exploration rests at `end`, which is exactly when somewhere to go next is
worth pointing at. Gating on `begin` instead left the button dead from the moment a
star was finished with until the host moved off it. Two things sit outside the turn
state and are tested alongside it: `scanning()`, which is raised a beat before the
state moves;
and, under per-player tech, whether **anybody** still holds a tech offer.
`gwCampaignPlayerSetupBlocked` answers that for the host and returns false flat for
everyone else, so `techChoicePending` applies the same shape test to the records
themselves — the local offer plus every connected client's — which every client has,
because records travel in the snapshot.

The button is a sibling of the stock action row inside `#selected-system-anchor`,
not a member of it: that row is gated on `canShowCampaignActionButtons`, which is
false for exactly the viewers Ping is for. `gw_play/coop_ping.js` injects it
synchronously, before the scene's single `ko.applyBindings`, and takes its dependency
on `model.selection.star` inside a `_.defer` — `systems.js` replaces `model.selection`
wholesale, and a computed built at load time would subscribe to the observable that
replacement orphans.

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

**Only the host's own per-turn deal replaces a card a viewer already holds.**
`refresh({redeal: true})` is called from `dealCardToSelectableAI` and nowhere else;
every other trigger fills gaps. `game.stats().turns()` moves on every `GWGame.move()`
while the host's cards are re-dealt only after a win, so a refresh keyed on the turn
would change what a star advertises to a viewer while the host was merely travelling
to it — and the card would no longer be the one in their hand on arrival.

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

**Winning one unlocks the commander and grants nothing in this war.** The card is
banked and never enters the inventory: `model.win` banks it and passes `-1` to
`winTurn`, which still clears the star and ends the turn. Left in the inventory it
would read as tech held — `cardsOfferedCount` tests `hasCard` for the Lucky
Commander, so it would keep paying out a fourth card on every explore. The base
game instead adds the card and a free slot to cover it (`gwc_start_*.buff`'s
"Don't clog up a slot" branch); GWO does not.

The server already banks a viewer's loadout choice without touching the inventory —
but only for ids passing `isBaseLoadoutCardId`, so it pushes every mod loadout into
the viewer's war inventory instead. GWO therefore intercepts **every** loadout id on
a viewer, banking locally and submitting `-1`; it cannot leave the base ids to the
server, because banking is held shut on viewers for the reason below.

## The per-player loadout scene

`gw_coop_per_player_loadout` is its own scene, and
`gw_coop_per_player_loadout/gwo_loadouts.js` is the only file GWO puts in it. It
is where a viewer picks their war loadout, and it has to build that loadout's
starting inventory itself rather than inheriting the host's.

Two things about it are not obvious from the scene it sits in:

- **The view model has no player faction**, but Cluster start cards read
  `global.playerFaction`. `resolvePlayerFaction` therefore loads the campaign
  game through `GW.manifest.loadGame(model.activeGameId())` purely to read that
  tag back out, and resolves `undefined` rather than rejecting when there is no
  active game — a loadout preview outside a war still has to render.
- **`validateStartingInventory` refuses rather than proceeds.** It asserts the
  chosen card produced exactly one card, in first position, with `maxCards` a
  number leaving room beyond it. Anything else rejects the deferred, because a
  loadout that quietly banked tech would hand the viewer cards nobody dealt them.

Banking is the other half, and is covered in "Whose unlocks are whose" below: a
viewer banks its own war loadout from this scene, which is why the hold placed on
the host's inventory does not reach it.

## Whose unlocks are whose

`GWGame.load()` calls `game.inventory().applyCards()` on **every** client, and on a
viewer under per-player tech that inventory is the host's. Each loadout card's
`buff()` ends in `bank.addStartCard`, so simply loading the campaign collected the
host's loadouts into the viewer's own bank — and the bank is what `gw_start` reads
next war.

The guard is in the shadowed `gw_inventory.js`, and **the timing is the whole
difficulty**. That first apply runs before the campaign half of `model` exists —
`isCampaignViewer`, `gwCampaignPerPlayerTechCards` and `model.game()` are all
`undefined` at that point, so no model-based test can answer, and installing a hold
from a scene script is too late even though `loadMods` has finished. The two signals
that _are_ available are `sessionStorage.gw_campaign_role`, and the game passed to
`GWGamePatches.patch` — which `GWGame.load` calls immediately before `applyCards`,
after setting `perPlayerTechCards`. `gw_inventory.js` therefore hijacks `patch` to
raise a flag that the next `applyCards` consumes and suspends on.

Hijacking rather than shadowing `gw_game.js` keeps a 459-line save-format file out of
the tree; `gw_game_patches` is reachable because, like `gw_bank`, it declares no
dependencies, while `shared/gw_common` and `shared/gw_game` would both close a cycle
back onto `gw_inventory`.

Only the host's inventory is ever flagged, so a viewer still banks its own claims —
`bankOwnLoadout` for a treasure loadout, and the loadout scene for its war loadout.
Winning a war unlocks through `gw_war_over`, a different scene, and is unaffected.

The mirror of this — the host collecting a _viewer's_ loadouts — comes from the host
applying each viewer's inventory to size their deals, and is suspended at each of
those call sites (`cards_coop_deal.js`, `cards_coop_reroll.js`,
`cards_coop_star_cards.js`).

**The star is identified by index, not by `ai.treasurePlanet`.** Beating the Guardians
runs `winTurn`'s boss branch, which calls `defeatTeam(ai.team)`; `gw_start/setup.js`
deletes `ai.team` for the treasure planet, so `defeatTeam(undefined)` matches the star
itself and clears its `ai()`. Nothing on the star still says "treasure planet" by the
time it is explored — and exploration is the whole point, since a star is fought
first and its cards offered afterwards. `gw_start/setup.js` therefore records
`originSystem.gwaio.treasureStar`, and `isTreasureStar` is the only test any caller
should use. Wars generated before that field existed get it back from
`findTreasureStar`, which looks for a live `ai.treasurePlanet` and otherwise for the
pre-dealt loadout the old war left on the star.

The pool is `loadout_ids.lockedBase + unlockable`, plus whatever a third-party mod
registered in `model.gwoNewStartCards`. `model` is a fresh page in `gw_play`, so that
last part holds only what the mod's own `gw_play` loader pushed — `shared/loadouts.js`,
which seeds GWO's `unlockable` ids into the same global, runs in `gw_start`. A mod
registering only in `gw_start` is therefore absent from the pool and its loadouts can
never be awarded. See [`tech-cards.md`](tech-cards.md), "Third-party card mods".

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
