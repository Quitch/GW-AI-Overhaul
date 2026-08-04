// The testable graph core (the GWGalaxy constructor:
// neighborsMap/areNeighbors/pathBetween, ko/lodash only) lives in the measured
// shared/gw_galaxy_graph.js and is unit-tested by test/gw_galaxy_path_between.test.js.
// This shadowed file augments that constructor with the systems load/save/build glue,
// which depends on the unshipped shared/GalaxyBuilder, shared/gw_star and template-loader
// (so it cannot load under the Node AMD harness) and is coverage-excluded. gw_game.js
// consumes the fully-augmented GWGalaxy via its "shared/gw_galaxy" AMD dependency, so the
// runtime contract is unchanged.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_galaxy_graph.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_galaxy_connect.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_system_brackets.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_system_templates.js",
  "shared/GalaxyBuilder",
  // Only for the buildGraph override below, which constructs what stock constructs.
  "shared/Delaunay",
  "shared/Graph",
  "shared/gw_star",
  "main/game/galactic_war/shared/js/systems/template-loader",
], function (
  GWGalaxy,
  gwoGalaxyConnect,
  gwoSystemBrackets,
  gwoRng,
  gwoSystemTemplates,
  GalaxyBuilder,
  Delaunay,
  Graph,
  GWStar,
  chooseStarSystemTemplates
) {
  // GWO - stock calls reduceConnections(max) with no seed, so Graph.js autoseeds from
  // crypto and the gate topology - and every distance derived from it - re-rolled on
  // every build. Hijacked rather than shadowed because this file is GalaxyBuilder's only
  // consumer; see shadowing.md. The body is otherwise stock.
  GalaxyBuilder.prototype.buildGraph = function () {
    this.graph = new Delaunay(this.stars);
    var allEdges = this.graph.getEdges();
    var outerEdges = this.graph.getOuterEdges();
    var innerEdges = _.filter(allEdges, function (testEdge) {
      return !_.some(outerEdges, function (o) {
        return testEdge[0] === o[0] && testEdge[1] === o[1];
      });
    });
    this.reducedGraph = new Graph(innerEdges);
    this.reducedGraph.reduceConnections(this.maxConnections, this.seed); // GWO - was (this.maxConnections)
    this.reducedGraph.sortEdges();
    this.edges = this.reducedGraph.getEdges().map(function (e) {
      return [this.stars[e[0]].slice(0), this.stars[e[1]].slice(0)];
    }, this);
  };

  GWGalaxy.loadSystems = function (systems, config) {
    _.forEach(_.zip(systems.stars, config.stars), function (pair) {
      GWStar.loadSystem(pair[0], pair[1]);
    });
    config.saved = true;
  };

  GWGalaxy.saveSystems = function (config) {
    var stars = _.map(config.stars, GWStar.saveSystem);
    if (config.saved) {
      return {};
    }
    return {
      stars: stars,
    };
  };

  GWGalaxy.prototype = {
    load: function (config) {
      var self = this;
      config = config || {};
      self.stars(
        _.map(config.stars || [], function (star) {
          var result = new GWStar();
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
      var self = this;

      // Handle the stars explicitly, since they tend to be big, and write differently when saved.
      var stars = self.stars;
      delete self.stars;
      var result = ko.toJS(self);
      self.stars = stars;

      var saved = self.saved();
      result.stars = _.map(stars(), function (star) {
        return star.save(saved);
      });

      return result;
    },
    build: function (config) {
      var self = this;
      config = config || {};

      // GWO - setup.js passes its galaxy stream; the fallback serves any other caller.
      var rng = config.gwoRng || gwoRng.create(config.seed || 0);

      var builder = new GalaxyBuilder(config);
      builder.build();

      // buildGraph() strips every convex-hull edge, which leaves any hull star that
      // belonged to a single Delaunay triangle with no edges at all: it gets no gate
      // below, calcDistance never reaches it so it keeps gw_star's default distance of
      // 0, and it generates a minimum-size system no route can ever enter. Restore its
      // hull edges before anything reads the graph. This can take a neighbouring star
      // one connection above config.maxConnections, which is well worth avoiding an
      // unreachable star - or an unwinnable war, since the origin picked below is always
      // a hull star and so is itself at risk.
      var reconnect = gwoGalaxyConnect.reconnectingEdges(
        builder.stars.length,
        builder.graph.getEdges(),
        builder.reducedGraph.getConnections()
      );
      if (reconnect.length > 0) {
        _.forEach(reconnect, function (edge) {
          builder.reducedGraph.addEdge(edge);
        });
        builder.reducedGraph.sortEdges();
      }

      var min = builder.stars[0].slice(0);
      var max = builder.stars[0].slice(0);
      _.forEach(builder.stars, function (star) {
        min[0] = Math.min(min[0], star[0]);
        min[1] = Math.min(min[1], star[1]);
        max[0] = Math.max(max[0], star[0]);
        max[1] = Math.max(max[1], star[1]);
      });
      var radius = [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2];
      self.radius(radius);

      _.forEach(builder.stars, function (star, index) {
        builder.stars[index][0] = (star[0] - min[0]) / radius[0] - 1;
        builder.stars[index][1] = (star[1] - min[1]) / radius[1] - 1;
      });

      // Pulls outliers inward and clusters more stars toward the center.
      var center = _.reduce(builder.stars, function (total, element) {
        return [total[0] + element[0], total[1] + element[1]];
      });
      center = [
        center[0] / builder.stars.length,
        center[1] / builder.stars.length,
      ];

      var deltas = _.map(builder.stars, function (element) {
        var delta = [element[0] - center[0], element[1] - center[1]];
        delta = Math.hypot(delta[0], delta[1]);

        return delta;
      });

      var maxDelta = _.max(deltas);
      var maxReduction = 0.35;

      builder.stars = _.map(builder.stars, function (element, index) {
        var delta = deltas[index];
        var factor = Math.pow(maxReduction * (delta / maxDelta), 2);

        return [
          center[0] * factor + element[0] * (1 - factor) - 0.15,
          center[1] * factor + element[1] * (1 - factor) + 0.15,
        ];
      });

      var jitterRng = rng.stream("jitter");
      self.stars(
        _.map(builder.stars, function (star) {
          var result = new GWStar();
          result.coordinates(star.concat([jitterRng()]));
          return result;
        })
      );
      self.gates(builder.reducedGraph.getEdges());

      var bestStar = 0;
      var bestDistance = Infinity;
      _.forEach(self.stars(), function (star, index) {
        var distance = star.coordinates()[0] - star.coordinates()[1];
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
      // GWO - a seeded copy of the stock loader, unless Shared Systems for Galactic War
      // has replaced it; see shared/gwo_system_templates.js.
      var StarSystemTemplates = gwoSystemTemplates.chooseFor(
        chooseStarSystemTemplates,
        config.content,
        config.useEasierSystemTemplate
      );

      var brackets = config.gwoSystemBrackets;

      // GWO - size follows distance only when System Scaling is on, which is the
      // default. The two passes below visit the stars in different orders, so the
      // randomised branch keys its stream by star index rather than drawing in sequence;
      // calling this twice for one star is therefore harmless. See galaxy.md.
      var systemSizeFor = function (star, index) {
        var systemSize;
        // One player is the baseline, so a solo war adds nothing and the origin star
        // asks for size 0. A nudge towards a bigger fight, not a spawn count: shared
        // army control gives every co-op client the same army, and only
        // gw_coop_referee.js's unshared path splits them one per client.
        var coopSystemPlayerBonus = Math.max(
          0,
          Math.floor((config.coopPlayersForSystemGeneration || 1) - 1)
        );
        if (
          model.gwoDifficultySettings &&
          model.gwoDifficultySettings.systemScaling()
        ) {
          systemSize = star.distance() + coopSystemPlayerBonus;
        } else {
          // "size", not "star": the template seed below already keys stream("star", i),
          // and both would then derive from that stream's first draw.
          systemSize = Math.floor(
            rng.stream("size", index).int(0, 13) + coopSystemPlayerBonus
          );
        }
        // Large Planets brings bigger systems forward rather than resizing planets -
        // the name is kept for its translation strings, see difficulty_options.html.
        if (
          model.gwoDifficultySettings &&
          model.gwoDifficultySettings.largePlanets()
        ) {
          systemSize += 4;
        }
        // Easy Systems has no simpler template set to swap to when the pool is real
        // systems, so it asks for the lowest bracket instead. Last, so it wins over
        // Large Planets and distance alike.
        if (
          brackets &&
          model.gwoDifficultySettings &&
          model.gwoDifficultySettings.simpleSystems()
        ) {
          systemSize = Math.min(systemSize, 0);
        }
        return systemSize;
      };

      var placeSystem = function (star, starSystem) {
        return starSystem.then(function (system) {
          // Both suppliers can resolve without a system - Shared Systems' pickSystem on
          // an empty pool, the stock loader when no template matches. Reject rather than
          // dereference: jQuery 2.x lets a throw here escape .fail(), which leaves Go To
          // War spinning instead of retrying.
          if (
            !system ||
            !system.planets ||
            !system.planets.length ||
            !system.planets[0].generator
          ) {
            return $.Deferred().reject(
              "no usable star system for the star at distance " +
                star.distance()
            );
          }
          star.system(system);
          star.biome(system.planets[0].generator.biome);
        });
      };

      // GWO - brackets are consumed, so nearer stars must claim the smaller systems
      // before the generator loop below runs in array order.
      var systemByStar = [];
      if (brackets) {
        var selector = gwoSystemBrackets.selectorFor(
          brackets,
          rng.stream("brackets")
        );
        var byDistance = _.sortBy(
          _.map(self.stars(), function (star, index) {
            return { star: star, index: index };
          }),
          function (entry) {
            return entry.star.distance();
          }
        );
        _.forEach(byDistance, function (entry) {
          systemByStar[entry.index] = selector.take(
            systemSizeFor(entry.star, entry.index)
          );
        });
      }

      var starGenerators = _.map(self.stars(), function (star, index) {
        if (brackets) {
          return placeSystem(star, $.when(systemByStar[index]));
        }
        // GWO - keyed by star index, not drawn in sequence: these generate() calls
        // resolve out of order, so a shared stream would hand out arbitrary seeds.
        return placeSystem(
          star,
          StarSystemTemplates.generate({
            players: systemSizeFor(star, index),
            seed: rng.stream("star", index).int(0, 2147483647),
          })
        );
      });

      return $.when.apply($, starGenerators).then(function () {
        return self;
      });
    },
  };
  return GWGalaxy;
});
