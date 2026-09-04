// The measured half of gw_play/victory_wait.js: holds a won war's end until
// every player from the final battle is back in gw_play. The observables are the
// scene's, handed in so the DOM bindings keep their identities. See coop.md,
// "War end".
define([], function () {
  return function (deps) {
    var visible = deps.visible;
    var message = deps.message;
    var connectedClients = deps.connectedClients;
    var maxClients = deps.maxClients;
    var connected = deps.connected;
    var expectedFromBattle = deps.expectedFromBattle;
    var labels = deps.labels;

    var subscriptions = [];
    var onDone;

    var expected = function () {
      var fromBattle = parseInt(expectedFromBattle()) || 1;
      var fromLobby = parseInt(maxClients()) || 1;
      return Math.max(fromBattle, fromLobby, 1);
    };

    // A viewer reports loading false only once its snapshot is applied, which
    // is the point after which host operators reach it.
    var clientReady = function (client) {
      if (!client || client.requires_loadout || client.loading) {
        return false;
      }
      var status = client.loading_status || "";
      return status !== "picking_loadout" && status !== "picking_tech_cards";
    };

    var returned = function () {
      return _.filter(connectedClients() || [], clientReady).length;
    };

    var ready = function () {
      if (!connected()) {
        return false;
      }
      var clients = connectedClients() || [];
      return clients.length >= expected() && _.every(clients, clientReady);
    };

    var refreshMessage = function () {
      message(labels.message(returned(), expected()));
    };

    var finish = function () {
      var done = onDone;
      onDone = undefined;
      _.forEach(subscriptions, function (subscription) {
        subscription.dispose();
      });
      subscriptions = [];
      visible(false);
      message("");
      if (done) {
        done();
      }
    };

    var check = function () {
      if (!onDone) {
        return;
      }
      if (ready()) {
        finish();
      } else {
        refreshMessage();
      }
    };

    var state = {
      visible: visible,
      message: message,
      ready: ready,

      wait: function (callback) {
        if (onDone) {
          return;
        }
        if (ready()) {
          callback();
          return;
        }
        onDone = callback;
        refreshMessage();
        visible(true);
        _.forEach([connectedClients, maxClients, connected], function (signal) {
          subscriptions.push(signal.subscribe(check));
        });
      },

      cancel: function () {
        if (onDone) {
          finish();
        }
      },
    };

    return state;
  };
});
