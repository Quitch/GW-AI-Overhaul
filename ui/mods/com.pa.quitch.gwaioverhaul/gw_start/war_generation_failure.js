// What gw_start/setup.js does when war generation fails, kept apart from that
// scene script so it can be tested. See galaxy.md, "Retries".
define(function () {
  // A new seed lays the galaxy out again, which can give every enemy faction
  // a home system. It cannot fix anything else, so nothing else is retried.
  var SPAWN_SHORTAGE = "spawnShortage";
  var MAX_ATTEMPTS = 5;

  var ISSUES_URL = "https://github.com/Quitch/GW-AI-Overhaul/issues";
  var LOG_FOLDER =
    "%LOCALAPPDATA%\\Uber Entertainment\\Planetary Annihilation\\log";

  return {
    SPAWN_SHORTAGE: SPAWN_SHORTAGE,

    shouldRetry: function (cause, attempts) {
      return cause === SPAWN_SHORTAGE && attempts < MAX_ATTEMPTS;
    },

    // The message gw_start shows once generation has given up. seed is the
    // one the player asked for, which reproduces the whole attempt.
    message: function (cause, seed) {
      if (cause === SPAWN_SHORTAGE) {
        return loc(
          "!LOC:The galaxy is too small for every enemy faction to have a home system. Choose a larger galaxy, or turn on Faction Scaling so that smaller galaxies have fewer factions."
        );
      }
      return loc(
        "!LOC:The war could not be created because of a bug. Please report it at __url__ and include the war seed (__seed__) and your PA log file, which is in __folder__.",
        { url: ISSUES_URL, seed: seed, folder: LOG_FOLDER }
      );
    },
  };
});
