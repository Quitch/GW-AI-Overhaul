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
  //
  // The host sends no answer when the request is lost: a host with no handler
  // for it only logs, and a dropped connection takes it with it. So a request
  // unanswered after retryMs is tried again, up to maxRetries times per
  // connection, and one sent before the viewer stopped being ready is treated
  // as lost.
  var viewerRequest = function (params) {
    var pending = params.pending;
    var wait = params.wait || setTimeout;
    var retryMs = params.retryMs || 15000;
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
