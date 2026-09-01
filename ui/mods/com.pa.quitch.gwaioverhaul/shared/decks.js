// The tech card deck registry: which card ids a war's techCardDeck deals.
// No engine globals, no model - third-party decks arrive through deck_mods.js.
// See tech-cards.md, "Third-party decks".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deck_ids.js",
], function (deckIds) {
  var BASIC_ID = "Basic";
  var EXPANDED_ID = "Expanded";

  var registry = {}; // normalized id -> compiled descriptor
  var order = []; // normalized ids in registration order, built-ins first

  var normalizeId = function (id) {
    return _.isString(id) ? id.trim().toLowerCase() : "";
  };

  // The canonical id (as given, trimmed) is what gets persisted into the war
  // save, so the built-ins keep writing exactly "Basic"/"Expanded" as every
  // GWO version before decks did.
  var compile = function (descriptor) {
    return {
      id: _.isString(descriptor.id) ? descriptor.id.trim() : "",
      name: descriptor.name,
      tooltip: _.isString(descriptor.tooltip) ? descriptor.tooltip : undefined,
      include: _.map(descriptor.include || [], normalizeId),
      cards: (descriptor.cards || []).slice(),
    };
  };

  var validate = function (descriptor) {
    if (!_.isPlainObject(descriptor)) {
      throw new Error("gwoDecks: a deck must be an object");
    }
    if (!normalizeId(descriptor.id)) {
      throw new Error("gwoDecks: a deck needs an id");
    }
    if (!_.isString(descriptor.name) || !descriptor.name.trim()) {
      throw new Error('gwoDecks: deck "' + descriptor.id + '" needs a name');
    }
    if (!_.isUndefined(descriptor.include) && !_.isArray(descriptor.include)) {
      throw new Error(
        'gwoDecks: deck "' + descriptor.id + '" include must be an array'
      );
    }
    if (!_.isUndefined(descriptor.cards) && !_.isArray(descriptor.cards)) {
      throw new Error(
        'gwoDecks: deck "' + descriptor.id + '" cards must be an array'
      );
    }

    // An included deck must already be registered: built-ins always are, and
    // a third-party deck is when its mod loads earlier (lower priority) and
    // is declared a dependency in the including mod's modinfo.json.
    _.forEach(descriptor.include, function (id) {
      if (!registry[normalizeId(id)]) {
        throw new Error(
          'gwoDecks: deck "' +
            descriptor.id +
            '" includes unregistered deck "' +
            id +
            '"'
        );
      }
    });

    if (
      !(descriptor.include || []).length &&
      !(descriptor.cards || []).length
    ) {
      throw new Error(
        'gwoDecks: deck "' + descriptor.id + '" resolves to no cards'
      );
    }
  };

  var registerDeck = function (descriptor) {
    validate(descriptor);

    var compiled = compile(descriptor);
    var key = normalizeId(compiled.id);

    // Last-wins, keeping the first registration's picker position.
    if (!registry[key]) {
      order.push(key);
    }
    registry[key] = compiled;

    return compiled;
  };

  var register = function (descriptor) {
    var key = normalizeId(descriptor && descriptor.id);

    if (key === normalizeId(BASIC_ID) || key === normalizeId(EXPANDED_ID)) {
      throw new Error('gwoDecks: "' + key + '" is a built-in deck id');
    }

    return registerDeck(descriptor);
  };

  var byId = function (id) {
    return registry[normalizeId(id)];
  };

  var all = function () {
    return _.map(order, function (id) {
      return registry[id];
    });
  };

  // Includes resolve lazily against the live registry, so a last-wins
  // re-registration of an included deck is honoured. The visited set makes an
  // include cycle (possible only through re-registration) terminate.
  var expand = function (deck, visited, out) {
    var key = normalizeId(deck.id);

    if (_.contains(visited, key)) {
      return;
    }
    visited.push(key);

    _.forEach(deck.include, function (id) {
      expand(registry[id], visited, out);
    });
    _.forEach(deck.cards, function (cardId) {
      out.push(cardId);
    });
  };

  var resolve = function (deck) {
    var out = [];

    expand(deck, [], out);

    // Deduplicated because setupGwoDeck indexes by position: a repeat -
    // overlapping includes, or a cherry-picked id an include already carries -
    // would otherwise leave a hole in the deck.
    return _.uniq(out);
  };

  // The card ids a war's techCardDeck deals. Absent means a non-GWO save or
  // v5.35.0 and earlier; unknown means the deck's mod is gone, and Expanded
  // is the deck those wars were dealt from before this feature existed.
  var cardsFor = function (deckId) {
    var wanted = normalizeId(deckId);
    var deck = registry[wanted];

    if (wanted && !deck) {
      console.warn(
        "gwoDecks: unknown deck " +
          deckId +
          " (mod uninstalled?); dealing the Expanded deck instead"
      );
    }

    return resolve(deck || registry[normalizeId(EXPANDED_ID)]);
  };

  // Registered as this module loads, so every module that depends on it sees
  // the built-in decks at once. Third-party decks arrive through deck_mods.js.
  var registerBuiltIns = function () {
    registerDeck({
      id: BASIC_ID,
      name: "!LOC:Basic",
      cards: deckIds.basic,
    });
    registerDeck({
      id: EXPANDED_ID,
      name: "!LOC:Galactic War Overhaul",
      include: [BASIC_ID],
      cards: deckIds.expanded,
    });
  };

  registerBuiltIns();

  return {
    BASIC_ID: BASIC_ID,
    EXPANDED_ID: EXPANDED_ID,
    normalizeId: normalizeId,
    register: register,
    byId: byId,
    all: all,
    cardsFor: cardsFor,
    // Test-only: a registered deck outlives the module, and the harness loads
    // each module once per process. The built-ins always exist.
    reset: function () {
      registry = {};
      order = [];
      registerBuiltIns();
    },
  };
});
