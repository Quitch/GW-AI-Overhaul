// The Galactic Conquest phase planner: given a plain-object board it decides
// every AI action for one turn - boss moves, captures, collisions, foe and
// ally rolls, tier re-scaling - and returns ordered steps for the scene glue
// to apply and animate. Pure: it owns the board it is given (the driver hands
// it clones), touches no observables, and draws only from the streams in ctx.
// The rules are documented in docs/conquest.md.
define([], function () {
  var tierFor = function (sinceTurn, turns, maxDist) {
    return Math.min(Math.floor((turns - sinceTurn) / 2), maxDist);
  };

  var isGuardians = function (ai) {
    return !!ai && !!ai.mirrorMode;
  };

  var isBossOf = function (ai, team) {
    return !!ai && !!ai.boss && !isGuardians(ai) && ai.team === team;
  };

  // A star's persistent owner: a boss standing on its own garrison carries the
  // displaced garrison until it moves on, and a boss that jumped the player
  // (ai.conquestJumped) holds nothing - the star stays the player's.
  var ownerAi = function (ai) {
    if (!ai || ai.conquestJumped) {
      return null;
    }
    return ai.conquestDisplaced ? ai.conquestDisplaced : ai;
  };

  var planPhase = function (board, ctx) {
    var steps = [];
    var events = [];
    var streams = ctx.streams;
    var warRng = ctx.warRng;
    var builder = ctx.builder;
    var cfg = ctx.cfg;
    var teams = cfg.factions.length;

    var neighborsOf = function (starIndex) {
      return board.neighbors[starIndex] || [];
    };

    var record = function (step) {
      steps.push(step);
    };

    var write = function (starIndex, ai) {
      board.stars[starIndex].ai = ai;
      return { star: starIndex, ai: ai };
    };

    // Locates team's boss: on its own star, or stacked as a boss-flagged foe
    // entry on another ai (only ever on the player's star or an ex-player
    // star). Returns undefined for an eliminated team.
    var findBoss = function (team) {
      var found;
      _.forEach(board.stars, function (star, starIndex) {
        var ai = star.ai;
        if (!ai) {
          return;
        }
        if (isBossOf(ai, team)) {
          found = { star: starIndex, ai: ai, host: undefined };
          return false;
        }
        var stacked = _.find(ai.foes || [], function (foe) {
          return foe.boss && foe.team === team;
        });
        if (stacked) {
          found = { star: starIndex, ai: stacked, host: ai };
          return false;
        }
      });
      return found;
    };

    var ownedCount = function (team) {
      var count = 0;
      _.forEach(board.stars, function (star) {
        var owner = ownerAi(star.ai);
        if (owner && !isGuardians(owner) && owner.team === team) {
          ++count;
        }
      });
      return count;
    };

    var hasStackedBoss = function (ai) {
      return !!ai && _.some(ai.foes || [], "boss");
    };

    var isCapturable = function (starIndex, team) {
      if (starIndex === board.treasureStar || starIndex === board.playerStar) {
        return false;
      }
      var ai = board.stars[starIndex].ai;
      if (hasStackedBoss(ai)) {
        return false;
      }
      return !ai || (!isGuardians(ai) && ai.team !== team);
    };

    var isFriendly = function (starIndex, team) {
      var ai = board.stars[starIndex].ai;
      return !!ai && !isGuardians(ai) && ai.team === team;
    };

    var nonFriendlyNeighbours = function (starIndex, team) {
      return _.filter(neighborsOf(starIndex), function (neighbor) {
        return !isFriendly(neighbor, team);
      }).length;
    };

    var friendlyNeighbours = function (starIndex, team) {
      return _.filter(neighborsOf(starIndex), function (neighbor) {
        return isFriendly(neighbor, team);
      }).length;
    };

    // Hop distances from the player's star over the whole graph, fog ignored.
    var distanceToPlayer = [];
    (function () {
      distanceToPlayer[board.playerStar] = 0;
      var work = [board.playerStar];
      var relax = function (from) {
        _.forEach(neighborsOf(from), function (next) {
          if (distanceToPlayer[next] === undefined) {
            distanceToPlayer[next] = distanceToPlayer[from] + 1;
            work.push(next);
          }
        });
      };
      while (work.length) {
        relax(work.shift());
      }
    })();

    // The move-target priority ladder. Filters apply only while they leave
    // candidates; the seeded pick breaks whatever ties survive.
    var pickTarget = function (candidates, team, moveRng) {
      var narrow = function (list, keep) {
        var kept = _.filter(list, keep);
        return kept.length ? kept : list;
      };
      var best = function (list, score) {
        var top = _.max(_.map(list, score));
        return _.filter(list, function (entry) {
          return score(entry) === top;
        });
      };

      var pool = narrow(candidates, function (starIndex) {
        return !board.stars[starIndex].explored;
      });
      var withHostileNeighbours = _.filter(pool, function (starIndex) {
        return nonFriendlyNeighbours(starIndex, team) > 0;
      });
      pool = withHostileNeighbours.length
        ? withHostileNeighbours
        : best(pool, function (starIndex) {
            // A star the player cannot reach at all ranks last.
            return distanceToPlayer[starIndex] === undefined
              ? -Infinity
              : -distanceToPlayer[starIndex];
          });
      pool = best(pool, function (starIndex) {
        return friendlyNeighbours(starIndex, team);
      });
      pool = best(pool, function (starIndex) {
        return nonFriendlyNeighbours(starIndex, team);
      });
      return pool.length === 1 ? pool[0] : moveRng.pick(pool);
    };

    // One hop toward the nearest friendly star that borders something
    // capturable or the player's star, walked through friendly territory only.
    var marchStep = function (fromStar, team) {
      var isFrontier = function (starIndex) {
        return _.some(neighborsOf(starIndex), function (neighbor) {
          return isCapturable(neighbor, team) || neighbor === board.playerStar;
        });
      };
      var parent = [];
      var seen = [];
      seen[fromStar] = true;
      var work = [fromStar];
      var relax = function (from) {
        _.forEach(neighborsOf(from), function (next) {
          if (!seen[next] && isFriendly(next, team)) {
            seen[next] = true;
            parent[next] = from;
            work.push(next);
          }
        });
      };
      while (work.length) {
        var node = work.shift();
        if (node !== fromStar && isFrontier(node)) {
          while (parent[node] !== fromStar) {
            node = parent[node];
          }
          return node;
        }
        relax(node);
      }
      return undefined;
    };

    var eliminate = function (team, byTeam) {
      var clearCards = [];
      var writes = [];
      _.forEach(board.stars, function (star, starIndex) {
        var ai = star.ai;
        if (!ai || isGuardians(ai)) {
          return;
        }
        if (ai.team === team) {
          writes.push(write(starIndex, null));
          if (!star.explored) {
            clearCards.push(starIndex);
          }
          return;
        }
        // A stacked boss of the dead team disappears with it; other factions'
        // ordinary foes stay, matching defeatTeam's semantics.
        if (ai.foes) {
          var remaining = _.filter(ai.foes, function (foe) {
            return !(foe.boss && foe.team === team);
          });
          if (remaining.length !== ai.foes.length) {
            ai.foes = remaining.length ? remaining : undefined;
            if (!ai.foes) {
              delete ai.foes;
            }
            writes.push(write(starIndex, ai));
          }
        }
      });
      record({
        kind: "eliminate",
        team: team,
        writes: writes,
        clearCards: clearCards,
      });
      events.push({ type: "eliminated", team: team, byTeam: byTeam });
    };

    // The garrison (or restored garrison) left behind when a boss departs.
    var departureAi = function (boss, fromStar) {
      var left;
      if (boss.conquestDisplaced) {
        left = boss.conquestDisplaced;
        delete boss.conquestDisplaced;
      } else {
        left = builder.buildGarrison({
          rng: streams.conquestGarrisonRng(warRng, fromStar, boss.capturedTurn),
          team: boss.team,
          faction: boss.faction,
          color: boss.color,
          tier: tierFor(boss.capturedTurn, board.turns, board.maxDist),
        });
        if (left) {
          left.capturedTurn = boss.capturedTurn;
          left.appliedTier = tierFor(
            boss.capturedTurn,
            board.turns,
            board.maxDist
          );
          builder.copyGameModifiers(boss, left);
        }
      }
      // Foes and allies belong to the star, not the departing piece.
      if (left) {
        if (boss.foes) {
          left.foes = (left.foes || []).concat(boss.foes);
          delete boss.foes;
        }
        if (boss.ally) {
          left.ally = boss.ally;
          delete boss.ally;
        }
        builder.ensureQuellerFFATags(left);
      }
      return left || null;
    };

    var capture = function (boss, toStar) {
      boss.capturedTurn = board.turns;
      builder.rollGameModifiers(
        streams.conquestModesRng(warRng, toStar, board.turns),
        boss
      );
    };

    // Moves a boss piece out of wherever it stands; returns the writes for
    // the origin star.
    var liftBoss = function (bossInfo) {
      if (bossInfo.host) {
        bossInfo.host.foes = _.filter(bossInfo.host.foes, function (foe) {
          return foe !== bossInfo.ai;
        });
        if (!bossInfo.host.foes.length) {
          delete bossInfo.host.foes;
        }
        return [write(bossInfo.star, bossInfo.host)];
      }
      return [write(bossInfo.star, departureAi(bossInfo.ai, bossInfo.star))];
    };

    var moveBoss = function (team, bossInfo, toStar) {
      var boss = bossInfo.ai;
      var target = board.stars[toStar].ai;
      var writes;

      // Stacking: a boss arriving on the player's star while another boss
      // holds it (or waits stacked on it) joins the pile rather than
      // resolving a collision.
      if (
        toStar === board.playerStar &&
        target &&
        (target.boss || hasStackedBoss(target))
      ) {
        writes = liftBoss(bossInfo);
        target.foes = (target.foes || []).concat([boss]);
        writes.push(write(toStar, target));
        record({
          kind: "move",
          team: team,
          from: bossInfo.star,
          to: toStar,
          movedAi: boss,
          writes: writes,
        });
        return;
      }

      if (target && target.boss && !isGuardians(target)) {
        // Boss versus boss: more owned systems wins, the attacker on ties.
        var attackerOwned = ownedCount(team);
        var defenderOwned = ownedCount(target.team);
        if (attackerOwned >= defenderOwned) {
          writes = liftBoss(bossInfo);
          record({
            kind: "move",
            team: team,
            from: bossInfo.star,
            to: toStar,
            writes: writes,
          });
          eliminate(target.team, team);
          capture(boss, toStar);
          record({ kind: "occupy", team: team, writes: [write(toStar, boss)] });
        } else {
          // The attacker dies on its own star; no move to animate.
          eliminate(team, target.team);
        }
        return;
      }

      writes = liftBoss(bossInfo);
      if (isFriendly(toStar, team) && target) {
        boss.conquestDisplaced = target;
      } else {
        capture(boss, toStar);
        // The player's star is attacked, not captured: ownership stays with
        // the player until the boss wins. See docs/conquest.md.
        if (toStar === board.playerStar) {
          boss.conquestJumped = true;
        }
      }
      writes.push(write(toStar, boss));
      record({
        kind: "move",
        team: team,
        from: bossInfo.star,
        to: toStar,
        writes: writes,
      });
    };

    var actTeam = function (team) {
      var bossInfo = findBoss(team);
      if (!bossInfo) {
        return;
      }

      var atStar = bossInfo.star;
      var playerAdjacent = _.includes(neighborsOf(atStar), board.playerStar);

      // Waiting on the player, either as the occupier or stacked.
      if (atStar === board.playerStar) {
        record({ kind: "hold", team: team, writes: [] });
        return;
      }

      // The player at the treasure star is out of reach: attacking there
      // would mean taking the Guardians' star.
      if (playerAdjacent && board.playerStar !== board.treasureStar) {
        moveBoss(team, bossInfo, board.playerStar);
        return;
      }

      var candidates = _.filter(neighborsOf(atStar), function (neighbor) {
        return isCapturable(neighbor, team);
      });
      if (candidates.length) {
        var target = pickTarget(
          candidates,
          team,
          streams.conquestMoveRng(warRng, team, board.turns)
        );
        moveBoss(team, bossInfo, target);
        return;
      }

      var towards = marchStep(atStar, team);
      if (towards !== undefined) {
        moveBoss(team, bossInfo, towards);
        return;
      }

      record({ kind: "hold", team: team, writes: [] });
    };

    // Foe and ally rolls run every second turn.
    var rollFoes = function () {
      _.forEach(board.stars, function (star, starIndex) {
        var owner = ownerAi(star.ai);
        if (!owner || isGuardians(owner)) {
          return;
        }
        var foeRng = streams.conquestFoeRng(warRng, starIndex, board.turns);
        _.times(teams, function (otherTeam) {
          if (otherTeam === owner.team) {
            return;
          }
          var foeFaction = cfg.factions[otherTeam];
          var hasFoe = _.some(owner.foes || [], { faction: foeFaction });
          if (hasFoe) {
            return;
          }
          var bordering = _.filter(neighborsOf(starIndex), function (neighbor) {
            var neighbourOwner = ownerAi(board.stars[neighbor].ai);
            return (
              neighbourOwner &&
              !isGuardians(neighbourOwner) &&
              neighbourOwner.team === otherTeam
            );
          }).length;
          if (!bordering) {
            return;
          }
          var rng = foeRng.stream("faction", otherTeam);
          var chance = cfg.difficulty.ffaChance * bordering;
          if (rng.int(1, 100) > chance) {
            return;
          }
          var foe = builder.buildFoe({
            rng: rng,
            foeFaction: foeFaction,
            tier: 0,
          });
          if (!foe) {
            return;
          }
          foe.createdTurn = board.turns;
          foe.appliedTier = 0;
          owner.foes = (owner.foes || []).concat([foe]);
          builder.ensureQuellerFFATags(owner);
          record({
            kind: "foe",
            star: starIndex,
            faction: foeFaction,
            writes: [write(starIndex, board.stars[starIndex].ai)],
          });
        });
      });
    };

    var rollAllies = function () {
      if (ctx.alliesSuppressed) {
        return;
      }
      _.forEach(board.stars, function (star, starIndex) {
        var owner = ownerAi(star.ai);
        if (!owner || isGuardians(owner) || owner.ally) {
          return;
        }
        var playerNeighbours = _.filter(
          neighborsOf(starIndex),
          function (neighbor) {
            var neighbourStar = board.stars[neighbor];
            return !ownerAi(neighbourStar.ai) && neighbourStar.visited;
          }
        ).length;
        if (!playerNeighbours) {
          return;
        }
        var rng = streams.conquestAllyRng(warRng, starIndex, board.turns);
        var chance = cfg.difficulty.alliedCommanderChance * playerNeighbours;
        if (rng.int(1, 100) > chance) {
          return;
        }
        var ally = builder.buildAlly({ rng: rng });
        if (!ally) {
          return;
        }
        owner.ally = ally;
        builder.ensureQuellerFFATags(owner);
        record({
          kind: "ally",
          star: starIndex,
          writes: [write(starIndex, board.stars[starIndex].ai)],
        });
      });
    };

    var refreshScaling = function () {
      _.forEach(board.stars, function (star, starIndex) {
        var ai = star.ai;
        if (!ai || isGuardians(ai)) {
          return;
        }
        var changed = false;
        var refreshOwner = function (owner) {
          if (owner.boss || owner.capturedTurn === undefined) {
            return;
          }
          var tier = tierFor(owner.capturedTurn, board.turns, board.maxDist);
          if (tier !== owner.appliedTier) {
            builder.refreshGarrison(
              streams.conquestScaleRng(warRng, starIndex, tier),
              owner,
              tier
            );
            owner.appliedTier = tier;
            changed = true;
          }
          _.forEach(owner.foes || [], function (foe) {
            if (foe.boss || foe.createdTurn === undefined) {
              return;
            }
            var foeTier = tierFor(foe.createdTurn, board.turns, board.maxDist);
            if (foeTier !== foe.appliedTier) {
              builder.refreshFoe(
                streams
                  .conquestScaleRng(warRng, starIndex, foeTier)
                  .stream("foe", foe.faction),
                foe,
                foeTier
              );
              foe.appliedTier = foeTier;
              changed = true;
            }
          });
        };
        refreshOwner(ai);
        if (ai.conquestDisplaced) {
          refreshOwner(ai.conquestDisplaced);
        }
        if (changed) {
          record({
            kind: "refresh",
            star: starIndex,
            writes: [write(starIndex, ai)],
          });
        }
      });

      _.times(teams, function (team) {
        var bossInfo = findBoss(team);
        if (!bossInfo) {
          return;
        }
        var owned = ownedCount(team);
        var tier = Math.min(owned, board.maxDist);
        if (tier === bossInfo.ai.appliedTier) {
          return;
        }
        builder.refreshBoss(
          streams.conquestBossScaleRng(warRng, team, owned),
          bossInfo.ai,
          tier
        );
        bossInfo.ai.appliedTier = tier;
        record({
          kind: "refresh",
          star: bossInfo.star,
          writes: [write(bossInfo.star, board.stars[bossInfo.star].ai)],
        });
      });
    };

    _.times(teams, actTeam);
    if (board.turns % 2 === 0) {
      rollFoes();
      rollAllies();
    }
    refreshScaling();

    return { steps: steps, events: events };
  };

  return { planPhase: planPhase, tierFor: tierFor };
});
