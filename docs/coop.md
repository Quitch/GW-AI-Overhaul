# Co-op

Galactic War co-op has one **host** and any number of **viewers**. The host owns
the campaign. Viewers join battles. GWO adds per-player tech cards, per-player
loadouts, and colour allocation that keeps everyone distinguishable.

## Shared tech versus per-player tech

The default is **shared control**: one inventory, the host's, for everybody.
Solo play also uses shared control, so most code paths never see anything else.

With **per-player tech cards** enabled, each viewer gets their own inventory,
their own cards, and their own subcommanders. That changes several assumptions:

- `model.game().inventory()` is **always the host's**. Card code that needs the
  acting player's inventory must use the inventory passed to it. `antiTechDeal`
  and the `gwaio_anti_*` cards get this right deliberately. It is an easy thing
  to break. The same rule is why viewers get their own pre-dealt star cards and
  their own treasure loadouts (both have their own sections below). It is also
  why the card tooltips name and highlight units against the viewer's own
  record.
- Viewers only field their own subcommanders under per-player tech. Without it
  there is one shared inventory and no co-op records to read at all. The viewer
  half of `getOrderedSubcommanders` is therefore gated on per-player tech.
- A second referee runs. See below.

The race is read per inventory, never from the host's. The loadout scene stamps
a race onto the viewer's starting inventory. The per-player referee expands each
viewer's units and mods onto that race's files by capability cell. It retags
their commander (and its Sub Commanders') the way the Guardians' Unicorn is
retagged. It routes their subcommanders to that race's tree. **Separate races**
decides which race is stamped. When it is off, every viewer gets the host's
race. When it is on, each viewer gets their own pick. See
[`races.md`](races.md).

**Separate races** is a co-op setting in the war setup's co-op panel. It is off
by default. It can be set only alongside Separate loadout & tech, because the
per-player tech referee is the only thing that reads a race per army. The war
records it as `originSystem.gwaio.races.perPlayerRace`. A viewer who joins
therefore knows whether to offer a picker. A war saved before the setting
existed reads as off.

Which races a client primes cells for follows from the same setting
(`gw_play/races.js`). Normally it is the one race the client plays: its own
record's race under Separate races, the war's race otherwise. A host under
Separate races deals and builds files for every viewer. A viewer may have picked
any race the picker still offers, that is, the recorded races whose server mod
is active. The host therefore primes exactly that offer.

## The two referees

A co-op host hires the referee **twice** per battle. The base game's
`hireRefereesForLaunch` creates a clean shared referee plus a local one. On top
of that:

1. **The main referee** (`gw_play/referee_config.js`) builds the battle config:
   armies, personalities, planets, modes.
2. **The per-player-tech referee**
   (`ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js`, shadowed)
   runs afterwards. It generates each viewer's unit specs and subcommanders and
   adds them to that config. It builds a viewer's Sub Commander personalities
   the same way the host's are built: through `shared/ai_personality.js`, from
   each minion's recorded id and penchant.

Only the host hires a referee. A viewer runs GWO's readers on the war snapshot
the host broadcasts. The war panel and the intelligence panel derive what they
show (commander counts, eco) from the snapshot's recorded fields on the viewer's
own GWO version. Nothing a viewer derives reaches the battle.

The setup runs more than once, and a failed launch can leave mutated state
behind. **None of it is idempotent**: eco mods and fabber caps multiply, and tags
get pushed. Every setup function therefore works
on `_.cloneDeep` copies of the live war objects.
`test/referee_config_ai_paths.test.js` pins this by running the setup twice. It
asserts `×1.5` fabber caps once, not `×2.25`.

The per-player-tech referee's validation lives in `gw_play/per_player_tech.js`
as `validatePerPlayerTechInputs`, because the shadowed file cannot load under
the Node harness. That function is the executable, unit-tested statement of the
referee's input contract.

It distinguishes two kinds of rejection, which is why the two branches log
differently. `writeFailure` marks a genuine failure that must disable per-player
tech, and it stamps `per_player_tech_ready = false`. "No co-op" and "feature
disabled" are benign no-ops that still resolve successfully.

## Player tags

The host is `.player`. Subsequent players are `.player0`, `.player1`, and so on.
Note that the host is _not_ `.player0`. That is why viewer indexing carries an
offset.

These tags scope both unit specs and AI paths. Under per-player tech, each
viewer's subcommander build orders are written to a path scoped by their own
tag. Two viewers can therefore never collide on build orders or `ai_unit_map`.
See [`ai-paths.md`](ai-paths.md) for how the scope token is derived. That
document also covers the sanitisation asymmetry: the subcommander path keeps the
leading dot while the Cluster path does not.

The per-player pass skips the host's minions because the main referee already
included them. The check is `tag === ".player"`.

## Colour allocation

Human army colours come from the base game. `model.gwCoopPlayerColors` in
`gw_play.js` is the authoritative source. It is a host-first record per
connected client, and each record carries the `color` pair that client's army
will get. `gwo_panel.js` reads it rather than computing the answer again. The
swatch therefore cannot disagree with what the referee assigns.

Shared armies are a single army, so every co-op commander flies the host's
colour: the `playerColor` global tag, written once at war creation.
`gw_coop_referee.js` splits unshared armies one per client. It colours army 0
with the host's faction colour. Then it prefers the faction's own
`coopPlayerColors`, and otherwise uses the custom-lobby palette in
`shared/gw_coop_player_colors.js`. That module is why GWO no longer keeps a copy
of the palette. Before PA 124670 the palette was private to
`gw_coop_referee.js`, which exported only `apply()`.

**Every faction therefore needs a `coopPlayerColors` array**, including GWO's
own Cluster in `faction/cluster_faction.js`. The base game treats the array as
optional: a faction without one silently drops to the generic lobby palette.

Subcommander colours are a separate system and still GWO's own. See
`gw_play/commander_colour.js`. `shared/referee_coop.js` provides the ordering:

- `getOrderedSubcommanders(inventory, game, connectedClients)` returns every
  allied AI commander that draws from the player faction's palette. The list is
  **in the order the battle config numbers their colours**: the host's
  subcommanders first, then each connected viewer's. Order in equals order out.
  Callers that care which colour lands where must therefore pass clients
  host-first (see this module's `clientsInPlayerOrder`). Callers that only want
  a count can pass any order.
- `alliedColourIndex(position)` returns `position + 1`. Index 0 is reserved for
  the player, whose army takes the faction's own colour pair rather than a
  palette entry.

A star's `ai.ally` is **deliberately absent** from that list. It is numbered
last, after every subcommander, so that a per-star commander never shifts the
colour of anything the war panel already shows. Its index is
`alliedColourIndex(list.length)`.

Duplicated subcommanders share one colour. That matches how the host's
duplication tech produces a single army with several commander slots.

`gw_play/commander_colour.js` decides which palette entry lands where. It is
shared rather than per-caller for a reason: `referee_config_setup.js`, the
shadowed per-player-tech referee, `gwo_panel.js` and the intel panel must all
agree. Otherwise the panel promises a colour the battle does not deliver. It
orders a palette by `contrastScore`, which is squared RGB distance plus a
luminance term weighted 16×. The commanders most likely to be confused are
therefore the ones pushed furthest apart.

The palette can run out. `pick()` then uses the caller's colour instead. The
referee treats "no pair available" as a reason to refuse the battle rather than
let two armies collide.

## Resolving viewers

`getConnectedViewerInventories(game, connectedClients)` returns
`{client, inventory}` pairs for connected **viewer-role** clients. It drops any
client whose inventory is not resolvable yet.

It guards against two failure modes:

- If no authenticated user ever loaded a viewer's PA profile, that viewer has an
  empty `uberId`/`displayName`. The function reports that rather than silently
  mishandling it.
- `game.findCoopPlayerInventoryData` never returns a record for the **host**.
  The host's own loadout is resolved locally via `model.gwoLoadout`.

Minion counting deliberately includes players who are not currently in the game.
The minions of a player who leaves and rejoins therefore do not vanish and
reappear.

## Addressing a host's reply

A host→viewer operator that carries one player's result is addressed with
`target_client_id`. **The server is the enforcement point.** It resolves the id
against its own connected clients. It refuses the send outright when that client
is not connected. It relays only to the clients that matched. It also rebuilds
the envelope as `{type, payload, request_id, timestamp}` on the way through, so
`target_client_id` never reaches the viewer at all.

That is why the handlers do not check who a result is for. `payload.client_id`
is the host's echo of which player it acted on. The handler uses it to find the
record. It is not a claim to validate against local identity. Re-validating it
would be worse than redundant: `client.id` is per-connection, so the check would
start rejecting a player's own results the moment they reconnect. That is the
same reason `gwo_streams.coopPlayerKey` prefers `record.playerId`.

Every reply that concerns one player addresses itself, including the failure
replies (`cards_coop_reroll.js`'s `failReroll`, `cards_start_subcdr.js`'s
`failSetup`). An unaddressed error would put one viewer's refusal on every
viewer's screen. Two host→viewer operators carry **no** target, and both are
broadcasts by design. One is the ping, which self-identifies and deduplicates by
`ping_id`. The other is the star-card name sync.

## Rerolls

A viewer's reroll request is a round trip: viewer → host → viewer. Two operators
in `gw_play/cards_coop_reroll.js` implement it. The size of the remaining hand
encodes the number of rerolls used, since each reroll spends one more of the
offered cards.

The host's own reroll path and the viewer path both keep the new cards hidden
behind the scanning overlay for a cosmetic two-second beat. That delay is
scheduled but not awaited.

## Whose selection is whose

A viewer's selection follows the host's moves. That is right until the viewer
picks a star of their own to view. `gw_play/coop_selection_follow.js` hijacks
`applyCampaignAction` and restores the viewer's own choice once the replayed
action settles. The scene entry is the thin `gw_play/coop_selection.js`, which
exists only to `_.defer` into it. `systems.js` replaces `model.selection`
outright, so `coop_selection.js` can take the subscription only after every
`gw_play` mod loads.

The choice has to be restored **afterwards** rather than defended.
`applyCampaignAction` writes the destination into `selection.star` itself,
because the base game's `move()` reads its destination from there. Blocking that
write would break the replay.

A viewer counts as having chosen while its selection is neither empty nor the
star the host stands on. Selecting the host's own star is therefore how a viewer
starts following again. A selection that the host later moved onto needs no
restoring. The tracking subscription ignores writes made while
`gwCampaignReplayingAction` is set. Those are exactly the host-driven writes.

## Pings

A viewer selects a star and presses Ping. The host and every other viewer then
get a pulsing marker on that star and the game's own ping cue. They also get a
chat line naming the sender. Two operators carry it, viewer → host → every
viewer: `gwo_ping_star` and `gwo_ping_star_broadcast`
(`gw_play/coop_ping_operators.js`).

A ping changes nothing. That fact shapes the whole subsystem:

- **Both handlers return nothing.** A returned promise joins
  `gwCampaignStateApplyTail`, and a ping has no business in the queue that
  orders authoritative updates. Nothing sets `stale_snapshot`, writes a record,
  or saves.
- **The relay broadcasts with no options object at all.** Omitting both
  `target_client_id` and `target_client_ids` is what makes the server relay it
  to every connected viewer.
- **It needs no inventory record**, so it works for the unauthenticated viewer
  whose empty `uberId` breaks every record-keyed path above. The cooldown and
  the chat label key on `client_name` instead, and on the `id::name` composite
  key after that.

The pinger renders locally on send and drops the returning broadcast by
`ping_id`, rather than waiting for the round trip. That buys instant feedback on
the click. With a host on an older GWO, the ping therefore degrades to "only the
pinger sees it" rather than to a dead button. Such a host logs the unknown
operator type and ignores it.

Rate limiting is on both sides because the relay has none of its own. The
viewer's 3s cooldown is UI feedback, greying the button. The host's cooldown is
the real one. It is deliberately **shorter** at 2.5s, because the viewer's clock
starts at the click and the host's at receipt. The ping cue is throttled
separately again, at 250ms: pings from different clients can legitimately land
together.

### The marker

`gw_play/coop_ping_marker.js` attaches an expanding ring and an exclamation icon
to `system.systemDisplay`, one per star. If the star is pinged again, the marker
restarts rather than stacks. Three things about it are not obvious:

- **`z = 2` is load-bearing.** `systems.js`'s `sortContainer` orders an
  undefined `z` ahead of every number, so an unlabelled container sinks below
  the star icon.
- **There is no `createjs.Tween`**, because `gw_play.html` loads EaselJS alone.
  The pulse therefore uses a `tick` listener that reads the wall clock, like
  `systems.js`'s rotating selection icon. `galaxy_map_perf.js` would otherwise
  render it at the idle 10fps. That is the reason for
  `model.gwoRequestInteractiveFrames`.
- **The `_.delay` cleanup is not a redundant safeguard.** `updateStage` stops
  re-arming its `requestAnimationFrame` while `hidingUI()` is true. Ticks
  therefore stop dead during a battle launch, and a tick-only marker would still
  be frozen on the map on return.

### What can be pinged

`canPing` drives both the button's visibility and the send. A click that lands
as the war moves on therefore cannot pass it. A star is pingable when this
client is a connected viewer, the star index is one the galaxy has, and
`star.explored()` is false. An explored star is already taken, and there is
nothing left there to ask the host for. That observable travels in
`syncViewerStarsFromGame`'s copy list, so a viewer's own copy is maintained
rather than inferred.

It also refuses while the turn state is `explore` or `fight`. Once the host
commits to a destination, where to go next is no longer a question. Testing for
those two rather than for `begin` is deliberate. **The state only returns to
`begin` on the next `move()`**, so a finished exploration rests at `end`. That
is exactly when somewhere to go next is worth pointing at. Gating on `begin`
instead left the button dead from the moment a star was finished until the host
left it.

Two things sit outside the turn state and are tested alongside it. One is
`scanning()`, which is raised a beat before the state moves. The other, under
per-player tech, is whether **anybody** still holds a tech offer.
`gwCampaignPlayerSetupBlocked` answers that for the host and returns false flat
for everyone else. `techChoicePending` therefore applies the same shape test to
the records themselves: the local offer plus every connected client's. Every
client has those records, because records travel in the snapshot.

The button is a sibling of the stock action row inside
`#selected-system-anchor`, not a member of it. That row is gated on
`canShowCampaignActionButtons`, which is false for exactly the viewers Ping is
for. `gw_play/coop_ping.js` injects the button synchronously, before the scene's
single `ko.applyBindings`. It takes its dependency on `model.selection.star`
inside a `_.defer`. `systems.js` replaces `model.selection` wholesale, and a
computed built at load time would subscribe to the observable that the
replacement orphans.

## Per-player pre-dealt cards

Under per-player tech each viewer gets their **own** card on every selectable AI
star. The host deals it from that viewer's inventory
(`gw_play/cards_coop_star_cards.js`), and the card joins their hand when they
explore. `star.cardList()` remains the host's own. A viewer never sees it.

The transport is a top-level `gwaioStarCards` field on the co-op player
inventory record, `{turn, cards: {"<star>": card}}`. Three things rule out the
alternatives:

- Host→viewer operators reach only **connected** clients and are never replayed.
  They therefore cannot carry state a late joiner needs.
- `applyCampaignSnapshot` calls `game.load()`, which rebuilds every star object.
  The next snapshot wipes anything written into `star.ai().cardName` on a
  viewer. That is why the intelligence panel reads the record through
  `gw_play/coop_star_cards_view.js` rather than the field
  `gwo_sync_star_card_name` maintains for the host.
- Records **are** in the game save, and therefore in every snapshot.

Note the asymmetry that makes this work. The server drops anything added inside
`pendingTechCards`, because it rebuilds that object as
`{star, cards, dealIndex, updatedAt}`. Every merge of the _record_ is an
`_.assign` over the existing one, on both the server and the client, so a novel
top-level field survives. `cardsOffered`/`rerollsUsed` are the standing example
of the first half: they only persist on the reroll path, which writes the record
locally.

**Only the host's own per-turn deal replaces a card a viewer already holds.**
Only `dealCardToSelectableAI` calls `refresh({redeal: true})`. Every other
trigger fills gaps. `game.stats().turns()` moves on every `GWGame.move()`, while
the host's cards are re-dealt only after a win. A refresh keyed on the turn
would therefore change what a star advertises to a viewer while the host was
merely travelling to it. The card would then no longer be the one in their hand
on arrival.

The refresh depends on two ordering rules:

- **Re-read the record immediately before writing it.**
  `upsertCoopPlayerInventoryData` replaces the whole record, and `chooseCards`
  is async, so a catch-up deal can land `pendingTechCards` in the window.
  Writing over a clone captured before the deal erases it. That viewer then
  waits forever on an offer the host thinks it sent.
- **A refresh must not run while anyone is still catching up.**
  `gwCampaignPlayerSetupBlocked` is not sufficient on its own. It reads
  `client.loading_status`, which arrives on `gw_campaign_control` broadcasts.
  Those broadcasts are deliberately never queued and can lag the record update.
  `viewersReadyForStarRefresh` therefore also requires every connected viewer to
  be level with `game.hostTechCardDealCount()`, the server's own catch-up
  predicate. That closes the loop: the snapshot a refresh publishes makes the
  server sweep every client for catch-up, and the gate guarantees that sweep
  finds nothing. Without it, a viewer rejoining ten deals behind would drive ten
  full re-deals of every selectable star.

Hand sizing: the pre-dealt card is passed as `systemCards`, and the draw count
is reduced by one. The stored hand is therefore still `cardsOffered` long.
`computeRerollDeal` derives the spent rerolls from that length, so lengthening
it would hand the viewer a free reroll. A reroll drops the pre-dealt card. That
matches how `model.rerollTech` empties the star's card list for the host.

## Treasure loadouts

The treasure planet's loadout is **not** pre-dealt at war creation. It is
derived at exploration from the acting player's own locked pool. The same code
serves the host and every viewer, and each is judged by their own unlock record
(`gw_play/treasure_loadouts.js`). A player who owns every loadout gets an
ordinary tech deal there instead.

Deriving rather than storing is what lets a catch-up deal replay a star for a
viewer who was absent when it was explored. Keyed on `(player, star)` alone, the
offer reproduces exactly. It also means a host who unlocked everything no longer
denies the planet to everyone else.

**Winning one unlocks the commander and grants nothing in this war.** The card
is banked and never enters the inventory. `model.win` banks it and passes `-1`
to `winTurn`, which still clears the star and ends the turn. Left in the
inventory, the card would read as tech held. `cardsOfferedCount` tests `hasCard`
for the Lucky Commander, so it would keep granting a fourth card on every
explore. The base game instead adds the card and a free slot to cover it
(`gwc_start_*.buff`'s "Don't clog up a slot" branch). GWO does not.

The server already banks a viewer's loadout choice without touching the
inventory, but only for ids that pass `isBaseLoadoutCardId`. It pushes every mod
loadout into the viewer's war inventory instead. GWO therefore intercepts
**every** loadout id on a viewer, banks it locally and submits `-1`. It cannot
leave the base ids to the server, because banking is held shut on viewers for
the reason below.

## The per-player loadout scene

`gw_coop_per_player_loadout` is its own scene. It is where a viewer picks their
war loadout and, under Separate races, their race. It has to build that
loadout's starting inventory itself rather than inherit the host's. GWO puts
three files in it: `shared/race_picker_view.js`,
`gw_coop_per_player_loadout/race_picker.js` and
`gw_coop_per_player_loadout/gwo_loadouts.js`.

Four things about it are not obvious from the scene it sits in:

- **The view model knows nothing about the war.** It has no player faction, but
  Cluster start cards read `global.playerFaction`. It has no race, and no war
  settings. `host_war.js` therefore loads the campaign game through
  `GW.manifest.loadGame(model.activeGameId())` once and caches the promise for
  both scene scripts. It resolves
  `{ faction, colour, race, races, perPlayerRace }` always and never rejects,
  because a loadout preview outside a war still has to render.

  `colour` is the war's `global.playerColor`. It paints the commander preview
  the way the war setup's Commander picker does: the same
  `race_picker_options.commanderTint` rotates the art's hue to the faction's.
  `races` is the war's recorded offer intersected with the host's active server
  mods. See [`races.md`](races.md), "Assignment and persistence", for why the
  intersection uses the host's set and not this client's, and why no answer
  removes nothing.

- **The deck it deals from is the loadout list, not the tech deck.** The scene
  deals exactly one card, the loadout. It therefore loads `loadouts.allCards`,
  the same list the picker offers, rather than calling `setupGwoCards`. That
  deck holds GWO's own loadout ids and third-party _tech_ ids, but never a
  third-party _loadout_ id. A card mod pushes such an id onto
  `model.gwoStartingCards` or `model.gwoNewStartCards` instead.

  Building the deck from `setupGwoCards` made another mod's loadout selectable
  and then undealable. The base scene's only failure handler is a
  `console.error`, so Join appeared to do nothing. `gw_start/setup.js` loads the
  host's start cards from `allCards` for the same reason.

- **The picker's markup is injected synchronously.** `ko.applyBindings` runs as
  soon as the scene scripts return, so anything added after that is never bound.
  GWO inserts the race control and the commander display at scene-script time.
  They stay hidden until `host_war.load()` says the war has races to offer. For
  the same reason the commander name and portrait lookup is a scene script
  rather than a module. The markup binds to it before any `requireGW` could
  resolve.
- **`validateStartingInventory` refuses rather than proceeds.** It asserts that
  the chosen card produced exactly one card, in first position, with `maxCards`
  a number that leaves room beyond it. Anything else rejects the deferred,
  because a loadout that quietly banked tech would hand the viewer cards nobody
  dealt them.

Banking is the other half, and "Whose unlocks are whose" below covers it. A
viewer banks its own war loadout from this scene. That is why the hold placed on
the host's inventory does not reach it.

## Whose unlocks are whose

`GWGame.load()` calls `game.inventory().applyCards()` on **every** client. On a
viewer under per-player tech, that inventory is the host's. Each loadout card's
`buff()` ends in `bank.addStartCard`, so simply loading the campaign collected
the host's loadouts into the viewer's own bank. The bank is what `gw_start`
reads next war.

The guard is in the shadowed `gw_inventory.js`, and **the timing is the whole
difficulty**. That first apply runs before the campaign half of `model` exists.
`isCampaignViewer`, `gwCampaignPerPlayerTechCards` and `model.game()` are all
`undefined` at that point, so no model-based test can answer. Installing a hold
from a scene script is too late even though `loadMods` is already complete.

Two signals _are_ available at that point: `sessionStorage.gw_campaign_role`,
and the game passed to `GWGamePatches.patch`. `GWGame.load` calls `patch`
immediately before `applyCards`, after setting `perPlayerTechCards`.
`gw_inventory.js` therefore hijacks `patch` to raise a flag that the next
`applyCards` consumes and suspends on.

Hijacking rather than shadowing `gw_game.js` keeps a 459-line save-format file
out of the tree. `gw_game_patches` is reachable because, like `gw_bank`, it
declares no dependencies. `shared/gw_common` and `shared/gw_game` would both
close a cycle back onto `gw_inventory`.

`gw_inventory.js` only ever flags the host's inventory, so a viewer still banks
its own claims. Those are `bankOwnLoadout` for a treasure loadout, and the
loadout scene for its war loadout. Winning a war unlocks through `gw_war_over`,
a different scene, and is unaffected.

The mirror of this is the host collecting a _viewer's_ loadouts. It comes from
the host applying each viewer's inventory to size their deals. Banking is
suspended at each of those call sites (`cards_coop_deal.js`,
`cards_coop_reroll.js`, `cards_coop_star_cards.js`).

**The star is identified by index, not by `ai.treasurePlanet`.** Beating the
Guardians runs `winTurn`'s boss branch, which calls `defeatTeam(ai.team)`.
`gw_start/setup.js` deletes `ai.team` for the treasure planet, so
`defeatTeam(undefined)` matches the star itself and clears its `ai()`. By the
time the star is explored, nothing on it still says "treasure planet".
Exploration is the whole point, since a star is fought first and its cards
offered afterwards.

`gw_start/setup.js` therefore records `originSystem.gwaio.treasureStar`, and
`isTreasureStar` is the only test any caller should use. Wars generated before
that field existed recover it from `findTreasureStar`. That function looks for a
live `ai.treasurePlanet`, and otherwise for the pre-dealt loadout the old war
left on the star.

The pool is `loadout_ids.lockedBase + unlockable`, plus whatever a third-party
mod registered in `model.gwoNewStartCards`. `model` is a fresh page in
`gw_play`, so that last part holds only what the mod's own `gw_play` loader
pushed. `shared/loadouts.js`, which seeds GWO's `unlockable` ids into the same
global, runs in `gw_start`. A mod that registers only in `gw_start` is therefore
absent from the pool, and its loadouts can never be awarded. See
[`tech-cards.md`](tech-cards.md), "Third-party card mods".

**A viewer's unlocks arrive by a GWO route, not the base game's.** Both
`normalizeStartCardIds` and the server's `normalizeUnlockedStartCardIds` filter
to ids that begin `gwc_start`. `record.unlockedStartCardIds` can therefore never
hold a `gwaio_start_*`, `nem_start_*` or `tgw_start_*` id. Those are 16 of the
21 cards in the pool. `model.recordHasUnlockedStartCard` returns false for all
of them. Viewers therefore report their own list over the
`gwo_report_unlocked_loadouts` operator, and the host stores it as
`gwaioUnlockedStartCardIds`. `recordHasUnlockedLoadout` reads both fields plus
`loadoutCardId`.

## War end

`gw_play/victory.js` ends a won war the moment the host lands in `gw_play`. It
tells the viewers to do the same over the `gwo_war_end` operator. After the
final battle that operator would never arrive, because of three stock rules:

- Returning from a battle in co-op restarts the campaign server process. The
  host is back in `gw_play` a couple of seconds after shutdown. A viewer must
  rediscover the new server, connect, and sync a snapshot first, and may pass
  through the loadout scene on the way.
- A host operator goes only to connected clients. It is dropped for a client
  that does not yet have its initial snapshot, and it is never replayed.
- Once the host is on `gw_war_over` there are no campaign handlers, so the host
  can never send the viewer a fresh `turnState: "end"` either. The viewer lands
  in a won war with the turn on `"begin"` and never sees the victory screen.

So in a co-op war the host holds the end behind `gw_play/victory_wait_state.js`.
That file shows the "Waiting for players" modal (`victory_wait.html`, injected
by `victory_wait.js`) until every player from the battle is back. Then it runs
the victory flow unchanged. Three details govern how it decides:

- **Who to wait for.** At launch the host writes the number of connected clients
  into `gw_campaign_settings` as `battle_launch_clients`. The server carries it
  into the restart-prepare payload, and the host keeps it in
  `model.gwCampaignRestartContext()` under `settings`. Stock later restores
  `max_clients` from it, but over an async `modify_settings` round trip, so
  `gwCampaignMaxClients()` can still read 1 when the victory code first runs.
  The expected count is the larger of the two.
- **What "returned" means.** A viewer reports `loading: false` only from
  `markGwCampaignAuthoritativeStateReady`, after its snapshot is applied. A
  connected client with `loading` false and no `requires_loadout` or
  `picking_loadout` / `picking_tech_cards` status is therefore past the point at
  which operators are delivered. The test is the per-client half of
  `viewersReadyForStarRefresh` in `cards_coop_star_cards.js`.
- **Cancel.** The host may end the war without waiting. Players still away then
  land in a won war with no victory screen. That is what happened every time
  before the wait existed.

`gw_play/systems.js` builds the state in the same `requireGW` as `victory.js`,
so the two cannot race. Solo wars skip it entirely: `gwCampaignEnabled()` is
known synchronously from the URL at scene construction.

## Where to look next

- [`ai-paths.md`](ai-paths.md): per-viewer path scoping.
- [`tech-cards.md`](tech-cards.md): why `deal()` must read the passed inventory.
- [`shadowing.md`](shadowing.md): why the per-player-tech referee is shadowed.
