// What gw_start/war_generation.js does when war generation fails: which
// failures it retries, and what it tells the player. See galaxy.md, "Retries".
define(function () {
  // A new seed lays the galaxy out again, which can give every enemy faction
  // a home system. It cannot fix anything else, so nothing else is retried.
  var SPAWN_SHORTAGE = "spawnShortage";
  // Shared Systems for Galactic War's sources gave no usable system. Not a
  // GWO bug: the player can choose other sources.
  var SYSTEM_SOURCES = "systemSources";
  var MAX_ATTEMPTS = 5;

  var ISSUES_URL = "https://github.com/Quitch/GW-AI-Overhaul/issues";

  // Where PA keeps its logs on each operating system, per the PA FAQ:
  // https://support.planetaryannihilation.com/kb/faq.php?id=176
  var logFolder = function () {
    var platform = navigator.platform.toLowerCase();
    if (_.startsWith(platform, "mac")) {
      return "~/Library/Application Support/Uber Entertainment/Planetary Annihilation/log";
    }
    if (_.startsWith(platform, "linux")) {
      return "~/.local/Uber Entertainment/Planetary Annihilation/log";
    }
    return "%LOCALAPPDATA%\\Uber Entertainment\\Planetary Annihilation\\log";
  };

  return {
    SPAWN_SHORTAGE: SPAWN_SHORTAGE,
    SYSTEM_SOURCES: SYSTEM_SOURCES,

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
      if (cause === SYSTEM_SOURCES) {
        return loc(
          "!LOC:The war could not be created because the sources selected under Systems could not be loaded or have no usable star systems. Select other sources, or leave this screen and come back to try them again."
        );
      }
      return loc(
        "!LOC:The war could not be created because of a bug. Please report it at __url__ and include the war seed (__seed__) and your PA log file, which is in __folder__.",
        { url: ISSUES_URL, seed: seed, folder: logFolder() }
      );
    },
  };
});
