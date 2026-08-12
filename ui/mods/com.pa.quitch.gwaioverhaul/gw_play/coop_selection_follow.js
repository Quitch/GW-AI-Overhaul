// A co-op viewer's selection follows the host only until the viewer picks a star
// of their own. See coop.md.
define(() => {
  // Selecting the star the host is standing on is how a viewer starts following
  // again.
  const followsHost = (star, hostStar) =>
    !_.isNumber(star) || star < 0 || star === hostStar;

  const factory = (params) => {
    const game = params.game;
    let chosenStar;

    const trackSelection = (star) => {
      // A replayed host move writes the selection itself, because the base
      // game's move() reads it as the destination.
      if (model.gwCampaignReplayingAction) {
        return;
      }

      chosenStar = followsHost(star, game.currentStar()) ? undefined : star;
    };

    const restoreChosenStar = (star) => () => {
      if (chosenStar === star && model.selection.star() !== star) {
        model.selection.star(star);
      }
    };

    const originalApplyCampaignAction = model.applyCampaignAction;

    model.applyCampaignAction = function () {
      const star = chosenStar;
      const result = originalApplyCampaignAction.apply(model, arguments);

      if (star === undefined || !result || !_.isFunction(result.then)) {
        return result;
      }

      const restore = restoreChosenStar(star);
      // The original promise is returned untouched, because the campaign queue
      // orders itself on it.
      result.then(restore, restore);
      return result;
    };

    model.selection.star.subscribe(trackSelection);
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { followsHost };
  }

  return factory;
});
