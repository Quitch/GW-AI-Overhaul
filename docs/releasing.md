# Releasing

Releases are cut by the repo owner. A pull request does not bump the version or
retitle `## Unreleased` in `CHANGELOG.md`.

## Where the version lives

The version is in three places, and none can be derived from another at
runtime:

| File                                                   | Read by                                                |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `modinfo.json`                                         | The game and the Community Mods manager                |
| `ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js` | The war information panel, and new war saves record it |
| `sonar-project.properties` (`sonar.projectVersion`)    | SonarCloud, which labels each analysis with it         |

`test/version.test.js` fails until all three match.

`develop` carries the identifier `com.pa.quitch.gwaioverhaul-dev` and the display
name `Galactic War Overhaul DEV`, so a working copy installs alongside the
released mod rather than over it. `master` carries the release identifier and
display name, and the release zip is built from `master`. Nothing in the code
special-cases the `-dev` identifier.

## Cutting a release

1. Launch PA once, so the Community Mods manager has the current race and add-on
   zips in `download/`. The harvests read those zips and nothing else, and they
   cannot tell that one is out of date.
2. Retitle `## Unreleased` in `CHANGELOG.md` as `## v<version> - <date>`.
3. Run `npm run release`.
4. Review the diff and commit it to `develop`.
5. Merge `develop` into `master`. This is the step that ships: the Community
   Mods manager checks `modinfo.json` on `master` once a day, at around 22:30
   UTC, and offers players the new version after the first check that finds it
   changed. A merge just after that time reaches players about a day later.
   The merge keeps `master`'s release identifier and display name, because
   `develop` never changes those lines.
6. Publish a GitHub release tagged `v<version>` on `master`. The tag is for
   GitHub's records only; the Community Mods manager does not read it.

`npm run release` (`scripts/release.js`) needs the PA install and PA's user data
folder, found as [testing.md](testing.md) describes. It stops at the first step
that fails, and it commits nothing. In order, it:

1. Reads the version from the first `##` heading in `CHANGELOG.md`. It stops if
   that heading is not `## v<version> - <date>`.
2. Re-harvests `test/fixtures/unit_types.json` and
   `test/fixtures/race_specs.json`, then regenerates the race and add-on tables
   and the translation catalog. The catalog comes after the tables, because a
   race file's unit names are catalog keys.
3. Runs `validate:race-trees`, `validate:queller-maps` and
   `i18n:missing -- --report`. The last one fails if GWO's translations override
   one the game ships, and prints how many keys each language still lacks.
4. Stamps the version into all three files. In `modinfo.json` it also sets
   `date` to today and `build` to the install's PA build, from `build.txt` beside
   the media folder.
5. Runs `npm run verify`, then `git status --short`.

It warns when the `CHANGELOG.md` heading's date is not today, and when the PA
build has changed. After a PA patch, collect `KNOWN_TEST_TYPES` in
`validate:schemas` again by hand ([testing.md](testing.md)).

It does not translate the missing keys or merge Playglot work. That is the
workflow in [translations.md](translations.md).

## After publishing

`release.yml` runs `npm run verify` at the tag and checks that the tag matches
`modinfo.json`'s version and that `CHANGELOG.md` has a `## v<version>` heading.
It runs after the release is published, and players have the new version from
the merge to `master` before that, so it is an alarm rather than a gate:
`npm run release` makes the same checks before you merge.
