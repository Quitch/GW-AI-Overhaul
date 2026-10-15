// The base game's GWGalaxy pathBetween, without copying the path at every step.
// See shadowing.md, "Galaxy generation is a hijack, and `gw_play` replaces
// `pathBetween`".
define(function () {
  var pathBetween = function (galaxy, from, to, noFog) {
    var stars = galaxy.stars();
    var toExplored = stars[to].explored();
    var neighborsMap = galaxy.neighborsMap();
    var reached = {};
    var cameFrom = {};
    var queue = [from];
    reached[from] = true;

    for (var head = 0; head < queue.length; head++) {
      var node = queue[head];
      var nodeNeighbors = neighborsMap[node] || [];

      for (var i = 0; i < nodeNeighbors.length; i++) {
        var other = nodeNeighbors[i];
        if (reached[other]) {
          continue;
        }

        if (other === to) {
          if (!stars[node].explored() && !toExplored && !noFog) {
            continue;
          }
          var path = [to];
          for (var step = node; step !== undefined; step = cameFrom[step]) {
            path.push(step);
          }
          return path.reverse();
        }

        var otherStar = stars[other];
        var valid = noFog
          ? otherStar.history().length > 0
          : otherStar.explored();
        if (valid) {
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
