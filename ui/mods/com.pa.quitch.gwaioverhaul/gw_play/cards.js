var gwoCardsLoaded;

if (!gwoCardsLoaded) {
  gwoCardsLoaded = true;

  function gwoCard() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
        // Allow tech cards to be deleted at any time
        $("#hover-card").replaceWith(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_inventory.html"
          )
        );
        locTree($("#hover-card"));

        // Used by cards checking for T2 access - global var for modders
        model.cardsGrantingAdvancedTech = [
          "gwc_enable_air_all",
          "gwc_enable_bots_all",
          "gwc_enable_sea_all",
          "gwc_enable_vehicles_all",
          "gwaio_upgrade_fabricationaircraft",
          "gwaio_upgrade_fabricationbot",
          "gwaio_upgrade_fabricationship",
          "gwaio_upgrade_fabricationvehicle",
        ];

        var numCardsToOffer = 3;

        model.rerollTech = function () {
          var cardsOffered = 0;
          if (game.inventory().handIsFull()) {
            cardsOffered = numCardsToOffer + 1;
          } else {
            cardsOffered = numCardsToOffer;
          }
          var star = game.galaxy().stars()[game.currentStar()];
          model.gwoRerollsUsed(model.gwoRerollsUsed() + 1);
          if (model.gwoRerollsUsed() >= cardsOffered - 1) {
            model.gwoOfferRerolls(false);
          }
          star.cardList([]);
          game.turnState("begin");
          model.explore();
        };

        var setupTechRerolls = function () {
          model.gwoOfferRerolls = ko.observable(true);
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
            }
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
              self.iconPlaceholder(
                !self.icon() && (self.summary() || self.desc())
              );
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

        var setupGwoCards = function (gwoSettings) {
          var basicCards = [
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
          var expandedCards = [
            "gwaio_enable_planetaryradar",
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

        var setupGwoDeck = function (cards, deck, cardsRemaining, promise) {
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

        requireGW(
          [
            "shared/gw_common",
            "shared/gw_factions",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
          ],
          function (GW, GWFactions, gwoAI, gwoSave, gwoBank) {
            var inventory = game.inventory();
            var playerFaction = inventory.getTag("global", "playerFaction");
            var galaxy = game.galaxy();
            var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

            /* Start of GWO implementation of GWDealer */

            model.gwoCards = setupGwoCards(gwoSettings);

            var cards = [];
            var deck = [];
            var numberOfCards = model.gwoCards.length;
            var loaded = $.Deferred();

            setupGwoDeck(cards, deck, numberOfCards, loaded);

            var doNotDealCard = function (
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

            // GWDealer.chooseCards - use our deck
            var chooseCards = function (params) {
              inventory = params.inventory;
              var rng = params.rng || new Math.seedrandom();
              var count = params.count;
              var star = params.star;
              galaxy = params.galaxy;
              var dealAddSlot = params.addSlot;
              var cardContexts = {};

              var result = $.Deferred();
              loaded.then(function () {
                _.forEach(cards, function (card) {
                  if (card.getContext && !cardContexts[card.id]) {
                    cardContexts[card.id] = card.getContext(galaxy, inventory);
                  }
                });

                var list = [];

                _.times(count, function () {
                  var fullHand = [];
                  var hand = [];

                  fullHand = _.map(cards, function (card) {
                    var context = cardContexts[card.id];
                    var cardChance =
                      card.deal && card.deal(star, context, inventory);
                    var match = doNotDealCard(
                      inventory,
                      card,
                      list,
                      dealAddSlot,
                      false
                    );

                    if (match) {
                      cardChance.chance = 0;
                    }

                    console.log(card.id, cardChance);

                    return cardChance;
                  });

                  fullHand = _.map(fullHand, function (deal, i) {
                    deal.index = i;
                    return deal;
                  });

                  hand = _.filter(fullHand, function (deal) {
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
                      roll >= hand[index].chance && index < hand.length;
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

            var setCardName = function (system, card) {
              var deferred = $.Deferred();
              if (!_.isEmpty(card)) {
                requireGW(["cards/" + card[0].id], function (data) {
                  var cardName = loc(data.summarize());
                  system.star.ai().cardName = cardName;
                  deferred.resolve();
                });
              }
              return deferred.promise();
            };

            var dealCardToSelectableAI = function (win, turnState) {
              var deferred = $.Deferred();

              // Avoid running twice after winning a fight
              if (!win || turnState === "end") {
                var deferredQueue = [];

                _.forEach(model.galaxy.systems(), function (system, starIndex) {
                  if (
                    model.canSelect(starIndex) &&
                    system.star.ai() &&
                    system.star.ai().treasurePlanet !== true
                  ) {
                    deferredQueue.push(
                      chooseCards({
                        inventory: inventory,
                        count: 1,
                        star: system.star,
                        galaxy: game.galaxy(),
                        addSlot: false,
                      }).then(function (card) {
                        system.star.cardList(card);
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

            var setupGeneralCommander = function () {
              if (
                inventory.cards().length === 1 &&
                inventory.cards()[0].id === "gwc_start_subcdr" &&
                !inventory.cards()[0].minions
              ) {
                var ai = gwoSettings && gwoSettings.ai;
                _.times(2, function () {
                  var subcommander = _.cloneDeep(
                    _.sample(GWFactions[playerFaction].minions)
                  );
                  if (ai === "Penchant") {
                    var penchantValues = gwoAI.penchants();
                    subcommander.character =
                      subcommander.character +
                      (" " + loc(penchantValues.penchantName));
                    subcommander.personality.personality_tags =
                      subcommander.personality.personality_tags.concat(
                        penchantValues.penchants
                      );
                  }
                  inventory.cards().push({
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

            var dealCardToSelectableAIWhenWarStarts = function (settings) {
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
            var dealCard = function (params) {
              var result = $.Deferred();
              loaded.then(function () {
                var card = _.find(model.gwoCards, function (cardId) {
                  return cardId === params.id;
                });

                // Simulate a deal
                var context =
                  card.getContext &&
                  card.getContext(params.galaxy, params.inventory);

                var deal = card.deal && card.deal(params.star, context);
                var product = { id: params.id };
                var cardParams = deal && deal.params;
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
              var ai = gwoSettings && gwoSettings.ai;

              if (ai === "Penchant") {
                var penchantValues = gwoAI.penchants();
                subcommander.character =
                  subcommander.character +
                  (" " + loc(penchantValues.penchantName));
                subcommander.personality.personality_tags =
                  subcommander.personality.personality_tags.concat(
                    penchantValues.penchants
                  );
              }
              product.minion = subcommander;
              product.unique = Math.random();

              return product;
            };

            var testCardForMatches = function (inventory, card) {
              model.currentSystemCardList().push(card);

              var cardsDealt = [card];
              var duplicate = doNotDealCard(
                inventory,
                card,
                cardsDealt,
                false,
                true
              );

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

            var expandInventorySize = function (
              galaxy,
              inventory,
              star,
              maxCards
            ) {
              var sizeDifference = inventory.cards().length - maxCards;
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
              galaxy = game.galaxy();
              var star = galaxy.stars()[game.currentStar()];
              inventory = game.inventory();
              var maxCards = inventory.maxCards() + 1; // start card doesn't use a slot

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
              var id = model.cheats.giveCardId();
              var cardId = _.find(model.gwoCards, function (card) {
                return card === id;
              });
              galaxy = game.galaxy();
              inventory = game.inventory();

              if (_.isUndefined(cardId)) {
                console.error(
                  "Unable to find a card called " + model.cheats.giveCardId()
                );
              } else {
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
              }
            };

            /* Cheat code end */

            // gw_play self.explore - call our chooseCards function
            model.explore = function () {
              if (!game || !game.explore()) {
                return;
              }

              model.scanning(true);

              api.audio.playSound("/VO/Computer/gw/board_exploring");

              inventory = game.inventory();

              var cardsOffered = 0;
              if (inventory.handIsFull()) {
                cardsOffered = numCardsToOffer + 1;
              } else {
                cardsOffered = numCardsToOffer;
              }
              var star = game.galaxy().stars()[game.currentStar()];
              var dealStarCards = chooseCards({
                inventory: inventory,
                count:
                  cardsOffered -
                  model.gwoRerollsUsed() -
                  star.cardList().length,
                star: star,
                galaxy: game.galaxy(),
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
              });
              $.when(dealStarCards).then(function () {
                if (model.currentSystemCardList()[0].isLoadout()) {
                  model.gwoOfferRerolls(false);
                }
                gwoSave(game, false);
                _.delay(function () {
                  model.scanning(false);
                }, 2000);
              });
            };

            // call dealCardToSelectableAI() so system cards update when player acquires a card
            model.win = function (selectedCardIndex) {
              model.exitGate($.Deferred());

              var techCard = model.currentSystemCardList()[selectedCardIndex];
              var techAudio =
                techCard && techCard.audio() ? techCard.audio().found : null;
              var playTechAudio = !!techCard;

              game.winTurn(selectedCardIndex).then(function (didWin) {
                if (!didWin) {
                  console.error("Failed winning turn", game);
                  return;
                }

                model.maybePlayCaptureSound();

                dealCardToSelectableAI(true, game.turnState())
                  .then(function () {
                    return gwoSave(game, true);
                  })
                  .then(function () {
                    if (model.gameOver()) {
                      api.tally
                        .incStatInt("gw_war_victory")
                        .always(function () {
                          model.exitGate().resolve();
                        });
                    } else {
                      model.exitGate().resolve();

                      if (playTechAudio) {
                        if (!techAudio) {
                          api.audio.playSound(
                            "/VO/Computer/gw/board_tech_acquired"
                          );
                        } else {
                          api.audio.playSound(techAudio);
                        }
                      }
                    }
                  });
              });
            };
          }
        );
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoCard();
}
