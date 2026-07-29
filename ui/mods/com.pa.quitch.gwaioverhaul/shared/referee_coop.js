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

  return {
    getConnectedViewers: getConnectedViewers,
    getConnectedViewerInventories: getConnectedViewerInventories,
  };
});
