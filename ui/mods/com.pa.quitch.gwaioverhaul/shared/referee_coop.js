define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  // Shared with shared/cards.js; the two copies had already drifted apart.
  var getConnectedViewers = gwoCard.getConnectedClients;

  // Returns {client, inventory} pairs for connected viewer-role clients.
  var getConnectedViewerInventories = function (game, connectedClients) {
    var clients = connectedClients || getConnectedViewers();

    return _.reduce(
      clients,
      function (viewers, client) {
        if (!client || client.role !== "viewer") {
          return viewers;
        }

        var playerData =
          game.findCoopPlayerInventoryData &&
          game.findCoopPlayerInventoryData({
            id: client.id,
            name: client.name,
          });

        if (!playerData || !playerData.inventory) {
          return viewers;
        }

        viewers.push({ client: client, inventory: playerData.inventory });
        return viewers;
      },
      []
    );
  };

  // {subcommander, cards} pairs for every allied AI commander drawing from the
  // player faction's palette, in battle-config colour order. The cards are the
  // owning player's, since a subcommander's tech comes from its own player.
  //
  // Order in equals order out, so a caller that cares which colour lands where
  // must pass clients host-first. See coop.md for what is excluded and why.
  var getOrderedSubcommanders = function (inventory, game, connectedClients) {
    // The host's own inventory is always the live GWInventory. Only the viewer
    // records below arrive as plain objects, hence the _.isArray tests there.
    var hostCards = inventory.cards();
    var subcommanders = _.map(inventory.minions(), function (minion) {
      return { subcommander: minion, cards: hostCards };
    });

    var perPlayerTech =
      game &&
      _.isFunction(game.perPlayerTechCards) &&
      game.perPlayerTechCards();

    if (!perPlayerTech) {
      return subcommanders;
    }

    _.forEach(
      getConnectedViewerInventories(game, connectedClients),
      function (viewer) {
        if (!_.isArray(viewer.inventory.minions)) {
          return;
        }

        var viewerCards = _.isArray(viewer.inventory.cards)
          ? viewer.inventory.cards
          : [];

        subcommanders = subcommanders.concat(
          _.map(viewer.inventory.minions, function (minion) {
            return { subcommander: minion, cards: viewerCards };
          })
        );
      }
    );

    return subcommanders;
  };

  // Index 0 is reserved for the player, whose army takes the faction's own
  // colour pair rather than a palette entry.
  var alliedColourIndex = function (position) {
    return position + 1;
  };

  // The order gw_lobby.js's startGame() hands out the split armies: host first,
  // then join order. The UI list identifies the host by role, not creator id.
  var clientsInPlayerOrder = function (connectedClients) {
    if (!_.isArray(connectedClients)) {
      return [];
    }

    // _.sortBy is stable, so non-host clients keep their existing order.
    return _.sortBy(connectedClients, function (client) {
      return client && client.role === "host" ? 0 : 1;
    });
  };

  return {
    getConnectedViewers: getConnectedViewers,
    getConnectedViewerInventories: getConnectedViewerInventories,
    getOrderedSubcommanders: getOrderedSubcommanders,
    alliedColourIndex: alliedColourIndex,
    clientsInPlayerOrder: clientsInPlayerOrder,
  };
});
