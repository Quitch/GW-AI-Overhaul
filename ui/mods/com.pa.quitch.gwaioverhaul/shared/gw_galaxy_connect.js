// Repairs stars the base game's GalaxyBuilder leaves with no gates. See
// galaxy.md, "The isolated-star bug".
define(function () {
  // Graph.getConnections() is sparse: a star in no edge has no entry at all.
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

  // Restores the isolated star's incident Delaunay edges, each once.
  var reconnectingEdges = function (starCount, delaunayEdges, connections) {
    var isolated = isolatedStars(starCount, connections);
    var restored = [];
    var added = {};

    for (var star of isolated) {
      for (var edge of delaunayEdges) {
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
