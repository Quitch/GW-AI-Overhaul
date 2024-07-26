/* We want to write our start cards to a different localStorage key so that if
   the mod is uninstalled the gw_start loadout list isn't messed up by 404s */
define(function () {
  const LS_KEY = "gwaio_bank";

  var self;

  var loading = false;

  const gwoBank = function () {
    self = this;

    self.startCards = ko.observableArray();
    self.startCards.subscribe(function (value) {
      self.save();

      const unlocked = value.length;

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
      const bankJson = localStorage[LS_KEY];
      if (!_.isString(bankJson)) {
        self.startCards([]);
        loading = false;
        return;
      }

      const config = JSON.parse(bankJson);
      self.startCards(config.startCards);
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
