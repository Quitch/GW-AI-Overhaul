// Third-party card mods record their loadout unlocks in their own localStorage
// key, so GWO has to be told where to look. They push { prefix, path } onto
// model.gwoLoadoutBanks - the New-GW-Cards template's start_cards.js does this.
// See tech-cards.md, "Third-party loadout banks".
//
// The entry carries the bank's path rather than the loaded module because scene
// scripts run synchronously at scene load while every requireGW callback resolves
// afterwards - a mod that required its own bank before registering would lose the
// race against the consumers below. Resolution therefore happens here, once, and
// the result is module state: AMD modules are singletons per page, so a caller
// that resolves early makes the banks available to every later reader without
// each one having to thread them through.
define(function () {
  var resolved = [];

  var entries = function () {
    return _.isArray(model.gwoLoadoutBanks) ? model.gwoLoadoutBanks : [];
  };

  var paths = function () {
    return _.uniq(
      _.filter(_.map(entries(), "path"), function (path) {
        return _.isString(path) && path.length > 0;
      })
    );
  };

  return {
    paths: paths,

    // modules are what requireGW(paths()) handed back, in the same order. A path
    // that failed to load arrives undefined and is dropped rather than throwing:
    // one broken mod must not take out the loadout list.
    //
    // Both halves of the documented contract are required, not just the one read
    // first: a bank that can answer hasStartCard but not record an addStartCard
    // would otherwise pass here and throw at award time, after the player had
    // already beaten the treasure planet. See tech-cards.md.
    resolve: function (modules) {
      var byPath = _.zipObject(paths(), modules || []);

      resolved = _.filter(
        _.map(entries(), function (entry) {
          var bank = entry && byPath[entry.path];
          if (
            !bank ||
            !_.isFunction(bank.hasStartCard) ||
            !_.isFunction(bank.addStartCard)
          ) {
            return undefined;
          }
          return { prefix: entry.prefix, bank: bank };
        })
      );

      return resolved;
    },

    banks: function () {
      return resolved;
    },

    // Readers include the gw_start loadout list and a ko.computed, so a mod's
    // bank throwing here would empty the picker or break a binding. Same rule as
    // resolve(): the broken mod loses its own unlocks, nothing more.
    hasStartCard: function (card) {
      return _.some(resolved, function (entry) {
        try {
          return entry.bank.hasStartCard(card);
        } catch (e) {
          console.error("Loadout bank hasStartCard() threw:", entry.prefix, e);
          return false;
        }
      });
    },

    // Which mod owns this id, by the prefix it registered. Used to write an
    // unlock back to the mod that shipped the loadout rather than to gwaio_bank.
    bankFor: function (id) {
      var match = _.find(resolved, function (entry) {
        return (
          _.isString(entry.prefix) &&
          _.isString(id) &&
          id.indexOf(entry.prefix) === 0
        );
      });

      return match ? match.bank : undefined;
    },

    startCards: function () {
      return _.flatten(
        _.map(resolved, function (entry) {
          if (!_.isFunction(entry.bank.startCards)) {
            return [];
          }
          try {
            return entry.bank.startCards();
          } catch (e) {
            console.error("Loadout bank startCards() threw:", entry.prefix, e);
            return [];
          }
        })
      );
    },
  };
});
