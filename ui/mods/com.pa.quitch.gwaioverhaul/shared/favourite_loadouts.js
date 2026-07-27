define(function () {
  var normalizeIds = function (ids) {
    return _.isArray(ids) ? ids : [];
  };

  var isFavourite = function (ids, id) {
    return !!id && _.includes(normalizeIds(ids), id);
  };

  var toggleId = function (ids, id) {
    var current = normalizeIds(ids);
    return isFavourite(current, id)
      ? _.without(current, id)
      : current.concat([id]);
  };

  // Partitions cards into [favourites..., rest...]. Favourites are ordered
  // by favouriteIds' own order (the order they were favourited in - toggleId
  // appends new ids to the end, so this is oldest-favourited-first), not by
  // the cards' original position - otherwise the order would only look
  // right by coincidence when re-sorting an already-sorted list (e.g. right
  // after a toggle) and revert to loadout order on a fresh load, where the
  // input is the original, unsorted card list. `rest` keeps the cards'
  // existing relative order (stable). getId(card) must return a falsy value
  // for cards that can never be favourited (locked cards), which always
  // land in `rest`.
  var sortCardsByFavourite = function (cards, favouriteIds, getId) {
    var ids = normalizeIds(favouriteIds);
    var rest = [];
    var cardsById = {};

    _.forEach(cards, function (card) {
      var id = getId(card);
      if (id && _.includes(ids, id)) {
        cardsById[id] = card;
      } else {
        rest.push(card);
      }
    });

    var favourites = _.compact(
      _.map(ids, function (id) {
        return cardsById[id];
      })
    );

    return favourites.concat(rest);
  };

  return {
    isFavourite: isFavourite,
    toggleId: toggleId,
    sortCardsByFavourite: sortCardsByFavourite,
  };
});
