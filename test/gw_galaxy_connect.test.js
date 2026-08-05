"use strict";

// Tests for shared/gw_galaxy_connect.js, the repair for stars buildGraph() leaves
// with no gates when it strips the convex-hull edges.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const galaxyConnect = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_galaxy_connect.js"
);

// getConnections() is sparse: a star with no surviving edge has no entry at all.
function connectionsFrom(edges) {
  const connections = [];
  edges.forEach((edge) => {
    connections[edge[0]] = connections[edge[0]] || [];
    connections[edge[1]] = connections[edge[1]] || [];
    connections[edge[0]].push(edge[1]);
    connections[edge[1]].push(edge[0]);
  });
  return connections;
}

function keys(edges) {
  return edges.map((edge) => edge.join(".")).sort();
}

describe("isolatedStars", () => {
  it("finds no isolated star when every star kept an edge", () => {
    const edges = [
      [0, 1],
      [1, 2],
    ];
    assert.deepEqual(
      galaxyConnect.isolatedStars(3, connectionsFrom(edges)),
      []
    );
  });

  it("treats a star missing from the sparse connections array as isolated", () => {
    const connections = connectionsFrom([[0, 2]]);
    assert.equal(connections[1], undefined);
    assert.deepEqual(galaxyConnect.isolatedStars(3, connections), [1]);
  });

  it("treats a star whose edges were all removed as isolated", () => {
    const connections = connectionsFrom([[0, 1]]);
    connections[1] = []; // removeEdge() empties an entry rather than deleting it
    assert.deepEqual(galaxyConnect.isolatedStars(2, connections), [1]);
  });

  it("counts trailing stars beyond the connections array length", () => {
    // connections only extends to the highest index seen in an edge.
    const connections = connectionsFrom([[0, 1]]);
    assert.deepEqual(galaxyConnect.isolatedStars(4, connections), [2, 3]);
  });
});

describe("reconnectingEdges", () => {
  it("restores nothing when the graph is already fully connected", () => {
    const delaunay = [
      [0, 1],
      [0, 2],
      [1, 2],
    ];
    const surviving = [
      [0, 1],
      [1, 2],
    ];
    assert.deepEqual(
      galaxyConnect.reconnectingEdges(3, delaunay, connectionsFrom(surviving)),
      []
    );
  });

  it("restores both hull edges of a star stripped down to no edges", () => {
    // Star 3 sat in a single triangle (1,3,2), so both its edges were hull edges and the
    // strip left it with none. Its neighbours 1 and 2 survive via the interior edge.
    const delaunay = [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const surviving = [
      [0, 1],
      [1, 2],
    ];
    const restored = galaxyConnect.reconnectingEdges(
      4,
      delaunay,
      connectionsFrom(surviving)
    );
    assert.deepEqual(keys(restored), ["1.3", "2.3"]);
  });

  it("reconnects the origin when it is the isolated star", () => {
    // The origin is always a hull star, so it is itself at risk - and an isolated
    // origin leaves calcDistance assigning no distance to any star at all.
    const delaunay = [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const surviving = [
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const restored = galaxyConnect.reconnectingEdges(
      4,
      delaunay,
      connectionsFrom(surviving)
    );
    assert.deepEqual(keys(restored), ["0.1", "0.2"]);
  });

  it("restores a hull edge shared by two isolated stars only once", () => {
    // Stars 2 and 3 are both isolated and adjacent, so edge [2,3] is incident to both.
    const delaunay = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ];
    const surviving = [[0, 1]];
    const restored = galaxyConnect.reconnectingEdges(
      4,
      delaunay,
      connectionsFrom(surviving)
    );
    assert.deepEqual(keys(restored), ["0.2", "1.3", "2.3"]);
  });

  it("leaves every star connected once the restored edges are applied", () => {
    const delaunay = [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const surviving = [
      [0, 1],
      [1, 2],
    ];
    const repaired = surviving.concat(
      galaxyConnect.reconnectingEdges(4, delaunay, connectionsFrom(surviving))
    );
    assert.deepEqual(
      galaxyConnect.isolatedStars(4, connectionsFrom(repaired)),
      []
    );
  });
});
