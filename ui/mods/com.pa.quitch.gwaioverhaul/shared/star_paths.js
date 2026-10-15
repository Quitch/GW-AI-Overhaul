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

  // Every star's pathBetween from one search. A star's last hop is the first
  // dequeued neighbour the fog rules allow, which is where pathBetween stops.
  var pathsFrom = function (galaxy, from, noFog) {
    var stars = galaxy.stars();
    var neighborsMap = galaxy.neighborsMap();
    var reached = {};
    var cameFrom = {};
    var lastHop = {};
    var queue = [from];
    reached[from] = true;

    var head = 0;
    while (head < queue.length) {
      var node = queue[head++];
      var nodeNeighbors = neighborsMap[node] || [];
      var i = 0;

      while (i < nodeNeighbors.length) {
        var other = nodeNeighbors[i++];
        if (
          other !== from &&
          lastHop[other] === undefined &&
          lastHopAllowed(stars[node], stars[other].explored(), noFog)
        ) {
          lastHop[other] = node;
        }

        if (!reached[other] && traversable(stars[other], noFog)) {
          reached[other] = true;
          cameFrom[other] = node;
          queue.push(other);
        }
      }
    }

    return function (to) {
      var last = lastHop[to];
      return last === undefined ? null : pathTo(cameFrom, last, to);
    };
  };

  // The stars the base game's model.canSelect selects, from one search: each
  // one's path, the current star's being itself alone, and null for the rest.
  var selectable = function (model) {
    var game = model.game();
    var current = game.currentStar();
    var noFog = model.cheats.noFog();
    var paths =
      model.canSelectOrMovePrefix() || noFog
        ? pathsFrom(game.galaxy(), current, noFog)
        : undefined;

    return function (star) {
      if (star === current) {
        return [current];
      }
      return paths ? paths(star) : null;
    };
  };

  var install = function (galaxy) {
    galaxy.pathBetween = function (from, to, noFog) {
      return pathBetween(galaxy, from, to, noFog);
    };
  };

  return {
    pathBetween: pathBetween,
    pathsFrom: pathsFrom,
    selectable: selectable,
    install: install,
  };
});
