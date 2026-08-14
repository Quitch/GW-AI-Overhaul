// The Galactic Conquest turn driver: runs the AI phase once the player's
// turn is resolved - after the fight and/or explore the move demands, and
// never before - blocks input while it does, and carries the loss and
// elimination rules a Conquest war changes. A factory in victory.js's style
// so the logic stays measurable; gw_play/conquest.js instantiates it with
// the live scene objects.
//
// The phase runs on the host and on every co-op viewer alike: a viewer's
// applyCampaignAction calls the same wrapped verbs, so the deterministic
// planner reproduces the host's phase locally. Only the host's save
// persists. It must not consult gwCampaignReplayingAction, which is cleared
// before async work completes. See docs/conquest.md.
define([], function () {
  var factory = function (params) {
    var game = params.game;
    var cfg = params.cfg;

    var currentStarAi = function () {
      return game.galaxy().stars()[game.currentStar()].ai();
    };

    var buildBoard = function () {
      var galaxy = game.galaxy();
      return {
        turns: game.stats().turns(),
        playerStar: game.currentStar(),
        treasureStar: params.gwoSettings.treasureStar,
        maxDist: cfg.maxDist,
        neighbors: galaxy.neighborsMap(),
        stars: _.map(galaxy.stars(), function (star) {
          return {
            // Cloned so the planner never mutates live state: a failed phase
            // leaves the board untouched and the re-run reproduces it.
            ai: star.ai() ? _.cloneDeep(star.ai()) : null,
            explored: !!star.explored(),
            visited: star.history().length > 0,
          };
        }),
      };
    };

    var applyWrites = function (step) {
      var stars = game.galaxy().stars();
      _.forEach(step.writes || [], function (entry) {
        stars[entry.star].ai(entry.ai === null ? undefined : entry.ai);
      });
      _.forEach(step.clearCards || [], function (starIndex) {
        stars[starIndex].cardList([]);
      });
    };

    var applySteps = function (steps, done) {
      var next = function (index) {
        if (index >= steps.length) {
          done();
          return;
        }
        var step = steps[index];
        var proceed = function () {
          applyWrites(step);
          next(index + 1);
        };
        if (step.kind === "move" && params.animate) {
          params.animate(step, proceed);
        } else {
          proceed();
        }
      };
      next(0);
    };

    var announce = function (teams) {
      if (teams.length && params.announce) {
        params.announce(teams);
      }
    };

    var phaseRunning = false;

    // The turn resolves once the player's star demands nothing: any AI but
    // the Guardians must be fought (an occupied star cannot be explored, so
    // the fight alone settles it), and an unexplored star must be explored.
    // The Guardians never trap the player - retreat from the treasure star
    // stays legal - and never carry a stacked boss (actTeam's treasure-star
    // exemption), so the foes check is belt and braces.
    var turnResolved = function () {
      var star = game.galaxy().stars()[game.currentStar()];
      var ai = star.ai();
      if (ai) {
        return !!ai.mirrorMode && !_.some(ai.foes || [], "boss");
      }
      return !!star.explored();
    };

    // Runs the phase exactly once per turn, and only after the turn is
    // resolved: the marker persists with the save, so a battle's scene
    // teardown or a crash mid-phase re-runs it from identical state - the
    // planner is deterministic, so with an identical outcome. Doubles as the
    // no-op path when move() rejected the click.
    var runPhaseIfDue = function () {
      var turns = game.stats().turns();
      if (
        phaseRunning ||
        cfg.lastAiPhaseTurn >= turns ||
        game.gameState() !== "active" ||
        !turnResolved()
      ) {
        return undefined;
      }
      phaseRunning = true;
      params.aiPhase(true);
      var finished = $.Deferred();

      var finish = function () {
        params.aiPhase(false);
        phaseRunning = false;
        finished.resolve();
      };

      try {
        var result = params.engine.planPhase(buildBoard(), {
          warRng: params.warRng,
          streams: params.streams,
          builder: params.builder,
          alliesSuppressed: params.alliesSuppressed,
          cfg: cfg,
        });
        applySteps(result.steps, function () {
          // An ambushing boss landed after the turn resolved: canFight needs
          // 'begin' and the resolved lock withholds the jump, so reopen the
          // turn. Before the save - the saved state must be fightable too.
          if (currentStarAi()) {
            game.turnState("begin");
          }
          cfg.lastAiPhaseTurn = turns;
          $.when(params.save(game, true)).always(function () {
            announce(_.map(result.events, "team"));
            finish();
          });
        });
      } catch (error) {
        console.error("Conquest AI phase failed");
        console.error(error && (error.stack || error.message || error));
        finish();
      }
      return finished;
    };

    // Covers the move that lands on an already-resolved star - and, on a
    // viewer, the replayed one. The original promise is extended, not
    // replaced, so the co-op action queue orders on the phase completing
    // everywhere.
    var baseMove = model.move;
    model.move = function () {
      var moved = baseMove.apply(model, arguments);
      return $.when(moved)
        .then(runPhaseIfDue)
        .then(function () {
          return moved;
        });
    };

    // The in-scene resolutions: the explore pick and a viewer's replayed
    // battle win. The host's own battle results land before scene mods load;
    // the install-time defer covers those. Extended, not replaced, as above.
    var baseWinTurn = game.winTurn;
    game.winTurn = function () {
      var won = baseWinTurn.apply(game, arguments);
      return $.when(won).then(function (result) {
        return $.when(runPhaseIfDue()).then(function () {
          return result;
        });
      });
    };

    // One hop per turn - a longer path costs the game several turns in one
    // click, which Conquest's you-then-them rhythm cannot allow - and none
    // at all until the destination is resolved.
    var baseCanMove = model.canMove;
    model.canMove = ko.computed(function () {
      if (params.aiPhase() || !turnResolved()) {
        return false;
      }
      var path = baseCanMove();
      return path && path.length === 2 ? path : false;
    });

    // Gating canFight/canExplore rather than the display computeds: those
    // re-read these by property on every evaluation, so the gate takes hold
    // whether or not the bindings captured the display computeds first.
    _.forEach(["canFight", "canExplore"], function (name) {
      var base = model[name];
      model[name] = ko.computed(function () {
        return !params.aiPhase() && !!base();
      });
    });

    // Losing against a faction boss loses the war outright. Guardians and
    // garrisons keep the stock retreat. Read before the base call: loseTurn
    // rewinds currentStar and clears the star's history.
    var baseLoseTurn = game.loseTurn;
    game.loseTurn = function () {
      var ai = currentStarAi();
      var facedFactionBoss = !!(ai && ai.boss && !ai.mirrorMode);
      var result = baseLoseTurn.apply(game, arguments);
      if (facedFactionBoss) {
        game.gameState("lost");
      }
      // A retreat rewinds to a star that was resolved to be left, so the
      // consumed turn's phase runs now; a lost war skips it via the guard.
      runPhaseIfDue();
      return result;
    };

    // Conquest elimination: no foe inheritance (a foe carrying the dead
    // ai.team would corrupt ownership tracking), and every boss stacked on
    // the fought star died in the same battle, so their teams fall too.
    // owners maps stars to the teams holding them when the fight launched:
    // reconciliation needs it because stock defeatTeam has already wiped
    // the dead team's ai but left its cards.
    var eliminate = function (foughtAi, defeatedTeam, owners) {
      api.tally.incStatInt("gw_eliminate_faction");

      var defeated = [defeatedTeam];
      _.forEach((foughtAi && foughtAi.foes) || [], function (foe) {
        if (foe.boss && !_.includes(defeated, foe.team)) {
          defeated.push(foe.team);
        }
      });

      var ownedByDefeated = function (index) {
        return (
          owners &&
          _.isNumber(owners[index]) &&
          _.includes(defeated, owners[index])
        );
      };

      var stripDefeatedBossFoes = function (star, ai) {
        if (!ai.foes) {
          return;
        }
        var survivors = _.filter(ai.foes, function (foe) {
          return !(foe.boss && _.includes(defeated, foe.team));
        });
        if (survivors.length === ai.foes.length) {
          return;
        }
        if (survivors.length) {
          ai.foes = survivors;
        } else {
          delete ai.foes;
        }
        star.ai(ai);
      };

      var remainingBosses = 0;
      _.forEach(game.galaxy().stars(), function (star, index) {
        var ai = star.ai();
        if (!ai) {
          if (ownedByDefeated(index)) {
            star.cardList([]);
          }
          return;
        }
        var guardians = !!ai.mirrorMode;
        // A beaten Guardians star matches on team undefined, as in the War
        // path, and keeps its cards - the loadout offer survives the fight.
        if (_.includes(defeated, ai.team)) {
          star.ai(undefined);
          if (!guardians) {
            star.cardList([]);
          }
          return;
        }
        stripDefeatedBossFoes(star, ai);
        ai = star.ai();
        if (ai && ai.boss) {
          ++remainingBosses;
        }
        _.forEach((ai && ai.foes) || [], function (foe) {
          if (foe.boss) {
            ++remainingBosses;
          }
        });
      });

      // The Guardians carry no team, and their defeat is not a faction's.
      announce(_.filter(defeated, _.isNumber));

      if (!remainingBosses) {
        game.gameState("won");
      }
    };

    game.defeatTeam = function (defeatedTeam) {
      eliminate(currentStarAi(), defeatedTeam);
      // Resolved in-scene, so the next install must not reconcile it again.
      delete cfg.pendingFight;
    };

    // gw_play.js applies lastBattleResult before scene mods load, so on the
    // host no wrap here ever sees a real battle's outcome. The launch stamp
    // records what was fought - self.fight saves right after game.fight() -
    // and the next install reconciles the result below.
    var baseFight = game.fight;
    game.fight = function () {
      var result = baseFight.apply(game, arguments);
      if (result) {
        cfg.pendingFight = {
          star: game.currentStar(),
          turn: game.stats().turns(),
          ai: _.cloneDeep(currentStarAi()),
          owners: _.map(game.galaxy().stars(), function (star) {
            var ai = star.ai();
            return ai && _.isNumber(ai.team) ? ai.team : null;
          }),
        };
      }
      return result;
    };

    // Replays the Conquest rules the stock battle-result path skipped: a
    // loss to a faction boss loses the war, a boss win runs the Conquest
    // elimination. Runs before the phase defer so the planner and the
    // gameState guard see the reconciled board.
    var reconcilePendingFight = function () {
      var pending = cfg.pendingFight;
      if (!pending) {
        return;
      }
      var foughtStarAi = game.galaxy().stars()[pending.star].ai();
      var abandoned =
        game.currentStar() === pending.star &&
        game.turnState() === "fight" &&
        !!foughtStarAi;
      if (abandoned) {
        return;
      }
      delete cfg.pendingFight;
      var facedFactionBoss =
        (!!pending.ai.boss && !pending.ai.mirrorMode) ||
        _.some(pending.ai.foes || [], "boss");
      if (game.currentStar() !== pending.star) {
        // Stock loseTurn rewound the player.
        if (facedFactionBoss && game.gameState() === "active") {
          game.gameState("lost");
        }
      } else if (!foughtStarAi && pending.ai.boss) {
        // Stock winTurn cleared the star through stock defeatTeam.
        eliminate(pending.ai, pending.ai.team, pending.owners);
      }
      params.save(game, true);
    };

    reconcilePendingFight();

    // Covers scene entry after a battle or a crash mid-phase.
    _.defer(runPhaseIfDue);

    return {
      runPhaseIfDue: runPhaseIfDue,
      defeatTeam: game.defeatTeam,
    };
  };

  return factory;
});
