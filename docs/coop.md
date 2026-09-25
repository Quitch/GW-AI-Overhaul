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

The local referee's files are mounted on the host alone. Stock deep-clones them
first with lodash 3's `cloneDeep`, whose cost is quadratic in the objects it
copies: a battle's 2,000 or so files took 11.5 s, and the 9,800 of a battle with
11 per-player AI players took 136 s. So the host's own pass hands its files over
as JSON text (`gameFilePaths.cookFiles`), which clones in milliseconds.
`mountFiles` would have made that text anyway.

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
disabled" are benign no-ops that still resolve successfully. A viewer's unit map or
spec read that fails takes the same path: the launch aborts with
`per_player_tech_ready = false` and the error named in the log, rather than
hanging on the load screen.

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
`gw_play/commander_colour.js`. `gw_play/referee_coop.js` provides the ordering:

- `getOrderedSubcommanders(inventory, game, connectedClients)` returns every
  allied AI commander that draws from the player faction's palette. The list is
  **in the order the battle config numbers their colours**: the host's
  subcommanders first, then each connected viewer's, then, under per-player
  tech, each AI player's in slot order. Order in equals order out.
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

## AI players

A co-op host can drop an AI player into an open slot, so a war made for more
players than turned up can still be fought. The AI fights beside the humans as
an allied AI army. The logic is `gw_play/coop_ai_roster.js` and
`gw_play/coop_ai_lobby.js`; `gw_play/coop_ai.js` is the scene glue. Under
per-player tech each AI also has a loadout and tech cards of its own, which the
host chooses for it. See "AI players' tech" below.

### A slot is a count

Stock keeps no list of slots. A slot is only `connected < max_clients`: the
client's `gwCampaignHasEmptySlots` greys Fight while one is open, and the
server refuses `launch_gw_battle`. So an AI **takes a slot by shrinking
`max_clients` by one**, and GWO keeps the AI slots itself, as co-op records.

`gw_play/coop_ai.js` wraps `model.savedCoopPlayers` to leave out the AIs that
hold one of the war's own seats, as `max(1, stock − those AIs)`. Every session
open seeds `max_clients` from it, and so does a locked war's slot limit, so an
AI's slot never reopens to a human. An AI the host added into a slot opened
with "+", past the seats the war was made with, is marked `gwaioAi.extraSeat`
and takes none of the war's seats, so the human it sat beside keeps theirs at
the next session. Which kind of seat an add fills is counted, not tracked: the
open slots and the AIs in the war's seats, against the war's seats. An AI in a
"+" seat is left out of that count, so the seat a player left is still the
war's, and an AI that takes it holds it. The wrap is made synchronously at
scene load, because a module callback lands after a new session's saved
settings apply, so until the roster loads the wrap makes `roster.humanSeats`'
count itself.

`gwCampaignSlots` becomes stock's rows plus one row per AI. An AI row carries
every field a stock row has, so the stock markup binds it unchanged. Its
`canKick` and `canRemove` are false, so stock's own buttons never act on it;
GWO's Kick does. `canAddGwCampaignSlot` counts the AIs against the server's
limit. An open lobby's limit counts every slot, and a lock's already leaves the
AIs out. Both are read from the server, not from the war, because stock's
restart after a battle never re-sends the lock.

### An AI is a record

The AI's record is `{playerId, commander, updatedAt, gwaioAi}`, and under
per-player tech it also holds the AI's tech ("AI players' tech"). `gwaioAi`
holds the serial, the name, the personality template, and a Penchant AI's
penchant. It is also the marker: a record is an AI's if and only if `gwaioAi` is
a plain object. The id is `gwo_ai_<serial>`, and the serial comes from
`originSystem.gwaio.coopAiSerial`, which only grows. An AI added after a kick
therefore draws from a stream of its own, though the kicked AI's name and
commander are free to be drawn again. A war without GWO's settings has nowhere
to keep the serial, so it offers no Add AI.

