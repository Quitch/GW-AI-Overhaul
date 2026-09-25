// A co-op player's starting inventory, built from their loadout: a viewer's in
// the per-player loadout scene, and a co-op AI player's on the host. The deck,
// its loaded cards and GWInventory are handed in, so neither caller pulls in the
// other's scene. See coop.md, "The per-player loadout scene".
define(function () {
  // A loadout that quietly banked tech would hand the player cards nobody
  // dealt them, so anything but the loadout alone in first place, with room
  // beyond it, is refused.
  var validateStartingInventory = function (savedInventory, loadoutCardId) {
    var cards = savedInventory.cards || [];
    if (
      !cards.length ||
      cards[0].id !== loadoutCardId ||
      !_.isNumber(savedInventory.maxCards) ||
      savedInventory.maxCards <= cards.length
    ) {
      console.error(
        "[GW COOP] Co-op loadout inventory did not produce empty tech banks loadout=" +
          loadoutCardId +
          " maxCards=" +
          savedInventory.maxCards +
          " cards=" +
          JSON.stringify(cards)
      );
      return false;
    }

    return true;
  };

  // The deal gate reads the race off each inventory, so the tag travels with
  // the player's own. See races.md.
  var buildGlobalTags = function (commander, playerFaction, playerRace) {
    var globalTags = {
      commander: commander,
    };

    if (_.isNumber(playerFaction)) {
      globalTags.playerFaction = playerFaction;
    }
    if (_.isString(playerRace) && playerRace.length) {
      globalTags.playerRace = playerRace;
    }

    return globalTags;
  };

  var dealStartingCard = function (
    gwoDeal,
    loaded,
    loadedCards,
    loadoutCardId,
    dealInventory,
    galaxy,
    star
  ) {
    return gwoDeal.dealCard(
      {
        id: loadoutCardId,
        inventory: dealInventory,
        galaxy: galaxy,
        star: star,
      },
      loaded,
      loadedCards
    );
  };

  var applyStartingInventory = function (
    GWInventory,
    loadoutCardId,
    globalTags,
    startCardProduct,
    result
  ) {
    var inventory = new GWInventory();

    inventory.load({
      cards: [startCardProduct || { id: loadoutCardId }],
      tags: {
        global: globalTags,
      },
    });

    inventory.applyCards(function () {
      var savedInventory = inventory.save();
      if (!validateStartingInventory(savedInventory, loadoutCardId)) {
        result.reject(
          "Co-op loadout inventory did not produce empty tech banks."
        );
        return;
      }

      result.resolve(savedInventory);
    });
  };

  // The whole build, resolving the saved inventory. params: GWInventory,
  // gwoDeal, loaded (resolves once loadedCards are in), loadedCards,
  // loadoutCardId, commander, playerFaction, playerRace, galaxy, star.
  var build = function (params) {
    var result = $.Deferred();
    var dealInventory = new params.GWInventory();
    var globalTags = buildGlobalTags(
      params.commander,
      params.playerFaction,
      params.playerRace
    );

    _.forEach(globalTags, function (value, name) {
      dealInventory.setTag("global", name, value);
    });

    dealStartingCard(
      params.gwoDeal,
      params.loaded,
      params.loadedCards,
      params.loadoutCardId,
      dealInventory,
      params.galaxy,
      params.star
    ).then(
      function (startCardProduct) {
        applyStartingInventory(
          params.GWInventory,
          params.loadoutCardId,
          globalTags,
          startCardProduct,
          result
        );
      },
      function (error) {
        result.reject(error);
      }
    );

    return result.promise();
  };

  return {
    validateStartingInventory: validateStartingInventory,
    buildGlobalTags: buildGlobalTags,
    dealStartingCard: dealStartingCard,
    applyStartingInventory: applyStartingInventory,
    build: build,
  };
});
