define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  // Shared with shared/cards.js rather than reimplemented - the two copies had
  // already drifted, this one missing the guard against a non-array value.
  var getConnectedViewers = gwoCard.getConnectedClients;

  // Resolves each connected viewer-role client to its co-op inventory data,
  // dropping clients that aren't viewers or have no resolvable inventory yet.
  // Returns {client, inventory} pairs.
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

  // Every allied AI commander that draws from the player's faction palette, in the
  // order the battle config numbers their colours: the host's subcommanders first,
  // then each connected viewer's. Viewers only field their own subcommanders under
  // per-player tech cards - without it there is one shared inventory and no co-op
  // records to read - so the viewer half is gated on that. Returns
  // {subcommander, cards} pairs, the cards being the owning player's, since a
  // subcommander's tech (duplication in particular) comes from its own player.
  //
  // A star's ai.ally is deliberately absent: it is numbered last, after every
  // subcommander, so that a per-star commander never shifts the colour of anything
  // the war panel shows. Its index is alliedColourIndex(theReturnedList.length).
  //
  // Order in equals order out for the viewers, so callers that care about which
  // colour lands on which subcommander must pass the clients host-first (see
  // gw_play/coop_colour.js's clientsInPlayerOrder); callers that only want the
  // count can pass the list as they hold it.
  var getOrderedSubcommanders = function (inventory, game, connectedClients) {
    var hostCards = _.isFunction(inventory.cards) ? inventory.cards() : [];
    var subcommanders = _.map(
      _.isFunction(inventory.minions) ? inventory.minions() : [],
      function (minion) {
        return { subcommander: minion, cards: hostCards };
      }
    );

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

  // Position in the player faction's palette (gw_play/commander_colour.js's pick)
  // for the position-th allied commander. Index 0 is reserved for the player, whose
  // army takes the faction's own colour pair rather than a palette entry.
  var alliedColourIndex = function (position) {
    return position + 1;
  };

  return {
    getConnectedViewers: getConnectedViewers,
    getConnectedViewerInventories: getConnectedViewerInventories,
    getOrderedSubcommanders: getOrderedSubcommanders,
    alliedColourIndex: alliedColourIndex,
  };
});