The record has **no `playerName`**. Stock finds a record by `playerId`, then by
exact `playerName`, on the client and the server alike, so no human's lookup
can land on an AI's record. A departed human's record is never touched either,
which is what keeps their rejoin and their fresh-deal rules intact.

Records are in the war's save and in every snapshot, so a viewer sees the rows
too. Under shared tech viewers hold no tech state, so the host publishes a
snapshot as soon as the roster changes. Under per-player tech the snapshot waits
until every viewer is level ("AI players' tech"). With no viewer connected, it
publishes nothing: a viewer who joins asks for a snapshot as its first step.

The name is drawn from the skirmish lobby's own list,
`server-script/ai_names_table.js`, which the client reads as text. It is never a
connected player's name, a record's `playerName`, another AI's, or `Player`,
case ignored. An AI whose name cannot be drawn is named by its serial. The
commander is one of the host's owned MLA commanders that nobody fields yet, or,
for an AI that fields a race, one of that race's own.

An MLA commander is one that builds what MLA's base commander builds, read up
its `base_spec` chain, so `gw_play` reads each owned commander's chain before
the Add AI button turns on. Ownership alone lets other factions' commanders in:
commander-merge lists every supported faction's commanders and gives several of
them the catalog name of a commander everyone owns, and a client that is not
signed in owns everything. A faction's commander builds only that faction's
units, and without that faction's mod it has no model, which crashes every
client when it lands.

### Adding and kicking

The host adds an AI from an empty slot's Add AI button. The lobby first has to
be settled, because `gwCampaignMaxClients` can be stale. Stock's restart
re-apply after a battle sends a `modify_settings` with no callback, and until
the server answers it, the count still reads the fresh server's default.
`gw_play/coop_ai.js` therefore wraps `model.send_message` and counts every
`modify_settings` in flight, and Add AI waits for none. It also waits for the
saved settings to have applied, for no player to be mid-setup, for no battle to
be launching, and for the victory wait to be closed.

After a battle, the humans who fought it come back one at a time, and each
one's slot reads as empty until they do. So a session that came back from a
battle offers Add AI only once `battle_launch_clients` humans are connected
again, or a minute has passed. Without that, an AI could take the slot of a
viewer still reconnecting, and turn them away with "No room".

Stock's "+" and "−" send an absolute count read from `gwCampaignMaxClients`.
While an add, a kick, or any other `modify_settings` is in flight that count is
stale, and a "+" sent then would undo the add. Both are held until the count
settles.

The add asks the server for one slot fewer, and writes nothing before it
answers. An answer with any other count abandons it. A human who joined
meanwhile has taken the slot, and the server keeps `max_clients` at the number
connected. The record is written through `enqueueGwCampaignStateApply`, so it
cannot interleave with a viewer's queued record write. Under a lock the same
count is sent again after the write, so the lock's limit leaves the new AI out.
A failure after the server answered gives the slot back, unless the record was
stored: the records' subscribers run inside the write, so one that throws does
so after the AI is in, and the AI keeps its slot.

Kicking is the only way an AI leaves, and it deletes the AI and its record for
good. So its Kick asks first, like Delete Tech
([`accessibility.md`](accessibility.md), 3.3.6). The record goes before the slot
comes back, so a lock's limit counts it.

A human whose slot an AI took is refused with "No room" when they come back,
until the host kicks the AI or adds a slot. Stock has no hook that could tell
them why.

### Sitting out

An AI is added only inside a session, but its record stays in the war's save.
When the war is played without a session, the AI takes no part: the roster is
empty outside an active session. That covers a host who resumes from the main
menu without Call for Reinforcements, and a viewer who left and plays their
local copy. When a session opens again, the wrap keeps the AI's slot, and the AI
fights again. Under per-player tech it first settles the deals the host
recorded meanwhile ("AI players' tech").

### In a battle

