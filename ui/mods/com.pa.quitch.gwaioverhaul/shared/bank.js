/* We want to write our start cards to a different localStorage key so that if
   the mod is uninstalled the gw_start loadout list isn't messed up by 404s */
define(function () {
  var LS_KEY = "gwaio_bank";

  var self;

  var loading = false;

  var suspended = 0;
  var suspendedStockBank;
  var stockAddStartCard;

  var gwoBank = function () {
    self = this;

    self.startCards = ko.observableArray();
    self.startCards.subscribe(function (value) {
      self.save();

      var unlocked = value.length;

      if (!unlocked) {
        return;
      }

      api.tally.getStatInt("gw_unlocked_loadouts").then(function (stat) {
        if (stat < unlocked) {
          api.tally.setStatInt("gw_unlocked_loadouts", unlocked);
        }
      });
    });

    self.load();
  };

  gwoBank.prototype = {
    load: function () {
      loading = true;
      var bankJson = localStorage[LS_KEY];
      if (!_.isString(bankJson)) {
        self.startCards([]);
        loading = false;
        return;
      }

      // This runs during AMD load, so an unreadable value would reject the module
      // and take down every gw_start module that requires bank.js - a corrupt
      // unlock list must degrade to an empty one, not to a broken scene.
      var config;
      try {
        config = JSON.parse(bankJson);
      } catch (e) {
        console.warn("Ignoring unreadable loadout unlock record", e);
      }

      self.startCards(
        config && _.isArray(config.startCards) ? config.startCards : []
      );
      loading = false;
    },

    save: function () {
      if (loading) {
        return;
      }
      localStorage.setItem(LS_KEY, ko.toJSON(self));
    },

    // A co-op host applies its viewers' inventories to weight their deals, which
    // runs their loadout cards' buff(). Each card banks into whichever bank owns
    // it, so the base game's is held off alongside this one. Counted, because
    // those applications overlap. See gw_play/cards_coop_deal.js.
    suspendUnlocks: function (stockBank) {
      suspended++;
      if (suspended > 1) {
        return;
      }
      suspendedStockBank = stockBank;
      stockAddStartCard = stockBank.addStartCard;
      stockBank.addStartCard = function () {
        return false;
      };
    },

    resumeUnlocks: function () {
      if (!suspended) {
        return;
      }
      suspended--;
      if (suspended) {
        return;
      }
      // Restores by value rather than deleting the override, so a bank another
      // mod had already patched keeps that mod's version.
      suspendedStockBank.addStartCard = stockAddStartCard;
      suspendedStockBank = undefined;
    },

    // Loads a co-op viewer's saved inventory into a fresh GWInventory and
    // applies its cards with every bank held off, then hands it to done. Also
    // returned, for a caller that needs it before done runs.
    applyRecordInventory: function (GWInventory, record, stockBank, done) {
      var bank = this;
      var inventory = new GWInventory();
      inventory.load(_.cloneDeep(record.inventory));

      if (!inventory.cards().length) {
        done(inventory);
        return inventory;
      }

      bank.suspendUnlocks(stockBank);
      try {
        inventory.applyCards(function () {
          bank.resumeUnlocks();
          done(inventory);
        });
      } catch (e) {
        bank.resumeUnlocks();
        throw e;
      }
      return inventory;
    },

    addStartCard: function (card) {
      if (suspended || self.hasStartCard(card)) {
        return false;
      }
      self.startCards.push(card);
      return true;
    },
    hasStartCard: function (card) {
      return _.some(self.startCards(), function (element) {
        return card === element || (_.isObject(card) && card.id === element.id);
      });
    },
  };

  return new gwoBank();
});
