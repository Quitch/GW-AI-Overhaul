// GWO - changes are listed in shadowing.md; the viewer banking guard is in
// coop.md, "Whose unlocks are whose".
define([
  "shared/gw_bank",
  "shared/gw_game_patches",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/defeat_team.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
], function (stockBank, gwoGamePatches, gwoBank, gwoDefeatTeam, unitCells) {
  var loadingAnotherPlayersCards = false;
  var holdCarried = false;

  var isCampaignViewerSession = function () {
    try {
      return (
        JSON.parse(sessionStorage.getItem("gw_campaign_role")) === "viewer"
      );
    } catch (e) {
      return false;
    }
  };

  // GWO - GWGame.load calls patch immediately before the first applyCards.
  var stockPatch = gwoGamePatches.patch;
  gwoGamePatches.patch = function (game) {
    loadingAnotherPlayersCards = !!(
      isCampaignViewerSession() && game.perPlayerTechCards()
    );
    gwoDefeatTeam.install(game);
    return stockPatch.apply(this, arguments);
  };

  var GWInventory = function () {
    var self = this;
    self.units = ko.observableArray();
    self.removedUnits = ko.observableArray(); // GWO - see races.md, "Capability cells"
    self.aiMods = ko.observableArray(); // GWO - add location to store changes to AI based on cards held
    self.mods = ko.observableArray();
    self.maxCards = ko.observable(0);
    self.cards = ko.observableArray();
    self.minions = ko.observableArray();
    self.tags = ko.observable({});
  };

  GWInventory.prototype = {
    load: function (config) {
      var self = this;
      config = config || {};
      self.units(config.units || []);
      self.removedUnits(config.removedUnits || []);
      self.mods(config.mods || []);
      self.aiMods(config.aiMods || []);
      self.maxCards(_.isUndefined(config.maxCards) ? 0 : config.maxCards);

      // GWO - stock gw_play's cardsChanged calls applyCards when the cards
      // change mid-apply; the stub keeps this reset from queueing a re-run.
      self.applyCards = function () {};
      self.cards(config.cards || []);
      delete self.applyCards;

      self.minions(config.minions || []);
      self.tags(config.tags || {});
    },
    save: function () {
      return ko.toJS(this);
    },
    // GWO - a card's own group may sit inside the list; a whole gwoUnit race
    // table is not a list and names nothing
    addUnits: function (add) {
      var self = this;
      self.units(self.units().concat(unitCells.unitPaths(add)));
    },
    // GWO - updated to remove multiple copies of a unit, from a list that may
    // hold groups, and to record the removal so race translation honours it
    removeUnits: function (remove) {
      var self = this;
      var paths = unitCells.unitPaths(remove);
      _.forEach(paths, function (unit) {
        self.units.remove(unit);
      });
      var added = _(paths)
        .filter(_.isString)
        .uniq()
        .difference(self.removedUnits())
        .value();
      if (added.length) {
        self.removedUnits(self.removedUnits().concat(added));
      }
    },
    // GWO
    addAIMods: function (aiMods) {
      var self = this;
      self.aiMods(self.aiMods().concat(aiMods));
    },
    addMods: function (mods) {
      var self = this;
      self.mods(self.mods().concat(mods));
    },
    isApplyingCards: _.constant(false),
    applyCards: function (done) {
      var self = this;
      var cards = self.cards().slice();
      // GWO - held for the whole apply, re-runs included, so a card's buff()
      // cannot bank. Consumed here: the apply GWGame.load flagged is the one
      // immediately following.
      if (loadingAnotherPlayersCards && !holdCarried) {
        gwoBank.suspendUnlocks(stockBank);
      }
      var foreignCards = loadingAnotherPlayersCards || holdCarried;
      loadingAnotherPlayersCards = false;
      holdCarried = false;
      // GWO - an inventory with gwoFinish runs a pass whose card modules are
      // all loaded at once, and hands done to gwoFinish. See tech-cards.md,
      // "Applying the card".
      var atOnce =
        _.isFunction(self.gwoFinish) &&
        _.every(cards, function (card) {
          return requireGW.defined(
            "cards/" + (_.isString(card) ? card : card.id)
          );
        });

      self.isApplyingCards = _.constant(true);
      // Tags are going to come from the current card
      var curCard = "";
      var protoGetTag = _.bind(self.getTag, self);
      self.getTag = function (context, name, def) {
        return protoGetTag(context || curCard, name, def);
      };
      var protoSetTag = _.bind(self.setTag, self);
      self.setTag = function (context, name, value) {
        return protoSetTag(context || curCard, name, value);
      };
      var dirty = false;
      var finishApplyCards = function () {
        delete self.getTag;
        delete self.setTag; // GWO
        delete self.applyCards;
        delete self.isApplyingCards;
        if (dirty) {
          // GWO - the re-run keeps this pass's hold; the pass that ends clean
          // releases it. The flag is set just before the call reads it.
          var reapply = self.applyCards;
          _.delay(function () {
            holdCarried = foreignCards;
            reapply.call(self, done);
          });
        } else {
          if (foreignCards) {
            gwoBank.resumeUnlocks();
          }
          if (done && atOnce) {
            self.gwoFinish(done); // GWO
          } else if (done) {
            _.delay(done);
          }
        }
      };
      // Replaces applyCards for the pass, so a card calling it from its own
      // buff/dull only marks dirty. finishApplyCards re-runs the real one.
      self.applyCards = function (queueDone) {
        dirty = true;
        if (!queueDone) {
          return;
        }
        if (done) {
          var wrap = done;
          done = function () {
            wrap();
            _.delay(queueDone);
          };
        } else {
          done = queueDone;
        }
      };

      // GWO - an entry that is not a card fails to load and finishes, rather
      // than throwing where the caller's catch cannot reach.
      var cardIdOf = function (cardParams) {
        return _.isString(cardParams)
          ? cardParams
          : cardParams && cardParams.id;
      };
      var loadCardOp = function (op, cardParams, index, loaded) {
        var cardId = cardIdOf(cardParams);
        if (_.isString(cardParams)) {
          cardParams = undefined;
        }
        // GWO - once per card: the loader can run a failed card's errback twice
        var settle = _.once(loaded);
        var useCard = function (card) {
          settle(function () {
            curCard = cardId;
            // GWO - a card that throws still finishes, or done and the unlock
            // resume never run. The loader does not catch a throw here.
            try {
              card[op](self, cardParams);
            } catch (e) {
              console.error(
                "GWO card " + cardId + " threw in " + op + ": " + e
              );
            }
          });
        };
        var skipCard = function () {
          settle(_.noop);
        };
        // GWO
        if (atOnce) {
          useCard(requireGW("cards/" + cardId));
          return;
        }
        requireGW(
          ["cards/" + cardId],
          useCard,
          _.once(function (error) {
            console.error("Failed loading card " + cardId + " : " + error);
            // GWO - a loadout this client cannot load gives the standard
            // start, or its player has no commander. See coop.md, "Records at
            // launch".
            if (op === "buff" && index === 0 && _.includes(cardId, "_start_")) {
              console.warn("GWO: the standard start replaces " + cardId);
              requireGW(
                ["cards/gwc_start"],
                useCard,
                _.once(function (startError) {
                  console.error(
                    "GWO: the standard start did not load either: " + startError
                  );
                  skipCard();
                })
              );
              return;
            }
            skipCard();
          })
        );
      };
      // GWO - every card's module settles before any card runs, so the cards
      // run in hand order however their modules arrive: spec ops past the
      // front of orderOfOperations run in the order the cards add them. See
      // specs.md.
      var applyCardOps = function (op, next) {
        var runs = [];
        var waiting = cards.length;
        _.forEach(cards, function (card, index) {
          loadCardOp(op, card, index, function (run) {
            runs[index] = run;
            --waiting;
            if (!waiting) {
              _.forEach(runs, function (runCard) {
                runCard();
              });
              next();
            }
          });
        });
      };
      var applyDulls = function () {
        applyCardOps("dull", finishApplyCards);
      };

      self.units([]);
      self.removedUnits([]);
      self.mods([]);
      self.aiMods([]);
      self.maxCards(0);
      self.minions([]);

      applyCardOps("buff", applyDulls);
    },
    hasCard: function (id) {
      var self = this;
      return _.some(self.cards(), function (card) {
        return id === card.id && !card.unique;
      });
    },
    // GWO - unchanged from stock; nothing shipped calls it. test is a
    // CardViewModel, whose id is a computed.
    hasCardLike: function (test) {
      var ok = test && test.id;
      if (!ok) {
        return false;
      }

      var self = this;
      return _.some(self.cards(), { id: test.id() });
    },
    lookupCard: function (test) {
      var self = this;
      var cardSearch = _.isString(test) ? { id: test } : test;
      return _.findIndex(self.cards(), cardSearch);
    },
    canFitCard: function (test) {
      var self = this;
      // This is an unfortunate bit of back-channel information.  The
      // card parameters are supposed to be opaque, but this is the best
      // channel for communicating between the card & the inventory.
      // Without this, the card would have to be loaded, which would
      // significantly complicate the system.
      if (_.isObject(test) && test.allowOverflow) {
        return true;
      }
      return self.cards().length < self.maxCards();
    },
    handIsFull: function () {
      var self = this;
      return self.cards().length >= self.maxCards();
    },
    // During card processing an empty context is replaced with the current card.
    getTag: function (context, name, def) {
      var self = this;
      var tags = self.tags();
      var mutated = false;

      if (!Object.prototype.hasOwnProperty.call(tags, context)) {
        if (_.isUndefined(def)) {
          return;
        }
        tags[context] = {};
        mutated = true;
      }
      var tagContext = tags[context];
      if (!Object.prototype.hasOwnProperty.call(tagContext, name)) {
        if (_.isUndefined(def)) {
          return;
        }
        tagContext[name] = def;
        mutated = true;
      }

      // GWO - notify tag readers
      if (mutated) {
        self.tags.valueHasMutated();
      }
      return tagContext[name];
    },
    setTag: function (context, name, value) {
      var self = this;
      var tags = self.tags();
      var mutated = false;

      if (_.isUndefined(value)) {
        if (tags[context]) {
          delete tags[context][name];
          mutated = true;
          if (_.isEmpty(tags[context])) {
            delete tags[context];
          }
        }
      } else {
        if (!Object.prototype.hasOwnProperty.call(tags, context)) {
          tags[context] = {};
        }
        tags[context][name] = value;
        mutated = true;
      }

      // GWO - notify tag readers
      if (mutated) {
        self.tags.valueHasMutated();
      }
    },
  };
  return GWInventory;
});
