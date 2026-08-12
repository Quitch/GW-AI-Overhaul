define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], (
  gwoCard
) => {
  // Shared with shared/cards.js; the two copies had already drifted apart.
  const getConnectedViewers = gwoCard.getConnectedClients;

  // Returns {client, inventory} pairs for connected viewer-role clients.
  const getConnectedViewerInventories = (game, connectedClients) => {
    const clients = connectedClients || getConnectedViewers();

    return _.reduce(
      clients,
      (viewers, client) => {
        if (!client || client.role !== "viewer") {
          return viewers;
        }

        const playerData =
          game.findCoopPlayerInventoryData &&
          game.findCoopPlayerInventoryData({
            id: client.id,
            name: client.name,
          });

        if (!playerData || !playerData.inventory) {
          return viewers;
        }

        viewers.push({ client, inventory: playerData.inventory });
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
  const getOrderedSubcommanders = (inventory, game, connectedClients) => {
    const hostCards = _.isFunction(inventory.cards) ? inventory.cards() : [];
    let subcommanders = _.map(
      _.isFunction(inventory.minions) ? inventory.minions() : [],
      (minion) => ({
        subcommander: minion,
        cards: hostCards,
      })
    );

    const perPlayerTech =
      game &&
      _.isFunction(game.perPlayerTechCards) &&
      game.perPlayerTechCards();

    if (!perPlayerTech) {
      return subcommanders;
    }

    _.forEach(
      getConnectedViewerInventories(game, connectedClients),
      (viewer) => {
        if (!_.isArray(viewer.inventory.minions)) {
          return;
        }

        const viewerCards = _.isArray(viewer.inventory.cards)
          ? viewer.inventory.cards
          : [];

        subcommanders = subcommanders.concat(
          _.map(viewer.inventory.minions, (minion) => ({
            subcommander: minion,
            cards: viewerCards,
          }))
        );
      }
    );

    return subcommanders;
  };

  // Index 0 is reserved for the player, whose army takes the faction's own
  // colour pair rather than a palette entry.
  const alliedColourIndex = (position) => position + 1;

  // The order gw_lobby.js's startGame() hands out the split armies: host first,
  // then join order. The UI list identifies the host by role, not creator id.
  const clientsInPlayerOrder = (connectedClients) => {
    if (!_.isArray(connectedClients)) {
      return [];
    }

    // _.sortBy is stable, so non-host clients keep their existing order.
    return _.sortBy(connectedClients, (client) =>
      client && client.role === "host" ? 0 : 1
    );
  };

  return {
    getConnectedViewers,
    getConnectedViewerInventories,
    getOrderedSubcommanders,
    alliedColourIndex,
    clientsInPlayerOrder,
  };
});
