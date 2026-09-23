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

  // See coop.md, "General Commander setup".
  var viewerRequest = function (params) {
    var pending = params.pending;
    var wait = params.wait || setTimeout;
    var retryMs = 15000;
    var maxRetries = 3;
    var answered = false;
    var attempt = 0;
    var retries = 0;

    var request = {
      send: function () {
        var sent;

        if (!params.ready()) {
          pending(false);
          retries = 0;
          return false;
        }
        if (!recordNeedsSetup(params.record())) {
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

        attempt += 1;
        sent = attempt;
        wait(function () {
          if (sent !== attempt || answered || !pending.peek()) {
            return;
          }
          pending(false);
          if (retries < maxRetries) {
            retries += 1;
            request.send();
          }
        }, retryMs);
        return true;
      },

      answer: function () {
        pending(false);
        answered = true;
      },
    };

    return request;
  };

  return {
    needsSetup: needsSetup,
    recordNeedsSetup: recordNeedsSetup,
    viewerRequest: viewerRequest,
  };
});
