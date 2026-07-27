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

  // Stable-partitions cards into [favourites..., rest...]; getId(card) must
  // return a falsy value for cards that can never be favourited (locked
  // cards), which always land in `rest`.
  var sortCardsByFavourite = function (cards, favouriteIds, getId) {
    var ids = normalizeIds(favouriteIds);
    var favourites = [];
    var rest = [];
    _.forEach(cards, function (card) {
      var id = getId(card);
      (id && _.includes(ids, id) ? favourites : rest).push(card);
    });
    return favourites.concat(rest);
  };

  return {
    isFavourite: isFavourite,
    toggleId: toggleId,
    sortCardsByFavourite: sortCardsByFavourite,
  };
});