The first step of every hire (`gw_play/referee.js`) fixes the battle's roster
as `ref.coopAis`, from `model.gwoCoopAi.launchRoster()`. A session whose war
has AI records but whose AI modules did not load fails the hire, rather than
fighting without its AI players. Fight is refused for the same reason, and
while an add or kick is under way.

Each AI is one army. Its slot is `ai: true` with a commander, it has
`alliance_group: 1`, and its commander carries its spec tag already, because
the army joins after `referee_config.js`'s tagging loop. It fights at the war's
difficulty tier, with the players' economy: `setAdvEcoMod` is the enemy's eco
cheat and is not applied. The personality template is `uber` under Queller and
`absurd` otherwise. It takes no `GWAlly` tag: the build files use that to mark
a Sub Commander, and an AI player plays as a player would. Its colour continues
the players' sequence: the AIs take
`resolvePlayerColorPairs(humanArmies + AIs).slice(humanArmies)`, and the stock
resolver builds its pairs in order, so no human's colour moves.

Under shared tech every AI fields the host's units under `.player`. Each AI's
commander joins the `.player` specs, as the star's ally's does. The AIs share
one AI tree on the war's Co-op brain, written with the host's AI mods. The tree
is identical for every AI, because they share the brain, race, AI mods and tag.
See [`ai-paths.md`](ai-paths.md), "Co-op AI players". Under per-player tech
each AI fields its own, on a tag and trees of its own ("AI players' tech").

**The per-player tech referee is untouched.** An AI army has an `ai` slot, and
stock's co-op referee and the server's lobby map humans onto non-AI armies only.
So the per-player referee's player count and human armies still match, and it
keeps the main referee's files and armies as they are. That holds under
per-player tech too: the main referee builds everything an AI brings there, and
its Sub Commanders' armies are `ai` armies as well.

## AI players' tech

Under per-player tech an AI player has its own loadout, inventory, and tech
cards, as a viewer does. Nobody sits at its controls, so the host makes every
choice a viewer would make. `gw_play/coop_ai_driver.js` settles the AI's deals.
`gw_play/coop_ai_effects.js` and `shared/coop_ai_cards.js` judge its cards, as
[`tech-cards.md`](tech-cards.md), "How AI players judge a card", describes.
`setupCoopAiTech` in `gw_play/cards.js` is the glue. All of it runs on the host
alone, and only in a session.

### The record

An AI's record is complete from the moment it is written, so stock's inventory
modal and every deal path take it at once. Beside the fields every AI record
has, it holds:

- `loadoutCardId`: the loadout the AI starts with, chosen by scoring.
- `inventory`: its starting inventory, applied, and stored as the server stores
  a viewer's: plain JSON with the global tags only, since every apply rebuilds
  the card-context tags. It is made plain because `GWInventory.save()` is
  `ko.toJS`, which copies the prototype's methods onto the result. A save
  therefore still looks like a `GWInventory` to anything that tests for
  `getTag`.
- `techCardDealCount: 0`: it has settled no deal yet, so it owes every deal the
  host has recorded.
- `gwaioAi.race`: its race. The same race is stamped on the inventory as the
  `playerRace` global tag, which is where `races.raceOf` reads it.

Under Separate races the AI picks its race from those the war offers, which is
the offer a viewer's picker gets, and prefers one that no player fields yet. The
draw comes from the `race` child of its identity stream. Otherwise it fields the
host's race. Its commander is then drawn as under shared tech, from its own
race.

Its loadout is chosen by what each loadout does. The candidates are the
starting loadouts and every locked loadout the host has unlocked, less those the
AI's race may not field. A loadout that another mod registers in `gw_play`
counts too. Each candidate is built as the per-player loadout scene builds a
viewer's (`shared/starting_inventory.js`), with the General Commander's Sub
Commanders drawn as a viewer's are (`cards_start_subcdr.js`'s
`appendRecordMinions`). It is then applied and scored against the base start
card alone, `gwc_start`, by the same scorer as a tech card. The best score wins,
and a tie goes to the AI's `coop_ai_loadout` stream ([`galaxy.md`](galaxy.md),
"Play-scene streams"). A candidate that cannot be built is skipped. If none can
be built, the add fails and gives the slot back.

