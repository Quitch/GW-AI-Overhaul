// The base game's GWGalaxy pathBetween, without copying the path at every step.
// See shadowing.md, "Galaxy generation is a hijack, and `gw_play` replaces
// `pathBetween`".
define(function () {
  var lastHopAllowed = function (star, toExplored, noFog) {
    return star.explored() || toExplored || noFog;
  };

  var traversable = function (star, noFog) {
    return noFog ? star.history().length > 0 : star.explored();
  };

  var pathTo = function (cameFrom, last, to) {
    var path = [to];
    for (var step = last; step !== undefined; step = cameFrom[step]) {
      path.push(step);
    }
    return path.reverse();
  };

  var pathBetween = function (galaxy, from, to, noFog) {
    var stars = galaxy.stars();
    var toExplored = stars[to].explored();
    var neighborsMap = galaxy.neighborsMap();
    var reached = {};
    var cameFrom = {};
    var queue = [from];
    reached[from] = true;

    // Index loops: for...of and shift() made a 234-star sweep four times
    // slower in PA's engine.
    var head = 0;
    while (head < queue.length) {
      var node = queue[head++];
      var nodeNeighbors = neighborsMap[node] || [];
      var i = 0;

      while (i < nodeNeighbors.length) {
        var other = nodeNeighbors[i++];
        if (reached[other]) {
          continue;
        }

        if (other === to) {
          if (lastHopAllowed(stars[node], toExplored, noFog)) {
            return pathTo(cameFrom, node, to);
          }
        } else if (traversable(stars[other], noFog)) {
          reached[other] = true;
          cameFrom[other] = node;
          queue.push(other);
        }
      }
    }

    return null;
  };

  var install = function (galaxy) {
    galaxy.pathBetween = function (from, to, noFog) {
      return pathBetween(galaxy, from, to, noFog);
    };
  };

  return {
    pathBetween: pathBetween,
    install: install,
  };
});
