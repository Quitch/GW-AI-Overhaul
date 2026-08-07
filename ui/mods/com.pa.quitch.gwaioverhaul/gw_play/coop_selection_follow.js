// A co-op viewer's selection follows the host only until the viewer picks a star
// of their own. See coop.md.
define(function () {
  // Selecting the star the host is standing on is how a viewer starts following
  // again.
  var followsHost = function (star, hostStar) {
    return !_.isNumber(star) || star < 0 || star === hostStar;
  };

  var factory = function (params) {
    var game = params.game;
    var chosenStar;

    var trackSelection = function (star) {
      // A replayed host move writes the selection itself, because the base
      // game's move() reads it as the destination.
      if (model.gwCampaignReplayingAction) {
        return;
      }

      chosenStar = followsHost(star, game.currentStar()) ? undefined : star;
    };

    var restoreChosenStar = function (star) {
      return function () {
        if (chosenStar === star && model.selection.star() !== star) {
          model.selection.star(star);
        }
      };
    };

    var originalApplyCampaignAction = model.applyCampaignAction;

    model.applyCampaignAction = function () {
      var star = chosenStar;
      var result = originalApplyCampaignAction.apply(model, arguments);

      if (star === undefined || !result || !_.isFunction(result.then)) {
        return result;
      }

      var restore = restoreChosenStar(star);
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
    module.exports = { followsHost: followsHost };
  }

  return factory;
});