That build takes seconds, so the lobby makes it after the server has answered
and before the campaign state queue, which it would otherwise hold. It takes the
serial first, because the loadout's stream is keyed by it. A build not settled
within 60 seconds fails the add and gives the slot back, since the lobby is held
until then, and a result that lands later is dropped. Add AI is offered
under per-player tech only once the AI tech modules have loaded and a unit
lookup is in.

### Settling deals

An AI **owes** a deal while its `techCardDealCount` is below
`game.hostTechCardDealCount()`, which is the test the server makes of a viewer
for catch-up. A pass of the driver starts whenever a session opens, the host
records a deal, the records change, the unit lookup arrives, or a star-card
refresh ends. A pass with nothing owed does nothing. It serves the AIs in slot
order, and settles each AI's owed deals one at a time, in the order of the
host's history, yielding between them. For each deal it:

1. **Deals the hand as a viewer's would be dealt.** `cards_coop_deal.js`'s
   `pendingHandForRecord` is a viewer's deal with no message sent. It deals from
   the AI's own inventory, at the star the host's history records for the deal,
   from the AI's own `coop_deal` stream, and puts the AI's pre-dealt card for
   that star last. A deal missing from the host's history is declined.
2. **Judges each card by applying it.**
3. **Rerolls, takes, swaps, or declines.** It declines a hand that holds a
   loadout: a loadout is banked, never held, and an AI never banks. It rerolls
   while its best card is poor and a reroll remains, through
   `cards_coop_reroll.js`'s `rerollHandForRecord`, a viewer's reroll that
   stores, sends, and saves nothing. It counts the rerolls spent from the
   hand's length, as that reroll does, so a thin deck's short hand has fewer
   left. It declines a best card worth nothing or
   less, and takes one the bank has room for. With a full bank it deletes its
   weakest held card for a card clearly better, but never the loadout in first
   place, and otherwise declines.
4. **Writes one patch.** The patch is the new `techCardDealCount`, plus the
   applied inventory after a take or a swap. A decline still writes the count,
   so the AI moves on.

Only the settled result is written. The hand, rerolled or not, lives in memory,
and the driver never writes `pendingTechCards` or `gwaioStarCards`. A reload
mid-decision therefore reruns the deal from the start, on the same streams. The
hand comes from the deal's own stream, a reroll from its `reroll.<n>` child, and
a tie from the AI's `coop_ai_decision` stream, keyed by the deal and the
rerolls spent ([`galaxy.md`](galaxy.md), "Play-scene streams"). The inventory
written is always an applied one, so the record's units, mods, AI mods, and Sub
Commanders are what its cards give. The referee builds the AI's battle files
straight from them.

The write runs inside the campaign state queue (`enqueueGwCampaignStateApply`),
where every host record write runs, so it cannot interleave with a viewer's
queued write. It re-reads the record first. It writes nothing if the AI has
gone, if the deal was settled meanwhile, or if the AI's cards differ from those
it decided on. A decision made on changed cards is redone, up to three times in
a pass. The patch goes over the fresh record, so a star-card write made while
the AI decided is kept.

Each step is bounded. A deal not settled within 20 seconds falls back to a
quick pick: the first card of the hand in play that is not a loadout, if the
bank has room and its apply lands. Otherwise the deal is declined, and still
counted. An error falls back the same way, but only a timeout counts against
the AI. The decision a timeout abandons stops at its next step, so it queues no
applies ahead of the next deal's and logs no choice that is never written. An
AI whose deals time out twice declines the rest of its deals without
dealing them, until `gw_play` next loads, because the driver keeps that count
in memory. A write the queue has not run within 60 seconds is no longer waited
for, and a later pass takes the deal up again. The write may still run, but
every write checks the count first, so a deal is settled only once. Each of
these is logged ([`live-testing.md`](live-testing.md), "AI players").

