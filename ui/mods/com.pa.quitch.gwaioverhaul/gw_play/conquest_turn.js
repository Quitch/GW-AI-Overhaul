// The Galactic Conquest turn driver: runs the AI phase once the player ends
// their turn - the fight and/or explore the move demands, or the explicit
// Pass on a friendly system - blocks input while it does, and carries the
// loss and elimination rules a Conquest war changes. A factory in
// victory.js's style so the logic stays measurable; gw_play/conquest.js
// instantiates it with the live scene objects.
//
// The phase runs identically on the host and every co-op viewer, and must
// never consult gwCampaignReplayingAction. See docs/conquest.md.
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

    var announce = function (eliminations) {
      if (eliminations.length && params.announce) {
        params.announce(eliminations);
      }
    };

    var eliminationsOf = function (events) {
      return _.map(events, function (event) {
        return { team: event.team, byTeam: event.byTeam };
      });
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
    // resolved (cfg.lastAiPhaseTurn persists with the save; see
    // docs/conquest.md). Doubles as the no-op path when move() rejected the
    // click.
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
            announce(eliminationsOf(result.events));
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

    // Player traversal: a jump crosses only systems no AI holds. A jumped
    // boss (ai.conquestJumped) holds nothing - the star is still the
    // player's.
    var conquestTraversable = function (star) {
      var ai = star.ai();
      return !ai || !!ai.conquestJumped;
    };

    // A jump is one turn however many systems it crosses. The stock moveStep
    // advances the clock once per hop, so every hop short of the destination
    // is unwound inside its own game.move call - before the per-hop save -
    // and the whole transit nets one.
    var transitTo;
    var baseGameMove = game.move;
    game.move = function (destination) {
      var result = baseGameMove.apply(game, arguments);
      if (transitTo !== undefined && destination !== transitTo) {
        game.stats().turns(game.stats().turns() - 1);
      }
      return result;
    };

    // The base move() recomputes its route itself, so the traversal rule is
    // slipped under pathBetween for the synchronous call that plans the
    // transit; the hops it then walks are already fixed.
    var baseMove = model.move;
    model.move = function () {
      var galaxy = game.galaxy();
      var basePathBetween = galaxy.pathBetween;
      galaxy.pathBetween = function (from, to, noFog) {
        return basePathBetween.call(
          galaxy,
          from,
          to,
          noFog,
          conquestTraversable
        );
      };
      transitTo = model.selection.star();
      var moved;
      try {
        moved = baseMove.apply(model, arguments);
      } finally {
        galaxy.pathBetween = basePathBetween;
      }
      $.when(moved).always(function () {
        transitTo = undefined;
      });
      return moved;
    };

    var canPass = function () {
      return (
        !params.aiPhase() &&
        game.gameState() === "active" &&
        game.turnState() !== "fight" &&
        game.turnState() !== "explore" &&
        !model.player.moving() &&
        turnResolved()
      );
    };

    // Ends the turn by hand. A pass at rest opens a fresh turn; after a move
    // the clock is already ahead and the phase merely owed, which also makes
    // a repeated pass the safe retry after a failed phase. The action is sent
    // before the state changes; sendCampaignAction no-ops off-host.
    var pass = function () {
      if (!canPass()) {
        return undefined;
      }
      model.sendCampaignAction("gwo_conquest_pass", {});
      var turns = game.stats().turns();
      if (cfg.lastAiPhaseTurn >= turns) {
        game.stats().turns(turns + 1);
      }
      // 'end' marks the turn as ended for the install-time recovery; a plain
      // 'begin' is a move still awaiting its Pass, fight or explore.
      game.turnState("end");
      return runPhaseIfDue();
    };

    // The base rejects unknown campaign action types, so a viewer's pass
    // replay is intercepted ahead of it. The returned promise is what orders
    // the co-op action queue on the phase completing.
    var baseApplyCampaignAction = model.applyCampaignAction;
    model.applyCampaignAction = function (action) {
      if (action && action.type === "gwo_conquest_pass") {
        return $.when(pass());
      }
      return baseApplyCampaignAction.apply(model, arguments);
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

    // Movement is free through the player's own territory but earns nothing
    // until the turn is resolved, and nothing between the move and the Pass,
    // fight or explore that ends it. The stock computed carries the
    // viewer/moving/selection guards; the conquest route then narrows its
    // path to friendly intermediates. cfg.lastAiPhaseTurn is a plain value,
    // but every write to it precedes an aiPhase or turns write, so the
    // computed always re-reads it fresh.
    var baseCanMove = model.canMove;
    model.canMove = ko.computed(function () {
      if (
        params.aiPhase() ||
        !turnResolved() ||
        cfg.lastAiPhaseTurn < game.stats().turns()
      ) {
        return false;
      }
      if (!baseCanMove()) {
        return false;
      }
      return (
        game
          .galaxy()
          .pathBetween(
            game.currentStar(),
            model.selection.star(),
            model.cheats.noFog(),
            conquestTraversable
          ) || false
      );
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

    // gw_play.js's gameOverCHeck navigates through exitGate the instant
    // gameState turns lost, and the gate the scene opens with is already
    // resolved - victory.js gates the won path against the same hazard.
    // Resolves the captured gate, never the current one: that could be
    // victory.js's.
    var loseWar = function () {
      var gate = $.Deferred();
      model.exitGate(gate);
      game.gameState("lost");
      $.when(params.save(game, true)).always(function () {
        gate.resolve();
      });
    };

    // Losing against a faction boss loses the war outright. Guardians and
    // garrisons keep the stock retreat. Read before the base call: loseTurn
    // rewinds currentStar and clears the star's history.
    var baseLoseTurn = game.loseTurn;
    game.loseTurn = function () {
      var ai = currentStarAi();
      var facedFactionBoss = !!(ai && ai.boss && !ai.mirrorMode);
      var result = baseLoseTurn.apply(game, arguments);
      if (facedFactionBoss) {
        loseWar();
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
      // No byTeam: these fell to the player.
      announce(
        _.map(_.filter(defeated, _.isNumber), function (team) {
          return { team: team };
        })
      );

      if (!remainingBosses) {
        game.gameState("won");
      }
    };

    game.defeatTeam = function (defeatedTeam) {
      eliminate(currentStarAi(), defeatedTeam);
      // Resolved in-scene, so the next install must not reconcile it again.
      delete cfg.pendingFight;
    };

    // The host's battle outcomes are applied before scene mods load, so the
    // launch stamps what was fought and clears galaxy.saved - gw_play.js's
    // save, the next statement after this call, then carries the stamp to
    // disk for the next install to reconcile. See docs/conquest.md.
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
            // A jumped boss holds nothing - the star is still the player's.
            return ai && !ai.conquestJumped && _.isNumber(ai.team)
              ? ai.team
              : null;
          }),
        };
        game.saved(false);
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
        return false;
      }
      var foughtStarAi = game.galaxy().stars()[pending.star].ai();
      var abandoned =
        game.currentStar() === pending.star &&
        game.turnState() === "fight" &&
        !!foughtStarAi;
      if (abandoned) {
        return false;
      }
      delete cfg.pendingFight;
      // A save can carry a stamp with no ai. Throwing on one would fail
      // every load of that war: the stamp stays in the save until this
      // reconciliation completes and the save below rewrites it.
      var pendingAi = pending.ai || {};
      var facedFactionBoss =
        (!!pendingAi.boss && !pendingAi.mirrorMode) ||
        _.some(pendingAi.foes || [], "boss");
      if (game.currentStar() !== pending.star) {
        // Stock loseTurn rewound the player.
        if (facedFactionBoss && game.gameState() === "active") {
          loseWar();
          return true;
        }
      } else if (!foughtStarAi && pendingAi.boss) {
        // Stock winTurn cleared the star through stock defeatTeam.
        eliminate(pendingAi, pendingAi.team, pending.owners);
      }
      params.save(game, true);
      return true;
    };

    var reconciled = reconcilePendingFight();

    // Covers scene entry after a battle or a crash mid-phase. An unreconciled
    // 'begin' is a move still awaiting its Pass, fight or explore - the
    // phase is not owed, however the clock reads.
    if (reconciled || game.turnState() !== "begin") {
      _.defer(runPhaseIfDue);
    }

    return {
      runPhaseIfDue: runPhaseIfDue,
      defeatTeam: game.defeatTeam,
      canPass: canPass,
      pass: pass,
    };
  };

  return factory;
});
