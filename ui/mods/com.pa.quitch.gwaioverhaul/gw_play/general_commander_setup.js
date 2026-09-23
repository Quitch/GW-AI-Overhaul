// The decisions behind the General Commander loadout's co-op setup, kept apart
// from gw_play/cards_start_subcdr.js so they can be tested. See shadowing.md,
// "Reaching shadowed logic from tests".
define(function () {
  var needsSetup = function (cards) {
    return !!(
      _.isArray(cards) &&
      cards.length === 1 &&
      cards[0] &&
      cards[0].id === "gwc_start_subcdr" &&
      !cards[0].minions
    );
  };

  var recordNeedsSetup = function (record) {
    return needsSetup(record && record.inventory && record.inventory.cards);
  };

  // A viewer asks the host once for its Sub Commanders. The request can only go
  // once the viewer is connected and per-player tech has synced, which can land
  // after gw_play loads, so the caller runs send() again whenever those or the
  // record change. Once the host has answered, nothing is sent again, so a
  // refusal cannot become an endless resend.
  var viewerRequest = function (params) {
    var pending = params.pending;
    var answered = false;

    return {
      send: function () {
        if (!params.ready() || !recordNeedsSetup(params.record())) {
          return false;
        }
        if (answered || pending.peek()) {
          return false;
        }

        pending(true);
        if (!params.transmit()) {
          pending(false);
          return false;
        }
        return true;
      },

      answer: function () {
        pending(false);
        answered = true;
      },
    };
  };

  return {
    needsSetup: needsSetup,
    recordNeedsSetup: recordNeedsSetup,
    viewerRequest: viewerRequest,
  };
});
