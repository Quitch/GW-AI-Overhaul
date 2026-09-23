// Third-party card mods record their loadout unlocks in their own localStorage
// key, so GWO has to be told where to look. They push { prefix, path } onto
// model.gwoLoadoutBanks - the New-GW-Cards template's start_cards.js does this.
// See tech-cards.md, "Third-party loadout banks".
define(function () {
  var resolved = [];

  var entries = function () {
    return _.isArray(model.gwoLoadoutBanks) ? model.gwoLoadoutBanks : [];
  };

  var paths = function () {
    return _(entries())
      .map("path")
      .filter(function (path) {
        return _.isString(path) && path.length > 0;
      })
      .uniq()
      .value();
  };

  // modules are the bank modules in paths() order. A path with no module, or
  // one whose module returns nothing, is dropped rather than throwing: one
  // broken mod must not take out the loadout list.
  //
  // Both halves of the documented contract are required, not just the one read
  // first: a bank that can answer hasStartCard but not record an addStartCard
  // would otherwise pass here and throw at award time, after the player had
  // already beaten the treasure planet. See tech-cards.md.
  var resolveBanks = function (modules) {
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
  };

  return {
    paths: paths,

    // Each path is requested on its own, because one requireGW for all of them
    // never calls back if any one fails, and every bank would be lost.
    // requireGW never times out (waitSeconds: 0), so a failed load reaches only
    // the errback, and the guard stops a second errback counting it twice.
    load: function () {
      var result = $.Deferred();
      var bankPaths = paths();
      var modules = [];
      var remaining = bankPaths.length;

      if (!remaining) {
        result.resolve(resolveBanks([]));
        return result.promise();
      }

      _.forEach(bankPaths, function (path, index) {
        var counted = false;
        var count = function (bank) {
          if (counted) {
            return;
          }
          counted = true;
          modules[index] = bank;
          --remaining;
          if (remaining === 0) {
            result.resolve(resolveBanks(modules));
          }
        };

        requireGW(
          [path],
          function (bank) {
            count(bank);
          },
          function () {
            console.error("Loadout bank failed to load: " + path);
            count(undefined);
          }
        );
      });

      return result.promise();
    },

    resolve: resolveBanks,

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
          _.startsWith(id, entry.prefix)
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
