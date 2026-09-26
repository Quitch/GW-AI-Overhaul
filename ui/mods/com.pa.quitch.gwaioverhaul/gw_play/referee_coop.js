define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  // One implementation, shared with shared/cards.js, so the two cannot drift.
  var getConnectedClients = gwoCard.getConnectedClients;

  // An unauthenticated viewer can have an empty client id, so a client is keyed
  // by id and name together.
  var clientKey = function (clientId, clientName) {
    return String(clientId || "") + "::" + String(clientName || "");
  };

  // The viewer-role clients in a client list.
  var viewersOf = function (clients) {
    return _.filter(_.isArray(clients) ? clients : [], function (client) {
      return client && client.role === "viewer";
    });
  };

  // A connected client's co-op record. The game keys records by id and name.
  var recordForClient = function (game, client) {
    return game.findCoopPlayerInventoryData({
      id: client.id,
      name: client.name,
    });
  };

  // Returns {client, inventory} pairs for connected viewer-role clients.
  var getConnectedViewerInventories = function (game, connectedClients) {
    var clients = connectedClients || getConnectedClients();

    return _.reduce(
      viewersOf(clients),
      function (viewers, client) {
        var playerData = recordForClient(game, client);

        if (!playerData || !playerData.inventory) {
          return viewers;
        }

        viewers.push({ client: client, inventory: playerData.inventory });
        return viewers;
      },
      []
    );
  };

  // The co-op AI players' records that field tech of their own: those with an
  // inventory, under per-player tech, in a session. Slot order. A record is an
  // AI's iff it carries gwaioAi - coop_ai_roster.js's isAiRecord. See coop.md,
  // "AI players' tech".
  var getCoopAiInventories = function (game) {
    if (!game.perPlayerTechCards() || !model.gwCampaignActive()) {
      return [];
    }

    return _(game.coopPlayerInventoryData())
      .filter(function (record) {
        return (
          !!record && _.isPlainObject(record.gwaioAi) && !!record.inventory
        );
      })
      .sortBy("gwaioAi.serial")
      .map(function (record) {
        return { record: record, inventory: record.inventory };
      })
      .value();
  };

  // {subcommander, cards} pairs for every allied AI commander drawing from the
  // player faction's palette, in battle-config colour order: the host's, each
  // viewer's, then each co-op AI player's. The cards are the owning player's,
  // since a subcommander's tech comes from its own player.
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

    var perPlayerTech = game.perPlayerTechCards();

    if (!perPlayerTech) {
      return subcommanders;
    }

    _.forEach(
      getConnectedViewerInventories(game, connectedClients).concat(
        getCoopAiInventories(game)
      ),
      function (player) {
        if (!_.isArray(player.inventory.minions)) {
          return;
        }

        var playerCards = _.isArray(player.inventory.cards)
          ? player.inventory.cards
          : [];

        subcommanders = subcommanders.concat(
          _.map(player.inventory.minions, function (minion) {
            return { subcommander: minion, cards: playerCards };
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
    viewersOf: viewersOf,
    recordForClient: recordForClient,
    clientKey: clientKey,
    getConnectedClients: getConnectedClients,
    getConnectedViewerInventories: getConnectedViewerInventories,
    getCoopAiInventories: getCoopAiInventories,
    getOrderedSubcommanders: getOrderedSubcommanders,
    alliedColourIndex: alliedColourIndex,
    clientsInPlayerOrder: clientsInPlayerOrder,
  };
});
