# Galactic Conquest

A war mode selected in the lobby's **Mode** dropdown ("Galactic War" is the
default and is unchanged). In Conquest the galaxy starts almost empty: each
enemy faction holds a single system, and once the player has resolved a move -
fought and explored where they landed - each faction's boss takes one adjacent
system. The player and the AIs alternate, so the player can only ever move one
system at a time.

## Module map

| File                             | Role                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `gw_start/conquest_setup.js`     | Measured: boss spawn placement, Guardians placement and identity, the `gwaio.conquest` snapshot  |
| `gw_play/conquest_engine.js`     | Measured: plans one full AI phase from a plain-object board and returns ordered steps and events |
| `gw_play/conquest_ai_builder.js` | Measured: builds and re-scales garrisons, foes and allies; rolls capture-time game modifiers     |
| `gw_play/conquest_turn.js`       | Measured: the driver - wraps the turn verbs, runs the phase once the turn resolves, saves        |
| `gw_play/conquest.js`            | Scene shell: instantiates the driver when the save carries `gwaio.conquest`. Coverage-excluded   |
| `gw_play/conquest_sprite.js`     | Boss-move animation, a copy of the stock transit visuals. Coverage-excluded                      |

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
- The boss is scaled to one owned system rather than the galaxy rim, and
  stamped `capturedTurn: 1` / `appliedTier`.
- No workers exist, so the setup-time foe and ally rolls never run.
- The Guardians are placed on a seeded unowned star (the War sweep's "first
  non-boss AI star" finds nothing when every AI star is a boss). They are
  scaled to `maxDist` once and never expand or re-scale.
- `onAisFinished` stamps `originSystem.gwaio.conquest`: `maxDist`,
  `playerCount`, `lastAiPhaseTurn`, the team-to-faction map, the effective
  difficulty numbers (Custom has no tier to re-derive them from at play time),
  the raw personality values `applyPersonality` consumes, and the
  game-modifier chances.

## The turn engine

`conquest_turn.js` runs the AI phase once the player's turn is resolved: any
AI on their star but the Guardians fought, an unexplored star explored. A
move onto an already-resolved system runs it at once; otherwise it follows
the fight and/or explore that resolves the turn - through the wrapped
`winTurn` and `loseTurn`, or the install-time defer for the host's own
battle returns. The phase snapshots the board (cloned - the planner never
mutates live state), runs `conquest_engine.planPhase`, applies the returned
steps in order, saves once with `gwoSave(game, true)`, and announces any
eliminations with the stock popup. `model.gwoConquestAiPhase` blocks
Move/Fight/Explore while it runs, and `canMove` only passes single-hop
paths, and none at all until the turn is resolved.

Each faction, in team order:

1. A boss adjacent to the player moves onto the player's star and waits to be
   fought - unless the player is at the treasure star, which would mean taking
   the Guardians' system. The jump is an attack, not a capture (see the engine
   rules below).
2. Otherwise it captures one adjacent system by the priority ladder: never the
   Guardians; prefer unexplored; prefer a candidate bordering at least one
   non-friendly system, else the candidate closest to the player; then most
   friendly neighbours; then most non-friendly neighbours; remaining ties fall
   to the seeded `conquest_move` stream. Movement itself draws nothing else.
3. With nothing capturable it marches one hop through friendly territory
   toward the frontier, or holds.

Rules the engine carries:

- **Captures** roll the game modifiers (land anywhere, sudden death, bounty,
  eradication) from `conquest_modes.<star>.turn.<captured>`, exactly as setup
  rolls them. When the boss moves on it leaves a garrison built at the system's
  tier, inheriting those capture-time rolls; a boss crossing its own territory
  instead carries the displaced garrison (`ai.conquestDisplaced`) and restores
  it on departure.
- **The player's star is attacked, not captured**: a jump stamps
  `ai.conquestJumped` and the system stays under the player's control - it is
  not counted, painted or rolled as the boss's, and the player's neighbours
  still see a player system. The boss must beat the player to take it, and as
  that loss ends the war the transfer is never recorded. The battle itself is
  unchanged: the jump still rolls the capture-time game modifiers.
- **Boss versus boss**: the faction with more systems wins; the attacker wins
  ties; the loser is eliminated and its systems become unowned. On the
  player's star bosses stack instead - the arrival becomes a boss-flagged
  entry in the occupier's `foes`, every boss present joins the one battle, and
  a stacked star is not capturable by anyone else.
- **Tiers**: presence scales with `min(floor(heldTurns / 2), maxDist)` fed to
  the same scaling arithmetic as war generation (`shared/ai_scaling.js`).
  Garrisons key on their system's `capturedTurn`, foes on their own
  `createdTurn`, bosses on systems owned. Re-scaling happens in the phase, so
  the referee and the intelligence panel read `star.ai()` unchanged.
- **Foes and allies** roll every second turn: per AI system, a foe of a
  bordering faction at `ffaChance x bordering systems` percent (never
  duplicated per faction), and an allied commander at
  `alliedCommanderChance x bordering player systems` percent, suppressed by
  the same ally-breaking loadouts as setup.
- **The turn must be resolved before the next jump**: any AI in the player's
  system has to be fought, stacked bosses included, and an unexplored system
  explored - the jump button is withheld until then. The Guardians alone
  keep the stock freedom to leave. A boss that lands on the player during
  the phase reopens the turn (`begin`) so the fight is offered.
- **Losing to a faction boss loses the war**, hardcore or not; the Guardians
  and garrisons keep the stock retreat.
- **defeatTeam** (Conquest variant, installed by the driver) clears a beaten
  faction outright - no foe inheritance, which would carry a dead `ai.team` -
  defeats every boss stacked on the fought star, and wins the war when no
  boss remains anywhere.
- A system the player explored before deals no new card when an AI retakes it
  (guarded in `cards.js` and the co-op deal path), and the intelligence panel
  says so.

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

Co-op needs no protocol of its own: a viewer's
`applyCampaignAction('move_to_star')` calls `model.move()` itself, so the same
wrap runs the same deterministic phase on every client; only the host's save
persists (`gw_play/save.js` no-ops for viewers). The phase must never consult
`gwCampaignReplayingAction`, which the viewer clears before async work
completes.

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
- A boss standing on friendly territory suppresses that garrison (and its
  foes) for any battle fought there while it visits.