After a pass that wrote anything, the host refreshes an open inventory modal,
saves the war, and owes the viewers a snapshot ("Publishing to viewers").

### Holding the war

`model.gwoCoopAiDeciding` is true on the host while a pass runs, or while any AI
owes a deal it has yet to start. It holds what a viewer choosing tech holds.
Fight is blocked, with the tooltip "Waiting for players", and `fight` and
`restartFight` refuse. `model.explore` refuses too, unless it is a replayed host
action or a forced host reroll, and the Explore button greys as it does while a
player sets up: `coop_ai.js` rebinds its disabled look to
`model.gwoExploreBlocked` before `gw_play.js` binds it. The star-card refresh waits as well
("Per-player pre-dealt cards").

### Publishing to viewers

Viewers learn of an AI's tech, as of its arrival and its departure, from a
snapshot. Under per-player tech a viewer's newest choices reach the host after
the server has them, and a snapshot sent in between would overwrite them there.
So `coop_ai_lobby.js` holds every roster publish, an add's, a kick's, and a
pass's, as a debt until every viewer is level. The test is the star-card
refresh's own, `viewersReadyForStarRefresh`, over the connected viewers: nobody
is mid-setup, the host is not exploring, no AI is deciding, and every viewer is
loaded and level with the host's deal count. A computed in `gw_play/coop_ai.js`
settles the debt when those change. With no viewer connected the debt is
dropped, since a viewer who joins asks for a snapshot as its first step.

### Catching up

A new AI owes every deal the host has recorded, from the first. It settles them
all before the next battle, in history order, each at the star of the host's
deal. At a star it holds no pre-dealt card for, its hand is a full one. An Add
late in a war therefore takes longer.

The same holds after a war played without a session. The host goes on recording
deals while its AIs sit out, and their counts stay where they were. When a
session opens again, each AI settles the deals it missed before the next battle.

A kick deletes the record for good, so an AI added afterwards is a new record
whose deal count starts again at 0. It inherits nothing from the kicked AI, and
catches up on the whole war.

### Star cards and the treasure planet

The star-card refresh deals each AI its own card on every selectable AI star,
as it does each viewer, and the driver puts that card last in the AI's hand at
that star ("Per-player pre-dealt cards"). At the treasure planet an AI is dealt
an ordinary hand rather than a loadout, because it counts as owning every
loadout ("Treasure loadouts").

### The inventory view

Under per-player tech an AI's slot row shows stock's Inventory button. It opens
stock's inventory modal on the AI's record, found by its id, once the record
holds what the modal needs: `coop_ai_roster.inventoryReady` asks what stock's
`validateGwCampaignInventoryRecord` asks. Records travel in every snapshot, so a
viewer can open it too. The war panel's line for each AI names its own loadout
and race.

### A per-player AI in a battle

Under per-player tech each AI fields its own inventory and race, and the main
referee builds everything it brings. `launchAis` leaves out an AI record with no
inventory. Each AI has:

- **A tag of its own**: the next player tag after the humans',
  `perPlayerTech.getPlayerTagGivenIndex(humans + slot)`, where `humans` counts
  the clients connected at the hire. With the host and one viewer connected, the
  first AI is `.player1`. The tag is not stored, so it can change from battle to
  battle.
- **Its own specs**: its units plus `model.gwoSpecs`, generated on its tag with
  its own mods. Its units and mods follow its race's capability cells, and its
  commanders are retagged, exactly as the host's are
  (`referee_game_file_paths.specPlan`).
- **Its own AI tree**: `player_coopai_<serial>/` on its co-op brain, so an MLA
  AI's tree carries its own AI mods ([`ai-paths.md`](ai-paths.md), "Co-op AI
  players").
