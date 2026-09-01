// What the co-op loadout scene needs to know about the war it is joining. The
// scene's own view model has none of it: no player faction, no race, and no
// war settings, so the campaign game is loaded once and shared. See coop.md.
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_check.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
], function (GW, gwoAI, gwoRaces, raceCheck, raceMods) {
  var loaded;

  // The races a viewer may pick: the ones the host's war recorded that are
  // still active, and MLA, which every war has. Deliberately not the viewer's
  // own installed list - a race the host is not running has no units in the
  // battle - and not the recorded list alone: a race disabled since the war
  // was made has no units either, and the resume check does not block a race
  // nobody fields. See races.md.
  var offeredRaces = function (recorded, installed) {
    var identifiers = _.map((recorded && recorded.mods) || [], function (mod) {
      return mod && mod.identifier;
    });

    return raceCheck.activeRaces(gwoRaces.detect(identifiers), installed);
  };

  var readGame = function (game, installed) {
    var inventory =
      game && _.isFunction(game.inventory) ? game.inventory() : undefined;
    var tag = function (name) {
      return inventory && _.isFunction(inventory.getTag)
        ? inventory.getTag("global", name)
        : undefined;
    };
    // originSettings walks the galaxy's origin star, so a game that did not
    // hydrate is a war with nothing recorded rather than a thrown scene.
    var settings;
    var recorded;
    try {
      settings = game ? gwoAI.originSettings(game) : undefined;
      recorded = settings && settings.races;
    } catch (e) {
      recorded = undefined;
    }

    return {
      faction: tag("playerFaction"),
      race: tag("playerRace"),
      races: offeredRaces(recorded, installed),
      perPlayerRace: !!(recorded && recorded.perPlayerRace),
    };
  };

  var empty = function () {
    return {
      faction: undefined,
      race: undefined,
      races: gwoRaces.detect([]),
      perPlayerRace: false,
    };
  };

  // Resolves to { faction, race, races, perPlayerRace }, always - a war that
  // cannot be read is one with no races and no picker, not a failure.
  var load = function () {
    if (loaded) {
      return loaded;
    }

    var deferred = $.Deferred();
    var activeGameId = _.isFunction(model.activeGameId)
      ? model.activeGameId()
      : undefined;

    loaded = deferred.promise();

    if (!activeGameId) {
      deferred.resolve(empty());
      return loaded;
    }

    // In parallel with the game read; installedRaces always resolves, so
    // chaining inside the success branch cannot hang the scene.
    var installed = raceMods.installedRaces();

    GW.manifest.loadGame(activeGameId).then(
      function (game) {
        installed.then(function (info) {
          deferred.resolve(readGame(game, info));
        });
      },
      function () {
        deferred.resolve(empty());
      }
    );

    return loaded;
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { offeredRaces: offeredRaces, readGame: readGame };
  }

  return { load: load };
});
