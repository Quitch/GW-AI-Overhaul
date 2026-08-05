// GWO's copy of the base game's gw_breeder.js, with params.rng (shared/gwo_rng.js)
// seeding the two draws that place each AI faction: which star a faction spawns on,
// and the order the spawns are assigned in.
//
// A copy in GWO's namespace rather than a shadow of pages/gw_start/gw_breeder, so the
// base module stays available to anything else that wants it. Kept otherwise identical
// to stock, including the rng-less fallback, so a diff after a PA patch stays readable.
// See shadowing.md and galaxy.md.
define(["shared/Graph"], function (Graph) {
  var GWBreeder = {
    populate: function (params) {
      var galaxy = params.galaxy;
      var spawn = params.spawn || function () {};
      var spreadFunction = params.spread || function () {};
      var canSpread =
        params.canSpread ||
        function () {
          return true;
        };
      var boost = params.boss || function () {};
      var teams = (params.teams || []).slice();
      var aiCount = teams.length;
      var neutralStars =
        params.neutralStars ||
        Math.floor(galaxy.stars().length / (aiCount + 2));
      var orderedSpawn = !!params.orderedSpawn;
      var breedToOrigin = !!params.breedToOrigin;
      var rng = params.rng; // GWO

      var graph = new Graph(galaxy.gates());
      var spawns = [];
      var origin = galaxy.origin();
      spawns.unshift(origin);
      _.times(aiCount, function () {
        var leaves = [];
        var maxDistance = 1;
        graph.calcDistance(spawns, function (star, distance) {
          if (distance < maxDistance) return; // If the distance calculator works breadth first (which it currently does), this shouldn't happen.

          if (distance > maxDistance) {
            leaves.length = 0;
            maxDistance = distance;
          }
          leaves.push(star);
        });
        if (!leaves.length) {
          console.warn("Not enough stars to spawn AI");
          return;
        }

        var spawn = rng ? rng.pick(leaves) : _.sample(leaves); // GWO
        spawns.push(spawn);
      });
      spawns.shift();
      // If we didn't get enough spawns, we need to update the ai count.
      aiCount = spawns.length;

      if (!orderedSpawn) spawns = rng ? rng.shuffle(spawns) : _.shuffle(spawns); // GWO

      // Mark neutral stars
      var neutralLeft = neutralStars;
      var neutralIndices = {};
      graph.calcDistance(origin, function (star) {
        if (neutralLeft < 0) return;
        --neutralLeft;
        neutralIndices[star] = true;
      });

      var doSpawn = $.when.apply(
        $,
        _.map(spawns, function (starIndex, spawnIndex) {
          var star = galaxy.stars()[starIndex];
          // TODO: More AI attributes
          var ai = {
            commander:
              "/pa/units/commanders/imperial_delta/imperial_delta.json",
            econ_rate: 1,
            color: teams[spawnIndex].color,
            team: spawnIndex,
          };
          return $.when(spawn(star, ai)).then(function (spawnResult) {
            star.ai(spawnResult || ai);
            return star.ai();
          });
        })
      );
      var spread = doSpawn.then(function () {
        // Spread out.
        var spreadStars = galaxy.stars().length - (neutralStars + aiCount);
        var spreadQueues = _.map(spawns, function (spawn) {
          var queue = [];
          // Sort the stars by distance from the spawns
          graph.calcDistance(spawn, function (neighbor, distance) {
            queue.push([neighbor, distance]);
          });
          return queue;
        });
        // Reverse them so we can use it as a stack (unshift sucks)
        _.invoke(spreadQueues, "reverse");
        var origin = galaxy.origin();
        var emptyQueues = 0;
        var spreadOnce = function () {
          // Spread out per queue
          if (spreadStars <= 0 || emptyQueues >= spreadQueues.length) {
            return $.when(false);
          }
          return $.when
            .apply(
              $,
              _.map(spreadQueues, function (queue, spawnIndex) {
                if (!spreadStars) return;
                if (!queue.length) return;

                var starInfo = queue.pop();
                var starIndex = starInfo[0];
                if (!queue.length) ++emptyQueues;

                if (starIndex === origin && !breedToOrigin) return;

                if (neutralIndices[starIndex]) return;

                var star = galaxy.stars()[starIndex];
                if (star.ai()) return;

                var parent = galaxy.stars()[spawns[spawnIndex]].ai();
                if (!canSpread(star, parent)) return;

                var ai = _.cloneDeep(parent);

                return $.when(spreadFunction(star, ai)).then(
                  function (spreadResult) {
                    star.ai(spreadResult || ai);
                    --spreadStars;
                    return star.ai();
                  }
                );
              })
            )
            .then(function () {
              return true;
            });
        };
        var loop = function () {
          return spreadOnce().then(function (result) {
            return result ? loop() : $.when();
          });
        };
        return loop();
      });

      // GWO - renamed from a second `var boost`, which redeclared the params.boss
      // alias above. Stock only works because this callback runs inline.
      var boosted = spread.then(function () {
        // Turn up the special boss
        return $.when.apply(
          $,
          _.map(spawns, function (starIndex) {
            var star = galaxy.stars()[starIndex];
            var ai = star.ai();
            if (!ai) return;
            ai.boss = true;
            return boost(star, ai);
          })
        );
      });

      return boosted.then(function () {
        return params;
      });
    },
  };

  return GWBreeder;
});
