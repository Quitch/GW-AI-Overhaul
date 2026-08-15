// Projects a Galactic Conquest system's growth counter forward at its current
// friendly adjacency: how many phases until it musters an army. Read-only and
// pure - the rules it mirrors are refreshScaling()'s in conquest_engine.js,
// whose owner and adjacency predicates it imports rather than restates.
// Rendered by gw_play/section_of_foreign_intelligence. See conquest.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_engine.js",
], function (gwoEngine) {
  // Saves from before the field was snapshotted always built 4-connection
  // galaxies, as planPhase assumes for the same reason.
  var DEFAULT_MAX_CONNECTIONS = 4;

  // null where the counter can never arrive: the section it feeds is hidden.
  var turnsToGrowth = function (growth, target, perTurn) {
    if (perTurn <= 0) {
      return null;
    }
    return Math.max(0, Math.ceil((target - growth) / perTurn));
  };

  // Mirrors accrueGrowth's seed for saves predating the counter: the tier they
  // saved is what they had accrued.
  var seededGrowth = function (piece, maxConnections) {
    return piece.growth === undefined
      ? (piece.appliedTier || 0) * maxConnections
      : piece.growth;
  };

  // A piece that musters. A boss scales by territory owned and an army never
  // re-scales, so for both the counter only sets the tier of the garrison they
  // leave behind, and neither ever spawns one from this star.
  var isMusteringGarrison = function (owner) {
    return (
      !gwoEngine.isGuardians(owner) &&
      !owner.boss &&
      !owner.conquestArmy &&
      owner.capturedTurn !== undefined
    );
  };

  // view: { ai, explored, held, growth, neighbours: [{ ai, explored, held }],
  // maxDist, maxConnections }, where growth is the player counter for this
  // star. Foe counters are deliberately not reported - the number always
  // describes the garrison itself.
  var forecast = function (view) {
    var maxConnections = view.maxConnections || DEFAULT_MAX_CONNECTIONS;
    var target = (view.maxDist + 1) * maxConnections;
    var owner = gwoEngine.ownerAi(view.ai);
    var neighbours = view.neighbours || [];
    var army = null;

    if (owner && isMusteringGarrison(owner)) {
      var perTurn = gwoEngine.owningNeighbourCount(
        _.map(neighbours, "ai"),
        function (neighbourOwner) {
          return neighbourOwner.team === owner.team;
        }
      );
      army = turnsToGrowth(
        seededGrowth(owner, maxConnections),
        target,
        perTurn
      );
    } else if (
      !owner &&
      gwoEngine.isPlayerOwned(view.ai, view.explored, view.held)
    ) {
      // The player's systems run the same arithmetic, their counter kept on
      // cfg because their stars carry no ai to hold it.
      var playerPerTurn = _.filter(neighbours, function (neighbour) {
        return gwoEngine.isPlayerOwned(
          neighbour.ai,
          neighbour.explored,
          neighbour.held
        );
      }).length;
      army = turnsToGrowth(view.growth || 0, target, playerPerTurn);
    }

    return { army: army };
  };

  return {
    turnsToGrowth: turnsToGrowth,
    forecast: forecast,
  };
});
