// Add aiMods()

const GWInventory = function () {
  const self = this;
  self.units = ko.observableArray();
  // add location to store changes to AI based on cards held
  self.aiMods = ko.observableArray();
  self.mods = ko.observableArray();
  self.maxCards = ko.observable(0);
  self.cards = ko.observableArray();
  self.minions = ko.observableArray([]);
  self.tags = ko.observable({});
};

define(function () {
  GWInventory.prototype = {
    load: function (config) {
      const self = this;
      config = config || {};
      self.units(config.units || []);
      self.mods(config.mods || []);
      self.aiMods(config.aiMods || []);
      self.maxCards(_.isUndefined(config.maxCards) ? 0 : config.maxCards);

      self.applyCards = function () {};
      self.cards(config.cards || []);
      delete self.applyCards;

      self.minions(config.minions || []);
      self.tags(config.tags || {});
    },
    save: function () {
      return ko.toJS(this);
    },
    addUnits: function (add) {
      const self = this;
      self.units(self.units().concat(add));
    },
    // GWO - updated to remove multiple copies of a unit
    removeUnits: function (remove) {
      const self = this;
      _.forEach(remove, function (unit) {
        _.pull(self.units(), unit);
      });
    },
    addAIMods: function (aiMods) {
      const self = this;
      self.aiMods(self.aiMods().concat(aiMods));
    },
    addMods: function (mods) {
      const self = this;
      self.mods(self.mods().concat(mods));
    },
    isApplyingCards: _.constant(false),
    applyCards: function (done) {
      const self = this;
      const cards = self.cards().slice();

      // Apply an override to this object to indicate that we are busy.
      self.isApplyingCards = _.constant(true);
      // Tags are going to come from the current card
      var curCard = "";
      const protoGetTag = _.bind(self.getTag, self);
      self.getTag = function (context, name, def) {
        return protoGetTag(context || curCard, name, def);
      };
      const protoSetTag = _.bind(self.setTag, self);
      self.setTag = function (context, name, value) {
        return protoSetTag(context || curCard, name, value);
      };
      var dirty = false;
      // Clean-up function that gets called when everything is done.
      const finishApplyCards = function () {
        delete self.getTag;
        delete self.applyCards;
        delete self.isApplyingCards;
        if (dirty) {
          _.delay(_.bind(self.applyCards, self, done));
        } else if (done) {
          _.delay(done);
        }
      };
      // Install a hook that calls the new callback when the current
      // process has completed.
      self.applyCards = function (queueDone) {
        dirty = true;
        if (!queueDone) {
          return;
        }
        if (done) {
          const wrap = done;
          done = function () {
            wrap();
            _.delay(queueDone);
          };
        } else {
          done = queueDone;
        }
      };

      var cardCount;
      var finishPhase;
      const finishCard = function () {
        --cardCount;
        if (!cardCount) {
          finishPhase();
        }
      };
      const applyCardOp = function (op, cardParams) {
        var cardId;
        if (_.isString(cardParams)) {
          cardId = cardParams;
          cardParams = undefined;
        } else {
          cardId = cardParams.id;
        }
        requireGW(
          ["cards/" + cardId],
          function (card) {
            curCard = cardId;
            card[op](self, cardParams);
            finishCard();
          },
          function (error) {
            console.error("Failed loading card " + cardId, " : " + error);
            finishCard();
          }
        );
      };
      const resetCardCount = function () {
        cardCount = cards.length;
      };
      const applyDulls = function () {
        resetCardCount();
        finishPhase = finishApplyCards;
        _.forEach(cards, _.bind(applyCardOp, self, "dull"));
      };
      const applyBuffs = function () {
        resetCardCount();
        finishPhase = applyDulls;
        _.forEach(cards, _.bind(applyCardOp, self, "buff"));
      };

      self.units([]);
      self.mods([]);
      self.aiMods([]);
      self.maxCards(0);
      self.minions([]);

      applyBuffs();
    },
    hasCard: function (id) {
      const self = this;
      return _.some(self.cards(), function (card) {
        return id === card.id && !card.unique;
      });
    },
    hasCardLike: function (test) {
      const ok = test && test.id;
      if (!ok) {
        return false;
      }

      const self = this;
      return _.some(self.cards(), { id: test.id() });
    },
    lookupCard: function (test) {
      const self = this;
      const cardSearch = _.isString(test) ? { id: test } : test;
      return _.findIndex(self.cards(), cardSearch);
    },
    canFitCard: function (test) {
      const self = this;
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
      const self = this;
      return self.cards().length >= self.maxCards();
    },

    // Get a tag value.  When called during card processing, an empty
    // context will be replaced with the current card.
    getTag: function (context, name, def) {
      const self = this;
      const tags = self.tags();
      if (!Object.prototype.hasOwnProperty.call(tags, context)) {
        if (_.isUndefined(def)) {
          return;
        }
        tags[context] = {};
      }
      const tagContext = tags[context];
      if (!Object.prototype.hasOwnProperty.call(tagContext, name)) {
        if (_.isUndefined(def)) {
          return;
        }
        tagContext[name] = def;
      }
      return tagContext[name];
    },
    setTag: function (context, name, value) {
      const self = this;
      const tags = self.tags();
      if (_.isUndefined(value)) {
        if (tags[context]) {
          delete tags[context][name];
          if (_.isEmpty(tags[context])) {
            delete tags[context];
          }
        }
      } else {
        if (!Object.prototype.hasOwnProperty.call(tags, context)) {
          tags[context] = {};
        }
        tags[context][name] = value;
      }
    },
  };
  return GWInventory;
});
