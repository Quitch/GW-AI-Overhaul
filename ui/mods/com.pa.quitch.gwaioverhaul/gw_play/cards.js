(function () {
  var game = model.game();

  if (game.isTutorial()) {
    return;
  }

  try {
    // Allow tech cards to be deleted at any time
    $("#hover-card").replaceWith(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_inventory.html"
      )
    );
    locTree($("#hover-card"));

    // Deleting a card cannot be undone, so the button asks once before it acts.
    model.gwoConfirmDiscard = ko.observable(false);
    model.gwoDiscardLabel = ko.computed(function () {
      return model.gwoConfirmDiscard()
        ? loc("!LOC:Delete this Tech?")
        : loc("!LOC:Delete Tech");
    });
    model.gwoDiscardHoverCard = function (card) {
      if (!model.gwoConfirmDiscard()) {
        model.gwoConfirmDiscard(true);
        return;
      }
      model.gwoConfirmDiscard(false);
      return model.discardHoverCard(card);
    };
    model.hoverCard.subscribe(function () {
      model.gwoConfirmDiscard(false);
    });

    // Used by cards checking for T2 access - global for modders,
    // New-GW-Cards pushes here - see tech-cards.md
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
      return model.canChooseCoopTechCards()
        ? model.currentCoopPendingTechCards()
        : undefined;
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
      if (!helpers.rerollsRemain(model.gwoRerollsUsed(), cardsOffered)) {
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
          pendingTechCards.cards.length,
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
            helpers.rerollsRemain(rerollsUsed, cardsOffered)
        );
        model.gwoRerollPending(false);
      });

      // launch_progress.html and victory_wait.html carry the class too.
      var systemOptionsBar =
        ".div_panel_bar_background.tech > .div_options_bar";
      $(systemOptionsBar).replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system_reroll.html"
        )
      );
      locTree($(systemOptionsBar));
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
      if (!helpers.rerollsRemain(model.gwoRerollsUsed(), cardsOffered)) {
        model.gwoOfferRerolls(false);
      }
      // The held offer's view models were built by stock before the
      // replacement below was installed, so rebuild them with it.
      star.cardList(star.cardList().slice());
    };

    // Replaces gwt_card.js's CardViewModel; only isLoadout differs. Installed
    // once helpers has loaded, since isLoadout reads it.
    var gwoCardViewModel = function (params) {
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
      self.iconPlaceholder = ko.observable();
      self.audio = ko.observable();

      self.isEmpty = ko.computed(function () {
        return !self.id();
      });
      // Stock tests for gwc_start only; mod loadouts carry _start_ anywhere.
      self.isLoadout = ko.computed(function () {
        return helpers.isStartLoadoutCardId(self.id());
      });

      var completed = $.Deferred();
      self.card = completed.promise();

      // Stock reuses a view model through params(), so a card that fails must
      // not leave the previous card showing.
      var clearView = function () {
        self.desc(undefined);
        self.summary(undefined);
        self.icon(undefined);
        self.iconPlaceholder(undefined);
        self.audio(undefined);
        self.visible(false);
      };

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
          // Stock waits on self.card, so a throwing third-party card must not
          // stop it resolving.
          try {
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
          } catch (e) {
            console.error(
              "GWO card threw while loading its view: " +
                self.id() +
                ": " +
                ((e && e.stack) || e)
            );
            clearView();
          }
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
          requireGW(
            ["cards/" + cardId],
            function (card) {
              if (loadToken !== myToken) {
                return;
              }
              loadCard(card, data);
            },
            function () {
              console.error("GWO card failed to load: " + cardId);
              if (loadToken !== myToken) {
                return;
              }
              clearView();
              completed.resolve({});
            }
          );
        } else {
          loadCard({}, data);
        }
      });
    };

    // Co-op AI players' tech under per-player tech: the driver that settles
    // their deals, and a new one's starting loadout. Glue - the logic is
    // gw_play/coop_ai_driver.js. See coop.md, "AI players' tech".
    // The co-op AI players' pings, in either tech mode. See coop.md, "AI
    // pings".
    var setupCoopAiPings = function (params) {
      var game = model.game();
      var galaxy = params.galaxy;
      var coopAiPings = params.coopAiPings;
      var starThreat = params.starThreat;

      var commanderOf = function (record) {
        return (
          _.get(record, "inventory.tags.global.commander") ||
          (record && record.commander)
        );
      };

      var windowOpen = function () {
        var star = galaxy.stars()[game.currentStar()];
        var turn = game.turnState();
        return (
          params.hostingSession() &&
          model.gwoCoopAi.count() > 0 &&
          !!params.lookup() &&
          turn !== "explore" &&
          turn !== "fight" &&
          !!star &&
          star.explored() &&
          !model.scanning() &&
          !model.gwCampaignPlayerSetupBlocked() &&
          !(model.gwoCoopAiDeciding && model.gwoCoopAiDeciding()) &&
          !params.starCardsBusy() &&
          !params.aiStarDealing() &&
          !model.gameOver()
        );
      };

      var pings = coopAiPings({
        ais: function () {
          return _.map(model.gwoCoopAi.records(), function (record) {
            return {
              id: record.playerId,
              name: record.gwaioAi.name,
              record: record,
            };
          });
        },
        // The cards every AI would find at every AI star are part of the key,
        // so a re-deal outside a turn - a cheat's, say - opens a new window.
        windowKey: function () {
          var perPlayerNow = model.gwCampaignPerPlayerTechCards();
          var records = model.gwoCoopAi.records();
          var entries = [];
          _.forEach(galaxy.stars(), function (star, index) {
            if (!star.ai() || star.explored()) {
              return;
            }
            if (!perPlayerNow) {
              var cards = star.cardList();
              entries.push(index + "=" + _.get(cards, "0.id", ""));
              return;
            }
            _.forEach(records, function (record) {
              entries.push(
                record.playerId +
                  "@" +
                  index +
                  "=" +
                  _.get(record, "gwaioStarCards.cards." + index + ".id", "")
              );
            });
          });
          return coopAiPings.windowKey(
            game.stats().turns(),
            game.currentStar(),
            game.hostTechCardDealCount(),
            coopAiPings.cardsDigest(entries)
          );
        },
        windowOpen: windowOpen,
        candidates: function () {
          var current = game.currentStar();
          var candidates = [];
          _.forEach(galaxy.stars(), function (star, index) {
            var ai = star.ai();
            if (index === current || !ai || star.explored()) {
              return;
            }
            var path = model.canSelect(index);
            if (path && path.length) {
              candidates.push({
                star: index,
                hops: path.length - 1,
                threat: starThreat.measure(ai),
                treasure: !!ai.treasurePlanet,
              });
            }
          });
          return coopAiPings.pickCandidates(candidates);
        },
        allThreats: function () {
          var threats = [];
          _.forEach(galaxy.stars(), function (star) {
            var ai = star.ai();
            if (ai && !star.explored()) {
              threats.push(starThreat.measure(ai));
            }
          });
          return threats;
        },
        // Under per-player tech an AI's own card for the star; under shared
        // tech the star's, which every player shares.
        cardFor: function (ai, star) {
          if (model.gwCampaignPerPlayerTechCards()) {
            return _.get(ai.record, "gwaioStarCards.cards." + star);
          }
          var cards = galaxy.stars()[star].cardList();
          return cards && cards[0];
        },
        valueOf: function (ai, card, star, memo) {
          var holder = model.gwCampaignPerPlayerTechCards()
            ? {
                playerId: ai.id,
                inventory: ai.record.inventory,
                commander: commanderOf(ai.record),
              }
            : {
                playerId: ai.id,
                inventory: params.plain(params.inventory.save()),
                commander: params.inventory.getTag("global", "commander"),
              };
          // deal() takes the star itself, as in a hand.
          return coopAiPings.valueOfCard(
            params.judge,
            holder,
            card,
            galaxy.stars()[star],
            memo
          );
        },
        ping: function (star, sender) {
          return !!model.gwoPingStarAs && model.gwoPingStarAs(star, sender);
        },
      });

      // Anything a window depends on opens or closes one.
      ko.computed(function () {
        windowOpen();
        game.stats().turns();
        game.currentStar();
        game.hostTechCardDealCount();
        model.gwoCoopAi.records();
        _.defer(pings.update);
      });
    };

    var setupCoopAiTech = function (params) {
      var game = model.game();
      if (!model.gwoCoopAi) {
        return;
      }
      var perPlayer = game.perPlayerTechCards();

      requireGW(
        [
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_driver.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_units.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/race_cells.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/starting_inventory.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_pings.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_threat.js",
        ],
        function (
          coopAiDriver,
          coopAiEffects,
          coopAiCards,
          coopAiUnits,
          unitGroups,
          raceCells,
          raceMods,
          roster,
          coopHost,
          refereeCoop,
          startingInventory,
          gwoLoadoutIds,
          coopAiPings,
          starThreat
        ) {
          var galaxy = params.galaxy;
          var inventory = params.inventory;
          var helpers = params.helpers;
          var gwoStreams = params.gwoStreams;
          var warRng = params.warRng;
          var LOOKUP_WAIT_MS = 8000;

          var hostingSession = function () {
            return model.isCampaignHost() && model.gwCampaignActive();
          };
          var hosting = function () {
            return model.gwCampaignPerPlayerTechCards() && hostingSession();
          };

          // The unit specs, read once the host opens a session; unit-group
          // membership stands in if they are not in within 8 s, and is
          // replaced when they land.
          var lookup = ko.observable();
          var groupsLookup = coopAiUnits.fromGroups(unitGroups);
          var prefetching = false;
          var prefetch = function () {
            prefetching = true;
            var fallback = setTimeout(function () {
              if (!lookup()) {
                console.log(
                  "[GW COOP AI] unit specs not in after " +
                    LOOKUP_WAIT_MS / 1000 +
                    " s: judging by unit groups until they are"
                );
                lookup(groupsLookup);
              }
            }, LOOKUP_WAIT_MS);
            raceMods.mountRoot().always(function () {
              raceCells.load().then(
                function (loaded) {
                  clearTimeout(fallback);
                  lookup(coopAiUnits.fromSpecs(loaded, unitGroups.units));
                },
                function (error) {
                  clearTimeout(fallback);
                  console.error(
                    "[GW COOP AI] unit specs not read: " +
                      ((error && error.stack) || error)
                  );
                  if (!lookup()) {
                    lookup(groupsLookup);
                  }
                }
              );
            });
          };
          // Under shared tech the lookup serves the pings alone, so it waits
          // for an AI.
          ko.computed(function () {
            if (
              !prefetching &&
              (hosting() || (hostingSession() && model.gwoCoopAi.count() > 0))
            ) {
              prefetch();
            }
          });

          var effects = coopAiEffects({
            GWInventory: params.GWInventory,
            stockBank: params.GW.bank,
            timeoutMs: 5000,
          });

          var find = function (playerId) {
            return _.find(game.coopPlayerInventoryData(), function (record) {
              return roster.isAiRecord(record) && record.playerId === playerId;
            });
          };

          // Everyone fighting beside the AI: the host, the connected
          // viewers, and the other AIs.
          var teamDomains = function (playerId, current) {
            var others = [inventory].concat(
              _.pluck(
                refereeCoop.getConnectedViewerInventories(game),
                "inventory"
              ),
              _.pluck(
                _.reject(model.gwoCoopAi.records(), { playerId: playerId }),
                "inventory"
              )
            );
            return coopAiCards.teamDomains(roster.teammates(others), current);
          };

          var namesUnits = function (cardId) {
            var entry = _.find(model.gwoCardsToUnits || [], { id: cardId });
            return !!(entry && !_.isEmpty(entry.units));
          };

          // A card's own deal weight for this inventory, for a card whose
          // effect shows only in battle. Third-party code, so guarded.
          var chanceOf = function (card, applied, star) {
            var module = _.find(params.cards, function (candidate) {
              return !!candidate && candidate.id === card.id;
            });
            if (!module || !_.isFunction(module.deal)) {
              return 0;
            }
            try {
              var dealInventory = new params.GWInventory();
              dealInventory.load(_.cloneDeep(applied));
              var context =
                module.getContext && module.getContext(galaxy, dealInventory);
              var dealt = module.deal(star, context, dealInventory);
              return dealt && _.isNumber(dealt.chance) ? dealt.chance : 0;
            } catch (e) {
              // A deal() that throws could never offer its card, so the card
              // has no chance to score.
              console.error(
                "[GW COOP AI] " +
                  card.id +
                  " deal() threw: " +
                  ((e && e.message) || e)
              );
              return 0;
            }
          };

          setupCoopAiPings({
            coopAiPings: coopAiPings,
            starThreat: starThreat,
            galaxy: galaxy,
            inventory: inventory,
            hostingSession: hostingSession,
            lookup: lookup,
            starCardsBusy: params.starCardsBusy,
            aiStarDealing: params.aiStarDealing,
            plain: coopAiEffects.plain,
            judge: {
              effects: effects,
              lookup: lookup,
              teamDomains: teamDomains,
              namesUnits: namesUnits,
              chanceOf: chanceOf,
              isLoadout: helpers.isStartLoadoutCardId,
            },
          });

          if (!perPlayer) {
            return;
          }

          var driver = coopAiDriver({
            records: function () {
              return hosting() ? model.gwoCoopAi.records() : [];
            },
            find: find,
            dealCount: model.getCoopPlayerTechCardDealCount,
            hostDealCount: function () {
              return game.hostTechCardDealCount();
            },
            entryFor: model.getHostTechCardDealEntry,
            starAt: function (starIndex) {
              return galaxy.stars()[starIndex];
            },
            dealHand: params.coopDeal.pendingHandForRecord,
            rerollHand: params.coopReroll.rerollHandForRecord,
            effects: effects,
            lookup: lookup,
            teamDomains: teamDomains,
            namesUnits: namesUnits,
            chanceOf: chanceOf,
            isLoadout: helpers.isStartLoadoutCardId,
            rerollsRemain: helpers.rerollsRemain,
            decisionRng: function (record, dealIndex, rerollsUsed) {
              return gwoStreams.coopAiDecisionRng(
                warRng,
                record.gwaioAi.serial,
                dealIndex,
                rerollsUsed
              );
            },
            enqueue: model.enqueueGwCampaignStateApply,
            write: function (record, patch) {
              return coopHost.upsertRecord(game, record, patch);
            },
            canRun: function () {
              return (
                hosting() &&
                !!lookup() &&
                !params.starCardsBusy() &&
                !model.gameOver()
              );
            },
            running: model.gwoCoopAi.driving,
            afterPass: function () {
              model.refreshGwCampaignInventoryModal();
              return Promise.resolve(params.gwoSave(game, false)).then(
                function () {
                  model.gwoCoopAi.publish("deal");
                }
              );
            },
          });

          // Every deal the host records, and every AI added or returning,
          // starts a pass; one with nothing owed does nothing.
          ko.computed(function () {
            hosting();
            game.hostTechCardDealCount();
            game.coopPlayerInventoryData();
            model.gwoCoopAi.records();
            lookup();
            params.starCardsBusy();
            _.defer(driver.run);
          });

          // The loadouts a new AI may start with, dealt as the per-player
          // loadout scene deals a viewer's.
          var cardIds = function (list) {
            return _.compact(_.pluck(_.isArray(list) ? list : [], "id"));
          };
          var startingIds = _.uniq(
            gwoLoadoutIds.starting.concat(cardIds(model.gwoStartingCards))
          );
          var lockedIds = _.uniq(
            gwoLoadoutIds.lockedBase.concat(
              gwoLoadoutIds.unlockable,
              cardIds(model.gwoNewStartCards)
            )
          );
          var loadoutIds = _.uniq(startingIds.concat(lockedIds));
          var loadoutCards = [];
          var loadoutDeck = [];
          var loadoutsLoaded = $.Deferred();
          params.gwoDeal.setupGwoDeck(
            loadoutCards,
            loadoutDeck,
            loadoutIds.length,
            loadoutsLoaded,
            loadoutIds
          );

          // A new AI's loadout and starting inventory: every loadout the host
          // has unlocked that its race may field, scored. options: record
          // (commander and serial set), race.
          var startingTech = function (options) {
            var record = options.record;
            var race = options.race;
            var playerFaction = inventory.getTag("global", "playerFaction");
            var tags = startingInventory.buildGlobalTags(
              record.commander,
              playerFaction,
              race
            );
            var star = galaxy.stars()[game.currentStar()];

            return Promise.resolve(params.generalCommander).then(
              function (handle) {
                return driver.chooseStartingLoadout({
                  name: record.gwaioAi.name,
                  candidates: roster.loadoutCandidates({
                    starting: startingIds,
                    locked: lockedIds,
                    unlocked: function (id) {
                      return params.startCardUnlocked({ id: id });
                    },
                    raceLocks: function (id) {
                      return helpers.raceLocksLoadout(race, id);
                    },
                  }),
                  baseline: {
                    cards: [{ id: "gwc_start" }],
                    tags: { global: tags },
                  },
                  commander: record.commander,
                  teamDomains: teamDomains(record.playerId, lookup()),
                  rng: gwoStreams.coopAiLoadoutRng(
                    warRng,
                    record.gwaioAi.serial
                  ),
                  build: function (loadoutCardId) {
                    return Promise.resolve(
                      startingInventory.build({
                        GWInventory: params.GWInventory,
                        gwoDeal: params.gwoDeal,
                        loaded: loadoutsLoaded,
                        loadedCards: loadoutCards,
                        loadoutCardId: loadoutCardId,
                        commander: record.commander,
                        playerFaction: playerFaction,
                        playerRace: race,
                        galaxy: galaxy,
                        star: star,
                      })
                    ).then(function (saved) {
                      // Plain data: a save carries the GWInventory methods.
                      return handle.appendRecordMinions(
                        coopAiEffects.plain(saved),
                        gwoStreams.coopPlayerKey(record)
                      );
                    });
                  },
                });
              }
            );
          };

          model.gwoCoopAi.tech({
            ready: function () {
              return !!lookup();
            },
            startingTech: startingTech,
          });
        },
        function (err) {
          console.error(
            "Galactic War Overhaul (GWO): co-op AI tech not loaded: " +
              err.requireModules +
              ": " +
              (err.stack || err.message || err)
          );
        }
      );
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_card_name_sync.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_reroll.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_cheats.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
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
        gwoTreasure,
        gwoLoadoutBanks,
        gwoRaces
      ) {
        helpers = cardsDealHelpers;
        globals.CardViewModel = gwoCardViewModel;
        // Nothing reads the banks until the player explores, so resolving them
        // alongside setup is early enough and keeps this callback synchronous.
        gwoLoadoutBanks.load();
        restoreExploreSaveRerolls();
        var inventory = game.inventory();
        var playerFaction = inventory.getTag("global", "playerFaction");
        var galaxy = game.galaxy();
        var gwoSettings = gwoAI.originSettings(game);
        var warRng = gwoStreams.warRng(gwoSettings);

        // Also registers the gwo_sync_star_card_name host handler.
        var cardNameSync = cardsCardNameSync({ game: game });

        // GWO's own dealer, replacing stock's gw_dealer end to end. See
        // shadowing.md, "Function hijacking".
        model.gwoCards = gwoDeal.setupGwoCards(gwoSettings);

        var cards = [];
        var deck = [];
        var numberOfCards = model.gwoCards.length;
        var deckLoaded = $.Deferred();
        var cardUnitsLoaded = $.Deferred();

        gwoDeal.setupGwoDeck(cards, deck, numberOfCards, deckLoaded);

        // The race gates read model.gwoCardsToUnits, which card_tooltips.js
        // also fills in a load of its own. The deal waits for this one, so no
        // deal runs before the gates exist. Without the list a race player is
        // gated on MLA-only cards alone, so a failed load is logged.
        requireGW(
          ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js"],
          function (cardUnits) {
            cardUnits.mergeInto();
            cardUnitsLoaded.resolve();
          },
          function () {
            console.error(
              "GWO failed to load card_units.js: tech cards deal without their race gates"
            );
            cardUnitsLoaded.resolve();
          }
        );

        var loaded = $.when(deckLoaded, cardUnitsLoaded);

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
              // setupGwoDeck leaves a hole where a card failed to load.
              if (!card) {
                return undefined;
              }

              var context = cardContexts[card.id];
              var cardChance;
              // A third-party card's deal() is arbitrary code, and this runs
              // inside a deferred callback where a throw is swallowed rather
              // than rejected - the hand would simply never arrive.
              try {
                cardChance =
                  card.deal &&
                  card.deal(
                    star,
                    context,
                    dealInventory,
                    gwoStreams.cardRng(iterationRng, card.id)
                  );
              } catch (e) {
                console.error(
                  "Tech card deal() threw, skipping " +
                    card.id +
                    ": " +
                    ((e && e.stack) || e)
                );
                return undefined;
              }

              var match =
                helpers.doNotDealCard(
                  dealInventory,
                  card,
                  list,
                  dealAddSlot,
                  systemCards
                ) ||
                !helpers.raceCanDeal(
                  gwoRaces,
                  dealInventory,
                  card.id,
                  model.gwoCardsToUnits
                );

              if (match && cardChance) {
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
              if (card && card.getContext && !cardContexts[card.id]) {
                try {
                  cardContexts[card.id] = card.getContext(
                    galaxy,
                    dealInventory
                  );
                } catch (e) {
                  console.error(
                    "Tech card getContext() threw, skipping " +
                      card.id +
                      ": " +
                      ((e && e.stack) || e)
                  );
                }
              }
            });

            var list = [];

            _.times(count, dealOneCard.bind(null, list));

            result.resolve(list);
          });
          return result;
        };

        // A co-op AI player settling its deals, from gw_play/coop_ai.js.
        var coopAiDeciding = function () {
          return !!(model.gwoCoopAiDeciding && model.gwoCoopAiDeciding());
        };
        var starCardsBusy = ko.observable(false);

        // Deals each viewer, and each co-op AI player, their own card on every
        // selectable AI star.
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
          aiClients: function () {
            return model.gwoCoopAi ? model.gwoCoopAi.clients() : [];
          },
          aiDeciding: coopAiDeciding,
          busy: starCardsBusy,
        });

        // Installs model.dealCoopPlayerPendingTechCards, overriding stock
        // gw_play.js, and hands back the same deal for a co-op AI player.
        var coopDeal = cardsCoopDeal({
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
          gwoRaces: gwoRaces,
        });

        // Reports a viewer's loadout unlocks to the host, which needs the mod
        // ones the base game's own record cannot carry, and holds a viewer's
        // banking closed against the host's inventory.
        var treasureUnlocks = gwoTreasure.install({
          game: game,
          stockBank: GW.bank,
          gwoBank: gwoBank,
        });

        // Registers the co-op reroll operator handlers, viewer and host, and
        // hands back the same reroll for a co-op AI player.
        var coopReroll = cardsCoopReroll({
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

        // Deals of the selectable AI stars' cards in flight, from their start to
        // the star-card refresh they end with, so the AI players' pings judge
        // the cards the stars will offer.
        var aiStarDealing = ko.observable(0);

        var dealCardToSelectableAI = function (win, turnState) {
          if (model.isCampaignViewer()) {
            return $.when().promise();
          }

          var deferred = $.Deferred();

          // Avoid running twice after winning a fight
          if (!win || turnState === "end") {
            var deferredQueue = [];
            aiStarDealing(aiStarDealing() + 1);
            var dealt = function () {
              aiStarDealing(Math.max(0, aiStarDealing() - 1));
            };

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
                    systemCards: system.star.cardList(),
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

            // Not $.when(deferredQueue): it takes an array as one value and
            // resolves at once. It would need $.when.apply.
            Promise.all(deferredQueue)
              .then(function () {
                // The one caller that replaces cards viewers already hold, so
                // their offers move exactly when the host's do.
                return coopStarCards.refresh({ redeal: true });
              })
              .then(function () {
                dealt();
                deferred.resolve();
              }, dealt);
          } else {
            deferred.resolve();
          }

          return deferred.promise();
        };

        // runRefresh reads the gate a tick late, so its inputs are read here.
        // See coop.md, "Per-player pre-dealt cards".
        ko.computed(function () {
          model.gwCampaignConnectedClients();
          model.gwCampaignPlayerSetupBlocked();
          game.coopPlayerInventoryData();
          game.hostTechCardDealCount();
          game.turnState();
          coopAiDeciding();
          coopStarCards.refresh();
        });

        // The handle a co-op AI player's starting loadout is set up with.
        var generalCommander = $.Deferred();
        requireGW(
          [
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_start_subcdr.js",
          ],
          function (cardsStartSubcdr) {
            var handle = cardsStartSubcdr({
              game: game,
              gwoSettings: gwoSettings,
              playerFaction: playerFaction,
              inventory: inventory,
            });
            handle.setupGeneralCommander();
            generalCommander.resolve(handle);
          },
          function () {
            console.error("GWO failed to load cards_start_subcdr.js");
            generalCommander.reject("cards_start_subcdr.js not loaded");
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
          races: gwoRaces,
        });

        // Every bank: base game, GWO, and any a third-party card mod registered.
        // Each unlocks into its own localStorage record.
        var startCardUnlocked = function (card) {
          return (
            GW.bank.hasStartCard(card) ||
            gwoBank.hasStartCard(card) ||
            gwoLoadoutBanks.hasStartCard(card)
          );
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
          // players are still choosing. A co-op AI player settling its deals
          // holds exploration as a viewer choosing tech does.
          if (
            _.isUndefined(force) &&
            (model.gwCampaignPlayerSetupBlocked() ||
              (!model.gwCampaignReplayingAction && coopAiDeciding()))
          ) {
            return;
          }

          if (!game.explore()) {
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
            gwoTreasure.isTreasureStar(gwoSettings, starIndex)
          ) {
            var treasureLoadout = gwoTreasure.pickTreasureLoadout({
              race: gwoRaces.raceOf(inventory),
              isUnlocked: startCardUnlocked,
              rng: gwoStreams.treasureLoadoutRng(warRng, undefined, starIndex),
            });
            star.cardList(treasureLoadout ? [treasureLoadout] : []);
          }

          var startLoadoutCards = helpers.filterStartLoadoutCards(
            star.cardList()
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
              star.cardList().length
            ) {
              dealEntry = game.recordHostTechCardDeal(starIndex, {
                startLoadoutCards: startLoadoutCards,
              });
            }

            if (!dealEntry) {
              return $.Deferred().resolve([]).promise();
            }

            return model.dealCoopPlayerPendingTechCards(starIndex, star, {
              dealIndex: dealEntry.dealIndex,
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
              if (
                helpers.explorationDealtNothing(
                  game,
                  starIndex,
                  star,
                  model.gwCampaignReplayingAction
                )
              ) {
                console.warn(
                  "GWO: no tech card could be dealt at star " +
                    starIndex +
                    "; ending the exploration with nothing"
                );
                _.delay(function () {
                  model.win(-1);
                }, 2000);
              }
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

        setupCoopAiTech({
          GW: GW,
          GWInventory: GWInventory,
          gwoDeal: gwoDeal,
          gwoSave: gwoSave,
          gwoStreams: gwoStreams,
          warRng: warRng,
          galaxy: galaxy,
          inventory: inventory,
          cards: cards,
          helpers: helpers,
          coopDeal: coopDeal,
          coopReroll: coopReroll,
          starCardsBusy: starCardsBusy,
          aiStarDealing: aiStarDealing,
          startCardUnlocked: startCardUnlocked,
          generalCommander: generalCommander.promise(),
        });

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
              console.error(
                "Failed winning turn at star " + game.currentStar()
              );
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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
