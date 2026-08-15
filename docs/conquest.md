# Galactic Conquest

A war mode selected in the lobby's **Mode** dropdown ("Galactic War" is the
default and is unchanged). In Conquest the galaxy starts almost empty: each
enemy faction holds a single system, and once the player has ended their turn -
fought and explored where they landed, or passed on a friendly system - each
faction's boss takes one adjacent system. The player and the AIs alternate: a
jump moves freely through the player's own territory but counts as one turn
however far it goes, and where it lands is where the turn is played out.

## Module map

| File                             | Role                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `gw_start/conquest_setup.js`     | Measured: boss spawn placement, Guardians placement and identity, the `gwaio.conquest` snapshot                            |
| `gw_play/conquest_engine.js`     | Measured: plans one full AI phase from a plain-object board and returns ordered steps and events                           |
| `gw_play/conquest_ai_builder.js` | Measured: builds and re-scales garrisons, foes and allies; rolls capture-time game modifiers                               |
| `gw_play/conquest_turn.js`       | Measured: the driver - wraps the turn verbs, runs the phase once the turn resolves, saves                                  |
| `gw_play/conquest.js`            | Scene shell: instantiates the driver and injects the Pass button when the save carries `gwaio.conquest`. Coverage-excluded |
| `gw_play/conquest_sprite.js`     | Boss- and army-move animation, a copy of the stock transit visuals. Coverage-excluded                                      |
| `gw_play/conquest_army_icons.js` | Minion-army icons on the galaxy map, the stock boss-icon layout in minion palette colours. Coverage-excluded               |
| `gw_play/conquest_pulse.js`      | Measured: the looping pulse ring on player-held explorable systems                                                         |

## Generation

`gw_start/setup.js` branches on `gwoDifficultySettings.warMode()`:

- Spawn stars come from `conquest_setup.spawnStars`, not the breeder's greedy
  farthest-point pick: lexicographic maximin over the pairwise gate-hop
  distances among the player's origin and every boss, so everyone starts as
  far apart - and as evenly spaced - as the galaxy allows. The greedy pick
  seeds a swap-based local search; a stall escalates to pair swaps once,
  which is exhaustive for two bosses and escapes symmetric plateaus for
  more. The result is handed to the breeder as `params.spawns`, which skips
  its own pick but still shuffles factions over the stars.
- The breeder runs with `canSpread` refusing everything, which leaves each
  faction exactly its spawn star, still boss-marked (pinned in
  `test/gwo_breeder.test.js`).
- `makeBoss` receives the team without its `systemTemplate`, so the boss keeps
  its personality and card but its spawn star keeps its procedural system.
- The `neutralSystems` lore sweep is skipped. Nothing spreads, so nearly every
  star is unowned rather than the handful Galactic War leaves over, and the
  eight entries would rename arbitrary capturable systems after factions already
  on the board. Unowned stars keep their procedural name and empty description.
- System Scaling and Easier Start do not apply. The rows are greyed out in the
  Game Options modal rather than cleared, so a player switching back to Galactic
  War keeps their choice; `gw_start/ui.js` exposes the gated values as
  `gwoDifficultySettingsApplied`, which the galaxy build, the neutral-star count
  and the `gwaio` war record all read instead of the raw settings. Easier Start
  would be inert here regardless - nothing spreads, so `neutralStars` reaches
  neither an rng draw nor an owned star (pinned in `test/gwo_breeder.test.js`).
- The boss is scaled to the fair-share tier for its one owned system rather
  than the galaxy rim, and stamped `capturedTurn: 1` / `appliedTier`.
