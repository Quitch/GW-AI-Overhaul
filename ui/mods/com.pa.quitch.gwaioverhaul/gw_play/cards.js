var gwoCardsLoaded;

function gwoCard() {
  var game = model.game();

  if (gwoCardsLoaded || game.isTutorial()) {
    return;
  }

  gwoCardsLoaded = true;

  try {
    // Allow tech cards to be deleted at any time
    $("#hover-card").replaceWith(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_inventory.html"
      )
    );
    locTree($("#hover-card"));

    // Used by cards checking for T2 access - global for modders
    model.gwoCardsGrantingAdvancedTech = _.isArray(
      model.gwoCardsGrantingAdvancedTech
    )
      ? model.gwoCardsGrantingAdvancedTech
      : [];
    model.gwoCardsGrantingAdvancedTech.push(
      "gwc_enable_air_all",
      "gwc_enable_bots_all",
      "gwc_enable_sea_all",
      "gwc_enable_vehicles_all",
      "gwaio_upgrade_fabricationaircraft",
      "gwaio_upgrade_fabricationbot",
      "gwaio_upgrade_fabricationship",
      "gwaio_upgrade_fabricationvehicle",
      "gwaio_start_hoarder"
    );

    var numCardsToOffer = 3;
    // Pure deal helpers (cards_deal_helpers.js), assigned at the top of the main
    // requireGW below. Only referenced from function/computed bodies that run after
    // that load resolves - never synchronously during scene setup.
    var helpers;

    var currentCoopPendingTechCards = function () {
      if (
        model.currentCoopPendingTechCards &&
        model.canChooseCoopTechCards &&
        model.canChooseCoopTechCards()
      ) {
        return model.currentCoopPendingTechCards();
      }

      return undefined;
    };

    model.rerollTech = function () {
      var pendingTechCards = currentCoopPendingTechCards();
      if (pendingTechCards) {
        if (
          helpers.pendingCardsContainLoadout(pendingTechCards) ||
          !model.sendCampaignViewerOperator ||
          !model.gwCampaignConnected() ||
          model.gwoRerollPending()
        ) {
          return;
        }

        model.gwoRerollPending(true);
        model.scanning(true);
        model.sendCampaignViewerOperator(
          "gwo_reroll_pending_tech",
          {
            star: pendingTechCards.star,
            deal_index: pendingTechCards.dealIndex,
          },
          {
            request_id: _.uniqueId("gwo_reroll_"),
          }
        );
        return;
      }

      var cardsOffered = helpers.cardsOfferedCount(
        numCardsToOffer,
        game.inventory()
      );
      var star = game.galaxy().stars()[game.currentStar()];
      model.gwoRerollsUsed(model.gwoRerollsUsed() + 1);
      if (model.gwoRerollsUsed() >= cardsOffered - 1) {
        model.gwoOfferRerolls(false);
      }
      star.cardList([]);
      game.turnState("begin");
      model.explore(true);
    };

    var setupTechRerolls = function () {
      model.gwoOfferRerolls = ko.observable(true);
      model.gwoRerollPending = ko.observable(false);
      model.gwoRerollsUsed = ko
        .observable(0)
        .extend({ session: "gwo_rerolls_used" }); // prevent UI refresh exploits

      // Clean start for new games in a single session
      if (game.turnState() === "begin") {
        model.gwoRerollsUsed(0);
      }
      // Avoid incorrect rerolls when loading an exploration save game
      else if (game.turnState() === "explore") {
        var star = game.galaxy().stars()[game.currentStar()];
        model.gwoRerollsUsed = ko.observable(
          numCardsToOffer - star.cardList().length
        );
        if (
          model.gwoRerollsUsed() >= numCardsToOffer - 1 ||
          (self.isLoadout && self.isLoadout())
        ) {
          model.gwoOfferRerolls(false);
        }
      }

      ko.computed(function () {
        if (game.turnState() === "end") {
          model.gwoRerollsUsed(0);
          model.gwoOfferRerolls(true);
          model.gwoRerollPending(false);
        }
      });

      var coopPendingRerollKey = "";
      ko.computed(function () {
        var pendingTechCards = currentCoopPendingTechCards();
        if (!pendingTechCards) {
          model.gwoRerollPending(false);
          coopPendingRerollKey = "";
          return;
        }

        // This computed evaluates eagerly on creation (before the main requireGW
        // assigns `helpers`), but only reaches helpers when pending co-op tech cards
        // exist - which cannot happen that early. Guard defensively regardless; the
        // read above already established the observable subscriptions.
        if (!helpers) {
          return;
        }

        var key = [
          pendingTechCards.star,
          pendingTechCards.dealIndex,
          pendingTechCards.updatedAt,
          pendingTechCards.cardsOffered,
          pendingTechCards.rerollsUsed,
          pendingTechCards.cards && pendingTechCards.cards.length,
        ].join("|");
        if (key === coopPendingRerollKey) {
          return;
        }

        coopPendingRerollKey = key;
        var cardsOffered = _.isNumber(pendingTechCards.cardsOffered)
          ? pendingTechCards.cardsOffered
          : Math.max(numCardsToOffer, pendingTechCards.cards.length);
        var rerollsUsed = _.isNumber(pendingTechCards.rerollsUsed)
          ? pendingTechCards.rerollsUsed
          : Math.max(0, cardsOffered - pendingTechCards.cards.length);
        model.gwoRerollsUsed(rerollsUsed);
        model.gwoOfferRerolls(
          !helpers.pendingCardsContainLoadout(pendingTechCards) &&
            rerollsUsed < cardsOffered - 1
        );
        model.gwoRerollPending(false);
      });

      $(".div_options_bar").replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system_reroll.html"
        )
      );
      locTree($(".div_options_bar"));
    };
    setupTechRerolls();

    // modified to recognise mod loadouts
    globals.CardViewModel = function (params) {
      var self = this;

      self.params = ko.observable(params);
      self.id = ko.computed(function () {
        var p = self.params();
        return _.isObject(p) ? p.id : p;
      });

      self.visible = ko.observable(false);
      self.desc = ko.observable();
      self.locDesc = ko.computed(function () {
        return loc(self.desc());
      });
      self.summary = ko.observable();
      self.icon = ko.observable();
      self.iconPlaceholder = ko.observable(); // Displayed when the icon is empty
      self.audio = ko.observable();

      self.isEmpty = ko.computed(function () {
        return !self.id();
      });
      // Recognise loadouts introduced by mods as loadouts
      self.isLoadout = ko.computed(function () {
        return _.includes(self.id(), "_start_");
      });

      var completed = $.Deferred();
      self.card = completed.promise();

      var loadCard = function (card, data) {
        if (_.isEmpty(card)) {
          self.desc(
            "!LOC:Data Bank holds one Tech. Explore systems to find new Tech."
          );
          self.summary("!LOC:Empty Data Bank");
          self.icon(
            "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_empty.png"
          );
          self.iconPlaceholder(undefined);
          self.visible(true);
        } else {
          self.desc(card.describe && card.describe(data));
          self.summary(card.summarize && card.summarize(data));
          self.icon(card.icon && card.icon(data));
          self.iconPlaceholder(!self.icon() && (self.summary() || self.desc()));
          self.audio(card.audio && card.audio(data));
          self.visible(
            card.visible === true || !!(card.visible && card.visible(data))
          );
        }
        completed.resolve(card);
      };

      var loadToken = 0;
      ko.computed(function () {
        var data = self.params();
        ++loadToken;
        var myToken = loadToken;
        var cardId = self.id();
        if (cardId) {
          requireGW(["cards/" + cardId], function (card) {
            if (loadToken !== myToken) {
              return;
            }
            loadCard(card, data);
          });
        } else {
          loadCard({}, data);
        }
      });
    };

    requireGW(
      [
        "shared/gw_common",
        "shared/gw_factions",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
        "shared/gw_inventory",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_card_name_sync.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_reroll.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_cheats.js",
      ],
      function (
        GW,
        GWFactions,
        gwoAI,
        gwoSave,
        gwoBank,
        GWInventory,
        gwoDeal,
        cardsDealHelpers,
        cardsCardNameSync,
        cardsCoopDeal,
        cardsCoopReroll,
        cardsCheats
      ) {
        helpers = cardsDealHelpers;
        var inventory = game.inventory();
        var playerFaction = inventory.getTag("global", "playerFaction");
        var galaxy = game.galaxy();
        var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

        // Registers the gwo_sync_star_card_name host handler; returns setCardName,
        // used by the AI-dealing path below to name each star after its tech card.
        var cardNameSync = cardsCardNameSync({ game: game });

        /* Start of GWO implementation of GWDealer */

        model.gwoCards = gwoDeal.setupGwoCards(gwoSettings);

        var cards = [];
        var deck = [];
        var numberOfCards = model.gwoCards.length;
        var loaded = $.Deferred();

        gwoDeal.setupGwoDeck(cards, deck, numberOfCards, loaded);

        // dealer.chooseCards() replacement - use our deck
        var chooseCards = function (params) {
          var rng = params.rng || new Math.seedrandom();
          var count = params.count;
          var star = params.star;
          var dealAddSlot = params.addSlot;
          var systemCards = params.systemCards;
          var dealInventory = params.inventory || inventory;
          var cardContexts = {};

          // One iteration of the deal loop below, pulled out of the nested
          // loaded.then/_.times callbacks (and passed to _.times by reference) so its
          // own map/filter/reduce callbacks don't sit six function-levels deep.
          // `list` is the accumulating result array, threaded in explicitly because it
          // lives inside the loaded.then closure rather than at this scope.
          var dealOneCard = function (list) {
            var fullHand = _.map(cards, function (card) {
              var context = cardContexts[card.id];
              var cardChance =
                card.deal && card.deal(star, context, dealInventory);
              var match = helpers.doNotDealCard(
                dealInventory,
                card,
                list,
                dealAddSlot,
                false,
                systemCards
              );

              if (match) {
                cardChance.chance = 0;
              }

              return cardChance;
            });

            fullHand = _.map(fullHand, function (deal, i) {
              deal.index = i;
              return deal;
            });

            var hand = _.filter(fullHand, function (deal) {
              return !!deal && !!deal.chance;
            });

            if (hand.length) {
              var resultIndex;

              var probability = _.reduce(
                hand,
                function (sum, card) {
                  return sum + card.chance;
                },
                0
              );
              var roll = rng() * probability;
              var index = 0;
              for (
                ;
                index < hand.length && roll >= hand[index].chance;
                ++index
              ) {
                roll -= hand[index].chance;
              }
              if (index < hand.length) {
                resultIndex = hand[index].index;
              }

              if (!_.isUndefined(resultIndex)) {
                var resultDeal = fullHand[resultIndex];
                var cardParams = resultDeal && resultDeal.params;
                var cardId = deck[resultIndex];
                var systemCard = {
                  id: cardId,
                };

                if (cardParams && _.isPlainObject(cardParams)) {
                  _.assign(systemCard, cardParams);
                }

                list.push(systemCard);
              }
            }
          };

          var result = $.Deferred();
          loaded.then(function () {
            _.forEach(cards, function (card) {
              if (card.getContext && !cardContexts[card.id]) {
                cardContexts[card.id] = card.getContext(galaxy, dealInventory);
              }
            });

            var list = [];

            _.times(count, dealOneCard.bind(null, list));

            result.resolve(list);
          });
          return result;
        };

        // Installs model.dealCoopPlayerPendingTechCards - the host-side co-op pending
        // tech deal path (GWO's bonus-card-aware override of stock gw_play.js).
        cardsCoopDeal({
          game: game,
          chooseCards: chooseCards,
          helpers: helpers,
          GWInventory: GWInventory,
          numCardsToOffer: numCardsToOffer,
        });

        // Registers the co-op pending-tech reroll operator handlers (viewer request +
        // host result) and their host-side deal logic.
        cardsCoopReroll({
          game: game,
          galaxy: galaxy,
          chooseCards: chooseCards,
          helpers: helpers,
          GWInventory: GWInventory,
          numCardsToOffer: numCardsToOffer,
          gwoSave: gwoSave,
          GW: GW,
        });

        var dealCardToSelectableAI = function (win, turnState) {
          if (model.isCampaignViewer()) {
            return $.when().promise(); // already resolved jQuery promise
          }

          var deferred = $.Deferred();

          // Avoid running twice after winning a fight
          if (!win || turnState === "end") {
            var deferredQueue = [];

            _.forEach(model.galaxy.systems(), function (system, starIndex) {
              var ai = system.star.ai();
              var treasurePlanet = ai && ai.treasurePlanet;
              var loadoutPresent =
                treasurePlanet &&
                !_.isEmpty(system.star.cardList()) &&
                helpers.isStartLoadoutCardId(system.star.cardList()[0].id);
              var validForDeal =
                gwoSettings && gwoSettings.staticTech
                  ? _.isEmpty(system.star.cardList())
                  : true;
              if (
                model.canSelect(starIndex) &&
                ai &&
                !loadoutPresent &&
                validForDeal
              ) {
                deferredQueue.push(
                  chooseCards({
                    count: 1,
                    star: system.star,
                    addSlot: false,
                    systemCards:
                      system.star && _.isFunction(system.star.cardList)
                        ? system.star.cardList()
                        : [],
                  }).then(function (card) {
                    system.star.cardList(card);
                    model.sendCampaignAction("sync_star_cards", {
                      star: starIndex,
                      cards: system.star.cardList(),
                    });
                    return cardNameSync.setCardName(system, card, starIndex);
                  })
                );
              }
            });

            // $.when() doesn't wait for setCardName() to return
            Promise.all(deferredQueue).then(function () {
              deferred.resolve();
            });
          } else {
            deferred.resolve();
          }

          return deferred.promise();
        };

        requireGW(
          [
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_start_subcdr.js",
          ],
          function (cardsStartSubcdr) {
            var setupGeneralCommander = cardsStartSubcdr({
              game: game,
              gwoSettings: gwoSettings,
              playerFaction: playerFaction,
              inventory: inventory,
            });
            setupGeneralCommander();
          }
        );

        var dealCardToSelectableAIWhenWarStarts = function (settings) {
          if (settings && !settings.firstDealComplete) {
            settings.firstDealComplete = true;
            dealCardToSelectableAI(false).then(function () {
              gwoSave(game, true);
            });
          }
        };
        dealCardToSelectableAIWhenWarStarts(gwoSettings);

        /* end of GWO implementation of GWDealer */

        // Installs model.cheats.testCards / model.cheats.giveCard - dev cheats that deal
        // from GWO's own deck.
        cardsCheats({
          game: game,
          galaxy: galaxy,
          inventory: inventory,
          gwoSettings: gwoSettings,
          playerFaction: playerFaction,
          gwoDeal: gwoDeal,
          gwoAI: gwoAI,
          GWFactions: GWFactions,
          gwoSave: gwoSave,
          cards: cards,
          loaded: loaded,
          dealCardToSelectableAI: dealCardToSelectableAI,
          helpers: helpers,
        });

        // gw_play self.explore - call our chooseCards()
        model.explore = function (force) {
          if (
            !game ||
            !game.explore() ||
            (model.isCampaignViewer() && !model.gwCampaignReplayingAction) ||
            // For normal player-triggered exploration, block if co-op players
            // are still selecting loadouts or pending tech cards. For a host
            // reroll, force the correct deal path even while that state is set.
            (_.isUndefined(force) && model.gwCampaignPlayerSetupBlocked())
          ) {
            return;
          }

          if (!model.gwCampaignReplayingAction) {
            model.sendCampaignAction("explore", { star: game.currentStar() });
          }

          model.scanning(true);

          api.audio.playSound("/VO/Computer/gw/board_exploring");

          var cardsOffered = helpers.cardsOfferedCount(
            numCardsToOffer,
            inventory
          );
          var star = game.galaxy().stars()[game.currentStar()];
          var startLoadoutCards = helpers.filterStartLoadoutCards(
            star && _.isFunction(star.cardList) ? star.cardList() : []
          );
          var dealStarCards = chooseCards({
            count:
              cardsOffered - model.gwoRerollsUsed() - star.cardList().length,
            star: star,
            systemCards: star.cardList(),
          }).then(function (result) {
            var ok = true;

            _.forEach(star.cardList(), function (card) {
              if (
                helpers.isStartLoadoutCardId(card.id) &&
                !GW.bank.hasStartCard(card) &&
                !gwoBank.hasStartCard(card)
              ) {
                ok = false;
              }
            });

            if (ok) {
              // Combine the deal with pre-dealt system card
              var cardList = result.concat(star.cardList());
              star.cardList(cardList);
            }

            if (!model.gwCampaignReplayingAction) {
              model.sendCampaignAction("sync_star_cards", {
                star: game.currentStar(),
                cards: star.cardList(),
              });
            }

            var dealEntry;

            if (
              force !== true &&
              (ok || startLoadoutCards.length) &&
              _.isArray(star.cardList()) &&
              star.cardList().length &&
              game &&
              _.isFunction(game.recordHostTechCardDeal)
            ) {
              dealEntry = game.recordHostTechCardDeal(game.currentStar(), {
                startLoadoutCards: startLoadoutCards,
              });
            }

            if (!dealEntry) {
              return $.Deferred().resolve([]).promise();
            }

            return model.dealCoopPlayerPendingTechCards(
              game.currentStar(),
              star,
              {
                dealIndex: dealEntry && dealEntry.dealIndex,
                startLoadoutCards: startLoadoutCards,
              }
            );
          });

          // Return the chain so the base campaign queue can order it. The 2s
          // cosmetic scanning delay is scheduled but not awaited - it must not
          // hold the queue.
          return $.when(dealStarCards).then(
            function () {
              if (
                model.currentSystemCardList() &&
                model.currentSystemCardList()[0] &&
                model.currentSystemCardList()[0].isLoadout()
              ) {
                model.gwoOfferRerolls(false);
              }
              _.delay(function () {
                model.scanning(false);
              }, 2000);
              return gwoSave(game, false);
            },
            function (reason) {
              console.error(
                "[GW COOP] failed to deal co-op player pending tech cards: " +
                  reason
              );
              model.scanning(false);
              return $.Deferred().reject(reason).promise();
            }
          );
        };

        // call dealCardToSelectableAI() so systems' cards update when player acquires a card
        model.win = function (selectedCardIndex) {
          if (
            model.canUseCoopTechChoice() &&
            model.isCampaignViewer() &&
            !model.gwCampaignReplayingAction
          ) {
            var tech_card = model.currentSystemCardList()[selectedCardIndex];
            var tech_audio =
              tech_card && tech_card.audio() ? tech_card.audio().found : null;

            return model.submitCoopTechCardChoice(selectedCardIndex).then(
              function () {
                if (tech_audio) {
                  api.audio.playSound(tech_audio);
                } else {
                  api.audio.playSound("/VO/Computer/gw/board_tech_acquired");
                }
              },
              function (reason) {
                console.error(
                  "[GW COOP] failed to acquire co-op tech choice: " + reason
                );
                return $.Deferred().reject(reason).promise();
              }
            );
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

          return game.winTurn(selectedCardIndex).then(function (didWin) {
            if (!didWin) {
              console.error("Failed winning turn", game);
              return $.Deferred().reject("Failed winning turn").promise();
            }

            if (model.isCampaignViewer()) {
              model.syncViewerStarsFromGame("win_applied");
            }

            model.maybePlayCaptureSound();

            return dealCardToSelectableAI(true, game.turnState())
              .then(function () {
                return gwoSave(game, true);
              })
              .then(function () {
                if (model.gameOver()) {
                  api.tally.incStatInt("gw_war_victory").always(function () {
                    model.exitGate().resolve();
                  });
                } else {
                  model.exitGate().resolve();

                  if (playTechAudio) {
                    if (techAudio) {
                      api.audio.playSound(techAudio);
                    } else {
                      api.audio.playSound(
                        "/VO/Computer/gw/board_tech_acquired"
                      );
                    }
                  }
                }
              });
          });
        };
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoCard();
