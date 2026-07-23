// The graph core of the Galactic War galaxy model (base-game-shadowed
// main/game/galactic_war/shared/js/gw_galaxy.js): the GWGalaxy constructor and its
// neighborsMap/areNeighbors/pathBetween fog-of-war routing. This needs only ko and
// lodash (at construction/call time), none of the base-game GalaxyBuilder/gw_star/
// template-loader deps the systems load/save/build glue needs, so it is split out here
// as a measured module and directly unit-tested (test/gw_galaxy_path_between.test.js),
// while gw_galaxy.js augments this constructor with that glue and is coverage-excluded.
// gw_galaxy.js requires this module and returns the augmented constructor to consumers
// (gw_game.js) via its "shared/gw_galaxy" AMD dependency, so the runtime contract is
// unchanged.
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

      // Fog of war: the final hop into the target is allowed if either endpoint is
      // explored (or fog is off entirely).
      var canEnterTarget = function (node) {
        return noFog || stars[node].explored() || toExplored;
      };

      // Fog of war: an intermediate neighbor may be traversed if it has been visited
      // (noFog) or is currently explored.
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
            continue; // ignore loop
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