- No workers exist, so the setup-time foe and ally rolls never run.
- The Guardians are placed on a seeded unowned star (the War sweep's "first
  non-boss AI star" finds nothing when every AI star is a boss). They are
  scaled to `maxDist` once and never expand or re-scale.
- `onAisFinished` stamps `originSystem.gwaio.conquest`: `maxDist`,
  `maxConnections`, `playerCount`, `lastAiPhaseTurn`, the team-to-faction
  map, the effective
  difficulty numbers (Custom has no tier to re-derive them from at play time),
  the raw personality values `applyPersonality` consumes, and the
  game-modifier chances.

## The turn engine

`conquest_turn.js` runs the AI phase once the player ends their turn: the
fight and/or explore the move demands - through the wrapped `winTurn` and
`loseTurn` - or, on a system that demands nothing, the explicit **Pass**
button (`conquest_pass.html`, injected by `conquest.js` beside the stock
action row and shown with the player's own star selected, like
Fight/Explore). A landing alone never runs the phase. A pass at rest opens a
fresh turn - it advances `stats.turns` itself - while a pass after a move
finds the clock already ahead and only runs the owed phase, which also makes
it the safe retry after a failed phase. Every pass stamps `turnState`
`"end"`, the marker the install-time recovery reads: the deferred
`runPhaseIfDue` at install runs only after a reconciled battle or when
`turnState` is not `"begin"`, because an unreconciled `"begin"` is a move
still awaiting its Pass, fight or explore. The phase snapshots the board
(cloned - the planner never mutates live state), runs
`conquest_engine.planPhase`, applies the returned steps in order, saves once
with `gwoSave(game, true)`, and announces any eliminations with the stock
popup, naming victor and vanquished (`conquest_announce.js` formats the
message). `model.gwoConquestAiPhase` blocks Move/Fight/Explore/Pass while it
runs, and drives `conquest_phase.html`, a centre-screen indicator skinned as
stock's own `#scanning`. The flag is held to a floor of two seconds, the length
stock explore holds that spinner for: a phase whose steps are all fogged or all
`hold` costs no wall-clock, so the Pass button would otherwise hide and return
inside one tick with nothing on screen to show for it. A floor, not an added
delay - a phase with visible transits already outruns it - and an elimination
popup rides the release, landing as the indicator clears. In co-op the floor
paces the campaign queue too, which orders on the promise the replayed pass
returns. `model.gwoConquestPlayerMoving` names the stage within that wait: the
player's own armies act inside the phase but are not the enemy, and theirs are
the only moves fog never hides, so the label swaps while one of their transits
animates. It is raised only by an animating `move`, so an invisible player
`hold` never claims it, and cleared once every step has landed rather than per
step - which holds it steady across consecutive army transits and returns the
held tail to the enemy's label. A `move` step carries only its origin lift,
applied before the transit sprite departs; the arrival is the following step
(`occupy`, `stack` or `clash`), landing when the animation completes - so
exactly one icon exists during a transit, as for the player's own commander.

Movement itself is War's, narrowed to Conquest's ownership: `canMove` routes
through `pathBetween` with a traversal predicate that crosses only systems
no AI holds (a jumped boss holds nothing), so a jump detours around enemy
territory or is refused outright; the destination itself may be enemy-held -
the final hop is the predicate's one exemption. The fog rule is widened the
other way: the driver permanently wraps the instance's `pathBetween` to pass
its optional `known` predicate, under which a `cfg.playerHeld` system counts
as charted space while staying unexplored - so the base `canMove` and
`canSelect` reads reach through and onto minion-captured territory too. No move passes until the
turn is resolved, nor between the move and the Pass, fight or explore that
ends it. The stock `moveStep` advances `stats.turns` and saves once per hop,
so the driver's `game.move` wrap unwinds the tick on every hop short of the
destination - inside the hop's own call, before its save - and a jump nets
exactly one turn on every save a crash could leave behind. A transit
interrupted mid-route resumes as a fresh jump from the star it reached.

Each faction, in team order, moves its boss like the player: one move
reaches any system on the frontier of the connected friendly territory
holding its star, however deep in that territory it stands. Its minion
armies follow it in spawn order, and the player's own armies act after
every faction (see "Minion armies" below).

1. A boss whose frontier holds the player's star moves onto it and waits to
   be fought - but only past the same strength gate as a boss attack,
   measured against the player's systems, and never at the treasure star,
   which would mean taking the Guardians' system. The jump is an attack, not
   a capture (see the engine rules below); a boss below the gate expands
   instead.
2. Otherwise it captures one frontier system by the priority ladder: never
   the Guardians; prefer unexplored; prefer a candidate bordering at least
   one non-friendly system, else the candidate closest to the player; then
   most friendly neighbours; then most non-friendly neighbours; remaining
   ties fall to the seeded `conquest_move` stream. Movement itself draws
   nothing else. Another boss's star is only a candidate when the attack
   gate passes (see the boss-versus-boss rule below).
3. Cornered - every capturable frontier star a gated boss star - it attacks
   one the collision rule would let it beat, and otherwise holds, as the
   player now can.

Rules the engine carries:

- **Captures** roll the game modifiers (land anywhere, sudden death, bounty,
  eradication) from `conquest_modes.<star>.turn.<captured>`, exactly as setup
  rolls them. When the boss moves on it leaves a garrison built at the
  system's tier, inheriting those capture-time rolls. A boss never enters its
  own territory - the frontier is always one move away.
- **The player's star is attacked, not captured**: a jump stamps
  `ai.conquestJumped` and the system stays under the player's control - it is
  not counted, painted or rolled as the boss's, and the player's neighbours
  still see a player system. The boss must beat the player to take it, and as
  that loss ends the war the transfer is never recorded. The battle itself is
  unchanged: the jump still rolls the capture-time game modifiers. The jump
  itself takes the boss-attack strength gate, with the player's count being
  their explored systems no AI holds (a jumped boss's star included).
- **Boss versus boss**: a boss only attacks another boss's star with at least
  half again that faction's systems - or, cornered with nothing else
  capturable, when the collision rule favours it. When the attack lands, the
  faction with more systems wins; the attacker wins ties; the loser is
  eliminated and its systems become unowned. On the player's star bosses
  stack instead - the arrival becomes a boss-flagged entry in the occupier's
  `foes`, every boss present joins the one battle, and a stacked star is not
  capturable by anyone else.
- **Tiers**: garrison and foe presence grows with friendly adjacency. Each
  phase a piece adds its bordering friendly systems to a persisted `growth`
  counter and scales at `min(floor(growth / maxConnections), maxDist)`, fed
  to the same scaling arithmetic as war generation (`shared/ai_scaling.js`).
  Garrisons count systems their own team persistently owns (a jumped boss
  holds nothing); foes count their own faction's - the adjacency that
  spawned them - and refresh wherever they besiege, boss-held systems
  included. An isolated system never strengthens; a fully surrounded one
  gains a tier per turn (a shade more where the isolated-star repair
  exceeded `maxConnections` - see `galaxy.md`), and a capture feeds its
  neighbours from the phase it lands. A boss-held system accrues the same
  counter, but it only sets the garrison the boss leaves on departure - the
  boss itself scales by the fraction of its faction's fair share it owns,
  `ceil(owned * (bossCount + 1) * maxDist / totalStars)`, the galaxy split
  among bosses plus the player - reaching the War boss's rim scale at its full
  share and continuing uncapped past it. Re-scaling happens in the phase, so
  the referee and the intelligence panel read `star.ai()` unchanged; accrual
  without a tier change still writes the star, because the planner's board is
  a clone and only written stars reach the save.
- **Foes and allies** roll every second turn: per AI system, a foe of a
  bordering faction at `ffaChance x bordering systems` percent (never
  duplicated per faction), and an allied commander at
  `alliedCommanderChance x bordering player systems` percent, suppressed by
  the same ally-breaking loadouts as setup.
- **The turn must be resolved and answered before the next jump**: any AI in
  the player's system has to be fought, stacked bosses included, and an
  unexplored system explored - the jump button is withheld until then, and
  again between the move and the Pass, fight or explore that ends the turn.
  The Guardians alone keep the stock freedom to leave (and to be passed
  beside). A boss that lands on the player during the phase reopens the turn
  (`begin`) so the fight is offered.
- **Losing to a faction boss loses the war**, hardcore or not; the Guardians
  and garrisons keep the stock retreat.
- **defeatTeam** (Conquest variant, installed by the driver) clears a beaten
  faction outright - no foe inheritance, which would carry a dead `ai.team` -
  defeats every boss stacked on the fought star, and wins the war when no
  boss remains anywhere.
- A system the player explored before deals no new card when an AI retakes it
  (guarded in `cards.js` and the co-op deal path), and the intelligence panel
  says so.

## Minion armies

A garrison capped at `maxDist` converts further growth into mobile pieces:
when accrual reaches a full tier past the cap
(`(maxDist + 1) x maxConnections`), the system spawns a **minion army** - a
garrison-shaped ai built at the cap tier - and the spawn debits one tier of
growth, so a full tier must re-accrue before the next. The army musters on
its origin star (`ai.minionArmies`, spawn order) and moves out the following
phase. It never re-scales, though it accrues growth for the garrison it
leaves on departure. Its marker is `ai.conquestArmy`: a persisted per-team
spawn ordinal (`cfg.armySeq`), its origin, and a minion palette colour index -
the lowest free among the team's live armies, else the least used, ties low,
over `commander_colour.js`'s contrast order, which `paletteFor` exposes so
map, transit and battle read one ordering.

Armies act after their boss in spawn order, with the boss's frontier and
target ladder minus its special branches: never the player's star, never a
boss star, and no cornered attack - they hold instead. A settled army holds
its star as `star.ai()`, so battles, intelligence, colour and team-keyed
eliminations need nothing new, and it departs like a boss, leaving a
departure garrison. Collisions:

- A boss (or the player) taking an army-held star defeats the army with the
  ordinary capture; AIs never battle each other.
- Two opposing armies meeting - the player's included - annihilate each
  other and raze the star to neutral: its ai nulled, any garrison and
  mustered stack there included, cards kept, so an unexplored star stays
  explorable.
- An AI arrival deletes any player tokens standing on the star.

The player's systems run the same arithmetic - counters in
`cfg.playerGrowth`, because their stars carry no ai to hold them - and spawn
**player armies**: pure tokens in `cfg.playerArmies`, never a `star.ai()`,
so fight and explore gating, traversal and the stock colour computed stay
untouched. They act last, after every faction, with `playerOwned` (explored
or held, no AI owner) as their friendly predicate. A capture razes the
target's ai; a captured unexplored star is flagged in `cfg.playerHeld` -
counted as the player's in the boss attack gate, still explorable and
dealing its card on explore, pulsing in the player's colour
(`conquest_pulse.js`) and painted with the player ring through the
ownerColor interceptor until explored, when the engine prunes the flag. A
system recaptured by an AI forfeits its accrued player growth.

Token state renders live, so it publishes per step: any step that changes
`playerArmies` or `playerHeld` carries a cloned `playerState` snapshot -
`record()` attaches it whenever a mutation helper flagged the change - which
`applyWrites` lands on `cfg` and republishes through `onPlayerState`; a
player move's own snapshot carries the token nowhere, lifted for the
transit. A token's arrival also rolls back the fog: the step's `reveal`
list pushes a synthetic `{ gwoConquestReveal: 1 }` entry into an empty
`star.history()` (the co-op replay fallback's precedent), which connects
the system on the map, persists with the save, and counts as visited on the
next board - allied-commander rolls included - and the player's fatal
clashes reveal like their captures.

`conquest_army_icons.js` shows the faction icon in the army's palette colour
at army-held stars, mustered stacks and player tokens - the last through
fog, being the player's own intelligence - and `conquest_sprite.js` tints a
moving army the same way. The draws come from the `conquest_army` (spawn
builds), `conquest_army_move` and `conquest_player_move` (target
tie-breaks, sub-keyed per army) streams; colour picking draws nothing.

## Determinism, resume and co-op

Everything the phase does is a pure function of (war seed, saved state, turn):
every draw comes from the `conquest_*` streams in `gw_play/gwo_streams.js`.
`cfg` lives in the origin star's `system` block, which `gw_galaxy.js` omits
from a save once `galaxy.saved` is set - so every write to it needs that flag
cleared first, which is what `gwoSave`'s second argument does. It is
`saveStars`, not a force flag.
`cfg.lastAiPhaseTurn`, persisted with the save, marks the last turn whose
phase completed - a battle's scene teardown or a crash mid-phase re-runs the
phase from identical saved state with an identical outcome, a rejected click
runs no phase at all, and an unresolved turn holds the phase until the fight
or explore that resolves it.

The base game applies a battle's result and saves before scene mods load, so
no wrap in the driver ever sees the host's own fight resolve. `game.fight`
therefore stamps `cfg.pendingFight` - the fought star, the turn, a clone of
its ai and a map of every star's owning team (a jumped boss's star records no
owner) - and clears `galaxy.saved` so
that gw_play.js's own save, the next statement it runs, carries the stamp to
disk. The next driver install reconciles: a loss against a faction
boss loses the war, a boss win replays the Conquest elimination from the
stamp (the owner map recovers the ownership stock `defeatTeam` wiped), and an
abandoned battle keeps the stamp. Viewers replay battle results as campaign
actions after the driver installs, so their outcomes route through the wraps.
Every path that loses the war holds `model.exitGate` - a fresh deferred
before the state flip, resolved once the loss is saved - because gw_play.js's
`gameOverCHeck` navigates to `gw_war_over` through the gate the instant
`gameState` turns lost, and the gate the scene opens with is already
resolved. `victory.js` documents the same hazard on the won path.

Co-op adds one action of its own: the host's pass sends `gwo_conquest_pass`,
which the driver's `applyCampaignAction` hijack replays as `pass()` on every
viewer - the base handler rejects unknown types, so the hijack intercepts
first and returns the phase's promise, which is what orders the campaign
queue on it. `sendCampaignAction` no-ops off-host, so the replayed pass never
re-sends. Everything else needs no protocol: a viewer's
`applyCampaignAction('move_to_star')` calls `model.move()` itself, so every
client ends the same turns with the same deterministic phase; only the
host's save persists (`gw_play/save.js` no-ops for viewers). The phase must
never consult `gwCampaignReplayingAction`, which the viewer clears before
async work completes.

## Victory badges

Conquest victories record under `gwaio_conquest_victory_<loadoutId>`, parallel
to the War badges, via `victoryKey` in `shared/cards.js`. The loadout list
shows the selected mode's badges; a mode change rebuilds the list because a
card view model snapshots its icon at load.

## Accepted limitations

- Play-time minion picks draw from the full faction pool, so names can repeat
  across garrisons - war generation's `remainingMinions` uniqueness is not
  threaded through saves.
- A boss stacked into another's `foes` fights with its commander slots but
  without its own minions - the referee treats every `foes` entry as a single
  FFA army.
- A mustered minion army is not fielded when the player attacks its host
  star, and stock `winTurn` clears the star's ai on a win, so it dies with
  the garrison.
- On an explored star "unowned" and "player-owned" are one state
  (`explored` and no ai), so an army clash there returns the system to the
  player - the same reading an eliminated faction's explored systems get.
