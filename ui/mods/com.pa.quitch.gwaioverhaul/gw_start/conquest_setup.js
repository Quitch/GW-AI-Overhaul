// The measured half of Galactic Conquest war generation: boss spawn placement,
// Guardians placement and the gwaio.conquest snapshot. The setup.js branch
// supplies engine values.
define([], function () {
  var adjacency = function (gates, starCount) {
    var neighbors = [];
    for (var i = 0; i < starCount; i++) {
      neighbors.push([]);
    }
    _.forEach(gates, function (gate) {
      neighbors[gate[0]].push(gate[1]);
      neighbors[gate[1]].push(gate[0]);
    });
    return neighbors;
  };

  // Unreachable stars stay undefined, matching the base game's
  // Graph.calcDistance never visiting them.
  var hopDistances = function (neighbors, root) {
    var distances = [];
    distances[root] = 0;
    var queue = [root];
    var head = 0;
    while (head < queue.length) {
      var star = queue[head++];
      _.forEach(neighbors[star], function (neighbor) {
        if (distances[neighbor] === undefined) {
          distances[neighbor] = distances[star] + 1;
          queue.push(neighbor);
        }
      });
    }
    return distances;
  };

  var spacingVector = function (members, distancesFrom) {
    var pairs = [];
    for (var a = 0; a < members.length; a++) {
      for (var b = a + 1; b < members.length; b++) {
        pairs.push(distancesFrom(members[a])[members[b]]);
      }
    }
    return pairs.sort(function (x, y) {
      return x - y;
    });
  };

  var betterVector = function (a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return a[i] > b[i];
      }
    }
    return false;
  };

  return {
    // In Conquest no faction spreads, so every star holding an AI is that
    // faction's boss star and the War sweep's "first non-boss AI star" rule
    // finds nothing. The Guardians need their own placement: any star no
    // faction spawned on, except the player's origin.
    guardiansCandidates: function (stars, originIndex) {
      var candidates = [];
      _.forEach(stars, function (star, starIndex) {
        if (!star.ai() && starIndex !== originIndex) {
          candidates.push(starIndex);
        }
      });
      return candidates;
    },

    // Boss spawn stars, replacing the breeder's greedy pick: lexicographic
    // maximin over pairwise gate-hop distances among the player and every
    // boss, so spacing is as wide and as even as the galaxy allows. See
    // conquest.md.
    spawnStars: function (params) {
      var neighbors = adjacency(params.gates, params.starCount);
      var distanceCache = {};
      var distancesFrom = function (root) {
        if (!distanceCache[root]) {
          distanceCache[root] = hopDistances(neighbors, root);
        }
        return distanceCache[root];
      };

      var originDistances = distancesFrom(params.originIndex);
      var candidates = [];
      for (var i = 0; i < params.starCount; i++) {
        if (i !== params.originIndex && originDistances[i] !== undefined) {
          candidates.push(i);
        }
      }
      var spawnCount = Math.min(params.aiCount, candidates.length);
      if (spawnCount < params.aiCount) {
        console.warn("Not enough stars to spawn AI");
      }

      var spawns = [];
      _.times(spawnCount, function () {
        var best = [];
        var bestDistance = 0;
        _.forEach(candidates, function (candidate) {
          if (_.includes(spawns, candidate)) {
            return;
          }
          var nearest = originDistances[candidate];
          _.forEach(spawns, function (spawn) {
            nearest = Math.min(nearest, distancesFrom(spawn)[candidate]);
          });
          if (nearest > bestDistance) {
            best = [];
            bestDistance = nearest;
          }
          if (nearest === bestDistance) {
            best.push(candidate);
          }
        });
        spawns.push(params.rng.pick(best));
      });

      var vectorFor = function (spawnSet) {
        return spacingVector(
          [params.originIndex].concat(spawnSet),
          distancesFrom
        );
      };

      // Swaps that lexicographically raise the spacing vector; ties are only
      // kept once an improvement anchors the champion.
      var improvingMoves = function (current, swapPairs) {
        var champion = vectorFor(current);
        var moves = [];
        var outside = _.reject(candidates, function (candidate) {
          return _.includes(current, candidate);
        });
        var consider = function (swapped) {
          var vector = vectorFor(swapped);
          if (betterVector(vector, champion)) {
            champion = vector;
            moves = [swapped];
          } else if (moves.length && !betterVector(champion, vector)) {
            moves.push(swapped);
          }
        };
        if (!swapPairs) {
          _.forEach(current, function (spawn, slot) {
            _.forEach(outside, function (candidate) {
              var swapped = current.slice();
              swapped[slot] = candidate;
              consider(swapped);
            });
          });
          return moves;
        }
        var slotPairs = [];
        for (var a = 0; a < current.length; a++) {
          for (var b = a + 1; b < current.length; b++) {
            slotPairs.push([a, b]);
          }
        }
        _.forEach(slotPairs, function (slots) {
          for (var c = 0; c < outside.length; c++) {
            for (var d = c + 1; d < outside.length; d++) {
              var swapped = current.slice();
              swapped[slots[0]] = outside[c];
              swapped[slots[1]] = outside[d];
              consider(swapped);
            }
          }
        });
        return moves;
      };

      // Single swaps stall on symmetric plateaus, so a stall escalates to
      // pair swaps once - exhaustive for two bosses. Every accepted move
      // strictly improves a vector drawn from a finite set, so this
      // terminates; the cap is a guard.
      var swapPairs = false;
      for (var pass = 0; pass < 100; pass++) {
        var options = improvingMoves(spawns, swapPairs);
        if (options.length) {
          spawns = params.rng.pick(options);
          swapPairs = false;
        } else if (!swapPairs && spawns.length > 1) {
          swapPairs = true;
        } else {
          break;
        }
      }
      return spawns;
    },

    // The Guardians' one identity for both modes: the War sweep assigns this
    // over a converted worker, Conquest starts from it directly.
    buildGuardiansAi: function (econRate, bossCommanders) {
      return {
        icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png",
        boss: true, // otherwise it won't display its icon
        mirrorMode: true,
        treasurePlanet: true,
        econ_rate: econRate,
        bossCommanders: bossCommanders,
        name: "The Guardians",
        character: "!LOC:Unknown",
        color: [
          [255, 255, 255],
          [255, 192, 203],
        ],
        commander: "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json",
      };
    },

    treasureDescription:
      "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.",

    // Everything the gw_play turn engine needs that only the lobby knows:
    // the effective difficulty numbers (Custom has no tier to re-derive them
    // from) and the raw personality values applyPersonality consumes.
    settings: function (params) {
      return {
        maxDist: params.maxDist,
        maxConnections: params.maxConnections,
        playerCount: params.playerCount,
        lastAiPhaseTurn: 1,
        factions: params.factions.slice(),
        difficulty: {
          econBase: params.difficulty.econBase,
          econRatePerDist: params.difficulty.econRatePerDist,
          mandatoryMinions: params.difficulty.mandatoryMinions,
          minionMod: params.difficulty.minionMod,
          factionTechHandicap: params.difficulty.factionTechHandicap,
          ffaChance: params.difficulty.ffaChance,
          alliedCommanderChance: params.difficulty.alliedCommanderChance,
          bossCommanders: params.difficulty.bossCommanders,
        },
        personality: _.assign({}, params.personality),
        gameModes: {
          landAnywhereChance: params.gameModes.landAnywhereChance,
          suddenDeathChance: params.gameModes.suddenDeathChance,
          bountyModeChance: params.gameModes.bountyModeChance,
          bountyModeValue: params.gameModes.bountyModeValue,
          eradicationModeChance: params.gameModes.eradicationModeChance,
        },
      };
    },
  };
});
