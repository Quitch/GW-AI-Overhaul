define(() => {
  // The index the loadout list's selection should land on once the list has
  // been rebuilt: the card with `activeId` if it is present and not locked,
  // else the first unlocked card, else -1. `cardId` reads a card's id;
  // `isLocked` says whether a card is refused.
  const selectableIndex = (cards, activeId, cardId, isLocked) => {
    const list = Array.isArray(cards) ? cards : [];
    const unlocked = (card) => !isLocked(card);

    if (activeId) {
      const activeIndex = _.findIndex(
        list,
        (card) => cardId(card) === activeId,
      );
      if (activeIndex !== -1 && unlocked(list[activeIndex])) {
        return activeIndex;
      }
    }

    return _.findIndex(list, unlocked);
  };

  return {
    selectableIndex,
  };
});
