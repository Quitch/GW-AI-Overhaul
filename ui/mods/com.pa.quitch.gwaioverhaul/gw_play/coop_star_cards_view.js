// Viewer-side read model for the per-player pre-dealt star cards the host writes
// to gwaioStarCards. Reading the record rather than star.ai().cardName is what
// survives a snapshot: applyCampaignSnapshot rebuilds every star object.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js",
], function (coopStarCards) {
  var starCardIdForRecord = function (record, starIndex) {
    var card = coopStarCards.starCardForRecord(record, starIndex);
    return card && _.isString(card.id) ? card.id : undefined;
  };

  var shouldUseViewerStarCard = function (isViewer, perPlayerTech) {
    return !!(isViewer && perPlayerTech);
  };

  var factory = function () {
    // summarize() lives on the card module, which loads asynchronously. Writing
    // the cache re-evaluates whatever computed read it and missed.
    var names = ko.observable({});
    var requested = {};

    var cardName = function (cardId) {
      if (!_.isString(cardId) || !cardId.length) {
        return "";
      }

      var known = names()[cardId];
      if (!_.isUndefined(known)) {
        return known;
      }

      if (!requested[cardId]) {
        requested[cardId] = true;
        requireGW(["cards/" + cardId], function (card) {
          var next = _.assign({}, names());
          next[cardId] =
            card && _.isFunction(card.summarize) ? loc(card.summarize()) : "";
          names(next);
        });
      }

      return "";
    };

    var cardIdForStar = function (starIndex) {
      return starCardIdForRecord(
        model.currentCoopPlayerInventoryData(),
        starIndex
      );
    };

    return {
      cardIdForStar: cardIdForStar,
      cardName: cardName,
      shouldUseViewerStarCard: shouldUseViewerStarCard,
    };
  };

  factory.shouldUseViewerStarCard = shouldUseViewerStarCard;

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      starCardIdForRecord: starCardIdForRecord,
      shouldUseViewerStarCard: shouldUseViewerStarCard,
    };
  }

  return factory;
});
