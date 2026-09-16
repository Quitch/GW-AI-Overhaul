// Repairs stars the base game's GalaxyBuilder leaves with no gates. See
// galaxy.md, "The isolated-star bug".
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

  // Restores the isolated star's incident Delaunay edges, each once.
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
