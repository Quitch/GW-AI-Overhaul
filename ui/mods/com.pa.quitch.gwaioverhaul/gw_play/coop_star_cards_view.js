// Viewer-side read model for the per-player pre-dealt star cards the host writes
// to gwaioStarCards. Reading the record rather than star.ai().cardName is what
// survives a snapshot: applyCampaignSnapshot rebuilds every star object.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js",
], (coopStarCards) => {
  const starCardIdForRecord = (record, starIndex) => {
    const card = coopStarCards.starCardForRecord(record, starIndex);
    return card && _.isString(card.id) ? card.id : undefined;
  };

  const shouldUseViewerStarCard = (isViewer, perPlayerTech) =>
    !!(isViewer && perPlayerTech);

  const factory = () => {
    // summarize() lives on the card module, which loads asynchronously. Writing
    // the cache re-evaluates whatever computed read it and missed.
    const names = ko.observable({});
    const requested = {};

    const cardName = (cardId) => {
      if (!_.isString(cardId) || !cardId.length) {
        return "";
      }

      const known = names()[cardId];
      if (!_.isUndefined(known)) {
        return known;
      }

      if (!requested[cardId]) {
        requested[cardId] = true;
        requireGW([`cards/${cardId}`], (card) => {
          const next = Object.assign({}, names());
          next[cardId] =
            card && _.isFunction(card.summarize) ? loc(card.summarize()) : "";
          names(next);
        });
      }

      return "";
    };

    const cardIdForStar = (starIndex) =>
      starCardIdForRecord(model.currentCoopPlayerInventoryData(), starIndex);

    return {
      cardIdForStar,
      cardName,
      shouldUseViewerStarCard,
    };
  };

  factory.shouldUseViewerStarCard = shouldUseViewerStarCard;

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      starCardIdForRecord,
      shouldUseViewerStarCard,
    };
  }

  return factory;
});
