var gwaioCardsLoaded;

if (!gwaioCardsLoaded) {
  gwaioCardsLoaded = true;

  function gwaioCards() {
    try {
      if (!model.game().isTutorial()) {
        globals.CardViewModel = function (params) {
          var self = this;

          self.params = ko.observable(params);
          self.id = ko.pureComputed(function () {
            var p = self.params();
            return _.isObject(p) ? p.id : p;
          });

          self.visible = ko.observable(false);
          self.desc = ko.observable();
          self.locDesc = ko.pureComputed(function () {
            return loc(self.desc());
          });
          self.summary = ko.observable();
          self.icon = ko.observable();
          self.iconPlaceholder = ko.observable(); // Displayed when the icon is empty
          self.audio = ko.observable();

          self.isEmpty = ko.pureComputed(function () {
            return !self.id();
          });
          // GWAIO - recognise the mod's loadouts as loadouts
          self.isLoadout = ko.pureComputed(function () {
            return (
              self.id() &&
              (self.id().startsWith("gwc_start") ||
                self.id().startsWith("gwaio_start") ||
                self.id().startsWith("nem_start") ||
                self.id().startsWith("tgw_start"))
            );
          });

          var loaded = $.Deferred();
          self.card = loaded.promise();

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
            loaded.resolve(card);
          };

          var loadToken = 0;
          ko.computed(function () {
            var data = self.params();
            ++loadToken;
            var myToken = loadToken;
            var cardId = self.id();
            if (cardId) {
              requireGW(["cards/" + cardId], function (card) {
                if (loadToken !== myToken) return;
                loadCard(card, data);
              });
            } else loadCard({}, data);
          });
        };

        // Allow player to delete tech cards whenever they want and add tooltips showing units affected by the cards
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

        requireGW(
          [
            "shared/gw_common",
            "shared/gw_factions",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
          ],
          function (
            GW,
            GWFactions,
            gwaioBank,
            gwaioCardsToUnits,
            gwaioUnitsToNames
          ) {
            // Deal the General Commander's minions as cards to the inventory for GWAIO v4.3.0+
            if (
              model.game().inventory().cards().length === 1 &&
              model.game().inventory().cards()[0].id === "gwc_start_subcdr" &&
              !model.game().inventory().cards()[0].minions
            ) {
              var playerFaction = model
                .game()
                .inventory()
                .getTag("global", "playerFaction");
              _.times(2, function () {
                var subCommander = _.sample(GWFactions[playerFaction].minions);
                model.game().inventory().cards().push({
                  id: "gwc_minion",
                  minion: subCommander,
                  unique: Math.random(),
                });
              });
              model.game().inventory().applyCards();
              model.driveAccessInProgress(true);
              GW.manifest.saveGame(model.game()).then(function () {
                model.driveAccessInProgress(false);
              });
            }

            /* Start of GWAIO implementation of GWDealer */
            if (!model.gwaioDeck) model.gwaioDeck = [];
            model.gwaioDeck.push(
              "gwaio_enable_bot_aa",
              "gwaio_upgrade_advancedlaserdefensetower",
              "gwaio_upgrade_advancedradar",
              "gwaio_upgrade_advancedradarsatellite",
              "gwaio_upgrade_advancedtorpedolauncher",
              "gwaio_upgrade_airfactory",
              "gwaio_upgrade_angel",
              "gwaio_upgrade_ant",
              "gwaio_upgrade_antinuke",
              "gwaio_upgrade_astraeus",
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
              "gwaio_upgrade_energystorage",
              "gwaio_upgrade_firefly",
              "gwaio_upgrade_gile",
              "gwaio_upgrade_grenadier",
              "gwaio_upgrade_halley",
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
              "gwaio_upgrade_metalstorage",
              "gwaio_upgrade_narwhal",
              "gwaio_upgrade_navalfactory",
              "gwaio_upgrade_nukes",
              "gwaio_upgrade_omega",
              "gwaio_upgrade_orbitallauncher",
              "gwaio_upgrade_orca",
              "gwaio_upgrade_pelican",
              "gwaio_upgrade_phoenix",
              "gwaio_upgrade_piranha",
              "gwaio_upgrade_radar",
              "gwaio_upgrade_ragnarok",
              "gwaio_upgrade_sheller",
              "gwaio_upgrade_singlelaserdefensetower",
              "gwaio_upgrade_skitter",
              "gwaio_upgrade_slammer",
              "gwaio_upgrade_spark",
              "gwaio_upgrade_spinner",
              "gwaio_upgrade_squall",
              "gwaio_upgrade_stinger",
              "gwaio_upgrade_stingray",
              "gwaio_upgrade_storm",
              "gwaio_upgrade_stryker",
              "gwaio_upgrade_sxx",
              "gwaio_upgrade_teleporter",
              "gwaio_upgrade_torpedolauncher",
              "gwaio_upgrade_typhoon",
              "gwaio_upgrade_ubercannon_structure",
              "gwaio_upgrade_umbrella",
              "gwaio_upgrade_unitcannon",
              "gwaio_upgrade_vanguard",
              "gwaio_upgrade_vehiclefactory",
              "gwaio_upgrade_wyrm",
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
                if (--loadCount === 0) loaded.resolve();
              });
            });

            // GWDealer.chooseCards - use our deck
            var chooseCards = function (params) {
              var inventory = params.inventory;
              var rng = params.rng || new Math.seedrandom();
              var count = params.count;
              var star = params.star;
              var galaxy = params.galaxy;

              var result = $.Deferred();
              loaded.then(function () {
                _.forEach(cards, function (card) {
                  if (card.getContext && !cardContexts[card.id])
                    cardContexts[card.id] = card.getContext(galaxy, inventory);
                });

                var list = [];

                _.times(count, function () {
                  var fullHand = [];
                  var hand = [];

                  fullHand = _.map(cards, function (card) {
                    var context = cardContexts[card.id];

                    var match =
                      inventory.hasCard(card.id) ||
                      _.some(list, { id: card.id });

                    var result =
                      card.deal && card.deal(star, context, inventory);
                    if (match) result.chance = 0;

                    return result;
                  });

                  fullHand = _.map(fullHand, function (deal, index) {
                    deal.index = index;
                    return deal;
                  });

                  hand = _.filter(fullHand, function (deal) {
                    if (!deal) return false;

                    if (!deal.chance) return false;

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
                      var result = hand[index];
                      resultIndex = result.index;
                    }

                    if (resultIndex !== undefined) {
                      var resultDeal = fullHand[resultIndex];
                      var params = resultDeal && resultDeal.params;
                      var cardId = deck[resultIndex];
                      var systemCard = {
                        id: cardId,
                      };

                      if (params && _.isObject(params))
                        _.assign(systemCard, params);

                      list.push(systemCard);
                    }
                  }
                });

                result.resolve(list);
              });
              return result;
            };
            /* end of GWAIO implementation of GWDealer */

            // gw_play self.explore - we need to call our chooseCards function
            model.explore = function () {
              if (!model.game() || !model.game().explore()) return;

              model.scanning(true);

              api.audio.playSound("/VO/Computer/gw/board_exploring");

              var star = model.game().galaxy().stars()[
                model.game().currentStar()
              ];

              if (model.game().inventory().handIsFull())
                var numCardsToOffer = 4;
              else numCardsToOffer = 3;

              var dealStarCards = chooseCards({
                inventory: model.game().inventory(),
                count: numCardsToOffer,
                star: star,
                galaxy: model.game().galaxy(),
              }).then(function (result) {
                var ok = true;

                _.forEach(star.cardList(), function (card) {
                  if (
                    !GW.bank.hasStartCard(card) &&
                    !gwaioBank.hasStartCard(card)
                  )
                    ok = false;
                });

                if (ok) star.cardList(result);
              });
              $.when(dealStarCards).then(function () {
                model.driveAccessInProgress(true);
                GW.manifest.saveGame(model.game()).then(function () {
                  model.driveAccessInProgress(false);
                });

                _.delay(function () {
                  model.scanning(false);
                }, 2000);
              });
            };

            if (model.gwaioCardsToUnits)
              model.gwaioCardsToUnits = model.gwaioCardsToUnits.concat(
                gwaioCardsToUnits.cards
              );
            else model.gwaioCardsToUnits = gwaioCardsToUnits.cards;

            model.gwaioTechCardTooltip = ko.observableArray([]);

            var makeCardTooltip = function (card, i) {
              if (card.isLoadout()) return;
              if (i === undefined) i = 3; // ensure inventory hovers work at the same time as the new tech display
              var cardId = card.id();
              var index = _.findIndex(model.gwaioCardsToUnits, { id: cardId });
              if (index === -1)
                if (cardId === undefined) return;
                else
                  console.warn(
                    cardId,
                    "is invalid or missing from model.gwaioCardsToUnits"
                  );
              else {
                var units = model.gwaioCardsToUnits[index].units;
                if (units) {
                  var affectedUnits = [];
                  _.forEach(units, function (unit) {
                    index = _.findIndex(gwaioUnitsToNames.units, {
                      path: unit,
                    });
                    if (index === -1)
                      console.warn(
                        unit,
                        "is invalid or missing from GWAIO unit_names.js"
                      );
                    else {
                      var name = loc(gwaioUnitsToNames.units[index].name);
                      affectedUnits = affectedUnits.concat(name);
                    }
                  });
                  affectedUnits = affectedUnits.sort();
                  model.gwaioTechCardTooltip()[i] = _.map(
                    affectedUnits,
                    function (unit, i) {
                      if (affectedUnits.length < 13)
                        return (unit = unit.concat("<br>"));
                      else if (i < affectedUnits.length - 1)
                        return (unit = unit.concat("; "));
                      else return unit;
                    }
                  );
                }
              }
            };

            model.showSystemCard.subscribe(function () {
              if (model.showSystemCard())
                model.currentSystemCardList().forEach(makeCardTooltip);
            });
            // Ensure the tooltip is shown even if the UI is refreshed
            if (model.showSystemCard())
              model.currentSystemCardList().forEach(makeCardTooltip);

            var hoverCount = 0;
            model.setHoverCard = function (card, hoverEvent) {
              if (card === model.hoverCard()) card = undefined;
              ++hoverCount;

              if (!card) {
                // Delay clears for a bit to avoid flashing
                var oldCount = hoverCount;
                _.delay(function () {
                  if (oldCount !== hoverCount) return;
                  model.hoverCard(undefined);
                }, 300);
                return;
              } else makeCardTooltip(card);

              var $block = $(hoverEvent.target);
              if (!$block.is(".one-card")) $block = $block.parent(".one-card");
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
