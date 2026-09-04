define(function () {
  // The index the loadout list's selection should land on once the list has
  // been rebuilt: the card with `activeId` if it is present and not locked,
  // else the first unlocked card, else -1. `cardId` reads a card's id;
  // `isLocked` says whether a card may be selected.
  var selectableIndex = function (cards, activeId, cardId, isLocked) {
    var list = _.isArray(cards) ? cards : [];
    var unlocked = function (card) {
      return !isLocked(card);
    };

    if (activeId) {
      var activeIndex = _.findIndex(list, function (card) {
        return cardId(card) === activeId;
      });
      if (activeIndex !== -1 && unlocked(list[activeIndex])) {
        return activeIndex;
      }
    }

    return _.findIndex(list, unlocked);
  };

  return {
    selectableIndex: selectableIndex,
  };
});
