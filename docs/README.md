# GW-AI-Overhaul developer documentation

These documents explain how the mod is built, and why it has the shape it has.

These documents are for people who change the code. For what the mod _does_ as a
player, see the repo's [README](../README.md). For how to submit a change, see
[CONTRIBUTING](../CONTRIBUTING.md).

## Start here

If you are new to the codebase, read these documents in this order:

1. **[constraints.md](constraints.md)**. The runtime is Chrome 40. Read this
   first. Chrome 40 does not support features that you would otherwise use by
   reflex (`let`, arrow functions, template literals, `class`). One arrow
   function silently kills an entire scene.
2. **[architecture.md](architecture.md)**. This doc covers the shape of the tree,
   how scenes and entry points work, and what runs when a battle launches.
3. **[shadowing.md](shadowing.md)**. This doc covers how GWO overrides base-game
   behaviour, why shadowing is a last resort, and the full inventory of what GWO
   shadows today.

Then read the doc for the subsystem you are changing.

## Subsystems

| Doc                                        | Covers                                                                  | Entry file                   |
| ------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------- |
| [tech-cards.md](tech-cards.md)             | The card contract, `buff`/`dull`, deal weighting, loadouts              | `shared/cards.js`            |
| [ai-pipeline.md](ai-pipeline.md)           | How a card changes what an AI builds                                    | `gw_play/referee_ai.js`      |
| [ai-paths.md](ai-paths.md)                 | Which AI reads which directory                                          | `shared/referee_ai_paths.js` |
| [coop.md](coop.md)                         | Host/viewer, per-player tech, colour allocation                         | `shared/referee_coop.js`     |
| [specs.md](specs.md)                       | Unit spec modification and caching                                      | `shared/specs.js`            |
| [galaxy.md](galaxy.md)                     | Galaxy generation, factions, difficulty tiers                           | `gw_start/setup.js`          |
| [races.md](races.md)                       | Unit factions (Legion, Bugs, Exiles): registry, translation, race trees | `shared/races.js`            |
| [race-conventions.md](race-conventions.md) | The checklist for adding a race, and the rules the race code relies on  | `shared/races_shipped.js`    |
| [testing.md](testing.md)                   | The Node AMD harness and the validators                                 | `scripts/lib/amd-loader.js`  |

## Things that surprise people

This is a short list of the traps that caused real bugs here. The linked doc
covers each one in full:

- **A shadowed file is a full copy, not a diff.** GWO silently loses base-game
  updates to the parts it did not touch. → [shadowing.md](shadowing.md)
- **`model.game().inventory()` is always the host's.** Under per-player tech in
  co-op, card code must use the inventory passed to it. → [coop.md](coop.md)
- **`buff()` cannot see other cards' units.** Just before `buff()` runs,
  `applyCards` refills the list with the loadout's own grants only. So test
  `hasCard`, not `hasUnit`. → [tech-cards.md](tech-cards.md)
- **The source AI tree never varies by Smart Subcommanders. The destination does.**
  → [ai-paths.md](ai-paths.md)
- **jQuery 2.x swallows a `throw` inside a deferred callback.** There is no
  rejection and no retry, and the caller hangs. → [constraints.md](constraints.md)
- **A defensive check marks a trust boundary, and means nothing anywhere else.**
  Where the mod _calls_ third-party code rather than reads it, the check is
  mandatory. That call sits in a deferred, so a throw is a hang, not an error.
  → [constraints.md](constraints.md)
- **Knockout `<!-- ko -->` blocks are executable markup, not comments.**
  → [constraints.md](constraints.md)
- **An unrecognised AI `test_type` is not an error.** The condition simply never
  validates, and the build entry silently never fires. → [testing.md](testing.md)
- **The GW server sees no mods on its own, and `file.load` on a missing biome
  never settles.** A planet whose `generator.biome` is not a stock
  `/pa/terrain/*.json` hangs every player at loading with no error. The hang
  does not happen when GWO or GW Server Mods supplied the mod.
  → [galaxy.md](galaxy.md)
- **`filter`, `animation`, `@keyframes` and `mask-*` are all inert in Chrome 40.**
  → [constraints.md](constraints.md)
- **`justify-content: space-evenly` parses and does nothing.**
  → [constraints.md](constraints.md)

## On comments in this codebase

The code carries comments only where the code itself cannot explain something.
Those cases are base-game or engine behaviour, a bug workaround, a dependency
that lives outside the mod, or a counter-intuitive ordering.

These docs cover **system-level** knowledge. Line-anchored facts deliberately stay
in the code. A doc cannot show `// otherwise it won't display its icon` at the
moment you edit that line. Expect both. Do not treat a documented subsystem as
licence to delete the comments inside it.

That split sets the length. Past a line or two, a comment is documentation and
belongs here instead. Where one of these docs already covers the fact, the
comment is `See <doc>.md` (plus the section, where the doc is long) and nothing
more. Where no doc covers the fact and the fact is subsystem-level, add the fact
here and reference it from the comment.

Rejected alternatives, tuning history and "this used to live elsewhere" belong in
[CHANGELOG](../CHANGELOG.md). A comment states the rule that holds now.

## Verifying a change

```bash
npm run verify    # exactly what CI runs
```

`ci.yml` and the test job of `release.yml` run `npm run verify` and nothing
else. `verify` runs `lint:js`/`lint:css`/`lint:md`/`format:check`/`validate`/`test`.
Every one of those is a full-repo hard gate.

Two more gates sit beside it. `build.yml` runs `test:coverage` and SonarCloud's
quality gate on every push to `develop` and on every pull request. `release.yml`
also checks the tag against `modinfo.json` and `CHANGELOG.md` (see
CONTRIBUTING.md, "Releasing"). So a clean `verify` is a clean CI, but not yet a
clean release.

`validate:docs` (part of `validate`) checks the inventories these docs carry by
hand against the tree. Those inventories are the scene table, the shadowed-file
and `pa/` tables, and the validator table. So adding a file without its row
fails `verify`.

Nothing here starts PA. Anything that can only fail at runtime needs the game
loaded with the mod enabled and a war started. Examples are a renamed identifier
in shipped `ui/**`, a CSS class rename spanning HTML and CSS, a `modinfo.json`
path, and a localisation directive. See [testing.md](testing.md) for what CI does
and does not catch.
