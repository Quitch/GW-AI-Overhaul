// The Galactic Conquest phase planner: given a plain-object board it decides
// every AI action for one turn - boss moves, captures, collisions, foe and
// ally rolls, tier re-scaling - and returns ordered steps for the scene glue
// to apply and animate. Pure: it owns the board it is given (the driver hands
// it clones), touches no observables, and draws only from the streams in ctx.
// The rules are documented in docs/conquest.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_scaling.js",
], function (gwoScaling) {
  // growth accumulates one friendly-neighbour count per phase; the integer
  // sum divides once here so no float drift can cross a floor boundary.
  var growthTier = function (growth, maxConnections, maxDist) {
    return Math.min(Math.floor(growth / maxConnections), maxDist);
  };

  // First free palette colour, else the least used; ties go to the lowest
  // index.
  var pickArmyColour = function (usedColours, paletteSize) {
    if (!paletteSize) {
      return 0;
    }
    var counts = [];
    var i;
    for (i = 0; i < paletteSize; i++) {
      counts.push(0);
    }
    _.forEach(usedColours, function (colour) {
      if (counts[colour] !== undefined) {
        ++counts[colour];
      }
    });
    var best = 0;
    for (i = 0; i < paletteSize; i++) {
      if (!counts[i]) {
        return i;
      }
      if (counts[i] < counts[best]) {
        best = i;
      }
    }
    return best;
  };

  var isGuardians = function (ai) {
    return !!ai && !!ai.mirrorMode;
  };

  var isBossOf = function (ai, team) {
    return !!ai && !!ai.boss && !isGuardians(ai) && ai.team === team;
  };

  // A star's persistent owner: a boss that jumped the player
  // (ai.conquestJumped) holds nothing - the star stays the player's.
  var ownerAi = function (ai) {
    return !ai || ai.conquestJumped ? null : ai;
  };

  var planPhase = function (board, ctx) {
    var steps = [];
    var events = [];
    var streams = ctx.streams;
    var warRng = ctx.warRng;
    var builder = ctx.builder;
    var cfg = ctx.cfg;
    var teams = cfg.factions.length;
    // Saves from before the field was snapshotted always built 4-connection
    // galaxies.
    var maxConnections = cfg.maxConnections || 4;
    var paletteSizes = ctx.paletteSizes || [];
    if (!board.armySeq) {
      board.armySeq = {};
    }
    var armySeq = board.armySeq;
    if (!board.playerHeld) {
      board.playerHeld = {};
    }
    if (!board.playerGrowth) {
      board.playerGrowth = {};
    }
    if (!board.playerArmies) {
      board.playerArmies = [];
    }
    var playerFaction = ctx.playerFaction || 0;

    var tierFromGrowth = function (growth) {
      return growthTier(growth, maxConnections, board.maxDist);
    };

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

    // A boss star is attackable only from strength: half again the defender's
    // owned systems. See docs/conquest.md; the cornered would-win exception
    // is actTeam's.
    var isTargetable = function (starIndex, team) {
      if (!isCapturable(starIndex, team)) {
        return false;
      }
      var ai = board.stars[starIndex].ai;
      if (!ai || !ai.boss) {
        return true;
      }
      return ownedCount(team) * 2 >= ownedCount(ai.team) * 3;
    };

    var isFriendly = function (starIndex, team) {
      var ai = board.stars[starIndex].ai;
      return !!ai && !isGuardians(ai) && ai.team === team;
    };

    var teamFriendly = function (team) {
      return function (starIndex) {
        return isFriendly(starIndex, team);
      };
    };

    // The player's side of the same test: explored or captured by a player
    // army, and held by no AI.
    var playerOwned = function (starIndex) {
      var star = board.stars[starIndex];
      return (
        !ownerAi(star.ai) && (star.explored || !!board.playerHeld[starIndex])
      );
    };

    var nonFriendlyNeighbours = function (starIndex, friendly) {
      return _.filter(neighborsOf(starIndex), function (neighbor) {
        return !friendly(neighbor);
      }).length;
    };

    var friendlyNeighbours = function (starIndex, friendly) {
      return _.filter(neighborsOf(starIndex), friendly).length;
    };

    // Persistent-owner adjacency (ownerAi: a jumped boss holds nothing) -
    // the count that spawns foes and feeds growth. isFriendly above is
    // movement's looser test.
    var owningNeighbours = function (starIndex, keep) {
      return _.filter(neighborsOf(starIndex), function (neighbor) {
        var owner = ownerAi(board.stars[neighbor].ai);
        return !!owner && !isGuardians(owner) && keep(owner);
      }).length;
    };

    var teamNeighbours = function (starIndex, team) {
      return owningNeighbours(starIndex, function (owner) {
        return owner.team === team;
      });
    };

    var factionNeighbours = function (starIndex, faction) {
      return owningNeighbours(starIndex, function (owner) {
        return owner.faction === faction;
      });
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
    var pickTarget = function (candidates, friendly, moveRng) {
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
        return nonFriendlyNeighbours(starIndex, friendly) > 0;
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
        return friendlyNeighbours(starIndex, friendly);
      });
      pool = best(pool, function (starIndex) {
        return nonFriendlyNeighbours(starIndex, friendly);
      });
      return pool.length === 1 ? pool[0] : moveRng.pick(pool);
    };

    // Every system adjacent to the connected friendly region holding atStar:
    // a boss moves like the player, so one move reaches any of them. Sorted
    // so the pick ladder sees a stable order whatever the BFS met first.
    var regionFrontier = function (atStar, friendly) {
      var inRegion = [];
      inRegion[atStar] = true;
      var onFrontier = [];
      var frontier = [];
      var work = [atStar];
      var relax = function (from) {
        _.forEach(neighborsOf(from), function (next) {
          if (inRegion[next] || onFrontier[next]) {
            return;
          }
          if (friendly(next)) {
            inRegion[next] = true;
            work.push(next);
          } else {
            onFrontier[next] = true;
            frontier.push(next);
          }
        });
      };
      while (work.length) {
        relax(work.shift());
      }
      return frontier.sort(function (a, b) {
        return a - b;
      });
    };

    // The player's systems: explored and held by no AI. A jumped boss's star
    // is still the player's, as in game.fight's owners map.
    var playerOwnedCount = function () {
      return _.filter(board.stars, function (star, starIndex) {
        return playerOwned(starIndex);
      }).length;
    };

    var playerArmiesAt = function (starIndex) {
      return _.filter(board.playerArmies, function (token) {
        return token.star === starIndex;
      });
    };

    var removePlayerArmiesAt = function (starIndex) {
      var present = playerArmiesAt(starIndex).length;
      if (present) {
        board.playerArmies = _.filter(board.playerArmies, function (token) {
          return token.star !== starIndex;
        });
      }
      return present;
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
        if (ai.minionArmies) {
          var liveArmies = _.filter(ai.minionArmies, function (army) {
            return army.team !== team;
          });
          if (liveArmies.length !== ai.minionArmies.length) {
            if (liveArmies.length) {
              ai.minionArmies = liveArmies;
            } else {
              delete ai.minionArmies;
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

    // The garrison left behind when a boss departs.
    var departureAi = function (boss, fromStar) {
      var growth = boss.growth || 0;
      var tier = tierFromGrowth(growth);
      var left = builder.buildGarrison({
        rng: streams.conquestGarrisonRng(warRng, fromStar, boss.capturedTurn),
        team: boss.team,
        faction: boss.faction,
        color: boss.color,
        tier: tier,
      });
      if (left) {
        left.capturedTurn = boss.capturedTurn;
        left.growth = growth;
        left.appliedTier = tier;
        builder.copyGameModifiers(boss, left);
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
      boss.growth = 0;
      // An AI arrival defeats any player minion armies standing there and
      // ends the player's claim on the star.
      removePlayerArmiesAt(toStar);
      delete board.playerHeld[toStar];
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
        removePlayerArmiesAt(toStar);
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
            movedAi: boss,
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
      capture(boss, toStar);
      // The player's star is attacked, not captured: ownership stays with
      // the player until the boss wins. See docs/conquest.md.
      if (toStar === board.playerStar) {
        boss.conquestJumped = true;
      }
      writes.push(write(toStar, boss));
      record({
        kind: "move",
        team: team,
        from: bossInfo.star,
        to: toStar,
        movedAi: boss,
        writes: writes,
      });
    };

    var actTeam = function (team) {
      var bossInfo = findBoss(team);
      if (!bossInfo) {
        return;
      }

      // Waiting on the player, either as the occupier or stacked.
      if (bossInfo.star === board.playerStar) {
        record({ kind: "hold", team: team, writes: [] });
        return;
      }

      var friendly = teamFriendly(team);
      var frontier = regionFrontier(bossInfo.star, friendly);
      var moveRng = function () {
        return streams.conquestMoveRng(warRng, team, board.turns);
      };

      // The player at the treasure star is out of reach: attacking there
      // would mean taking the Guardians' star. Engaging the player takes the
      // same strength as attacking a boss - the region-wide reach would
      // otherwise land on the player every single turn.
      if (
        _.includes(frontier, board.playerStar) &&
        board.playerStar !== board.treasureStar &&
        ownedCount(team) * 2 >= playerOwnedCount() * 3
      ) {
        moveBoss(team, bossInfo, board.playerStar);
        return;
      }

      var candidates = _.filter(frontier, function (starIndex) {
        return isCapturable(starIndex, team);
      });
      var targetable = _.filter(candidates, function (starIndex) {
        return isTargetable(starIndex, team);
      });
      if (targetable.length) {
        moveBoss(team, bossInfo, pickTarget(targetable, friendly, moveRng()));
        return;
      }

      // Cornered: every capturable frontier star is a gated boss star.
      // Attack only what the collision in moveBoss would let this faction
      // win - otherwise hold, as the player now can.
      var winnable = _.filter(candidates, function (starIndex) {
        return ownedCount(team) >= ownedCount(board.stars[starIndex].ai.team);
      });
      if (winnable.length) {
        moveBoss(team, bossInfo, pickTarget(winnable, friendly, moveRng()));
        return;
      }

      record({ kind: "hold", team: team, writes: [] });
    };

    // Every live army of the team, spawn order first: settled on their own
    // stars or still mustered on a host's stack.
    var findArmies = function (team) {
      var found = [];
      _.forEach(board.stars, function (star, starIndex) {
        var ai = star.ai;
        if (!ai) {
          return;
        }
        if (ai.conquestArmy && ai.team === team) {
          found.push({ star: starIndex, ai: ai, host: undefined });
        }
        _.forEach(ai.minionArmies || [], function (army) {
          if (army.team === team) {
            found.push({ star: starIndex, ai: army, host: ai });
          }
        });
      });
      return _.sortBy(found, function (info) {
        return info.ai.conquestArmy.seq;
      });
    };

    var armyAlive = function (info) {
      if (info.host) {
        return (
          board.stars[info.star].ai === info.host &&
          _.includes(info.host.minionArmies || [], info.ai)
        );
      }
      return board.stars[info.star].ai === info.ai;
    };

    // Moves an army off its star: a mustered army leaves its host garrison
    // untouched, a settled army leaves a departure garrison like a boss.
    var liftArmy = function (info) {
      if (info.host) {
        info.host.minionArmies = _.filter(
          info.host.minionArmies,
          function (army) {
            return army !== info.ai;
          }
        );
        if (!info.host.minionArmies.length) {
          delete info.host.minionArmies;
        }
        return [write(info.star, info.host)];
      }
      return [write(info.star, departureAi(info.ai, info.star))];
    };

    var hasOpposingArmy = function (ai, team) {
      if (!ai || ai.team === team) {
        return false;
      }
      return !!ai.conquestArmy || !!(ai.minionArmies && ai.minionArmies.length);
    };

    var moveArmy = function (team, info, toStar) {
      var army = info.ai;
      var target = board.stars[toStar].ai;
      var writes = liftArmy(info);

      record({
        kind: "move",
        team: team,
        from: info.star,
        to: toStar,
        movedAi: army,
        writes: writes,
      });

      // Opposing minion armies - the player's tokens included - annihilate
      // each other and raze the system to neutral; an unexplored star keeps
      // its card.
      if (hasOpposingArmy(target, team) || playerArmiesAt(toStar).length) {
        removePlayerArmiesAt(toStar);
        delete board.playerHeld[toStar];
        record({
          kind: "clash",
          team: team,
          star: toStar,
          writes: [write(toStar, null)],
        });
        return;
      }

      capture(army, toStar);
      record({
        kind: "occupy",
        team: team,
        writes: [write(toStar, army)],
      });
    };

    // Armies move like bosses shorn of the special branches: no attack on
    // the player's star, no cornered fallback, and a boss star is never a
    // target.
    var actArmies = function (team) {
      var friendly = teamFriendly(team);
      _.forEach(findArmies(team), function (info) {
        if (!armyAlive(info)) {
          return;
        }
        var frontier = regionFrontier(info.star, friendly);
        var candidates = _.filter(frontier, function (starIndex) {
          var ai = board.stars[starIndex].ai;
          return isCapturable(starIndex, team) && !(ai && ai.boss);
        });
        if (!candidates.length) {
          record({
            kind: "hold",
            team: team,
            army: info.ai.conquestArmy.seq,
            writes: [],
          });
          return;
        }
        var rng = streams.conquestArmyMoveRng(
          warRng,
          team,
          info.ai.conquestArmy.seq,
          board.turns
        );
        moveArmy(team, info, pickTarget(candidates, friendly, rng));
      });
    };

    var playerCapturable = function (starIndex) {
      if (starIndex === board.treasureStar) {
        return false;
      }
      var ai = board.stars[starIndex].ai;
      if (!ai) {
        return true;
      }
      return !isGuardians(ai) && !ai.boss && !hasStackedBoss(ai);
    };

    var movePlayerArmy = function (token, toStar) {
      var target = board.stars[toStar].ai;
      record({
        kind: "move",
        player: true,
        from: token.star,
        to: toStar,
        movedAi: {
          faction: playerFaction,
          conquestArmy: { seq: token.seq, colour: token.colour, player: true },
        },
        writes: [],
      });

      // -1 matches no AI team, so any army presence there opposes.
      if (hasOpposingArmy(target, -1)) {
        board.playerArmies = _.without(board.playerArmies, token);
        delete board.playerHeld[toStar];
        record({
          kind: "clash",
          player: true,
          star: toStar,
          writes: [write(toStar, null)],
        });
        return;
      }

      token.star = toStar;
      var writes = [];
      if (target) {
        writes.push(write(toStar, null));
      }
      // A captured unexplored star stays explorable; the flag is what marks
      // it as the player's until they do.
      if (!board.stars[toStar].explored) {
        board.playerHeld[toStar] = true;
      }
      record({ kind: "occupy", player: true, writes: writes });
    };

    // Player armies act last, so every AI team's resolution stays identical
    // to a war without them.
    var actPlayerArmies = function () {
      _.forEach(_.sortBy(board.playerArmies.slice(0), "seq"), function (token) {
        if (!_.includes(board.playerArmies, token)) {
          return;
        }
        var frontier = regionFrontier(token.star, playerOwned);
        var candidates = _.filter(frontier, playerCapturable);
        if (!candidates.length) {
          record({ kind: "hold", player: true, army: token.seq, writes: [] });
          return;
        }
        var rng = streams.conquestPlayerArmyMoveRng(
          warRng,
          token.seq,
          board.turns
        );
        movePlayerArmy(token, pickTarget(candidates, playerOwned, rng));
      });
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
          var bordering = teamNeighbours(starIndex, otherTeam);
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
          foe.growth = 0;
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

    var nextArmySeq = function (team) {
      var key = String(team);
      var seq = armySeq[key] || 0;
      armySeq[key] = seq + 1;
      return seq;
    };

    var armyColoursInUse = function (team) {
      var used = [];
      _.forEach(board.stars, function (star) {
        var ai = star.ai;
        if (!ai) {
          return;
        }
        if (ai.conquestArmy && ai.team === team) {
          used.push(ai.conquestArmy.colour);
        }
        _.forEach(ai.minionArmies || [], function (army) {
          if (army.team === team) {
            used.push(army.conquestArmy.colour);
          }
        });
      });
      return used;
    };

    // A capped garrison converts each further full tier of growth into a
    // minion army, mustered on its star until the next phase moves it out.
    // The debit makes a full tier re-accrue before the next spawn.
    var spawnArmy = function (starIndex, owner) {
      var army = builder.buildGarrison({
        rng: streams.conquestArmyRng(warRng, starIndex, board.turns),
        team: owner.team,
        faction: owner.faction,
        color: owner.color,
        tier: board.maxDist,
      });
      if (!army) {
        return false;
      }
      owner.growth -= maxConnections;
      army.capturedTurn = board.turns;
      army.growth = 0;
      army.appliedTier = board.maxDist;
      army.conquestArmy = {
        seq: nextArmySeq(owner.team),
        colour: pickArmyColour(
          armyColoursInUse(owner.team),
          paletteSizes[owner.faction]
        ),
        origin: starIndex,
      };
      owner.minionArmies = (owner.minionArmies || []).concat([army]);
      record({
        kind: "spawn",
        star: starIndex,
        team: owner.team,
        writes: [write(starIndex, owner)],
      });
      return true;
    };

    var refreshScaling = function () {
      // Seeds the counter pre-growth saves lack, reproducing the saved tier.
      // Returns whether the piece mutated: the planner owns a clone, so every
      // mutation must reach a step's writes or the live board never sees it.
      var accrueGrowth = function (piece, count) {
        var mutated = false;
        if (piece.growth === undefined) {
          piece.growth = (piece.appliedTier || 0) * maxConnections;
          mutated = true;
        }
        if (count > 0) {
          piece.growth += count;
          mutated = true;
        }
        return mutated;
      };

      _.forEach(board.stars, function (star, starIndex) {
        var ai = star.ai;
        if (!ai || isGuardians(ai)) {
          return;
        }
        var changed = false;
        var refreshOwner = function (owner) {
          if (owner.boss) {
            // The counter only sets the departure garrison's tier; the
            // boss's own tier is the fair-share loop below. A jumped boss
            // holds nothing and never departs.
            if (!owner.conquestJumped) {
              var count = teamNeighbours(starIndex, owner.team);
              if (count > 0) {
                owner.growth = (owner.growth || 0) + count;
                changed = true;
              }
            }
          } else if (owner.conquestArmy) {
            // An army never rescales; growth feeds only its departure
            // garrison.
            changed =
              accrueGrowth(owner, teamNeighbours(starIndex, owner.team)) ||
              changed;
          } else if (owner.capturedTurn !== undefined) {
            changed =
              accrueGrowth(owner, teamNeighbours(starIndex, owner.team)) ||
              changed;
            if (owner.growth >= (board.maxDist + 1) * maxConnections) {
              changed = spawnArmy(starIndex, owner) || changed;
            }
            var tier = tierFromGrowth(owner.growth);
            if (tier !== owner.appliedTier) {
              builder.refreshGarrison(
                streams.conquestScaleRng(warRng, starIndex, tier),
                owner,
                tier
              );
              owner.appliedTier = tier;
              changed = true;
            }
          }
          _.forEach(owner.foes || [], function (foe) {
            if (foe.boss || foe.createdTurn === undefined) {
              return;
            }
            changed =
              accrueGrowth(foe, factionNeighbours(starIndex, foe.faction)) ||
              changed;
            var foeTier = tierFromGrowth(foe.growth);
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
        if (changed) {
          record({
            kind: "refresh",
            star: starIndex,
            writes: [write(starIndex, ai)],
          });
        }
      });

      // Player systems accrue the same growth and spawn the same armies; the
      // counters live on cfg because their stars carry no ai to hold them.
      _.forEach(board.stars, function (star, starIndex) {
        if (board.playerHeld[starIndex] && star.explored) {
          delete board.playerHeld[starIndex];
        }
        if (!playerOwned(starIndex)) {
          // A recaptured system forfeits its accrued growth.
          delete board.playerGrowth[starIndex];
          return;
        }
        var count = friendlyNeighbours(starIndex, playerOwned);
        var growth = (board.playerGrowth[starIndex] || 0) + count;
        if (count > 0) {
          board.playerGrowth[starIndex] = growth;
        }
        if (growth >= (board.maxDist + 1) * maxConnections) {
          board.playerGrowth[starIndex] = growth - maxConnections;
          board.playerArmies.push({
            seq: nextArmySeq("player"),
            colour: pickArmyColour(
              _.map(board.playerArmies, "colour"),
              paletteSizes[playerFaction]
            ),
            star: starIndex,
          });
          record({ kind: "spawn", star: starIndex, player: true, writes: [] });
        }
      });

      _.times(teams, function (team) {
        var bossInfo = findBoss(team);
        if (!bossInfo) {
          return;
        }
        var owned = ownedCount(team);
        var tier = gwoScaling.conquestBossTier(
          owned,
          teams,
          board.maxDist,
          board.stars.length
        );
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

    _.times(teams, function (team) {
      actTeam(team);
      actArmies(team);
    });
    actPlayerArmies();
    if (board.turns % 2 === 0) {
      rollFoes();
      rollAllies();
    }
    refreshScaling();

    return {
      steps: steps,
      events: events,
      conquest: {
        armySeq: armySeq,
        playerHeld: board.playerHeld,
        playerGrowth: board.playerGrowth,
        playerArmies: board.playerArmies,
      },
    };
  };

  return {
    planPhase: planPhase,
    growthTier: growthTier,
    pickArmyColour: pickArmyColour,
  };
});
