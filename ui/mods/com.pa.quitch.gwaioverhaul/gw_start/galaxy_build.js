// Galaxy generation: system size scaling, army brackets under Shared Systems for
// Galactic War, and the repair for stars the base builder leaves with no gates.
//
// A hijack rather than a shadow of shared/gw_galaxy.js. Only `build` and
// GalaxyBuilder's `buildGraph` differ from stock, and both are prototype methods,
// so the rest of that file - including the constructor's routing - is left to the
// base game. install() is called from gw_start/setup.js, whose own navToNewGame is
// the only caller of build(). See galaxy.md and shadowing.md.
define([
  "shared/gw_galaxy",
  "shared/GalaxyBuilder",
  "shared/Delaunay",
  "shared/Graph",
  "shared/gw_star",
  "main/game/galactic_war/shared/js/systems/template-loader",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_galaxy_connect.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_system_brackets.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_system_templates.js",
], function (
  GWGalaxy,
  GalaxyBuilder,
  Delaunay,
  Graph,
  GWStar,
  chooseStarSystemTemplates,
  gwoGalaxyConnect,
  gwoSystemBrackets,
  gwoRng,
  gwoSystemTemplates
) {
  // Stock calls reduceConnections(max) with no seed, so Graph.js autoseeds from
  // crypto and the gate topology - and every distance derived from it - re-rolled
  // on every build. The body is otherwise stock.
  var buildGraph = function () {
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

  var build = function (config) {
    var self = this;
    config = config || {};

    // GWO - setup.js passes its galaxy stream; the fallback serves any other caller.
    var rng = config.gwoRng || gwoRng.create(config.seed || 0);

    var builder = new GalaxyBuilder(config);
    builder.build();

    // Must run before anything reads the graph. Can push a neighbour one
    // connection past config.maxConnections, which beats an unreachable star.
    // See shared/gw_galaxy_connect.js.
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
      // A nudge towards a bigger fight, not a spawn count. One player is the
      // baseline, so a solo war adds nothing.
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
        // "size", not "star": the template seed below already keys stream("star", i).
        systemSize = Math.floor(
          rng.stream("size", index).int(0, 13) + coopSystemPlayerBonus
        );
      }
      // Large Planets brings bigger systems forward rather than resizing
      // planets. The name is kept for its translation strings.
      if (
        model.gwoDifficultySettings &&
        model.gwoDifficultySettings.largePlanets()
      ) {
        systemSize += 4;
      }
      // A real-system pool has no simpler template set for Easy Systems to swap
      // to, so it asks for the lowest bracket. Last, so it wins over the rest.
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
        // Both suppliers can resolve without a system. Reject rather than
        // dereference: a throw here escapes .fail() and hangs Go To War.
        if (
          !system ||
          !system.planets ||
          !system.planets.length ||
          !system.planets[0].generator
        ) {
          return $.Deferred().reject(
            "no usable star system for the star at distance " + star.distance()
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
        rng.stream("brackets"),
        config.gwoBiomeProviders
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
  };

  return {
    install: function () {
      GalaxyBuilder.prototype.buildGraph = buildGraph;
      GWGalaxy.prototype.build = build;
    },
  };
});
