define(() => {
  const normalizeIds = (ids) => (Array.isArray(ids) ? ids : []);

  const isFavourite = (ids, id) => !!id && _.includes(normalizeIds(ids), id);

  const toggleId = (ids, id) => {
    const current = normalizeIds(ids);
    return isFavourite(current, id)
      ? _.without(current, id)
      : current.concat([id]);
  };

  // Partitions cards into [favourites..., rest...]. Favourites follow
  // favouriteIds' order, oldest first, not the cards' - ordering by card
  // position only looks right when the input is already sorted. `rest` is
  // stable. A falsy getId(card) means never-favouritable, and lands in `rest`.
  const sortCardsByFavourite = (cards, favouriteIds, getId) => {
    const ids = normalizeIds(favouriteIds);
    const rest = [];
    const cardsById = {};

    _.forEach(cards, (card) => {
      const id = getId(card);
      if (id && _.includes(ids, id)) {
        cardsById[id] = card;
      } else {
        rest.push(card);
      }
    });

    const favourites = _.compact(_.map(ids, (id) => cardsById[id]));

    return favourites.concat(rest);
  };

  return {
    isFavourite,
    toggleId,
    sortCardsByFavourite,
  };
});
