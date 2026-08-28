# GW-AI-Overhaul developer documentation

How the mod is built, and why it is shaped the way it is.

This is for people changing the code. For what the mod _does_ as a player, see the
repo's [README](../README.md); for how to submit a change, see
[CONTRIBUTING](../CONTRIBUTING.md).

## Start here

If you are new to the codebase, read in this order:

1. **[constraints.md](constraints.md)** — the runtime is Chrome 40. Read this
   first, because it rules out things you would otherwise reach for by reflex
   (`let`, arrow functions, template literals, `class`) and one arrow function
   silently kills an entire scene.
2. **[architecture.md](architecture.md)** — the shape of the tree, how scenes and
   entry points work, what runs when a battle launches.
3. **[shadowing.md](shadowing.md)** — how GWO overrides base-game behaviour, why
   shadowing is a last resort, and the full inventory of what is shadowed today.

Then whichever subsystem you are touching.

## Subsystems

| Doc                              | Covers                                                     | Entry file                   |
| -------------------------------- | ---------------------------------------------------------- | ---------------------------- |
| [tech-cards.md](tech-cards.md)   | The card contract, `buff`/`dull`, deal weighting, loadouts | `shared/cards.js`            |
| [ai-pipeline.md](ai-pipeline.md) | How a card changes what an AI builds                       | `gw_play/referee_ai.js`      |
| [ai-paths.md](ai-paths.md)       | Which AI reads which directory                             | `shared/referee_ai_paths.js` |
| [coop.md](coop.md)               | Host/viewer, per-player tech, colour allocation            | `shared/referee_coop.js`     |
| [specs.md](specs.md)             | Unit spec modification and caching                         | `shared/specs.js`            |
| [galaxy.md](galaxy.md)           | Galaxy generation, factions, difficulty tiers              | `gw_start/setup.js`          |
| [testing.md](testing.md)         | The Node AMD harness and the seven validators              | `scripts/lib/amd-loader.js`  |

## Things that surprise people

A short list of the traps that have actually caused bugs here, each covered in
full by the doc named:

- **A shadowed file is a full copy, not a diff.** GWO silently loses base-game
  updates to the parts it did not touch. → [shadowing.md](shadowing.md)
- **`model.game().inventory()` is always the host's.** Under per-player tech in
  co-op, card code must use the inventory passed to it. → [coop.md](coop.md)
- **`buff()` cannot see other cards' units.** `applyCards` has just refilled the
  list with the loadout's own grants only, so test `hasCard`, not `hasUnit`.
  → [tech-cards.md](tech-cards.md)
- **The source AI tree never varies by Smart Subcommanders; the destination does.**
  → [ai-paths.md](ai-paths.md)
- **jQuery 2.x swallows a `throw` inside a deferred callback.** No rejection, no
  retry, caller hangs. → [constraints.md](constraints.md)
- **A defensive check marks a trust boundary, and means nothing anywhere else.**
  Where third-party code is _called_ rather than read, the check is mandatory —
  that call sits in a deferred, so a throw is a hang, not an error.
  → [constraints.md](constraints.md)
- **Knockout `<!-- ko -->` blocks are executable markup, not comments.**
  → [constraints.md](constraints.md)
- **An unrecognised AI `test_type` is not an error** — the condition simply never
  validates and the build entry silently never fires. → [testing.md](testing.md)
- **The GW server never sees mods, and `file.load` on a missing biome never
  settles.** A planet whose `generator.biome` is not a stock `/pa/terrain/*.json`
  hangs every player at loading with no error. → [galaxy.md](galaxy.md)
- **`filter` is Chrome 53.** Only `-webkit-filter` does anything. So is `animation`
  and `@keyframes` (Chrome 43), and `mask-*` (Chrome 120) — the base game ships
  inert declarations of all three. → [constraints.md](constraints.md)
- **`justify-content: space-evenly` parses, computes, and does nothing.**
  `CSS.supports()` says yes; flex layout falls through to `flex-start`.
  → [constraints.md](constraints.md)

## On comments in this codebase

The code carries comments only where the code itself cannot explain something:
base-game or engine behaviour, a bug workaround, a dependency that lives outside
the mod, or a counter-intuitive ordering.

These docs cover **system-level** knowledge. Line-anchored facts deliberately stay
in the code — a doc cannot surface `// otherwise it won't display its icon` at the
moment you are editing that line. Expect both, and do not treat a documented
subsystem as licence to delete the comments inside it.

That split sets the length: past a line or two, a comment is documentation and
belongs here instead. Where one of these docs already covers the fact, the comment
is `See <doc>.md` (plus the section, where the doc is long) and nothing more; where
it doesn't and the fact is subsystem-level, add it here and point at it.

Rejected alternatives, tuning history and "this used to live elsewhere" belong in
[CHANGELOG](../CHANGELOG.md). A comment states the rule that holds now.

## Verifying a change

```bash
npm run verify    # exactly what CI runs
```

CI and the release workflow both run `npm run verify` and nothing else:
`lint:js`/`lint:css`/`lint:md`/`format:check`/`validate`/`test`, every one a
full-repo hard gate. A clean `verify` is a clean CI, and the reverse.

Nothing here starts PA. Anything that can only fail at runtime — a renamed
identifier in shipped `ui/**`, a CSS class rename spanning HTML and CSS, a
`modinfo.json` path, a localisation directive — needs the game loaded with the mod
enabled and a war started. See [testing.md](testing.md) for what CI does and does
not catch.
