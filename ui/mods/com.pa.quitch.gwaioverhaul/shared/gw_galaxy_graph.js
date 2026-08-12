// The GWGalaxy constructor and its fog-of-war routing - the measured half of the
// shadowed gw_galaxy.js, which augments this with the load/save/build glue and
// re-exports it under "shared/gw_galaxy". See testing.md.
define(() => {
  const GWGalaxy = function () {
    const self = this;
    self.stars = ko.observableArray();
    self.gates = ko.observableArray();
    self.origin = ko.observable(0);
    self.radius = ko.observable([1, 1]);
    self.saved = ko.observable(false);

    // Map of node -> node list that share an edge, going both directions.
    // This means that _.includes(self.neighborsMap()[a], b) <=> _.includes(self.neighborsMap()[b], a).
    self.neighborsMap = ko.computed(() => {
      const edges = {};
      _.forEach(self.gates(), (gate) => {
        if (!_.has(edges, gate[0])) {
          edges[gate[0]] = [];
        }
        if (!_.has(edges, gate[1])) {
          edges[gate[1]] = [];
        }

        edges[gate[0]].push(gate[1]);
        edges[gate[1]].push(gate[0]);
      });

      return edges;
    });

    self.areNeighbors = (a, b) => {
      const neighbors = self.neighborsMap();
      if (_.has(neighbors, a)) {
        return _.includes(neighbors[a], b);
      }
    };

    self.pathBetween = (from, to, noFog) => {
      const stars = self.stars();
      const neighborsMap = self.neighborsMap();
      const toExplored = stars[to].explored();

      // Fog of war: the final hop is allowed if either endpoint is explored.
      const canEnterTarget = (node) =>
        noFog || stars[node].explored() || toExplored;

      // Fog of war: an intermediate is traversable once visited or explored.
      const canTraverse = (neighbor) =>
        noFog
          ? stars[neighbor].history().length > 0
          : stars[neighbor].explored();

      const checked = {};
      const workList = [[from]];

      while (workList.length > 0) {
        const path = workList.shift();
        const node = path[path.length - 1];
        checked[node] = true;

        for (const neighbor of neighborsMap[node] || []) {
          if (checked[neighbor]) {
            continue;
          }

          if (neighbor === to) {
            if (canEnterTarget(node)) {
              return path.concat(neighbor);
            }
            continue;
          }

          if (canTraverse(neighbor)) {
            workList.push(_.cloneDeep(path).concat(neighbor));
          }
        }
      }

      return null;
    };
  };

  return GWGalaxy;
});
