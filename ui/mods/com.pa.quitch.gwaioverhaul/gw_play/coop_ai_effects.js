// What a card would do to a co-op AI player's inventory, found by applying it:
// a scratch inventory built from the AI's saved one, run through the real
// GWInventory.applyCards with GWO's and the base game's banks held shut, as
// every host apply of a co-op record is. Applies run one at a time, each
// against a timeout, and are cached by what they apply. See tech-cards.md,
// "How AI players judge a card".
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js"], function (
  gwoBank
) {
  // An apply depends on the cards and their tags alone: applyCards rebuilds
  // everything else from them.
  var digestOf = function (saved) {
    return JSON.stringify([saved.cards || [], saved.tags || {}]);
  };

  // The saved inventory with `card` added: a loadout goes first, as the war's
  // start card does, anything else last.
  var withCard = function (saved, card, loadout) {
    var next = _.cloneDeep(saved);
    next.cards = loadout
      ? [card].concat(next.cards || [])
      : (next.cards || []).concat(card);
    return next;
  };

  var withoutCard = function (saved, index) {
    var next = _.cloneDeep(saved);
    next.cards = _.filter(next.cards || [], function (card, at) {
      return at !== index;
    });
    return next;
  };

  // GWInventory.save() is ko.toJS, which copies the prototype's methods onto
  // the result, so a save still looks like a GWInventory to anything that
  // tests for getTag. What an apply hands back is plain data, as a stored
  // record's inventory is.
  var plain = function (saved) {
    return JSON.parse(JSON.stringify(saved));
  };

  // params: GWInventory, stockBank, timeoutMs.
  var factory = function (params) {
    var tail = Promise.resolve();
    var cache = {};

    var applyOnce = function (saved) {
      return new Promise(function (resolve, reject) {
        var held;
        var timer = setTimeout(function () {
          if (held) {
            held.abandon();
          }
          reject(new Error("apply timed out after " + params.timeoutMs + "ms"));
        }, params.timeoutMs);

        try {
          held = gwoBank.applyInventoryHeld(
            params.GWInventory,
            saved,
            params.stockBank,
            function (inventory) {
              clearTimeout(timer);
              resolve(plain(inventory.save()));
            }
          );
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      });
    };

    // Resolves the applied saved inventory. One apply runs at a time: the
    // bank hold and the card modules are shared.
    var apply = function (saved) {
      var digest = digestOf(saved);
      if (!cache[digest]) {
        var result = tail.then(function () {
          return applyOnce(saved);
        });
        tail = result.then(_.noop, _.noop);
        cache[digest] = result;
        result.then(null, function () {
          delete cache[digest];
        });
      }
      return cache[digest];
    };

    return {
      apply: apply,
      // The inventory before and after a card.
      withCard: function (saved, card, loadout) {
        return Promise.all([
          apply(saved),
          apply(withCard(saved, card, loadout)),
        ]);
      },
      // The inventory without a held card, and with it: what it is worth now.
      withoutCard: function (saved, index) {
        return Promise.all([apply(withoutCard(saved, index)), apply(saved)]);
      },
      clear: function () {
        cache = {};
      },
    };
  };

  factory.digestOf = digestOf;
  factory.plain = plain;
  factory.addCard = withCard;
  factory.removeCard = withoutCard;

  return factory;
});