- **Its Sub Commanders**, built as a viewer's are
  (`perPlayerTech.buildViewerSubcommanderArmies`), on its tag, and reading a Sub
  Commander tree of its own with unit maps written for its tag. Their colours
  come after every human's Sub Commanders and before the star's ally ("Colour
  allocation").

Each AI adds some 630 to 750 files to a battle. A battle with the 11 AI players
that the slot limit allows beside the host mounts about 9,800, which is why the
host's own pass hands its files over as JSON text ("The two referees").

An AI's cards count wherever GWO asks what any player holds, while a session is
active: `anyPlayerHasCard` and `getAllConnectedPlayerCards` in `shared/cards.js`
include them. So an AI's Tsunami Tech floods the battle's planets and its
Bounty Tech turns on bounty mode, as a viewer's do. The Guardians, who turn the
players' technology against them, take each AI's unit mods, AI mods, and cards
along with every other player's.

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

## General Commander setup

Under per-player tech, a viewer who picked the General Commander loadout asks
the host once for its Sub Commanders. The request is the
`gwo_setup_general_commander` operator, and the host replies with
`gwo_setup_general_commander_result`. `gw_play/cards_start_subcdr.js` wires the
two operators, and `viewerRequest` in `gw_play/general_commander_setup.js` decides
when to send.

The request can go only once the viewer is connected and per-player tech has
synced. Either can land after `gw_play` loads, so the caller runs `send()`
again whenever those or the viewer's record change. Once the host has answered,
nothing is sent again, so a refusal cannot become an endless resend.

The host sends no answer when the request is lost. A host with no handler for it
only logs, and a dropped connection takes the request with it. So a request
unanswered after `retryMs` (15 seconds) is tried again, up to `maxRetries` (3)
times per connection. A request sent before the viewer stopped being ready is
treated as lost.

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

Every check but the connected viewer's lives in `starOpenForPing`, which the
host's pings for its AI players share ("AI pings").

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

### AI pings

A co-op AI player pings too, in either tech mode, so the players can see where
it wants to go next. It has no client to send from, so the host pings for it.
`gw_play/coop_ai_pings.js` holds the rules, and `setupCoopAiPings` in
`gw_play/cards.js` is the glue.

**When.** An AI considers a ping once in each window. A window is keyed by the
host's turn count, the current star, and the host's deal count, so a move, a won
star, or a deal opens a new one. It is open while the host holds a session with
an AI in it and the unit lookup is in, the current star is explored, the turn
state is neither `explore` nor `fight`, nothing is scanning, no player is
choosing tech, no AI is settling its deals, the star-card refresh is idle, and
the war is not over. The AIs settle in slot order, the first 1.5 seconds after
the window opens and each after it 1.2 seconds later, so their pings do not
land together. Judging takes time, so each checks the window again before it
pings. A window that closes before an AI has settled reopens for it.

**Which star.** The candidates are the unexplored AI stars the host can move
to, other than the current one, and the treasure planet only when it is the
only one. Each star's card is the one the AI would find there: its own
pre-dealt card under per-player tech, and the star's card under shared tech.
The AI judges that card as it would in a hand
([`tech-cards.md`](tech-cards.md), "How AI players judge a card"), against its
own inventory under per-player tech and the host's under shared tech. A star's
threat is the intelligence panel's own measure, `shared/star_threat.js`, which
the panel reads too, so an AI weighs what the players see. A star scores its
card's value as a share of the best card's, less 0.6 of its threat as a share
of the worst threat's. The best score wins, then the nearer star, then the
lower index.

**Only when it cares.** An AI pings when it **wants** its best star's card,
which is worth 10 or more, about a factory's unlock. It also pings when its
best star leads the runner-up by 0.25 or more, a clear **lead**. A lone
candidate counts as a lead only when its threat is below the median of every
AI star's. Otherwise it stays silent. It stays silent too for a star another
AI pinged in the same window, for the star it pinged last, and for any new star
within 20 seconds of its last ping.

**Sending.** `pingStarAs(star, sender)` in `coop_ping_operators.js` is the
host's send on another's behalf. `canPingAs` makes the viewer's checks of the
war and the star (`starOpenForPing`), and asks that this client be a connected
host rather than a viewer. The host's cooldown keys on the AI, as it does on a
viewer. The broadcast is the viewer's own `gwo_ping_star_broadcast`, naming the
AI as its sender, and the host shows the ping locally. So every client gets the
marker and the chat line "`<AI name>`: Ping! `<star>`". `gw_play/coop_ping.js`
exposes the send as `model.gwoPingStarAs` and `model.gwoCanPingStarAs`.

Each settle logs one line ([`live-testing.md`](live-testing.md), "AI
players").

## Per-player pre-dealt cards

Under per-player tech each viewer gets their **own** card on every selectable AI
star. The host deals it from that viewer's inventory
(`gw_play/cards_coop_star_cards.js`), and the card joins their hand when they
explore. `star.cardList()` remains the host's own. A viewer never sees it.

Each co-op AI player gets its own card the same way. The refresh walks the AIs
as clients with the role `"ai"` and their record's id
(`model.gwoCoopAi.clients()`), and the driver puts an AI's card last in its hand
at that star ("AI players' tech").

The transport is a top-level `gwaioStarCards` field on the co-op player
inventory record, `{turn, cards: {"<star>": card}, redealOwed}`. `redealOwed` is
present only while a re-deal is owed (see below). Three things rule out the
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

**What triggers a gap-filling refresh.** A computed in `gw_play/cards.js` calls
`refresh()` whenever one of its reads changes. The turn deal covers the
ordinary case. The computed covers the cases that do not pass through a turn: a
viewer joining, a rejoining viewer finishing its catch-up deals, and a re-deal
the gate below turned away. `refresh()` itself reads `gwCampaignActive`,
`isCampaignHost`, and `gwCampaignPerPlayerTechCards` before it returns, so those
subscribe the computed. The gate's inputs are read by `runRefresh`, which
starts a tick later, too late to subscribe it, so the computed reads them
itself. `game.turnState()` is among them because the gate refuses every refresh
during exploration, so the end of exploration is what retries. So is
`model.gwoCoopAiDeciding`: the gate also refuses while an AI player settles its
deals, and the end of that catch-up retries in the same way.
`game.stats().turns()` is deliberately not read: it changes on every hop, and a
move must not disturb an offer already advertised. The first hop out of `end`
still refreshes, through `turnState`, but that refresh only fills gaps unless a
re-deal is owed.

A re-deal the gate below turns away is **owed**, not dropped. So is one made
while no viewer is connected, and one that fails. The next refresh the gate
allows pays it. This matters because the host re-deals after a win, which is
exactly when viewers hold `pendingTechCards`. A dropped re-deal left them with
last turn's cards, which could duplicate cards they had just taken.

The debt is kept **on each viewer's record**, as `gwaioStarCards.redealOwed`.
A re-deal sets it on every co-op record before the gate is consulted: every
viewer's, connected or not, and every AI player's. The write that stores a
viewer's new cards drops it, so each debt clears only when that viewer's own
re-deal succeeds. A viewer with nothing left to re-deal has the flag dropped on
its own. Otherwise the first gap-filling refresh of the next turn would re-deal
them.

The record is where the debt belongs for three reasons:

- **It survives a gw_play reload.** Records are in the game save, and every
  caller of `refresh({redeal: true})` saves afterwards. Held in memory, the
  debt was lost on a reload between the refused re-deal and the viewer's
  choice, while the viewer's `pendingTechCards` survived.
- **It reaches a viewer who was away.** A viewer disconnected when the host
  re-deals is owed the re-deal like any other, and is paid on their return.
- **It is per viewer.** A single war-wide flag would not work: after one viewer
  failed, it would owe the re-deal again to viewers already re-dealt. Their
  record write triggers the next refresh, so each such viewer would get a new
  card on every refresh for as long as the other viewer kept failing.

A failed save does not create a debt, because the re-deal already happened in
memory. `refresh` starts `runRefresh` on a later tick for the same reason the
records matter: owing a re-deal writes records, and `cards.js` refreshes on
every record write. Run synchronously, that refresh would start before
`refreshInFlight` is set, run alongside this one, and re-deal the same viewer
twice.

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
  full re-deals of every selectable star. An AI player must be level too, which
  it is once the host has settled its deals. It has no connection to load, so
  the loading tests skip it, and the gate refuses outright while any AI is
  settling its deals. The refresh in turn holds a `busy` flag while it runs,
  and the driver starts no pass until it drops, so the two take turns.

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

A co-op AI player counts as owning every loadout: `recordHasUnlockedLoadout` is
true for any record that carries `gwaioAi`. It banks nothing, so a loadout would
be wasted on it. It is therefore dealt an ordinary hand at the treasure planet,
and it never holds a won war open for the loadout the Guardians still owe
(`anyPlayerCanUnlockLoadout`, which `gw_play/victory.js` reads).

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
  dealt them. The check and the build it guards live in
  `shared/starting_inventory.js`, because the host builds a co-op AI player's
  starting inventory the same way ("AI players' tech").

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
`applyCards` consumes and suspends on. The same hijack installs GWO's
`defeatTeam` ([`architecture.md`](architecture.md), "Returning from a battle").

Hijacking rather than shadowing `gw_game.js` keeps a 459-line save-format file
out of the tree. `gw_game_patches` is reachable because, like `gw_bank`, it
declares no dependencies. `shared/gw_common` and `shared/gw_game` would both
close a cycle back onto `gw_inventory`.

`gw_inventory.js` only ever flags the host's inventory, so a viewer still banks
its own claims. Those are `bankOwnLoadout` for a treasure loadout, and the
loadout scene for its war loadout. Winning a war unlocks through `gw_war_over`,
a different scene, and is unaffected.

The mirror of this is the host collecting a _viewer's_ loadouts. It comes from
the host applying each viewer's inventory, and each co-op AI player's, to size
their deals. Banking is suspended at each of those call sites
(`cards_coop_deal.js`, `cards_coop_reroll.js`, `cards_coop_star_cards.js`).

The host also applies an AI's inventory to judge its cards, in
`gw_play/coop_ai_effects.js`, through `bank.applyInventoryHeld`. That holds
banking the same way, and can release the hold when an apply hangs. The hold
matters there. Judging a loadout puts it first, which pushes the AI's own
loadout into second place, and a loadout in any place but the first banks
itself in its `buff`. An AI never takes a loadout, so it never banks one.

**The star is identified by index, not by `ai.treasurePlanet`.** Beating the
Guardians runs `winTurn`'s boss branch, which calls `defeatTeam(ai.team)`.
`gw_start/ai_population.js` deletes `ai.team` for the treasure planet, so
`defeatTeam(undefined)` matches the star itself and clears its `ai()`. By the
time the star is explored, nothing on it still says "treasure planet".
Exploration is the whole point, since a star is fought first and its cards
offered afterwards.

`gw_start/ai_population.js` therefore picks the star by index, and
`gw_start/war_record.js` records it as `originSystem.gwaio.treasureStar`.
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
hold a `gwaio_start_*`, `nem_start_*` or `tgw_start_*` id. Those are 15 of the
18 cards in the pool. `model.recordHasUnlockedStartCard` returns false for all
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
- [`tech-cards.md`](tech-cards.md): why `deal()` must read the passed inventory,
  and how a co-op AI player judges a card.
- [`shadowing.md`](shadowing.md): why the per-player-tech referee is shadowed.
