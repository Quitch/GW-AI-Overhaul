/* We want to write our start cards to a different localStorage key so that if
   the mod is uninstalled the gw_start loadout list isn't messed up by 404s */
define(function () {
  var LS_KEY = "gwaio_bank";

  var self;

  var loading = false;

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

    addStartCard: function (card) {
      if (self.hasStartCard(card)) {
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
