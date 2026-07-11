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
    model.gwoCardsGrantingAdvancedTech = [
      "gwc_enable_air_all",
      "gwc_enable_bots_all",
      "gwc_enable_sea_all",
      "gwc_enable_vehicles_all",
      "gwaio_upgrade_fabricationaircraft",
      "gwaio_upgrade_fabricationbot",
      "gwaio_upgrade_fabricationship",
      "gwaio_upgrade_fabricationvehicle",
      "gwaio_start_hoarder",
    ];

    var numCardsToOffer = 3;

    var cardsOfferedCount = function (offer, techInventory) {
      var cardsToOffer = offer;
      var inventoryToCheck = techInventory || game.inventory();

      if (
        inventoryToCheck &&
        _.isFunction(inventoryToCheck.handIsFull) &&
        inventoryToCheck.handIsFull()
      ) {
        cardsToOffer++;
      }

      if (
        inventoryToCheck &&
        _.isFunction(inventoryToCheck.hasCard) &&
        inventoryToCheck.hasCard("gwaio_start_lucky")
      ) {
        cardsToOffer++;
      }

      return cardsToOffer;
    };

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

    var pendingCardsContainLoadout = function (pendingTechCards) {
      return !!(
        pendingTechCards &&
        _.isArray(pendingTechCards.cards) &&
        pendingTechCards.cards.length &&
        _.includes(pendingTechCards.cards[0].id, "_start_")
      );
    };

    model.rerollTech = function () {
      var pendingTechCards = currentCoopPendingTechCards();
      if (pendingTechCards) {
        if (
          pendingCardsContainLoadout(pendingTechCards) ||
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

      var cardsOffered = cardsOfferedCount(numCardsToOffer);
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
          !pendingCardsContainLoadout(pendingTechCards) &&
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

    var doNotDealCard = function (
      inventory,
      card,
      cardsDealt,
      dealAddSlot,
      testRun,
      systemCards // allow duplicates across players, but not within a single player's deal
    ) {
      var cardsInSystem = _.isArray(systemCards)
        ? systemCards
        : model.currentSystemCardList();
      var systemHasCard = _.some(cardsInSystem, function (systemCard) {
        if (!systemCard) {
          return false;
        }

        if (_.isFunction(systemCard.id)) {
          return systemCard.id() === card.id;
        }

        return systemCard.id === card.id;
      });

      // Never deal Additional Data Bank as a system's pre-dealt card
      if (card.id === "gwc_add_card_slot" && dealAddSlot === false) {
        return true;
      }

      if (testRun) {
        return (
          inventory.hasCard(card.id) &&
          _.some(cardsDealt, { id: card.id }) &&
          systemHasCard
        );
      }

      return (
        inventory.hasCard(card.id) ||
        _.some(cardsDealt, { id: card.id }) ||
        systemHasCard
      );
    };

    var setCardNameSyncOperator = "gwo_sync_star_card_name";

    var sendSyncedStarCardName = function (starIndex, cardId) {
      if (
        !_.isNumber(starIndex) ||
        _.isNaN(starIndex) ||
        !_.isString(cardId) ||
        !cardId.length ||
        !model.sendCampaignHostOperator ||
        !_.isFunction(model.isCampaignHost) ||
        !_.isFunction(model.gwCampaignConnected)
      ) {
        return;
      }

      model.sendCampaignHostOperator(setCardNameSyncOperator, {
        star: starIndex,
        card_id: cardId,
      });
    };

    var setAiCardName = function (star, cardName) {
      if (!star || !_.isFunction(star.ai)) {
        return false;
      }

      var ai = star.ai();
      if (!ai) {
        return false;
      }

      ai.cardName = cardName;
      return true;
    };

    var applyCardNameToStarIndex = function (starIndex, cardName) {
      var applied = false;

      var systems =
        model.galaxy && _.isFunction(model.galaxy.systems)
          ? model.galaxy.systems()
          : undefined;
      var system = _.isArray(systems) ? systems[starIndex] : undefined;
      if (system && system.star) {
        applied = setAiCardName(system.star, cardName) || applied;
      }

      var gameGalaxy =
        game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
      var stars =
        gameGalaxy && _.isFunction(gameGalaxy.stars)
          ? gameGalaxy.stars()
          : undefined;
      var gameStar = _.isArray(stars) ? stars[starIndex] : undefined;
      applied = setAiCardName(gameStar, cardName) || applied;

      return applied;
    };

    var isValidSyncedStarCardNamePayload = function (payload) {
      return (
        _.isNumber(payload.star) &&
        !_.isNaN(payload.star) &&
        _.isString(payload.card_id) &&
        !!payload.card_id.length
      );
    };

    var applySyncedStarCardName = function (operator) {
      var payload = operator && operator.payload ? operator.payload : {};
      if (!isValidSyncedStarCardNamePayload(payload)) {
        console.error("[GW COOP] invalid synced star card name payload");
        return;
      }

      requireGW(["cards/" + payload.card_id], function (data) {
        if (!data || !_.isFunction(data.summarize)) {
          console.error(
            "[GW COOP] card summarize unavailable for synced card name id=" +
              payload.card_id
          );
          return;
        }

        var cardName = loc(data.summarize());
        if (!applyCardNameToStarIndex(payload.star, cardName)) {
          console.error(
            "[GW COOP] unable to apply synced star card name for star=" +
              payload.star
          );
        }
      });
    };

    var setCardName = function (system, card, starIndex) {
      var deferred = $.Deferred();
      var firstCard = card && card[0];
      if (!firstCard || !firstCard.id) {
        deferred.resolve();
        return deferred.promise();
      }

      requireGW(["cards/" + firstCard.id], function (data) {
        if (data && _.isFunction(data.summarize)) {
          system.star.ai().cardName = loc(data.summarize());
          sendSyncedStarCardName(starIndex, firstCard.id);
        }
        deferred.resolve();
      });

      return deferred.promise();
    };

    var testCardForMatches = function (inventory, card) {
      model.currentSystemCardList().push(card);

      var cardsDealt = [card];
      var duplicate = doNotDealCard(inventory, card, cardsDealt, false, true);

      if (!duplicate) {
        console.error(card.id, "failed duplication test");
      }
    };

    var applyCheatCards = function (product, inventory) {
      inventory.cards.push(product);
      inventory.applyCards();
    };

    var setupNewCardSlot = function (product) {
      product.allowOverflow = true;
      product.unique = Math.random();

      return product;
    };

    var isStartLoadoutCardId = function (cardId) {
      return _.isString(cardId) && _.includes(cardId, "_start_");
    };

    var filterStartLoadoutCards = function (cards) {
      return _.filter(cards || [], function (card) {
        return isStartLoadoutCardId(card.id);
      });
    };

    var buildPendingStartLoadoutCard = function (card) {
      var result = _.isString(card) ? { id: card } : _.cloneDeep(card);
      if (
        result &&
        isStartLoadoutCardId(result.id) &&
        _.isUndefined(result.allowOverflow)
      ) {
        result.allowOverflow = true;
      }

      return result;
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
      ],
      function (GW, GWFactions, gwoAI, gwoSave, gwoBank, GWInventory, gwoDeal) {
        var inventory = game.inventory();
        var playerFaction = inventory.getTag("global", "playerFaction");
        var galaxy = game.galaxy();
        var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

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

          var result = $.Deferred();
          loaded.then(function () {
            _.forEach(cards, function (card) {
              if (card.getContext && !cardContexts[card.id]) {
                cardContexts[card.id] = card.getContext(galaxy, dealInventory);
              }
            });

            var list = [];

            _.times(count, function () {
              var fullHand = _.map(cards, function (card) {
                var context = cardContexts[card.id];
                var cardChance =
                  card.deal && card.deal(star, context, dealInventory);
                var match = doNotDealCard(
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

                  if (cardParams && _.isObject(cardParams)) {
                    _.assign(systemCard, cardParams);
                  }

                  list.push(systemCard);
                }
              }
            });

            result.resolve(list);
          });
          return result;
        };

        // GWO override of the host-side co-op pending tech deal path.
        //
        // In stock gw_play.js, the host always deals exactly 3 cards to viewers
        // when creating pending tech cards. That base implementation does not
        // account for GWO-specific bonus card rules
        model.dealCoopPlayerPendingTechCards = function (
          starIndex,
          star,
          options
        ) {
          var result = $.Deferred();
          var dealOptions = options || {};
          var startLoadoutCards = filterStartLoadoutCards(
            dealOptions.startLoadoutCards
          );

          if (
            !model.gwCampaignActive() ||
            !model.isCampaignHost() ||
            !model.gwCampaignPerPlayerTechCards()
          ) {
            result.resolve([]);
            return result.promise();
          }

          var connectedClients = _.isArray(model.gwCampaignConnectedClients())
            ? model.gwCampaignConnectedClients()
            : [];
          var sourceClients = _.isArray(dealOptions.clients)
            ? dealOptions.clients
            : connectedClients;
          var viewers = _.filter(sourceClients, function (client) {
            return client && client.role === "viewer";
          });

          if (!viewers.length) {
            result.resolve([]);
            return result.promise();
          }

          var updates = [];
          var jobs = [];
          var targets = [];
          var validationError;

          _.forEach(viewers, function (client) {
            if (validationError) {
              return;
            }

            var record = game.findCoopPlayerInventoryData({
              id: client.id,
              name: client.name,
            });
            if (!record) {
              validationError =
                "Missing inventory data for pending tech cards client=" +
                client.id +
                " name=" +
                client.name;
              return;
            }

            if (!record.inventory) {
              validationError =
                "Missing saved inventory for pending tech cards client=" +
                client.id +
                " name=" +
                client.name;
              return;
            }

            if (record.pendingTechCards) {
              validationError =
                "Client already has pending tech cards client=" +
                client.id +
                " name=" +
                client.name;
              return;
            }

            var dealIndex = dealOptions.dealIndex;
            if (
              _.isNumber(dealIndex) &&
              model.getCoopPlayerTechCardDealCount(record) >= dealIndex
            ) {
              return;
            }

            var startLoadoutCard;
            if (startLoadoutCards.length) {
              if (!_.isArray(record.unlockedStartCardIds)) {
                console.error(
                  "[GW COOP] Co-op player has no unlocked loadout metadata; treating as missing loadouts client=" +
                    client.id +
                    " name=" +
                    client.name
                );
              }

              startLoadoutCard = _.find(startLoadoutCards, function (card) {
                return !model.recordHasUnlockedStartCard(record, card);
              });
            }

            targets.push({
              client: client,
              record: record,
              dealIndex: dealIndex,
              startLoadoutCard: startLoadoutCard,
            });
          });

          if (validationError) {
            result.reject(validationError);
            return result.promise();
          }

          if (!targets.length) {
            result.resolve([]);
            return result.promise();
          }

          _.forEach(targets, function (target) {
            var client = target.client;
            var record = target.record;
            var job = $.Deferred();
            jobs.push(job.promise());

            if (target.startLoadoutCard) {
              updates.push({
                client_id: client.id,
                client_name: client.name,
                pendingTechCards: {
                  star: starIndex,
                  cards: [
                    buildPendingStartLoadoutCard(target.startLoadoutCard),
                  ],
                  dealIndex: target.dealIndex,
                  updatedAt: _.now(),
                },
              });
              job.resolve();
              return;
            }

            var inventory = new GWInventory();
            inventory.load(_.cloneDeep(record.inventory));

            var dealCards = function () {
              var cardsOffered = cardsOfferedCount(numCardsToOffer, inventory);
              chooseCards({
                inventory: inventory,
                count: cardsOffered,
                star: star,
                systemCards: [],
              }).then(function (cards) {
                var pendingTechCards = {
                  star: starIndex,
                  cards: cards || [],
                  dealIndex: target.dealIndex,
                  cardsOffered: cardsOffered,
                  updatedAt: _.now(),
                };
                updates.push({
                  client_id: client.id,
                  client_name: client.name,
                  pendingTechCards: pendingTechCards,
                });
                job.resolve();
              });
            };

            if (inventory.cards().length) {
              inventory.applyCards(dealCards);
            } else {
              dealCards();
            }
          });

          $.when.apply($, jobs).then(function () {
            if (!updates.length) {
              result.resolve([]);
              return;
            }

            var payload = {
              players: updates,
              host_tech_card_deal_count: game.hostTechCardDealCount(),
              host_tech_card_deal_history: game.hostTechCardDealHistory(),
            };

            if (_.isFunction(model.send_message)) {
              model.send_message(
                "set_player_pending_tech_cards",
                payload,
                function (success, response) {
                  if (!success) {
                    result.reject(
                      "set_player_pending_tech_cards failed response=" +
                        JSON.stringify(response || {})
                    );
                    return;
                  }

                  result.resolve(updates);
                }
              );
            } else {
              model.sendCampaignAction(
                "set_player_pending_tech_cards",
                payload
              );
              result.resolve(updates);
            }
          });

          return result.promise();
        };

        var rerollPendingTechRequest = "gwo_reroll_pending_tech";
        var rerollPendingTechResult = "gwo_reroll_pending_tech_result";

        var sendPendingTechRerollResult = function (
          clientId,
          requestId,
          payload
        ) {
          if (!model.sendCampaignHostOperator) {
            return;
          }

          model.sendCampaignHostOperator(rerollPendingTechResult, payload, {
            target_client_id: clientId,
            request_id: requestId,
          });
        };

        var failPendingTechReroll = function (operator, reason) {
          console.error("[GW COOP] failed to reroll pending tech: " + reason);
          if (_.isUndefined(operator.client_id)) {
            return;
          }

          sendPendingTechRerollResult(operator.client_id, operator.request_id, {
            client_id: operator.client_id,
            client_name: operator.client_name,
            error: reason,
          });
        };

        var applyPendingTechRerollResult = function (operator) {
          var payload = operator.payload || {};
          model.gwoRerollPending(false);
          model.scanning(false);

          if (payload.error) {
            console.error(
              "[GW COOP] pending tech reroll failed: " + payload.error
            );
            return;
          }

          var pendingTechCards = payload.pendingTechCards;
          if (
            !pendingTechCards ||
            !_.isNumber(pendingTechCards.star) ||
            !_.isArray(pendingTechCards.cards)
          ) {
            console.error("[GW COOP] invalid pending tech reroll result");
            return;
          }

          var record = game.findCoopPlayerInventoryData({
            id: payload.client_id,
            name: payload.client_name,
          });
          if (!record || !record.inventory) {
            console.error(
              "[GW COOP] missing inventory for pending tech reroll result"
            );
            return;
          }

          var nextRecord = _.assign({}, _.cloneDeep(record), {
            pendingTechCards: pendingTechCards,
            updatedAt: payload.updated_at || _.now(),
          });

          if (!game.upsertCoopPlayerInventoryData(nextRecord)) {
            console.error(
              "[GW COOP] failed to apply pending tech reroll result"
            );
            return;
          }

          if (_.isNumber(payload.rerolls_used)) {
            model.gwoRerollsUsed(payload.rerolls_used);
          }
          model.gwoOfferRerolls(payload.offer_rerolls === true);
          model.prepareCoopPlayerInventories();

          GW.manifest.saveGame(game).then(
            function () {},
            function (err) {
              console.error("[GW COOP] failed to save rerolled tech", err);
            }
          );
        };

        var rerollPendingTechForCoopPlayer = function (operator) {
          if (
            !model.isCampaignHost() ||
            !model.gwCampaignPerPlayerTechCards()
          ) {
            return;
          }

          var payload = operator.payload || {};
          var record = game.findCoopPlayerInventoryData({
            id: operator.client_id,
            name: operator.client_name,
          });

          if (!record || !record.inventory || !record.pendingTechCards) {
            failPendingTechReroll(operator, "missing pending tech cards");
            return;
          }

          var pendingTechCards = record.pendingTechCards;
          if (
            !_.isNumber(pendingTechCards.star) ||
            !_.isArray(pendingTechCards.cards)
          ) {
            failPendingTechReroll(operator, "invalid pending tech cards");
            return;
          }

          if (
            _.isNumber(payload.star) &&
            payload.star !== pendingTechCards.star
          ) {
            failPendingTechReroll(operator, "stale pending tech star");
            return;
          }

          if (
            _.isNumber(payload.deal_index) &&
            _.isNumber(pendingTechCards.dealIndex) &&
            payload.deal_index !== pendingTechCards.dealIndex
          ) {
            failPendingTechReroll(operator, "stale pending tech deal index");
            return;
          }

          if (pendingCardsContainLoadout(pendingTechCards)) {
            failPendingTechReroll(operator, "loadout cards cannot be rerolled");
            return;
          }

          var star = galaxy.stars()[pendingTechCards.star];
          if (!star) {
            failPendingTechReroll(operator, "missing pending tech star");
            return;
          }

          var playerInventory = new GWInventory();
          playerInventory.load(_.cloneDeep(record.inventory));

          var dealCards = function () {
            var cardsOffered = cardsOfferedCount(
              numCardsToOffer,
              playerInventory
            );
            var rerollsUsed = Math.max(
              0,
              cardsOffered - pendingTechCards.cards.length
            );
            var nextRerollsUsed = rerollsUsed + 1;

            if (nextRerollsUsed > cardsOffered - 1) {
              failPendingTechReroll(operator, "no pending tech rerolls remain");
              return;
            }

            var cardCount = cardsOffered - nextRerollsUsed;
            chooseCards({
              inventory: playerInventory,
              count: cardCount,
              star: star,
              systemCards: [],
            }).then(function (cards) {
              var updatedAt = _.now();
              var nextPendingTechCards = {
                star: pendingTechCards.star,
                cards: cards || [],
                dealIndex: pendingTechCards.dealIndex,
                cardsOffered: cardsOffered,
                rerollsUsed: nextRerollsUsed,
                updatedAt: updatedAt,
              };
              var nextRecord = _.assign({}, _.cloneDeep(record), {
                pendingTechCards: nextPendingTechCards,
                updatedAt: updatedAt,
              });

              if (!game.upsertCoopPlayerInventoryData(nextRecord)) {
                failPendingTechReroll(
                  operator,
                  "failed to store rerolled pending tech"
                );
                return;
              }

              model.sendCampaignSnapshot("gwo_reroll_pending_tech", true);
              sendPendingTechRerollResult(
                operator.client_id,
                operator.request_id,
                {
                  client_id: operator.client_id,
                  client_name: operator.client_name,
                  pendingTechCards: nextPendingTechCards,
                  rerolls_used: nextRerollsUsed,
                  offer_rerolls: nextRerollsUsed < cardsOffered - 1,
                  updated_at: updatedAt,
                }
              );
              gwoSave(game, false);
            });
          };

          if (playerInventory.cards().length) {
            playerInventory.applyCards(dealCards);
          } else {
            dealCards();
          }
        };

        if (model.registerCampaignViewerOperatorHandler) {
          model.registerCampaignViewerOperatorHandler(
            rerollPendingTechRequest,
            rerollPendingTechForCoopPlayer
          );
        }

        if (model.registerCampaignHostOperatorHandler) {
          model.registerCampaignHostOperatorHandler(
            rerollPendingTechResult,
            applyPendingTechRerollResult
          );
          model.registerCampaignHostOperatorHandler(
            setCardNameSyncOperator,
            applySyncedStarCardName
          );
        }

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
                isStartLoadoutCardId(system.star.cardList()[0].id);
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
                    return setCardName(system, card, starIndex);
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

        /* Cheat code start */

        var testMinions = function (product, inventory) {
          _.forEach(GWFactions, function (faction) {
            _.forEach(faction.minions, function (minion) {
              var minionStock = _.cloneDeep(product);
              minionStock.minion = minion;
              inventory.cards.push(minionStock);
              inventory.cards.pop();

              if (!minionStock.minion.commander) {
                // This will use the player's commander
                return;
              }

              require([
                "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
              ], function (gwoUnit) {
                var clusterSecurity = gwoUnit.colonel;
                var clusterWorker = gwoUnit.angel;

                if (
                  !CommanderUtility.bySpec.getObjectName(
                    minionStock.minion.commander
                  ) &&
                  minionStock.minion.commander !== clusterSecurity &&
                  minionStock.minion.commander !== clusterWorker
                ) {
                  console.error(
                    "Minion commander unit spec " +
                      minionStock.minion.commander +
                      " invalid"
                  );
                }
              });
            });
          });
        };

        var dealSubCommander = function (product) {
          var subcommander = _.cloneDeep(
            _.sample(GWFactions[playerFaction].minions)
          );
          var subcommanderAI = gwoSettings && gwoSettings.aiAlly;

          if (subcommanderAI === "Penchant") {
            var penchantValues = gwoAI.penchants();
            subcommander.character =
              subcommander.character + (" " + loc(penchantValues.penchantName));
            subcommander.personality.personality_tags =
              subcommander.personality.personality_tags.concat(
                penchantValues.penchants
              );
          }
          product.minion = subcommander;
          product.unique = Math.random();

          return product;
        };

        var expandInventorySize = function (galaxy, inventory, star, maxCards) {
          var sizeDifference = inventory.cards().length - maxCards;
          _.times(sizeDifference, function () {
            gwoDeal
              .dealCard(
                {
                  id: "gwc_add_card_slot",
                  galaxy: galaxy,
                  inventory: inventory,
                  star: star,
                },
                loaded
              )
              .then(function (product) {
                product = setupNewCardSlot(product);
                applyCheatCards(product, inventory);
              });
          });
        };

        // We need cheats to deal from our deck
        model.cheats.testCards = function () {
          var star = galaxy.stars()[game.currentStar()];
          var maxCards = inventory.maxCards() + 1; // start card doesn't use a slot

          _.forEach(model.gwoCards, function (cardId) {
            gwoDeal
              .dealCard(
                {
                  id: cardId,
                  galaxy: galaxy,
                  inventory: inventory,
                  star: star,
                },
                loaded
              )
              .then(function (product) {
                if (product.id === "gwc_minion") {
                  testMinions(product, inventory);
                  product = dealSubCommander(product);
                } else if (product.id === "gwc_add_card_slot") {
                  product = setupNewCardSlot(product);
                }
                applyCheatCards(product, inventory);
                if (!product.unique) {
                  testCardForMatches(inventory, product);
                }
              });
          });
          expandInventorySize(galaxy, inventory, star, maxCards);
        };

        model.cheats.giveCard = function () {
          var id = model.cheats.giveCardId();
          var cardId = _.find(model.gwoCards, function (card) {
            return card === id;
          });

          if (cardId) {
            gwoDeal
              .dealCard(
                {
                  id: cardId,
                  galaxy: galaxy,
                  inventory: inventory,
                  star: galaxy.stars()[game.currentStar()],
                },
                loaded
              )
              .then(function (product) {
                if (product.id === "gwc_minion") {
                  product = dealSubCommander(product);
                } else if (product.id === "gwc_add_card_slot") {
                  product = setupNewCardSlot(product);
                }
                inventory.cards.push(product);
                inventory.applyCards();
                dealCardToSelectableAI(false).then(function () {
                  gwoSave(game, true);
                });
              });
          } else {
            console.error(
              "Unable to find a card called " + model.cheats.giveCardId()
            );
          }
        };

        /* Cheat code end */

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

          var cardsOffered = cardsOfferedCount(numCardsToOffer, inventory);
          var star = game.galaxy().stars()[game.currentStar()];
          var startLoadoutCards = filterStartLoadoutCards(
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
                _.includes(card.id, "_start_") &&
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

          $.when(dealStarCards).then(
            function () {
              if (
                model.currentSystemCardList() &&
                model.currentSystemCardList()[0] &&
                model.currentSystemCardList()[0].isLoadout()
              ) {
                model.gwoOfferRerolls(false);
              }
              gwoSave(game, false);
              _.delay(function () {
                model.scanning(false);
              }, 2000);
            },
            function (reason) {
              console.error(
                "[GW COOP] failed to deal co-op player pending tech cards: " +
                  reason
              );
              model.scanning(false);
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

            model.submitCoopTechCardChoice(selectedCardIndex).then(
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
              }
            );
            return;
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

          game.winTurn(selectedCardIndex).then(function (didWin) {
            if (!didWin) {
              console.error("Failed winning turn", game);
              return;
            }

            if (model.isCampaignViewer()) {
              model.syncViewerStarsFromGame("win_applied");
            }

            model.maybePlayCaptureSound();

            dealCardToSelectableAI(true, game.turnState())
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
