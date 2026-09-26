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

  // A GWInventory that notes every unit its cards remove.
  var recording = function (GWInventory, removed) {
    return function () {
      var inventory = new GWInventory();
      var removeUnits = inventory.removeUnits;
      inventory.removeUnits = function (units) {
        if (_.isArray(units)) {
          removed.push.apply(removed, _.filter(units, _.isString));
        }
        return removeUnits.apply(inventory, arguments);
      };
      return inventory;
    };
  };

  // Non-enumerable, so no copy or save of the result carries it.
  var withStripped = function (applied, removed) {
    Object.defineProperty(applied, "strippedUnits", {
      value: _.difference(_.uniq(removed), applied.units || []),
    });
    return applied;
  };

  // Applies kept for reuse. Enough for a deal's or a ping window's; older ones
  // are dropped, so a long war does not keep every inventory it judged.
  var MAX_CACHED = 64;

  // params: GWInventory, stockBank, timeoutMs.
  var factory = function (params) {
    var tail = Promise.resolve();
    var cache = {};
    // Digests in the order they were cached, oldest first.
    var order = [];

    var applyOnce = function (saved) {
      return new Promise(function (resolve, reject) {
        var held;
        var removed = [];
        var timer = setTimeout(function () {
          if (held) {
            held.abandon();
          }
          reject(new Error("apply timed out after " + params.timeoutMs + "ms"));
        }, params.timeoutMs);

        try {
          held = gwoBank.applyInventoryHeld(
            recording(params.GWInventory, removed),
            saved,
            params.stockBank,
            function (inventory) {
              clearTimeout(timer);
              resolve(withStripped(plain(inventory.save()), removed));
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
        order.push(digest);
        if (order.length > MAX_CACHED) {
          delete cache[order.shift()];
        }
        result.then(null, function () {
          if (cache[digest] === result) {
            delete cache[digest];
            _.pull(order, digest);
          }
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
      clear: function () {
        cache = {};
        order = [];
      },
    };
  };

  factory.MAX_CACHED = MAX_CACHED;
  factory.digestOf = digestOf;
  factory.plain = plain;
  factory.addCard = withCard;
  factory.removeCard = withoutCard;

  return factory;
});
