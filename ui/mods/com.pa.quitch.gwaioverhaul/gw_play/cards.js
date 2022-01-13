var gwaioCardsLoaded;

if (!gwaioCardsLoaded) {
  gwaioCardsLoaded = true;

  function gwaioCards() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
        // Allow player to delete tech cards whenever they want and add tooltips
        // showing units affected by the cards
        $("#hover-card").replaceWith(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_inventory.html"
          )
        );
        locTree($("#hover-card"));
        $("#system-card").replaceWith(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system.html"
          )
        );
        locTree($("#system-card"));

        var numCardsToOffer = 3;

        model.gwaioOfferRerolls = ko.observable(true);
        model.gwaioRerollsUsed = ko
          .observable(0)
          .extend({ session: "gwaio_rerolls_used" }); // prevent UI refresh exploits
        var star = {};
        // Clean start for new games in a single session
        if (game.turnState() === "begin") {
          model.gwaioRerollsUsed(0);
        }
        // Avoid incorrect rerolls when loading an exploration save game
        else if (game.turnState() === "explore") {
          star = game.galaxy().stars()[game.currentStar()];
          model.gwaioRerollsUsed = ko.observable(
            numCardsToOffer - star.cardList().length
          );
          if (
            model.gwaioRerollsUsed() >= numCardsToOffer - 1 ||
            (self.isLoadout && self.isLoadout())
          ) {
            model.gwaioOfferRerolls(false);
          }
        }
        ko.computed(function () {
          game.turnState();
          if (game.turnState() === "end") {
            model.gwaioRerollsUsed(0);
            model.gwaioOfferRerolls(true);
          }
        });
        model.rerollTech = function () {
          var cardsOffered = 0;
          if (game.inventory().handIsFull()) {
            cardsOffered = numCardsToOffer + 1;
          } else {
            cardsOffered = numCardsToOffer;
          }
          star = game.galaxy().stars()[game.currentStar()];
          model.gwaioRerollsUsed(model.gwaioRerollsUsed() + 1);
          if (model.gwaioRerollsUsed() >= cardsOffered - 1) {
            model.gwaioOfferRerolls(false);
          }
          star.cardList([]);
          game.turnState("begin");
          model.explore();
        };
        $(".div_options_bar").replaceWith(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system_reroll.html"
          )
        );
        locTree($(".div_options_bar"));

        requireGW(
          [
            "shared/gw_common",
            "shared/gw_factions",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
          ],
          function (
            GW,
            GWFactions,
            gwaioCardsToUnits,
            gwaioUnitsToNames,
            gwaioAI,
            gwaioSave,
            gwaioBank
          ) {
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
                    card.visible === true ||
                      !!(card.visible && card.visible(data))
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

            var inventory = game.inventory();
            var playerFaction = 0;

            /* Start of GWO implementation of GWDealer */
            if (!model.gwaioDeck) {
              model.gwaioDeck = [];
            }
            model.gwaioDeck.push(
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
              "gwc_cost_intel",
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
              "gwc_energy_efficiency_intel",
              "gwc_energy_efficiency_weapons",
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
              "gwc_storage_and_buff"
            );

            var cards = [];
            var cardContexts = {};

            var loadCount = model.gwaioDeck.length;
            var loaded = $.Deferred();

            var deck = [];
            _.forEach(model.gwaioDeck, function (cardId) {
              requireGW(["cards/" + cardId], function (card) {
                card.id = cardId;
                cards.push(card);
                deck.push(cardId);
                --loadCount;
                if (loadCount === 0) {
                  loaded.resolve();
                }
              });
            });

            var galaxy = model.game().galaxy();

            // GWDealer.chooseCards - use our deck
            var chooseCards = function (params) {
              inventory = params.inventory;
              var rng = params.rng || new Math.seedrandom();
              var count = params.count;
              star = params.star;
              galaxy = params.galaxy;
              var dealAddSlot = params.addSlot;

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

                    var match =
                      inventory.hasCard(card.id) ||
                      _.some(list, { id: card.id }) ||
                      // Never deal Additional Data Bank as a system's pre-dealt card
                      (card.id === "gwc_add_card_slot" &&
                        dealAddSlot === false);

                    var cardChance =
                      card.deal && card.deal(star, context, inventory);
                    if (match) {
                      cardChance.chance = 0;
                    }

                    return cardChance;
                  });

                  fullHand = _.map(fullHand, function (deal, i) {
                    deal.index = i;
                    return deal;
                  });

                  hand = _.filter(fullHand, function (deal) {
                    if (!deal) {
                      return false;
                    }

                    if (!deal.chance) {
                      return false;
                    }

                    return true;
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

                    if (resultIndex !== undefined) {
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
              requireGW(["cards/" + card[0].id], function (data) {
                var cardName = loc(data.summarize());
                system.star.ai().cardName = cardName;
                deferred.resolve();
              });
              return deferred.promise();
            };

            var dealCardSelectableAI = function (win, turnState) {
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

            // Deal some cards when the war starts
            var dealFirstCardSelectableAI = function (settings) {
              if (settings && !settings.firstDealComplete) {
                settings.firstDealComplete = true;
                dealCardSelectableAI(false).then(function () {
                  gwaioSave(game, true);
                });
              }
            };

            // Deal the General Commander's minions as cards to the inventory for GWO v4.3.0+
            if (
              inventory.cards().length === 1 &&
              inventory.cards()[0].id === "gwc_start_subcdr" &&
              !inventory.cards()[0].minions
            ) {
              _.times(2, function () {
                playerFaction = inventory.getTag("global", "playerFaction");
                var subcommander = _.cloneDeep(
                  _.sample(GWFactions[playerFaction].minions)
                );
                galaxy = game.galaxy();
                var ai = galaxy.stars()[galaxy.origin()].system().gwaio.ai;
                if (ai === "Penchant") {
                  var penchantValues = gwaioAI.penchants();
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
              // This will also trigger a save
              dealFirstCardSelectableAI(
                galaxy.stars()[galaxy.origin()].system().gwaio
              );
            }

            dealFirstCardSelectableAI(
              galaxy.stars()[galaxy.origin()].system().gwaio
            );

            // Cheats use our deck
            var dealCard = function (params) {
              var result = $.Deferred();
              loaded.then(function () {
                var card = _.find(model.gwaioDeck, function (cardId) {
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

            // We need cheats to deal from our deck
            model.cheats.testCards = function () {
              star = game.galaxy().stars()[game.currentStar()];
              _.forEach(model.gwaioDeck, function (cardId) {
                console.log("Testing " + cardId);
                dealCard({
                  id: cardId,
                  galaxy: game.galaxy(),
                  inventory: game.inventory(),
                  star: star,
                }).then(function (product) {
                  if (product.id === "gwc_minion") {
                    _.forEach(GWFactions, function (faction) {
                      _.forEach(faction.minions, function (minion) {
                        var minionStock = _.cloneDeep(product);
                        minionStock.minion = minion;
                        game.inventory().cards.push(minionStock);
                        game.inventory().cards.pop();
                        if (!minionStock.minion.commander) {
                          // This will use the player's commander
                          return;
                        }
                        require([
                          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
                        ], function (gwaioUnits) {
                          var clusterSecurity = gwaioUnits.colonel;
                          var clusterWorker = gwaioUnits.angel;

                          if (
                            !CommanderUtility.bySpec.getObjectName(
                              minionStock.minion.commander
                            ) &&
                            minionStock.minion.commander !== clusterSecurity &&
                            minionStock.minion.commander !== clusterWorker
                          ) {
                            console.error(
                              "Minion commander unitspec " +
                                minionStock.minion.commander +
                                " invalid"
                            );
                          }
                        });
                      });
                    });
                  } else {
                    game.inventory().cards.push(product);
                    inventory.applyCards();
                    game.inventory().cards.pop();
                  }
                });
              });
            };

            model.cheats.giveCard = function () {
              var id = model.cheats.giveCardId();
              var cardId = _.find(model.gwaioDeck, function (card) {
                return card === id;
              });
              galaxy = game.galaxy();

              if (_.isUndefined(cardId)) {
                console.error(
                  "Unable to find a card called " + model.cheats.giveCardId()
                );
              } else {
                dealCard({
                  id: cardId,
                  galaxy: galaxy,
                  inventory: game.inventory(),
                  star: galaxy.stars()[game.currentStar()],
                }).then(function (product) {
                  if (product.id === "gwc_minion") {
                    var minion = _.cloneDeep(
                      _.sample(GWFactions[playerFaction].minions)
                    );
                    var ai = galaxy.stars()[galaxy.origin()].system().gwaio.ai;
                    if (ai === "Penchant") {
                      var penchantValues = gwaioAI.penchants();
                      minion.character =
                        minion.character +
                        (" " + loc(penchantValues.penchantName));
                      minion.personality.personality_tags =
                        minion.personality.personality_tags.concat(
                          penchantValues.penchants
                        );
                    }
                    product.minion = minion;
                    product.unique = Math.random();
                  } else if (product.id === "gwc_add_card_slot") {
                    product.allowOverflow = true;
                    product.unique = Math.random();
                  }
                  game.inventory().cards.push(product);
                  inventory.applyCards();
                  dealCardSelectableAI(false).then(function () {
                    gwaioSave(game, true);
                  });
                });
              }
            };

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
              star = game.galaxy().stars()[game.currentStar()];
              var dealStarCards = chooseCards({
                inventory: inventory,
                count:
                  cardsOffered -
                  model.gwaioRerollsUsed() -
                  star.cardList().length,
                star: star,
                galaxy: game.galaxy(),
              }).then(function (result) {
                var ok = true;

                _.forEach(star.cardList(), function (card) {
                  if (
                    _.includes(card.id, "_start_") &&
                    !GW.bank.hasStartCard(card) &&
                    !gwaioBank.hasStartCard(card)
                  ) {
                    ok = false;
                  }
                });

                if (ok) {
                  var cardList = result.concat(star.cardList());
                  star.cardList(cardList);
                }
              });
              $.when(dealStarCards).then(function () {
                if (model.currentSystemCardList()[0].isLoadout()) {
                  model.gwaioOfferRerolls(false);
                }
                gwaioSave(game, false);
                _.delay(function () {
                  model.scanning(false);
                }, 2000);
              });
            };

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

                dealCardSelectableAI(true, game.turnState())
                  .then(function () {
                    return gwaioSave(game, true);
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

            if (model.gwaioCardsToUnits) {
              model.gwaioCardsToUnits = model.gwaioCardsToUnits.concat(
                gwaioCardsToUnits.cards
              );
            } else {
              model.gwaioCardsToUnits = gwaioCardsToUnits.cards;
            }

            model.gwaioTechCardTooltip = ko.observableArray([]);

            var makeCardTooltip = function (card, hoverIndex) {
              if (card.isLoadout()) {
                return;
              }
              // Ensure inventory hovers work at the same time as the new tech display
              if (hoverIndex === undefined) {
                hoverIndex = 0;
              } else {
                hoverIndex += 1;
              }
              var cardId = card.id();
              var cardIndex = _.findIndex(model.gwaioCardsToUnits, {
                id: cardId,
              });
              if (cardIndex === -1) {
                if (cardId === undefined) {
                  return;
                } else {
                  console.warn(
                    cardId +
                      " is invalid or missing from model.gwaioCardsToUnits"
                  );
                }
              } else {
                var units = model.gwaioCardsToUnits[cardIndex].units;
                if (units) {
                  var affectedUnits = [];
                  // TODO: replace with $.getJSON() to get this info from the source?
                  _.forEach(units, function (unit) {
                    cardIndex = _.findIndex(gwaioUnitsToNames.units, {
                      path: unit,
                    });
                    if (cardIndex === -1) {
                      console.warn(
                        unit + " is invalid or missing from GWO unit_names.js"
                      );
                    } else {
                      var name = loc(gwaioUnitsToNames.units[cardIndex].name);
                      affectedUnits = affectedUnits.concat(name);
                    }
                  });
                  affectedUnits = affectedUnits.sort();
                  model.gwaioTechCardTooltip()[hoverIndex] = _.map(
                    affectedUnits,
                    function (unit, index) {
                      if (affectedUnits.length < 13) {
                        return unit.concat("<br>");
                      } else if (index < affectedUnits.length - 1) {
                        return unit.concat("; ");
                      } else {
                        return unit;
                      }
                    }
                  );
                } else {
                  model.gwaioTechCardTooltip()[hoverIndex] = undefined;
                }
              }
            };

            model.showSystemCard.subscribe(function () {
              if (model.showSystemCard()) {
                model.currentSystemCardList().forEach(makeCardTooltip);
              }
            });
            // Ensure the tooltip is shown even if the UI is refreshed
            if (model.showSystemCard()) {
              model.currentSystemCardList().forEach(makeCardTooltip);
            }

            var hoverCount = 0;
            model.setHoverCard = function (card, hoverEvent) {
              if (card === model.hoverCard()) {
                card = undefined;
              }
              ++hoverCount;

              if (!card) {
                // Delay clears for a bit to avoid flashing
                var oldCount = hoverCount;
                _.delay(function () {
                  if (oldCount !== hoverCount) {
                    return;
                  }
                  model.hoverCard(undefined);
                }, 300);
                return;
              } else {
                makeCardTooltip(card);
              }

              var $block = $(hoverEvent.target);
              if (!$block.is(".one-card")) {
                $block = $block.parent(".one-card");
              }
              var left = $block.offset().left + $block.width() / 2;
              model.hoverOffset(left.toString() + "px");
              model.hoverCard(card);
            };
          }
        );
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioCards();
}
