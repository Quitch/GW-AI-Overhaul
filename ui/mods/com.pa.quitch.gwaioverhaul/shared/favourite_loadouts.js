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

  // Partitions cards into [favourites..., rest...]. Favourites follow
  // favouriteIds' order, oldest first, not the cards' - ordering by card
  // position only looks right when the input is already sorted. `rest` is
  // stable. A falsy getId(card) means never-favouritable, and lands in `rest`.
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
