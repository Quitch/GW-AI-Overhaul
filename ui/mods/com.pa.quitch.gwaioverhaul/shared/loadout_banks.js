// Third-party card mods record their loadout unlocks in their own localStorage
// key, so GWO has to be told where to look. They push { prefix, path } onto
// model.gwoLoadoutBanks - the New-GW-Cards template's start_cards.js does this.
// See docs/tech-cards.md, "Third-party loadout banks".
//
// The entry carries the bank's path rather than the loaded module because scene
// scripts run synchronously at scene load while every requireGW callback resolves
// afterwards - a mod that required its own bank before registering would lose the
// race against the consumers below. Resolution therefore happens here, once, and
// the result is module state: AMD modules are singletons per page, so a caller
// that resolves early makes the banks available to every later reader without
// each one having to thread them through.
define(() => {
  let resolved = [];

  const entries = () =>
    Array.isArray(model.gwoLoadoutBanks) ? model.gwoLoadoutBanks : [];

  const paths = () =>
    _.uniq(
      _.filter(
        _.map(entries(), "path"),
        (path) => _.isString(path) && path.length > 0,
      ),
    );

  return {
    paths,

    // modules are what requireGW(paths()) handed back, in the same order. A path
    // that failed to load arrives undefined and is dropped rather than throwing:
    // one broken mod must not take out the loadout list.
    resolve: function (modules) {
      const byPath = _.zipObject(paths(), modules || []);

      resolved = _.filter(
        _.map(entries(), (entry) => {
          const bank = entry && byPath[entry.path];
          if (!bank || !_.isFunction(bank.hasStartCard)) {
            return undefined;
          }
          return { prefix: entry.prefix, bank };
        }),
      );

      return resolved;
    },

    banks: function () {
      return resolved;
    },

    hasStartCard: function (card) {
      return _.some(resolved, (entry) => entry.bank.hasStartCard(card));
    },

    // Which mod owns this id, by the prefix it registered. Used to write an
    // unlock back to the mod that shipped the loadout rather than to gwaio_bank.
    bankFor: function (id) {
      const match = _.find(
        resolved,
        (entry) =>
          _.isString(entry.prefix) &&
          _.isString(id) &&
          id.indexOf(entry.prefix) === 0,
      );

      return match ? match.bank : undefined;
    },

    startCards: function () {
      return _.flatten(
        _.map(resolved, (entry) =>
          _.isFunction(entry.bank.startCards) ? entry.bank.startCards() : [],
        ),
      );
    },
  };
});
