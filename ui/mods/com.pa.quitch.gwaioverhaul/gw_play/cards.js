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

    // Used by cards checking for T2 access - global for modders, which a card
    // mod may push its own ids onto - see tech-cards.md
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
    // cards_deal_helpers.js and the co-op reroll, assigned by the main
    // requireGW below. Only read from bodies that run after that load resolves.
    var helpers;
    var coopReroll;

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

        coopReroll.requestReroll(pendingTechCards);
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

    var setupCoopAiTech = function (params) {
      var game = model.game();
      var perPlayer = game.perPlayerTechCards();

      requireGW(
        [
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_ai_tech.js",
        ],
        function (cardsCoopAiTech) {
          cardsCoopAiTech(
            _.assign({ game: game, perPlayer: perPlayer }, params)
          );
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_dealer.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_ai_star_deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_explore.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_win.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_start_subcdr.js",
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
        gwoRaces,
        gwoPromise,
        cardsDealer,
        cardsAiStarDeal,
        cardsExplore,
        cardsWin,
        cardsStartSubcdr
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

        var chooseCards = cardsDealer({
          cards: cards,
          deck: deck,
          loaded: loaded,
          galaxy: galaxy,
          inventory: inventory,
          helpers: helpers,
          gwoStreams: gwoStreams,
          gwoRaces: gwoRaces,
        });

        // A co-op AI player settling its deals, from gw_play/coop_ai.js.
        var coopAiDeciding = function () {
          return model.gwoCoopAiDeciding();
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
            return model.gwoCoopAi.clients();
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
        // ones the base game's own record cannot carry.
        var treasureUnlocks = gwoTreasure.install({
          game: game,
          stockBank: GW.bank,
          gwoBank: gwoBank,
        });

        // Registers the co-op reroll operator handlers, viewer and host, and
        // hands back the viewer's request and the same reroll for a co-op AI
        // player.
        coopReroll = cardsCoopReroll({
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

        var aiStarDeal = cardsAiStarDeal({
          game: game,
          chooseCards: chooseCards,
          gwoTreasure: gwoTreasure,
          gwoSettings: gwoSettings,
          gwoStreams: gwoStreams,
          warRng: warRng,
          cardNameSync: cardNameSync,
          coopStarCards: coopStarCards,
          gwoPromise: gwoPromise,
        });
        var dealCardToSelectableAI = aiStarDeal.dealCardToSelectableAI;

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
        var generalCommander = cardsStartSubcdr({
          game: game,
          gwoSettings: gwoSettings,
          playerFaction: playerFaction,
          inventory: inventory,
        });

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

        // Installs model.explore.
        cardsExplore({
          game: game,
          inventory: inventory,
          helpers: helpers,
          numCardsToOffer: numCardsToOffer,
          chooseCards: chooseCards,
          coopAiDeciding: coopAiDeciding,
          startCardUnlocked: startCardUnlocked,
          gwoTreasure: gwoTreasure,
          gwoSettings: gwoSettings,
          gwoRaces: gwoRaces,
          gwoStreams: gwoStreams,
          warRng: warRng,
          gwoSave: gwoSave,
        });

        setupCoopAiTech({
          GW: GW,
          GWInventory: GWInventory,
          gwoAI: gwoAI,
          gwoDeal: gwoDeal,
          gwoSave: gwoSave,
          gwoStreams: gwoStreams,
          warRng: warRng,
          galaxy: galaxy,
          inventory: inventory,
          cards: cards,
          loaded: loaded,
          races: gwoRaces,
          helpers: helpers,
          coopDeal: coopDeal,
          coopReroll: coopReroll,
          starCardsBusy: starCardsBusy,
          aiStarDealing: aiStarDeal.dealing,
          startCardUnlocked: startCardUnlocked,
          generalCommander: generalCommander,
        });

        // Installs model.win.
        cardsWin({
          game: game,
          helpers: helpers,
          treasureUnlocks: treasureUnlocks,
          dealCardToSelectableAI: dealCardToSelectableAI,
          gwoSave: gwoSave,
        });

        generalCommander.setupGeneralCommander();
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
