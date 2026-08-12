// Repairs stars the base game's GalaxyBuilder leaves with no gates.
//
// buildGraph() triangulates the stars and then discards every convex-hull edge, so
// a hull star belonging to one triangle is left with zero connections. It fails
// silently: no gates entry, so pathBetween cannot reach it, and calcDistance never
// visits it, so it keeps distance 0 and generates at minimum size. The origin is
// chosen as an extreme point, so it is drawn from exactly the population at risk -
// and an isolated origin makes the war unplayable.
//
// A measured sibling of the shadowed gw_galaxy.js - see testing.md.
define(() => {
  // Graph.getConnections() is sparse: a star in no edge has no entry at all.
  const isolatedStars = (starCount, connections) => {
    const isolated = [];
    for (let i = 0; i < starCount; i++) {
      const links = connections[i];
      if (!links || links.length === 0) {
        isolated.push(i);
      }
    }
    return isolated;
  };

  const edgeKey = (edge) =>
    edge[0] < edge[1] ? `${edge[0]}.${edge[1]}` : `${edge[1]}.${edge[0]}`;

  // An isolated star's incident Delaunay edges are exactly the hull edges the
  // strip removed, so restoring them reconnects both its hull neighbours.
  const reconnectingEdges = (starCount, delaunayEdges, connections) => {
    const isolated = isolatedStars(starCount, connections);
    const restored = [];
    const added = {};

    for (const star of isolated) {
      for (const edge of delaunayEdges) {
        if (edge[0] !== star && edge[1] !== star) {
          continue;
        }
        // Two isolated stars can share a hull edge; only restore it once.
        const key = edgeKey(edge);
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
    isolatedStars,
    reconnectingEdges,
  };
});
