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
    // cards_deal_helpers.js, assigned by the main requireGW below. Only read
    // from bodies that run after that load resolves.
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
      // setupTechRerolls injects the button before helpers is assigned, so a
      // click in that window reaches here first.
      if (!helpers) {
        return;
      }

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

        // Defensive: this computed evaluates eagerly on creation. The read
        // above has already established the observable subscriptions.
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

    // A save taken mid-exploration holds a short offer, so the spent rerolls are
    // recoverable from its length. Needs helpers for the bonus-aware offer size:
    // against the bare constant a 4-card offer yields -1 and the next reroll is free.
    var restoreExploreSaveRerolls = function () {
      if (game.turnState() !== "explore") {
        return;
      }

      var star = game.galaxy().stars()[game.currentStar()];
      var cardsOffered = helpers.cardsOfferedCount(
        numCardsToOffer,
        game.inventory()
      );
      model.gwoRerollsUsed(cardsOffered - star.cardList().length);
      if (model.gwoRerollsUsed() >= cardsOffered - 1) {
        model.gwoOfferRerolls(false);
      }
    };

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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_reroll.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_cheats.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js",
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
        cardsCoopStarCards,
        cardsCoopReroll,
        cardsCheats,
        gwoStreams,
        gwoTreasure
      ) {
        helpers = cardsDealHelpers;
        restoreExploreSaveRerolls();
        var inventory = game.inventory();
        var playerFaction = inventory.getTag("global", "playerFaction");
        var galaxy = game.galaxy();
        var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
        var warRng = gwoStreams.warRng(gwoSettings);

        // Also registers the gwo_sync_star_card_name host handler.
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
          // params.rng is the deal's stream, one sub-stream per card of the hand.
          // A caller with no stream keeps the unseeded draw it always had.
          var dealStream = params.rng;
          var unseeded = dealStream ? undefined : new Math.seedrandom();
          var count = params.count;
          var star = params.star;
          var dealAddSlot = params.addSlot;
          var systemCards = params.systemCards;
          var dealInventory = params.inventory || inventory;
          var cardContexts = {};

          // One iteration of the deal loop below. `list` accumulates in the
          // loaded.then closure; `iteration` keys this card's stream.
          var dealOneCard = function (list, iteration) {
            var iterationRng = gwoStreams.iterationRng(dealStream, iteration);
            var fullHand = _.map(cards, function (card) {
              var context = cardContexts[card.id];
              var cardChance =
                card.deal &&
                card.deal(
                  star,
                  context,
                  dealInventory,
                  gwoStreams.cardRng(iterationRng, card.id)
                );
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

            var resultIndex = helpers.chooseDealIndex(
              fullHand,
              iterationRng ? iterationRng() : unseeded()
            );
            if (_.isUndefined(resultIndex)) {
              return;
            }

            var resultDeal = fullHand[resultIndex];
            var cardParams = resultDeal && resultDeal.params;
            var systemCard = {
              id: deck[resultIndex],
            };

            if (cardParams && _.isPlainObject(cardParams)) {
              _.assign(systemCard, cardParams);
            }

            list.push(systemCard);
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

        // Deals each viewer their own card on every selectable AI star.
        var coopStarCards = cardsCoopStarCards({
          game: game,
          chooseCards: chooseCards,
          GWInventory: GWInventory,
          gwoStreams: gwoStreams,
          warRng: warRng,
          gwoBank: gwoBank,
          stockBank: GW.bank,
          gwoSettings: gwoSettings,
          gwoSave: gwoSave,
          gwoTreasure: gwoTreasure,
        });

        // Installs model.dealCoopPlayerPendingTechCards, overriding stock gw_play.js.
        cardsCoopDeal({
          game: game,
          chooseCards: chooseCards,
          helpers: helpers,
          GWInventory: GWInventory,
          numCardsToOffer: numCardsToOffer,
          gwoStreams: gwoStreams,
          warRng: warRng,
          gwoBank: gwoBank,
          stockBank: GW.bank,
          gwoTreasure: gwoTreasure,
          coopStarCards: coopStarCards,
          gwoSettings: gwoSettings,
        });

        // Reports a viewer's loadout unlocks to the host, which needs the mod
        // ones the base game's own record cannot carry, and holds a viewer's
        // banking closed against the host's inventory.
        var treasureUnlocks = gwoTreasure.install({
          game: game,
          stockBank: GW.bank,
          gwoBank: gwoBank,
        });

        // Registers the co-op reroll operator handlers, viewer and host.
        cardsCoopReroll({
          game: game,
          galaxy: galaxy,
          chooseCards: chooseCards,
          helpers: helpers,
          GWInventory: GWInventory,
          numCardsToOffer: numCardsToOffer,
          gwoSave: gwoSave,
          GW: GW,
          gwoStreams: gwoStreams,
          warRng: warRng,
          gwoBank: gwoBank,
          stockBank: GW.bank,
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
              // A treasure planet offers a loadout derived at exploration, so it
              // never carries a pre-dealt card.
              var treasurePlanet = gwoTreasure.isTreasureStar(
                gwoSettings,
                starIndex
              );
              var validForDeal =
                gwoSettings && gwoSettings.staticTech
                  ? _.isEmpty(system.star.cardList())
                  : true;
              if (
                model.canSelect(starIndex) &&
                ai &&
                !treasurePlanet &&
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
                    // Every selectable AI star is re-dealt each turn, so the
                    // turn count is what stops a star repeating its own card.
                    rng: gwoStreams.aiStarDealRng(
                      warRng,
                      starIndex,
                      game.stats().turns()
                    ),
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
            Promise.all(deferredQueue)
              .then(function () {
                // The one caller that replaces cards viewers already hold, so
                // their offers move exactly when the host's do.
                return coopStarCards.refresh({ redeal: true });
              })
              .then(function () {
                deferred.resolve();
              });
          } else {
            deferred.resolve();
          }

          return deferred.promise();
        };

        // The turn deal above covers the ordinary case. This covers a viewer
        // joining, and a rejoining viewer finishing its catch-up deals - neither
        // of which passes through a turn. It deliberately does not read
        // stats().turns(): a move must not disturb an offer already advertised.
        ko.computed(function () {
          model.gwCampaignConnectedClients();
          model.gwCampaignPlayerSetupBlocked();
          game.coopPlayerInventoryData();
          game.hostTechCardDealCount();
          coopStarCards.refresh();
        });

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

        // Installs model.cheats.testCards / model.cheats.giveCard.
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

        // Both banks: base game and GWO loadouts unlock into separate
        // localStorage records.
        var startCardUnlocked = function (card) {
          return GW.bank.hasStartCard(card) || gwoBank.hasStartCard(card);
        };

        // gw_play self.explore - call our chooseCards()
        model.explore = function (force) {
          // game.explore() advances turnState rather than querying it, so it must
          // stay below every guard that can refuse, or a refused call leaves the
          // star inert with no deal.
          if (model.isCampaignViewer() && !model.gwCampaignReplayingAction) {
            return;
          }

          // force is set for a host reroll, which must proceed even while co-op
          // players are still choosing.
          if (_.isUndefined(force) && model.gwCampaignPlayerSetupBlocked()) {
            return;
          }

          if (!game || !game.explore()) {
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
          var starIndex = game.currentStar();
          var star = game.galaxy().stars()[starIndex];

          // Deriving here rather than at war creation is what lets every player
          // be judged by their own unlock record. Writing the whole list also
          // clears the pre-dealt card a war generated before this carried.
          // A replaying viewer reads its own banks, so the host's card reaches
          // it through sync_star_cards instead.
          if (
            !model.gwCampaignReplayingAction &&
            star &&
            gwoTreasure.isTreasureStar(gwoSettings, starIndex)
          ) {
            var treasureLoadout = gwoTreasure.pickTreasureLoadout({
              isUnlocked: startCardUnlocked,
              rng: gwoStreams.treasureLoadoutRng(warRng, undefined, starIndex),
            });
            star.cardList(treasureLoadout ? [treasureLoadout] : []);
          }

          var startLoadoutCards = helpers.filterStartLoadoutCards(
            star && _.isFunction(star.cardList) ? star.cardList() : []
          );

          var dealStarCards = chooseCards({
            count:
              cardsOffered - model.gwoRerollsUsed() - star.cardList().length,
            star: star,
            systemCards: star.cardList(),
            // A reroll re-enters here with the iteration index back at 0, so
            // the reroll count is what makes it deal a different hand.
            rng: gwoStreams.exploreDealRng(
              warRng,
              starIndex,
              game.stats().turns(),
              model.gwoRerollsUsed()
            ),
          }).then(function (result) {
            var ok = true;

            _.forEach(star.cardList(), function (card) {
              if (
                helpers.isStartLoadoutCardId(card.id) &&
                !startCardUnlocked(card)
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
            // chooseCards is async, so the turn can have moved on. Recording then
            // owes every co-op viewer a catch-up hand for a deal never offered.
            var explorationLive = helpers.explorationStillLive(
              game,
              starIndex,
              star
            );

            if (!explorationLive) {
              console.log(
                "[GW COOP] discarded a stale explore deal star=" +
                  starIndex +
                  " turnState=" +
                  game.turnState()
              );
            }

            if (
              explorationLive &&
              force !== true &&
              (ok || startLoadoutCards.length) &&
              _.isArray(star.cardList()) &&
              star.cardList().length &&
              game &&
              _.isFunction(game.recordHostTechCardDeal)
            ) {
              dealEntry = game.recordHostTechCardDeal(starIndex, {
                startLoadoutCards: startLoadoutCards,
              });
            }

            if (!dealEntry) {
              return $.Deferred().resolve([]).promise();
            }

            return model.dealCoopPlayerPendingTechCards(starIndex, star, {
              dealIndex: dealEntry && dealEntry.dealIndex,
              startLoadoutCards: startLoadoutCards,
            });
          });

          // Returned so the base campaign queue can order it. The cosmetic
          // scanning delay below is deliberately not awaited.
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

        // A loadout won at a treasure planet unlocks the commander for later
        // wars and grants nothing in this one. Left in the inventory it would
        // read as tech held: cardsOfferedCount tests hasCard for the Lucky
        // Commander, so it would keep paying out an extra card every explore.
        // Returns the index to submit in place of the player's own.
        var bankWonLoadout = function (cardId, selectedCardIndex) {
          if (
            selectedCardIndex === -1 ||
            !helpers.isStartLoadoutCardId(cardId)
          ) {
            return selectedCardIndex;
          }

          treasureUnlocks.bankOwnLoadout({ id: cardId });
          return -1;
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
            var tech_card = model.currentSystemCardList()[selectedCardIndex];
            var tech_audio =
              tech_card && tech_card.audio() ? tech_card.audio().found : null;
            // Every loadout id, not just the ones the server misfiles: banking
            // is held for the whole scene on a viewer, so the server's own
            // GW.bank.addStartCard would be suppressed along with the rest.
            var submittedIndex = bankWonLoadout(
              tech_card && tech_card.id(),
              selectedCardIndex
            );

            return model.submitCoopTechCardChoice(submittedIndex).then(
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
          // winTurn(-1) still clears the star and ends the turn; it just adds
          // nothing to the inventory.
          var wonIndex = bankWonLoadout(
            techCard && techCard.id(),
            selectedCardIndex
          );

          return game.winTurn(wonIndex).then(function (didWin) {
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
                  // always, so a failed stat write still opens the gate.
                  api.tally
                    .incStatInt("gw_war_victory")
                    .always(resolveExitGate);
                } else {
                  resolveExitGate();

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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoCard();
