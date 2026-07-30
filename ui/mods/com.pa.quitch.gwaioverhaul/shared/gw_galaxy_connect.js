// Repairs stars that the base game's GalaxyBuilder leaves with no gates.
//
// GalaxyBuilder.buildGraph() (base game, not shadowed here) builds a Delaunay
// triangulation of the stars and then discards every convex-hull edge. A hull star that
// belonged to exactly one triangle has only hull edges, so the strip drops it to zero
// connections. The consequences downstream in gw_galaxy.js are silent rather than loud:
// it gets no entry in self.gates(), so pathBetween can never reach it, and Graph
// .calcDistance() - a BFS over the surviving connections - never visits it, so its
// distance stays at gw_star's ko.observable(0) default and its system generates at
// minimum size. When the isolated star is the origin the whole war is unplayable, and
// the origin is always a hull star because it is chosen as an extreme point (min of
// x - y), so it is drawn from exactly the population at risk.
//
// This is the measured sibling of the base-game-shadowed gw_galaxy.js (see
// CONTRIBUTING.md's "Node test reach for base-game-shadowed modules"): pure index/edge
// arithmetic over plain arrays, unit-tested by test/gw_galaxy_connect.test.js, while the
// builder glue that calls it stays in the coverage-excluded shadowed file.
define(function () {
  // Graph.getConnections() is sparse - a star that never appeared in an edge has no
  // entry at all rather than an empty one - so both cases mean "no gates".
  var isolatedStars = function (starCount, connections) {
    var isolated = [];
    for (var i = 0; i < starCount; i++) {
      var links = connections[i];
      if (!links || links.length === 0) {
        isolated.push(i);
      }
    }
    return isolated;
  };

  var edgeKey = function (edge) {
    return edge[0] < edge[1]
      ? edge[0] + "." + edge[1]
      : edge[1] + "." + edge[0];
  };

  // The Delaunay edges to add back so no star is left without gates. An isolated star's
  // incident Delaunay edges are precisely the hull edges the strip removed, so restoring
  // them reconnects it to both of its hull neighbours.
  var reconnectingEdges = function (starCount, delaunayEdges, connections) {
    var isolated = isolatedStars(starCount, connections);
    var restored = [];
    var added = {};

    for (var i = 0; i < isolated.length; i++) {
      var star = isolated[i];
      for (var j = 0; j < delaunayEdges.length; j++) {
        var edge = delaunayEdges[j];
        if (edge[0] !== star && edge[1] !== star) {
          continue;
        }
        // Two isolated stars can share a hull edge; only restore it once.
        var key = edgeKey(edge);
        if (added[key]) {
          continue;
        }
        added[key] = true;
        restored.push(edge);
      }
    }

    return restored;
  };

  return {
    isolatedStars: isolatedStars,
    reconnectingEdges: reconnectingEdges,
  };
});
