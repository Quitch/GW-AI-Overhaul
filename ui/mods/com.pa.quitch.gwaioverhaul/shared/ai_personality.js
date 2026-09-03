// Resolves an AI's personality from what the war records. The measured
// sibling of faction/personalities.js - see galaxy.md, "AI personalities and
// penchants".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (personalities) {
  // Index = faction, as gw_faction_*.js and cluster_faction.js declare them.
  var FACTION_IDS = [
    "legonisMachina",
    "foundation",
    "synchronous",
    "revenants",
    "cluster",
  ];

  // The personalities.js key of the object a faction file references, so an
  // id can never drift from the object it names.
  var idOf = function (personality) {
    return _.findKey(personalities, function (candidate) {
      return candidate === personality;
    });
  };

  // A fresh personality: the faction's baseline with the named overrides
  // merged over it, the merge faction_builder.js makes. undefined when either
  // is unknown, so a caller can fall back to what the war stored.
  var base = function (personalityId, faction) {
    var baseline = personalities[FACTION_IDS[faction]];
    var overrides = personalities[personalityId];
    if (!baseline || !overrides) {
      return undefined;
    }
    return _.merge(_.cloneDeep(baseline), overrides);
  };

  return {
    FACTION_IDS: FACTION_IDS,
    idOf: idOf,
    base: base,
  };
});
