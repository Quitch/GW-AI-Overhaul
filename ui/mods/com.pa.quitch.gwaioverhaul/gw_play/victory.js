// Ending a won war the moment the last boss falls. gw_game.js's winTurn wins the
// war in its fight branch but leaves the turn on "begin", and gw_play.js only
// opens gw_war_over once the turn reaches "end" - which nothing but exploring the
// star and taking a card ever does.
define(function () {
  var warEndOperator = "gwo_war_end";

  var factory = function (params) {
    var game = params.game;
    var gwoSettings = params.gwoSettings;
    var treasure = params.treasure;
    var ended = false;

    var onTreasureStar = function () {
      var star = game.currentStar();

      if (gwoSettings && _.isNumber(gwoSettings.treasureStar)) {
        return treasure.isTreasureStar(gwoSettings, star);
      }

      // bugfixes.js records the index for a war generated before it existed, but
      // does so asynchronously, so this cannot wait on it having run.
      return treasure.findTreasureStar(game.galaxy().stars()) === star;
    };

    var perPlayerTech = function () {
      return !!model.gwCampaignPerPlayerTechCards();
    };

    var guardiansStillOweALoadout = function () {
      return (
        onTreasureStar() &&
        treasure.anyPlayerCanUnlockLoadout({
          localUnlockedIds: treasure.localUnlockedLoadoutIds(
            params.stockBank,
            params.gwoBank
          ),
          records: _.isFunction(game.coopPlayerInventoryData)
            ? game.coopPlayerInventoryData()
            : [],
          perPlayerTech: perPlayerTech(),
        })
      );
    };

    var warWon = function () {
      return !ended && game.gameState() === "won" && game.turnState() !== "end";
    };

    var endWar = function () {
      if (!warWon()) {
        return;
      }
      ended = true;

      // gw_play.js's gameOverCHeck reads the gate the instant gameOver() flips,
      // and the gate it installs is already resolved, so replacing it has to come
      // first or the scene changes before the war is saved.
      model.exitGate($.Deferred());
      game.turnState("end");

      $.when(params.save(game, true)).always(function () {
        // always, so a failed stat write still opens the gate.
        api.tally.incStatInt("gw_war_victory").always(function () {
          model.exitGate().resolve();
        });
      });
    };

    // Only the host holds every player's unlock record, so only the host decides.
    var endWarIfWon = function () {
      if (
        model.isCampaignViewer() ||
        !warWon() ||
        guardiansStillOweALoadout()
      ) {
        return;
      }

      model.sendCampaignHostOperator(warEndOperator, {});
      endWar();
    };

    model.registerCampaignHostOperatorHandler(warEndOperator, endWar);

    game.gameState.subscribe(function () {
      // defeatTeam wins the war from inside winTurn, which sets the turn back to
      // "begin" immediately afterwards.
      _.defer(endWarIfWon);
    });

    _.defer(endWarIfWon);

    return { endWar: endWar, endWarIfWon: endWarIfWon };
  };

  return factory;
});
