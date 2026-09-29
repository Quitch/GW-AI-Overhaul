// Taking a star's card, or none. See shadowing.md, "Function hijacking".
define(function () {
  return function (params) {
    var game = params.game;
    var helpers = params.helpers;
    var treasureUnlocks = params.treasureUnlocks;
    var dealCardToSelectableAI = params.dealCardToSelectableAI;
    var gwoSave = params.gwoSave;

    // A loadout won at a treasure planet unlocks the commander for later
    // wars and grants nothing in this one. Left in the inventory it would
    // read as tech held: cardsOfferedCount tests hasCard for the Lucky
    // Commander, so it would keep paying out an extra card every explore.
    // Returns the index to submit in place of the player's own.
    var bankWonLoadout = function (cardId, selectedCardIndex) {
      if (selectedCardIndex === -1 || !helpers.isStartLoadoutCardId(cardId)) {
        return selectedCardIndex;
      }

      treasureUnlocks.bankOwnLoadout({ id: cardId });
      return -1;
    };

    var playTechAcquired = function (techAudio) {
      api.audio.playSound(techAudio || "/VO/Computer/gw/board_tech_acquired");
    };

    var submitViewerChoice = function (selectedCardIndex) {
      var techCard = model.currentSystemCardList()[selectedCardIndex];
      var techAudio =
        techCard && techCard.audio() ? techCard.audio().found : null;
      // Every loadout id, not just the ones the server misfiles: banking
      // is held for the whole scene on a viewer, so the server's own
      // GW.bank.addStartCard would be suppressed along with the rest.
      var submittedIndex = bankWonLoadout(
        techCard && techCard.id(),
        selectedCardIndex
      );

      return model.submitCoopTechCardChoice(submittedIndex).then(
        function () {
          playTechAcquired(techAudio);
        },
        function (reason) {
          console.error(
            "[GW COOP] failed to acquire co-op tech choice: " + reason
          );
          return $.Deferred().reject(reason).promise();
        }
      );
    };

    // call dealCardToSelectableAI() so systems' cards update when player acquires a card
    model.win = function (selectedCardIndex) {
      var resolveExitGate = function () {
        model.exitGate().resolve();
      };

      if (
        model.canUseCoopTechChoice() &&
        model.isCampaignViewer() &&
        !model.gwCampaignReplayingAction
      ) {
        return submitViewerChoice(selectedCardIndex);
      }

      if (model.isCampaignViewer() && !model.gwCampaignReplayingAction) {
        return;
      }

      if (!model.gwCampaignReplayingAction) {
        model.sendCampaignAction("win_choice", {
          selected_card_index: selectedCardIndex,
        });
      }

      var actionCardList = model.currentSystemActionCardList();
      if (
        selectedCardIndex !== -1 &&
        (!actionCardList || !actionCardList[selectedCardIndex])
      ) {
        console.error(
          "[GW COOP] Cannot apply win choice without current system card data."
        );
        return;
      }

      model.exitGate($.Deferred());

      var techCard = actionCardList && actionCardList[selectedCardIndex];
      var techAudio =
        techCard && techCard.audio() ? techCard.audio().found : null;
      var playTechAudio = !!techCard;
      // winTurn(-1) still clears the star and ends the turn; it just adds
      // nothing to the inventory.
      var wonIndex = bankWonLoadout(
        techCard && techCard.id(),
        selectedCardIndex
      );

      return game
        .winTurn(wonIndex)
        .then(function (didWin) {
          if (!didWin) {
            console.error("Failed winning turn at star " + game.currentStar());
            return $.Deferred().reject("Failed winning turn").promise();
          }

          if (model.isCampaignViewer()) {
            model.syncViewerStarsFromGame("win_applied");
          }

          model.maybePlayCaptureSound();

          return dealCardToSelectableAI(true, game.turnState());
        })
        .then(function () {
          return gwoSave(game, true);
        })
        .then(function () {
          if (model.gameOver()) {
            // always, so a failed stat write still opens the gate.
            api.tally.incStatInt("gw_war_victory").always(resolveExitGate);
          } else {
            resolveExitGate();

            if (playTechAudio) {
              playTechAcquired(techAudio);
            }
          }
        });
    };
  };
});
