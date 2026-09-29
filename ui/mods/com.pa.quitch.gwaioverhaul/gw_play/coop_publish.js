// GWO's own snapshots to the viewers. Under per-player tech the server applies
// a viewer's tech choice to its copy before the host has it, and a snapshot
// replaces that copy whole, so one is held as a debt until every viewer is
// level. One debt for the scene: every module gets this same object. See
// coop.md, "Publishing to viewers".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
], function (coopStarCards, refereeCoop) {
  var debt;

  var connectedClients = function () {
    var clients = model.gwCampaignConnectedClients();
    return _.isArray(clients) ? clients : [];
  };

  var hasViewer = function () {
    return _.some(connectedClients(), function (client) {
      return client && client.role === "viewer";
    });
  };

  // The star-card refresh's own test, over the connected viewers.
  var viewersLevel = function () {
    var game = model.game();
    return coopStarCards.viewersReadyForStarRefresh({
      viewers: refereeCoop.viewersOf(connectedClients()),
      findRecord: function (client) {
        return refereeCoop.recordForClient(game, client);
      },
      getDealCount: model.getCoopPlayerTechCardDealCount,
      hostDealCount: game.hostTechCardDealCount(),
      setupBlocked: model.gwCampaignPlayerSetupBlocked(),
      turnState: game.turnState(),
      aiDeciding: model.gwoCoopAiDeciding(),
    });
  };

  // Viewers hold no tech state under shared tech, so a snapshot goes out at
  // once. With nobody to tell, a joiner's initial sync asks for one itself.
  var settle = function () {
    if (!debt) {
      return false;
    }
    if (!hasViewer()) {
      debt = undefined;
      return false;
    }
    if (model.gwCampaignPerPlayerTechCards() && !viewersLevel()) {
      return false;
    }

    var reason = debt;
    debt = undefined;
    model.sendCampaignSnapshot(reason, true);
    return true;
  };

  return {
    // Publishes now, or once every viewer is level. A later reason replaces
    // one still held: a snapshot carries everything either way.
    publish: function (reason) {
      debt = reason;
      return settle();
    },
    settle: settle,
  };
});
