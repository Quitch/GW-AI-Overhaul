// Projects a Galactic Conquest system's growth counter forward at its current
// friendly adjacency: how many phases until the next garrison tier, and until
// the system musters an army. Read-only and pure - the rules it mirrors are
// refreshScaling()'s in conquest_engine.js, whose owner and adjacency
// predicates it imports rather than restates. Rendered by
// gw_play/section_of_foreign_intelligence. See docs/conquest.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_engine.js",
], function (gwoEngine) {
  // Saves from before the field was snapshotted always built 4-connection
  // galaxies, as planPhase assumes for the same reason.
  var DEFAULT_MAX_CONNECTIONS = 4;

  // null where the counter can never arrive: the row it feeds is not rendered.
  var turnsToGrowth = function (growth, target, perTurn) {
    if (!(perTurn > 0)) {
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

  // A piece whose counter sets its own tier. A boss scales by territory owned
  // and an army never re-scales, so for both the counter only sets the tier of
  // the garrison they leave behind - not something to forecast at this star.
  var isScalingGarrison = function (owner) {
    return (
      !gwoEngine.isGuardians(owner) &&
      !owner.boss &&
      !owner.conquestArmy &&
      owner.capturedTurn !== undefined
    );
  };

  // view: { ai, explored, held, growth, neighbours: [{ ai, explored, held }],
  // maxDist, maxConnections }, where growth is the player counter for this
  // star. Foe counters are deliberately not reported - the numbers always
  // describe the garrison itself.
  var forecast = function (view) {
    var maxConnections = view.maxConnections || DEFAULT_MAX_CONNECTIONS;
    var maxDist = view.maxDist;
    var owner = gwoEngine.ownerAi(view.ai);
    var neighbours = view.neighbours || [];
    var reinforcements = null;
    var army = null;

    if (owner && isScalingGarrison(owner)) {
      var perTurn = gwoEngine.owningNeighbourCount(
        _.map(neighbours, "ai"),
        function (neighbourOwner) {
          return neighbourOwner.team === owner.team;
        }
      );
      var growth = seededGrowth(owner, maxConnections);
      var tier = gwoEngine.growthTier(growth, maxConnections, maxDist);
      if (tier < maxDist) {
        reinforcements = turnsToGrowth(
          growth,
          (tier + 1) * maxConnections,
          perTurn
        );
      }
      army = turnsToGrowth(growth, (maxDist + 1) * maxConnections, perTurn);
    } else if (
      !owner &&
      gwoEngine.isPlayerOwned(view.ai, view.explored, view.held)
    ) {
      // The player's systems run the same arithmetic but carry no garrison to
      // scale, so they only ever muster.
      var playerPerTurn = _.filter(neighbours, function (neighbour) {
        return gwoEngine.isPlayerOwned(
          neighbour.ai,
          neighbour.explored,
          neighbour.held
        );
      }).length;
      army = turnsToGrowth(
        view.growth || 0,
        (maxDist + 1) * maxConnections,
        playerPerTurn
      );
    }

    return { reinforcements: reinforcements, army: army };
  };

  return {
    turnsToGrowth: turnsToGrowth,
    forecast: forecast,
  };
});
