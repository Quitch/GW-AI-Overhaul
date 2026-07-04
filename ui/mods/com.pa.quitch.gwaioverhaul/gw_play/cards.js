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

    const numCardsToOffer = 3;

    const cardsOfferedCount = function (offer, techInventory) {
      var cardsToOffer = offer;
      const inventoryToCheck = techInventory || game.inventory();

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

    const currentCoopPendingTechCards = function () {
      if (
        model.currentCoopPendingTechCards &&
        model.canChooseCoopTechCards &&
        model.canChooseCoopTechCards()
      ) {
        return model.currentCoopPendingTechCards();
      }

      return undefined;
    };

    const pendingCardsContainLoadout = function (pendingTechCards) {
      return !!(
        pendingTechCards &&
        _.isArray(pendingTechCards.cards) &&
        pendingTechCards.cards.length &&
        _.includes(pendingTechCards.cards[0].id, "_start_")
      );
    };

    model.rerollTech = function () {
      const pendingTechCards = currentCoopPendingTechCards();
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
      const star = game.galaxy().stars()[game.currentStar()];
      model.gwoRerollsUsed(model.gwoRerollsUsed() + 1);
      if (model.gwoRerollsUsed() >= cardsOffered - 1) {
        model.gwoOfferRerolls(false);
      }
      star.cardList([]);
      game.turnState("begin");
      model.explore();
    };

    const setupTechRerolls = function () {
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
        const star = game.galaxy().stars()[game.currentStar()];
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
        const pendingTechCards = currentCoopPendingTechCards();
        if (!pendingTechCards) {
          model.gwoRerollPending(false);
          coopPendingRerollKey = "";
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
      const self = this;

      self.params = ko.observable(params);
      self.id = ko.computed(function () {
        const p = self.params();
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

      const completed = $.Deferred();
      self.card = completed.promise();

      const loadCard = function (card, data) {
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
        const data = self.params();
        ++loadToken;
        const myToken = loadToken;
        const cardId = self.id();
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

    const setupGwoCards = function (gwoSettings) {
      const basicCards = [
        "gwc_add_card_slot",
        "gwc_bld_efficiency_cdr",
        "gwc_bld_efficiency_fabs",
        "gwc_combat_air",
        "gwc_combat_bots",
        "gwc_combat_commander",
        "gwc_combat_orbital",
        "gwc_combat_sea",
        "gwc_combat_structures",
        "gwc_combat_vehicles",
        "gwc_cost_air",
        "gwc_cost_artillery",
        "gwc_cost_bots",
        "gwc_cost_defenses",
        "gwc_cost_economy",
        "gwc_cost_orbital",
        "gwc_cost_sea",
        "gwc_cost_super_weapons",
        "gwc_cost_titans",
        "gwc_cost_vehicles",
        "gwc_damage_air",
        "gwc_damage_artillery",
        "gwc_damage_bots",
        "gwc_damage_commander",
        "gwc_damage_defenses",
        "gwc_damage_orbital",
        "gwc_damage_sea",
        "gwc_damage_vehicles",
        "gwc_enable_air_all",
        "gwc_enable_air_t1",
        "gwc_enable_artillery",
        "gwc_enable_bots_all",
        "gwc_enable_bots_t1",
        "gwc_enable_defenses_t2",
        "gwc_enable_orbital_all",
        "gwc_enable_sea_all",
        "gwc_enable_titans",
        "gwc_enable_vehicles_all",
        "gwc_enable_vehicles_t1",
        "gwc_energy_efficiency_all",
        "gwc_health_air",
        "gwc_health_bots",
        "gwc_health_commander",
        "gwc_health_orbital",
        "gwc_health_sea",
        "gwc_health_structures",
        "gwc_health_vehicles",
        "gwc_minion",
        "gwc_speed_air",
        "gwc_speed_bots",
        "gwc_speed_commander",
        "gwc_speed_orbital",
        "gwc_speed_sea",
        "gwc_speed_vehicles",
        "gwc_storage_1",
        "gwc_storage_and_buff",
      ];
      const expandedCards = [
        "gwaio_anti_air",
        "gwaio_anti_bots",
        "gwaio_anti_commander",
        "gwaio_anti_hover",
        "gwaio_anti_orbital",
        "gwaio_anti_sea",
        "gwaio_anti_structure",
        "gwaio_anti_vehicles",
        "gwaio_combat_titans",
        "gwaio_cooldown_air",
        "gwaio_cooldown_bots",
        "gwaio_cooldown_orbital",
        "gwaio_cooldown_sea",
        "gwaio_cooldown_vehicles",
        "gwaio_damage_titans",
        "gwaio_enable_bounties",
        "gwaio_enable_eradication",
        "gwaio_enable_factories_t1_all",
        "gwaio_enable_landanywhere",
        "gwaio_enable_orbitalbombardment",
        "gwaio_enable_planetaryradar",
        "gwaio_enable_suddendeath",
        "gwaio_enable_tsunami",
        "gwaio_health_titans",
        "gwaio_protocol_agility",
        "gwaio_protocol_blindness",
        "gwaio_protocol_disposability",
        "gwaio_protocol_fortitude",
        "gwaio_protocol_killswitch",
        "gwaio_protocol_precision",
        "gwaio_protocol_wrath",
        "gwaio_speed_structure",
        "gwaio_speed_titans",
        "gwaio_upgrade_advancedairfactory",
        "gwaio_upgrade_advancedbotfactory",
        "gwaio_upgrade_advancedenergyplant",
        "gwaio_upgrade_advancedfabricationaircraft",
        "gwaio_upgrade_advancedfabricationbot",
        "gwaio_upgrade_advancedfabricationship",
        "gwaio_upgrade_advancedfabricationvehicle",
        "gwaio_upgrade_advancedlaserdefensetower",
        "gwaio_upgrade_advancedmetalextractor",
        "gwaio_upgrade_advancednavalfactory",
        "gwaio_upgrade_advancedradar",
        "gwaio_upgrade_advancedradarsatellite",
        "gwaio_upgrade_advancedtorpedolauncher",
        "gwaio_upgrade_advancedvehiclefactory",
        "gwaio_upgrade_airfactory",
        "gwaio_upgrade_anchor",
        "gwaio_upgrade_angel",
        "gwaio_upgrade_ant",
        "gwaio_upgrade_antinuke",
        "gwaio_upgrade_ares",
        "gwaio_upgrade_arkyd",
        "gwaio_upgrade_artemis",
        "gwaio_upgrade_astraeus",
        "gwaio_upgrade_atlas",
        "gwaio_upgrade_avenger",
        "gwaio_upgrade_barnacle",
        "gwaio_upgrade_barracuda",
        "gwaio_upgrade_bluehawk",
        "gwaio_upgrade_boom",
        "gwaio_upgrade_botfactory",
        "gwaio_upgrade_bumblebee",
        "gwaio_upgrade_catalyst",
        "gwaio_upgrade_catapult",
        "gwaio_upgrade_colonel",
        "gwaio_upgrade_dox",
        "gwaio_upgrade_drifter",
        "gwaio_upgrade_energyplant",
        "gwaio_upgrade_energystorage",
        "gwaio_upgrade_fabricationaircraft",
        "gwaio_upgrade_fabricationbot",
        "gwaio_upgrade_fabricationship",
        "gwaio_upgrade_fabricationvehicle",
        "gwaio_upgrade_firefly",
        "gwaio_upgrade_flak",
        "gwaio_upgrade_galata",
        "gwaio_upgrade_gile",
        "gwaio_upgrade_grenadier",
        "gwaio_upgrade_halley",
        "gwaio_upgrade_helios",
        "gwaio_upgrade_hermes",
        "gwaio_upgrade_holkins",
        "gwaio_upgrade_hornet",
        "gwaio_upgrade_horsefly",
        "gwaio_upgrade_hummingbird",
        "gwaio_upgrade_icarus",
        "gwaio_upgrade_inferno",
        "gwaio_upgrade_jig",
        "gwaio_upgrade_kaiju",
        "gwaio_upgrade_kessler",
        "gwaio_upgrade_kestrel",
        "gwaio_upgrade_kraken",
        "gwaio_upgrade_laserdefensetower",
        "gwaio_upgrade_leveler",
        "gwaio_upgrade_leviathan",
        "gwaio_upgrade_lob",
        "gwaio_upgrade_locusts",
        "gwaio_upgrade_manhattan",
        "gwaio_upgrade_mend",
        "gwaio_upgrade_metalextractor",
        "gwaio_upgrade_metalstorage",
        "gwaio_upgrade_mine",
        "gwaio_upgrade_narwhal",
        "gwaio_upgrade_navalfactory",
        "gwaio_upgrade_nukes",
        "gwaio_upgrade_nyx",
        "gwaio_upgrade_omega",
        "gwaio_upgrade_orbitalfabricationbot",
        "gwaio_upgrade_orbitalfactory",
        "gwaio_upgrade_orbitallauncher",
        "gwaio_upgrade_orca",
        "gwaio_upgrade_pelican",
        "gwaio_upgrade_pelter",
        "gwaio_upgrade_phoenix",
        "gwaio_upgrade_piranha",
        "gwaio_upgrade_planetaryradar",
        "gwaio_upgrade_radar",
        "gwaio_upgrade_radarjammer",
        "gwaio_upgrade_ragnarok",
        "gwaio_upgrade_sheller",
        "gwaio_upgrade_singlelaserdefensetower",
        "gwaio_upgrade_skitter",
        "gwaio_upgrade_slammer",
        "gwaio_upgrade_solararray",
        "gwaio_upgrade_spark",
        "gwaio_upgrade_spinner",
        "gwaio_upgrade_squall",
        "gwaio_upgrade_stinger",
        "gwaio_upgrade_stingray",
        "gwaio_upgrade_stitch",
        "gwaio_upgrade_storm",
        "gwaio_upgrade_stryker",
        "gwaio_upgrade_subcommander_duplication",
        "gwaio_upgrade_subcommander_fabber",
        "gwaio_upgrade_subcommander_tactics",
        "gwaio_upgrade_sxx",
        "gwaio_upgrade_teleporter",
        "gwaio_upgrade_torpedolauncher",
        "gwaio_upgrade_typhoon",
        "gwaio_upgrade_ubercannon_structure",
        "gwaio_upgrade_umbrella",
        "gwaio_upgrade_unitcannon",
        "gwaio_upgrade_vanguard",
        "gwaio_upgrade_vehiclefactory",
        "gwaio_upgrade_wall",
        "gwaio_upgrade_ward",
        "gwaio_upgrade_wyrm",
        "gwaio_upgrade_zeus",
        // not enabled in vanilla GW
        "gwc_cost_intel",
        "gwc_energy_efficiency_intel",
        "gwc_energy_efficiency_weapons",
      ];

      if (!model.gwoCards) {
        model.gwoCards = [];
      }

      if (
        !gwoSettings || // non-GWO saves
        !gwoSettings.techCardDeck || // v5.35.0 and earlier
        gwoSettings.techCardDeck === "Expanded"
      ) {
        return model.gwoCards.concat(basicCards, expandedCards);
      }

      return model.gwoCards.concat(basicCards);
    };

    const setupGwoDeck = function (cards, deck, cardsRemaining, promise) {
      _.forEach(model.gwoCards, function (cardId) {
        requireGW(["cards/" + cardId], function (card) {
          card.id = cardId;
          cards.push(card);
          deck.push(cardId);
          --cardsRemaining;
          if (cardsRemaining === 0) {
            promise.resolve();
          }
        });
      });
    };

    const doNotDealCard = function (
      inventory,
      card,
      cardsDealt,
      dealAddSlot,
      testRun
    ) {
      // Never deal Additional Data Bank as a system's pre-dealt card
      if (card.id === "gwc_add_card_slot" && dealAddSlot === false) {
        return true;
      }

      if (testRun) {
        return (
          inventory.hasCard(card.id) &&
          _.some(cardsDealt, { id: card.id }) &&
          _.some(model.currentSystemCardList(), { id: card.id })
        );
      }

      return (
        inventory.hasCard(card.id) ||
        _.some(cardsDealt, { id: card.id }) ||
        _.some(model.currentSystemCardList(), function (systemCard) {
          return systemCard.id() === card.id;
        })
      );
    };

    const setCardName = function (system, card) {
      const deferred = $.Deferred();
      if (!_.isEmpty(card)) {
        requireGW(["cards/" + card[0].id], function (data) {
          system.star.ai().cardName = loc(data.summarize());
          deferred.resolve();
        });
      }
      return deferred.promise();
    };

    const isCardLoadout = function (card) {
      return _.includes(card.id, "_start_");
    };

    const testCardForMatches = function (inventory, card) {
      model.currentSystemCardList().push(card);

      const cardsDealt = [card];
      const duplicate = doNotDealCard(inventory, card, cardsDealt, false, true);

      if (!duplicate) {
        console.error(card.id, "failed duplication test");
      }
    };

    const applyCheatCards = function (product, inventory) {
      inventory.cards.push(product);
      inventory.applyCards();
    };

    const setupNewCardSlot = function (product) {
      product.allowOverflow = true;
      product.unique = Math.random();

      return product;
    };

    const filterStartLoadoutCards = function (cards) {
      return _.filter(cards || [], function (card) {
        return isCardLoadout(card);
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
      ],
      function (GW, GWFactions, gwoAI, gwoSave, gwoBank, GWInventory) {
        const inventory = game.inventory();
        const playerFaction = inventory.getTag("global", "playerFaction");
        const galaxy = game.galaxy();
        const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

        /* Start of GWO implementation of GWDealer */

        model.gwoCards = setupGwoCards(gwoSettings);

        const cards = [];
        const deck = [];
        const numberOfCards = model.gwoCards.length;
        const loaded = $.Deferred();

        setupGwoDeck(cards, deck, numberOfCards, loaded);

        // GWDealer.chooseCards - use our deck
        const chooseCards = function (params) {
          const rng = params.rng || new Math.seedrandom();
          const count = params.count;
          const star = params.star;
          const dealAddSlot = params.addSlot;
          const dealInventory = params.inventory || inventory;
          const cardContexts = {};

          const result = $.Deferred();
          loaded.then(function () {
            _.forEach(cards, function (card) {
              if (card.getContext && !cardContexts[card.id]) {
                cardContexts[card.id] = card.getContext(galaxy, dealInventory);
              }
            });

            const list = [];

            _.times(count, function () {
              var fullHand = _.map(cards, function (card) {
                const context = cardContexts[card.id];
                const cardChance =
                  card.deal && card.deal(star, context, dealInventory);
                const match = doNotDealCard(
                  dealInventory,
                  card,
                  list,
                  dealAddSlot,
                  false
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

                const probability = _.reduce(
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
                  roll >= hand[index].chance && index < hand.length;
                  ++index
                ) {
                  roll -= hand[index].chance;
                }
                if (index < hand.length) {
                  resultIndex = hand[index].index;
                }

                if (!_.isUndefined(resultIndex)) {
                  const resultDeal = fullHand[resultIndex];
                  const cardParams = resultDeal && resultDeal.params;
                  const cardId = deck[resultIndex];
                  const systemCard = {
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

        const rerollPendingTechRequest = "gwo_reroll_pending_tech";
        const rerollPendingTechResult = "gwo_reroll_pending_tech_result";

        const sendPendingTechRerollResult = function (
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

        const failPendingTechReroll = function (operator, reason) {
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

        const applyPendingTechRerollResult = function (operator) {
          const payload = operator.payload || {};
          model.gwoRerollPending(false);
          model.scanning(false);

          if (payload.error) {
            console.error(
              "[GW COOP] pending tech reroll failed: " + payload.error
            );
            return;
          }

          const pendingTechCards = payload.pendingTechCards;
          if (
            !pendingTechCards ||
            !_.isNumber(pendingTechCards.star) ||
            !_.isArray(pendingTechCards.cards)
          ) {
            console.error("[GW COOP] invalid pending tech reroll result");
            return;
          }

          const record = game.findCoopPlayerInventoryData({
            id: payload.client_id,
            name: payload.client_name,
          });
          if (!record || !record.inventory) {
            console.error(
              "[GW COOP] missing inventory for pending tech reroll result"
            );
            return;
          }

          const nextRecord = _.assign({}, _.cloneDeep(record), {
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

        const rerollPendingTechForCoopPlayer = function (operator) {
          if (
            !model.isCampaignHost() ||
            !model.gwCampaignPerPlayerTechCards()
          ) {
            return;
          }

          const payload = operator.payload || {};
          const record = game.findCoopPlayerInventoryData({
            id: operator.client_id,
            name: operator.client_name,
          });

          if (!record || !record.inventory || !record.pendingTechCards) {
            failPendingTechReroll(operator, "missing pending tech cards");
            return;
          }

          const pendingTechCards = record.pendingTechCards;
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

          const star = galaxy.stars()[pendingTechCards.star];
          if (!star) {
            failPendingTechReroll(operator, "missing pending tech star");
            return;
          }

          const playerInventory = new GWInventory();
          playerInventory.load(_.cloneDeep(record.inventory));

          const dealCards = function () {
            const cardsOffered = cardsOfferedCount(
              numCardsToOffer,
              playerInventory
            );
            const rerollsUsed = Math.max(
              0,
              cardsOffered - pendingTechCards.cards.length
            );
            const nextRerollsUsed = rerollsUsed + 1;

            if (nextRerollsUsed > cardsOffered - 1) {
              failPendingTechReroll(operator, "no pending tech rerolls remain");
              return;
            }

            const cardCount = cardsOffered - nextRerollsUsed;
            chooseCards({
              inventory: playerInventory,
              count: cardCount,
              star: star,
            }).then(function (cards) {
              const updatedAt = _.now();
              const nextPendingTechCards = {
                star: pendingTechCards.star,
                cards: cards || [],
                dealIndex: pendingTechCards.dealIndex,
                cardsOffered: cardsOffered,
                rerollsUsed: nextRerollsUsed,
                updatedAt: updatedAt,
              };
              const nextRecord = _.assign({}, _.cloneDeep(record), {
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
        }

        const dealCardToSelectableAI = function (win, turnState) {
          const deferred = $.Deferred();

          // Avoid running twice after winning a fight
          if (!win || turnState === "end") {
            const deferredQueue = [];

            _.forEach(model.galaxy.systems(), function (system, starIndex) {
              const ai = system.star.ai();
              const treasurePlanet = ai && ai.treasurePlanet;
              const loadoutPresent =
                treasurePlanet &&
                !_.isEmpty(system.star.cardList()) &&
                isCardLoadout(system.star.cardList()[0]);
              const validForDeal =
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
                  }).then(function (card) {
                    system.star.cardList(card);
                    model.sendCampaignAction("sync_star_cards", {
                      star: system.star,
                      cards: system.star.cardList(),
                    });
                    return setCardName(system, card);
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

        const setupGeneralCommander = function () {
          const cards = inventory.cards();
          if (
            cards.length === 1 &&
            cards[0].id === "gwc_start_subcdr" &&
            !cards[0].minions
          ) {
            const subcommanderAI = gwoSettings && gwoSettings.aiAlly;
            _.times(2, function () {
              const subcommander = _.cloneDeep(
                _.sample(GWFactions[playerFaction].minions)
              );
              if (subcommanderAI === "Penchant") {
                const penchantValues = gwoAI.penchants();
                subcommander.character =
                  subcommander.character +
                  (" " + loc(penchantValues.penchantName));
                subcommander.personality.personality_tags =
                  subcommander.personality.personality_tags.concat(
                    penchantValues.penchants
                  );
              }
              cards.push({
                id: "gwc_minion",
                minion: subcommander,
                unique: Math.random(),
              });
            });
            inventory.applyCards();
            gwoSave(game, false);
          }
        };
        setupGeneralCommander();

        const dealCardToSelectableAIWhenWarStarts = function (settings) {
          if (settings && !settings.firstDealComplete) {
            settings.firstDealComplete = true;
            dealCardToSelectableAI(false).then(function () {
              gwoSave(game, true);
            });
          }
        };
        dealCardToSelectableAIWhenWarStarts(gwoSettings);

        /* Cheat code start */

        // Cheats use our deck
        const dealCard = function (params) {
          const result = $.Deferred();
          loaded.then(function () {
            const card = _.find(model.gwoCards, function (cardId) {
              return cardId === params.id;
            });

            // Simulate a deal
            const context =
              card.getContext &&
              card.getContext(params.galaxy, params.inventory);

            const deal = card.deal && card.deal(params.star, context);
            const product = { id: params.id };
            const cardParams = deal && deal.params;
            if (cardParams && _.isObject(cardParams)) {
              _.assign(product, cardParams);
            }
            card.keep && card.keep(deal, context);
            card.releaseContext && card.releaseContext(context);

            result.resolve(product);
          });
          return result;
        };

        /* end of GWO implementation of GWDealer */

        const testMinions = function (product, inventory) {
          _.forEach(GWFactions, function (faction) {
            _.forEach(faction.minions, function (minion) {
              const minionStock = _.cloneDeep(product);
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
                const clusterSecurity = gwoUnit.colonel;
                const clusterWorker = gwoUnit.angel;

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

        const dealSubCommander = function (product) {
          const subcommander = _.cloneDeep(
            _.sample(GWFactions[playerFaction].minions)
          );
          const subcommanderAI = gwoSettings && gwoSettings.aiAlly;

          if (subcommanderAI === "Penchant") {
            const penchantValues = gwoAI.penchants();
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

        const expandInventorySize = function (
          galaxy,
          inventory,
          star,
          maxCards
        ) {
          const sizeDifference = inventory.cards().length - maxCards;
          _.times(sizeDifference, function () {
            dealCard({
              id: "gwc_add_card_slot",
              galaxy: galaxy,
              inventory: inventory,
              star: star,
            }).then(function (product) {
              product = setupNewCardSlot(product);
              applyCheatCards(product, inventory);
            });
          });
        };

        // We need cheats to deal from our deck
        model.cheats.testCards = function () {
          const star = galaxy.stars()[game.currentStar()];
          const maxCards = inventory.maxCards() + 1; // start card doesn't use a slot

          _.forEach(model.gwoCards, function (cardId) {
            dealCard({
              id: cardId,
              galaxy: galaxy,
              inventory: inventory,
              star: star,
            }).then(function (product) {
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
          const id = model.cheats.giveCardId();
          const cardId = _.find(model.gwoCards, function (card) {
            return card === id;
          });

          if (cardId) {
            dealCard({
              id: cardId,
              galaxy: galaxy,
              inventory: inventory,
              star: galaxy.stars()[game.currentStar()],
            }).then(function (product) {
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
        model.explore = function () {
          if (
            !game ||
            !game.explore() ||
            (model.isCampaignViewer() && !model.gwCampaignReplayingAction) ||
            model.gwCampaignPlayerSetupBlocked()
          ) {
            return;
          }

          if (!model.gwCampaignReplayingAction) {
            model.sendCampaignAction("explore", { star: game.currentStar() });
          }

          model.scanning(true);

          api.audio.playSound("/VO/Computer/gw/board_exploring");

          var cardsOffered = cardsOfferedCount(numCardsToOffer);
          const star = game.galaxy().stars()[game.currentStar()];
          const startLoadoutCards = filterStartLoadoutCards(
            star && _.isFunction(star.cardList) ? star.cardList() : []
          );
          const dealStarCards = chooseCards({
            count:
              cardsOffered - model.gwoRerollsUsed() - star.cardList().length,
            star: star,
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
              const cardList = result.concat(star.cardList());
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

          const techCard = actionCardList && actionCardList[selectedCardIndex];
          const techAudio =
            techCard && techCard.audio() ? techCard.audio().found : null;
          const playTechAudio = !!techCard;

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
