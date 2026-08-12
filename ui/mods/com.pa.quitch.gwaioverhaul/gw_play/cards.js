var gwoCardsLoaded;

function gwoCard() {
  const game = model.game();

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

    // Used by cards checking for T2 access - global for modders,
    // New-GW-Cards pushes here - see docs/tech-cards.md
    model.gwoCardsGrantingAdvancedTech = Array.isArray(
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

    const numCardsToOffer = 3;
    // cards_deal_helpers.js, assigned by the main requireGW below. Only read
    // from bodies that run after that load resolves.
    let helpers;

    const currentCoopPendingTechCards = () => {
      if (
        model.currentCoopPendingTechCards &&
        model.canChooseCoopTechCards &&
        model.canChooseCoopTechCards()
      ) {
        return model.currentCoopPendingTechCards();
      }

      return undefined;
    };

    model.rerollTech = () => {
      // setupTechRerolls injects the button before helpers is assigned, so a
      // click in that window reaches here first.
      if (!helpers) {
        return;
      }

      const pendingTechCards = currentCoopPendingTechCards();
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

      const cardsOffered = helpers.cardsOfferedCount(
        numCardsToOffer,
        game.inventory()
      );
      const star = game.galaxy().stars()[game.currentStar()];
      model.gwoRerollsUsed(model.gwoRerollsUsed() + 1);
      if (model.gwoRerollsUsed() >= cardsOffered - 1) {
        model.gwoOfferRerolls(false);
      }
      star.cardList([]);
      game.turnState("begin");
      model.explore(true);
    };

    const setupTechRerolls = () => {
      model.gwoOfferRerolls = ko.observable(true);
      model.gwoRerollPending = ko.observable(false);
      model.gwoRerollsUsed = ko
        .observable(0)
        .extend({ session: "gwo_rerolls_used" }); // prevent UI refresh exploits

      // Clean start for new games in a single session
      if (game.turnState() === "begin") {
        model.gwoRerollsUsed(0);
      }

      ko.computed(() => {
        if (game.turnState() === "end") {
          model.gwoRerollsUsed(0);
          model.gwoOfferRerolls(true);
          model.gwoRerollPending(false);
        }
      });

      let coopPendingRerollKey = "";
      ko.computed(() => {
        const pendingTechCards = currentCoopPendingTechCards();
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

        const key = [
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
        const cardsOffered = _.isNumber(pendingTechCards.cardsOffered)
          ? pendingTechCards.cardsOffered
          : Math.max(numCardsToOffer, pendingTechCards.cards.length);
        const rerollsUsed = _.isNumber(pendingTechCards.rerollsUsed)
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
    const restoreExploreSaveRerolls = () => {
      if (game.turnState() !== "explore") {
        return;
      }

      const star = game.galaxy().stars()[game.currentStar()];
      const cardsOffered = helpers.cardsOfferedCount(
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
      const self = this;

      self.params = ko.observable(params);
      self.id = ko.computed(() => {
        const p = self.params();
        return _.isObject(p) ? p.id : p;
      });

      self.visible = ko.observable(false);
      self.desc = ko.observable();
      self.locDesc = ko.computed(() => loc(self.desc()));
      self.summary = ko.observable();
      self.icon = ko.observable();
      self.iconPlaceholder = ko.observable(); // Displayed when the icon is empty
      self.audio = ko.observable();

      self.isEmpty = ko.computed(() => !self.id());
      // Recognise loadouts introduced by mods as loadouts
      self.isLoadout = ko.computed(() => _.includes(self.id(), "_start_"));

      const completed = $.Deferred();
      self.card = completed.promise();

      const loadCard = (card, data) => {
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

      let loadToken = 0;
      ko.computed(() => {
        const data = self.params();
        ++loadToken;
        const myToken = loadToken;
        const cardId = self.id();
        if (cardId) {
          requireGW([`cards/${cardId}`], (card) => {
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
      ],
      (
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
        gwoTreasure,
        gwoLoadoutBanks
      ) => {
        helpers = cardsDealHelpers;
        // Nothing reads the banks until the player explores, so resolving them
        // alongside setup is early enough and keeps this callback synchronous.
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
        });
        restoreExploreSaveRerolls();
        const inventory = game.inventory();
        const playerFaction = inventory.getTag("global", "playerFaction");
        const galaxy = game.galaxy();
        const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
        const warRng = gwoStreams.warRng(gwoSettings);

        // Also registers the gwo_sync_star_card_name host handler.
        const cardNameSync = cardsCardNameSync({ game });

        /* Start of GWO implementation of GWDealer */

        model.gwoCards = gwoDeal.setupGwoCards(gwoSettings);

        const cards = [];
        const deck = [];
        const numberOfCards = model.gwoCards.length;
        const loaded = $.Deferred();

        gwoDeal.setupGwoDeck(cards, deck, numberOfCards, loaded);

        // dealer.chooseCards() replacement - use our deck
        const chooseCards = (params) => {
          // params.rng is the deal's stream, one sub-stream per card of the hand.
          // A caller with no stream keeps the unseeded draw it always had.
          const dealStream = params.rng;
          const unseeded = dealStream ? undefined : new Math.seedrandom();
          const count = params.count;
          const star = params.star;
          const dealAddSlot = params.addSlot;
          const systemCards = params.systemCards;
          const dealInventory = params.inventory || inventory;
          const cardContexts = {};

          // One iteration of the deal loop below. `list` accumulates in the
          // loaded.then closure; `iteration` keys this card's stream.
          const dealOneCard = (list, iteration) => {
            const iterationRng = gwoStreams.iterationRng(dealStream, iteration);
            const fullHand = _.map(cards, (card) => {
              const context = cardContexts[card.id];
              const cardChance =
                card.deal &&
                card.deal(
                  star,
                  context,
                  dealInventory,
                  gwoStreams.cardRng(iterationRng, card.id)
                );
              const match = helpers.doNotDealCard(
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

            const resultIndex = helpers.chooseDealIndex(
              fullHand,
              iterationRng ? iterationRng() : unseeded()
            );
            if (_.isUndefined(resultIndex)) {
              return;
            }

            const resultDeal = fullHand[resultIndex];
            const cardParams = resultDeal && resultDeal.params;
            const systemCard = {
              id: deck[resultIndex],
            };

            if (cardParams && _.isPlainObject(cardParams)) {
              _.assign(systemCard, cardParams);
            }

            list.push(systemCard);
          };

          const result = $.Deferred();
          loaded.then(() => {
            _.forEach(cards, (card) => {
              if (card.getContext && !cardContexts[card.id]) {
                cardContexts[card.id] = card.getContext(galaxy, dealInventory);
              }
            });

            const list = [];

            _.times(count, dealOneCard.bind(null, list));

            result.resolve(list);
          });
          return result;
        };

        // Deals each viewer their own card on every selectable AI star.
        const coopStarCards = cardsCoopStarCards({
          game,
          chooseCards,
          GWInventory,
          gwoStreams,
          warRng,
          gwoBank,
          stockBank: GW.bank,
          gwoSettings,
          gwoSave,
          gwoTreasure,
        });

        // Installs model.dealCoopPlayerPendingTechCards, overriding stock gw_play.js.
        cardsCoopDeal({
          game,
          chooseCards,
          helpers,
          GWInventory,
          numCardsToOffer,
          gwoStreams,
          warRng,
          gwoBank,
          stockBank: GW.bank,
          gwoTreasure,
          coopStarCards,
          gwoSettings,
        });

        // Reports a viewer's loadout unlocks to the host, which needs the mod
        // ones the base game's own record cannot carry, and holds a viewer's
        // banking closed against the host's inventory.
        const treasureUnlocks = gwoTreasure.install({
          game,
          stockBank: GW.bank,
          gwoBank,
        });

        // Registers the co-op reroll operator handlers, viewer and host.
        cardsCoopReroll({
          game,
          galaxy,
          chooseCards,
          helpers,
          GWInventory,
          numCardsToOffer,
          gwoSave,
          GW,
          gwoStreams,
          warRng,
          gwoBank,
          stockBank: GW.bank,
        });

        const dealCardToSelectableAI = (win, turnState) => {
          if (model.isCampaignViewer()) {
            return $.when().promise(); // already resolved jQuery promise
          }

          const deferred = $.Deferred();

          // Avoid running twice after winning a fight
          if (!win || turnState === "end") {
            const deferredQueue = [];

            _.forEach(model.galaxy.systems(), (system, starIndex) => {
              const ai = system.star.ai();
              // A treasure planet offers a loadout derived at exploration, so it
              // never carries a pre-dealt card.
              const treasurePlanet = gwoTreasure.isTreasureStar(
                gwoSettings,
                starIndex
              );
              const validForDeal =
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
                  }).then((card) => {
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
              .then(() =>
                // The one caller that replaces cards viewers already hold, so
                // their offers move exactly when the host's do.
                coopStarCards.refresh({ redeal: true })
              )
              .then(() => {
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
        ko.computed(() => {
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
          (cardsStartSubcdr) => {
            const setupGeneralCommander = cardsStartSubcdr({
              game,
              gwoSettings,
              playerFaction,
              inventory,
            });
            setupGeneralCommander();
          }
        );

        const dealCardToSelectableAIWhenWarStarts = (settings) => {
          if (settings && !settings.firstDealComplete) {
            settings.firstDealComplete = true;
            dealCardToSelectableAI(false).then(() => {
              gwoSave(game, true);
            });
          }
        };
        dealCardToSelectableAIWhenWarStarts(gwoSettings);

        /* end of GWO implementation of GWDealer */

        // Installs model.cheats.testCards / model.cheats.giveCard.
        cardsCheats({
          game,
          galaxy,
          inventory,
          gwoSettings,
          playerFaction,
          gwoDeal,
          gwoAI,
          GWFactions,
          gwoSave,
          cards,
          loaded,
          dealCardToSelectableAI,
          helpers,
        });

        // Every bank: base game, GWO, and any a third-party card mod registered.
        // Each unlocks into its own localStorage record.
        const startCardUnlocked = (card) =>
          GW.bank.hasStartCard(card) ||
          gwoBank.hasStartCard(card) ||
          gwoLoadoutBanks.hasStartCard(card);

        // gw_play self.explore - call our chooseCards()
        model.explore = (force) => {
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

          const cardsOffered = helpers.cardsOfferedCount(
            numCardsToOffer,
            inventory
          );
          const starIndex = game.currentStar();
          const star = game.galaxy().stars()[starIndex];

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
            const treasureLoadout = gwoTreasure.pickTreasureLoadout({
              isUnlocked: startCardUnlocked,
              rng: gwoStreams.treasureLoadoutRng(warRng, undefined, starIndex),
            });
            star.cardList(treasureLoadout ? [treasureLoadout] : []);
          }

          const startLoadoutCards = helpers.filterStartLoadoutCards(
            star && _.isFunction(star.cardList) ? star.cardList() : []
          );

          const dealStarCards = chooseCards({
            count:
              cardsOffered - model.gwoRerollsUsed() - star.cardList().length,
            star,
            systemCards: star.cardList(),
            // A reroll re-enters here with the iteration index back at 0, so
            // the reroll count is what makes it deal a different hand.
            rng: gwoStreams.exploreDealRng(
              warRng,
              starIndex,
              game.stats().turns(),
              model.gwoRerollsUsed()
            ),
          }).then((result) => {
            let ok = true;

            _.forEach(star.cardList(), (card) => {
              if (
                helpers.isStartLoadoutCardId(card.id) &&
                !startCardUnlocked(card)
              ) {
                ok = false;
              }
            });

            if (ok) {
              // Combine the deal with pre-dealt system card
              const cardList = result.concat(star.cardList());
              star.cardList(cardList);
            }

            if (!model.gwCampaignReplayingAction) {
              model.sendCampaignAction("sync_star_cards", {
                star: game.currentStar(),
                cards: star.cardList(),
              });
            }

            let dealEntry;
            // chooseCards is async, so the turn can have moved on. Recording then
            // owes every co-op viewer a catch-up hand for a deal never offered.
            const explorationLive = helpers.explorationStillLive(
              game,
              starIndex,
              star
            );

            if (!explorationLive) {
              console.log(
                `[GW COOP] discarded a stale explore deal star=${starIndex} turnState=${game.turnState()}`
              );
            }

            if (
              explorationLive &&
              force !== true &&
              (ok || startLoadoutCards.length) &&
              Array.isArray(star.cardList()) &&
              star.cardList().length &&
              game &&
              _.isFunction(game.recordHostTechCardDeal)
            ) {
              dealEntry = game.recordHostTechCardDeal(starIndex, {
                startLoadoutCards,
              });
            }

            if (!dealEntry) {
              return $.Deferred().resolve([]).promise();
            }

            return model.dealCoopPlayerPendingTechCards(starIndex, star, {
              dealIndex: dealEntry && dealEntry.dealIndex,
              startLoadoutCards,
            });
          });

          // Returned so the base campaign queue can order it. The cosmetic
          // scanning delay below is deliberately not awaited.
          return $.when(dealStarCards).then(
            () => {
              if (
                model.currentSystemCardList() &&
                model.currentSystemCardList()[0] &&
                model.currentSystemCardList()[0].isLoadout()
              ) {
                model.gwoOfferRerolls(false);
              }
              _.delay(() => {
                model.scanning(false);
              }, 2000);
              return gwoSave(game, false);
            },
            (reason) => {
              console.error(
                `[GW COOP] failed to deal co-op player pending tech cards: ${reason}`
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
        const bankWonLoadout = (cardId, selectedCardIndex) => {
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
        model.win = (selectedCardIndex) => {
          const resolveExitGate = () => {
            model.exitGate().resolve();
          };

          if (
            model.canUseCoopTechChoice() &&
            model.isCampaignViewer() &&
            !model.gwCampaignReplayingAction
          ) {
            const tech_card = model.currentSystemCardList()[selectedCardIndex];
            const tech_audio =
              tech_card && tech_card.audio() ? tech_card.audio().found : null;
            // Every loadout id, not just the ones the server misfiles: banking
            // is held for the whole scene on a viewer, so the server's own
            // GW.bank.addStartCard would be suppressed along with the rest.
            const submittedIndex = bankWonLoadout(
              tech_card && tech_card.id(),
              selectedCardIndex
            );

            return model.submitCoopTechCardChoice(submittedIndex).then(
              () => {
                if (tech_audio) {
                  api.audio.playSound(tech_audio);
                } else {
                  api.audio.playSound("/VO/Computer/gw/board_tech_acquired");
                }
              },
              (reason) => {
                console.error(
                  `[GW COOP] failed to acquire co-op tech choice: ${reason}`
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

          const actionCardList = model.currentSystemActionCardList();
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

          const techCard = actionCardList && actionCardList[selectedCardIndex];
          const techAudio =
            techCard && techCard.audio() ? techCard.audio().found : null;
          const playTechAudio = !!techCard;
          // winTurn(-1) still clears the star and ends the turn; it just adds
          // nothing to the inventory.
          const wonIndex = bankWonLoadout(
            techCard && techCard.id(),
            selectedCardIndex
          );

          return game.winTurn(wonIndex).then((didWin) => {
            if (!didWin) {
              console.error("Failed winning turn", game);
              return $.Deferred().reject("Failed winning turn").promise();
            }

            if (model.isCampaignViewer()) {
              model.syncViewerStarsFromGame("win_applied");
            }

            model.maybePlayCaptureSound();

            return dealCardToSelectableAI(true, game.turnState())
              .then(() => gwoSave(game, true))
              .then(() => {
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
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoCard();
