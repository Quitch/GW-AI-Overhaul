// The measured half of gw_play/victory_wait.js: holds a won war's end until
// every player from the final battle is back in gw_play. The observables are the
// scene's, handed in so the DOM bindings keep their identities. See coop.md,
// "War end".
define([], () => (deps) => {
  const visible = deps.visible;
  const message = deps.message;
  const connectedClients = deps.connectedClients;
  const maxClients = deps.maxClients;
  const connected = deps.connected;
  const expectedFromBattle = deps.expectedFromBattle;
  const labels = deps.labels;

  let subscriptions = [];
  let onDone;

  const expected = () => {
    const fromBattle = Number.parseInt(expectedFromBattle(), 10) || 1;
    const fromLobby = Number.parseInt(maxClients(), 10) || 1;
    return Math.max(fromBattle, fromLobby, 1);
  };

  // A viewer reports loading false only once its snapshot is applied, which
  // is the point after which host operators reach it.
  const clientReady = (client) => {
    if (!client || client.requires_loadout || client.loading) {
      return false;
    }
    const status = client.loading_status || "";
    return status !== "picking_loadout" && status !== "picking_tech_cards";
  };

  const returned = () => _.filter(connectedClients() || [], clientReady).length;

  const ready = () => {
    if (!connected()) {
      return false;
    }
    const clients = connectedClients() || [];
    return clients.length >= expected() && _.every(clients, clientReady);
  };

  const refreshMessage = () => {
    message(labels.message(returned(), expected()));
  };

  const finish = () => {
    const done = onDone;
    onDone = undefined;
    _.forEach(subscriptions, (subscription) => {
      subscription.dispose();
    });
    subscriptions = [];
    visible(false);
    message("");
    if (done) {
      done();
    }
  };

  const check = () => {
    if (!onDone) {
      return;
    }
    if (ready()) {
      finish();
    } else {
      refreshMessage();
    }
  };

  const state = {
    visible,
    message,
    ready,

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
      _.forEach([connectedClients, maxClients, connected], (signal) => {
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
});
