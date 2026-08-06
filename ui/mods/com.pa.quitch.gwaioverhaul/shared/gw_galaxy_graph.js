// The GWGalaxy constructor and its fog-of-war routing - the measured half of the
// shadowed gw_galaxy.js, which augments this with the load/save/build glue and
// re-exports it under "shared/gw_galaxy". See testing.md.
define(function () {
  var GWGalaxy = function () {
    var self = this;
    self.stars = ko.observableArray();
    self.gates = ko.observableArray();
    self.origin = ko.observable(0);
    self.radius = ko.observable([1, 1]);
    self.saved = ko.observable(false);

    // Map of node -> node list that share an edge, going both directions.
    // This means that _.contains(self.neighborsMap()[a], b) <=> _.contains(self.neighborsMap()[b], a).
    self.neighborsMap = ko.computed(function () {
      var edges = {};
      _.forEach(self.gates(), function (gate) {
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

    self.areNeighbors = function (a, b) {
      var neighbors = self.neighborsMap();
      if (_.has(neighbors, a)) {
        return _.includes(neighbors[a], b);
      }
    };

    self.pathBetween = function (from, to, noFog) {
      var stars = self.stars();
      var neighborsMap = self.neighborsMap();
      var toExplored = stars[to].explored();

      // Fog of war: the final hop is allowed if either endpoint is explored.
      var canEnterTarget = function (node) {
        return noFog || stars[node].explored() || toExplored;
      };

      // Fog of war: an intermediate is traversable once visited or explored.
      var canTraverse = function (neighbor) {
        return noFog
          ? stars[neighbor].history().length > 0
          : stars[neighbor].explored();
      };

      var checked = {};
      var workList = [[from]];

      while (workList.length > 0) {
        var path = workList.shift();
        var node = path[path.length - 1];
        checked[node] = true;

        for (var neighbor of neighborsMap[node] || []) {
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
