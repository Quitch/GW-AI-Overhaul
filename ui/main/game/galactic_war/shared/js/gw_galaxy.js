// StarSystemTemplates.generate has systems scale with galaxy depth
define([
  "shared/GalaxyBuilder",
  "shared/gw_star",
  "main/game/galactic_war/shared/js/systems/template-loader",
], function (GalaxyBuilder, GWStar, chooseStarSystemTemplates) {
  const GWGalaxy = function () {
    const self = this;
    self.stars = ko.observableArray();
    self.gates = ko.observableArray();
    self.origin = ko.observable(0);
    self.radius = ko.observable([1, 1]);
    self.saved = ko.observable(false);

    // Map of node -> node list that share an edge, going both directions.
    // This means that _.contains(self.neighborsMap()[a], b) <=> _.contains(self.neighborsMap()[b], a).
    self.neighborsMap = ko.computed(function () {
      const edges = {};
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
      const neighbors = self.neighborsMap();
      if (_.has(neighbors, a)) {
        return _.includes(neighbors[a], b);
      }
    };

    self.pathBetween = function (from, to, noFog) {
      const toExplored = self.stars()[to].explored();

      const neighborsMap = self.neighborsMap();

      const checked = {};

      const workList = [[from]];

      while (workList.length > 0) {
        var path = workList.shift();

        var node = path[path.length - 1];
        var nodeNeighbors = neighborsMap[node];

        checked[node] = true;

        for (var neighbor of nodeNeighbors) {
          var other = neighbor;

          if (checked[other]) {
            continue;
          } // ignore loop

          if (other === to) {
            var previous = _.last(path);

            // prevent pathing through unexplored systems for fog of war

            var explored = self.stars()[previous].explored() || toExplored;

            if (!explored && !noFog) {
              continue;
            }

            path.push(other);

            return path;
          }

          var otherStar = self.stars()[other];
          var otherVisited = otherStar.history().length > 0;

          var valid = noFog ? otherVisited : otherStar.explored();

          if (valid) {
            var newPath = _.cloneDeep(path);
            newPath.push(other);

            workList.push(newPath);
          }
        }
      }

      return null;
    };
  };

  GWGalaxy.loadSystems = function (systems, config) {
    _.forEach(_.zip(systems.stars, config.stars), function (pair) {
      GWStar.loadSystem(pair[0], pair[1]);
    });
    config.saved = true;
  };

  GWGalaxy.saveSystems = function (config) {
    const stars = _.map(config.stars, GWStar.saveSystem);
    // If we have already been saved, throw away the results.
    if (config.saved) {
      return {};
    }
    return {
      stars: stars,
    };
  };

  GWGalaxy.prototype = {
    load: function (config) {
      const self = this;
      config = config || {};
      self.stars(
        _.map(config.stars || [], function (star) {
          const result = new GWStar();
          result.load(star);
          return result;
        })
      );
      self.gates(config.gates || []);
      self.origin(config.origin || 0);
      self.radius(config.radius || [1, 1]);
      self.saved(!!config.saved);
    },
    save: function () {
      const self = this;

      // Handle the stars explicitly, since they tend to be big, and write differently when saved.
      const stars = self.stars;
      delete self.stars;
      const result = ko.toJS(self);
      self.stars = stars;

      const saved = self.saved();
      result.stars = _.map(stars(), function (star) {
        return star.save(saved);
      });

      return result;
    },
    build: function (config) {
      const self = this;
      config = config || {};

      const rng = new Math.seedrandom(config.seed || 0);

      const builder = new GalaxyBuilder(config);
      builder.build();

      // Re-normalize the stars
      const min = builder.stars[0].slice(0);
      const max = builder.stars[0].slice(0);
      _.forEach(builder.stars, function (star) {
        min[0] = Math.min(min[0], star[0]);
        min[1] = Math.min(min[1], star[1]);
        max[0] = Math.max(max[0], star[0]);
        max[1] = Math.max(max[1], star[1]);
      });
      const radius = [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2];
      self.radius(radius);

      _.forEach(builder.stars, function (star, index) {
        builder.stars[index][0] = (star[0] - min[0]) / radius[0] - 1.0;
        builder.stars[index][1] = (star[1] - min[1]) / radius[1] - 1.0;
      });

      // Transform the stars so that they are moved towards the center in proportion to there distance from the center.
      // This moves outliers into the galaxy and will cluster more stars in the center
      var center = _.reduce(builder.stars, function (total, element) {
        return [total[0] + element[0], total[1] + element[1]];
      });
      center = [
        center[0] / builder.stars.length,
        center[1] / builder.stars.length,
      ];

      const deltas = _.map(builder.stars, function (element) {
        var delta = [element[0] - center[0], element[1] - center[1]];
        delta = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);

        return delta;
      });

      const maxDelta = _.max(deltas);
      const maxReduction = 0.35;

      builder.stars = _.map(builder.stars, function (element, index) {
        const delta = deltas[index];
        const factor = Math.pow(maxReduction * (delta / maxDelta), 2);

        return [
          center[0] * factor + element[0] * (1.0 - factor) - 0.15,
          center[1] * factor + element[1] * (1.0 - factor) + 0.15,
        ];
      });

      self.stars(
        _.map(builder.stars || [], function (star) {
          const result = new GWStar();
          result.coordinates(star.concat([rng()]));
          return result;
        })
      );
      self.gates(builder.reducedGraph.getEdges());

      var bestStar = 0;
      var bestDistance = Infinity;
      _.forEach(self.stars(), function (star, index) {
        const distance = star.coordinates()[0] + -star.coordinates()[1];
        if (distance < bestDistance) {
          bestDistance = distance;
          bestStar = index;
        }
      });
      self.origin(bestStar);

      var maxDist = 0;
      builder.reducedGraph.calcDistance(self.origin(), function (s, distance) {
        self.stars()[s].distance(distance);
        if (maxDist < distance) {
          maxDist = distance;
        }
      });

      self.difficultyIndex = config.difficultyIndex;
      const StarSystemTemplates = chooseStarSystemTemplates(
        config.content,
        config.useEasierSystemTemplate
      );

      // Generate the planets, increasing the size based on the distance from the start.
      const starGenerators = _.map(self.stars(), function (star) {
        var systemSize = 0;
        if (
          model.gwoDifficultySettings &&
          !model.gwoDifficultySettings.systemScaling()
        ) {
          systemSize = Math.floor(Math.random() * 10 + 1);
        } else {
          systemSize = star.distance();
        }
        return StarSystemTemplates.generate({
          players: systemSize,
          seed: rng() * rng(),
        }).then(function (system) {
          star.system(system);
          star.biome(system.planets[0].generator.biome);
        });
      });

      return $.when.apply($, starGenerators).then(function () {
        return self;
      });
    },
  };
  return GWGalaxy;
});
