// Predicts the army colour each connected co-op client will be given in the next
// battle, so the war information panel can show it on the galaxy map.
//
// With unshared army control the base game's gw_play/gw_coop_referee.js splits the
// single human army into one army per client: army 0 keeps the host's GW faction
// colour pair and armies 1..n-1 take primaries from the custom-game lobby palette,
// each keeping the host's secondary. That palette and every helper around it are
// private to gw_coop_referee.js, which exports only apply() - there is nothing to
// require - and gw_coop_referee.js is itself a deliberate mirror of the server's
// server-script/lobby/color_table.js. This is therefore a third copy of the same
// data: keep the table, the brightness rule and the sort below in sync with
// gw_coop_referee.js if the base game ever changes them.
define(function () {
  // Applied only when a channel is saturated, matching the server's table.
  var LOBBY_COLOUR_BRIGHTNESS_ADJUSTMENT = 14 / 16;
  var LOBBY_BASE_COLOURS = [
    [142, 107, 68],
    [74, 43, 0],
    [139, 69, 19],
    [255, 0, 0],
    [128, 0, 0],
    [161, 59, 59],
    [255, 120, 47],
    [255, 200, 0],
    [139, 128, 0],
    [255, 255, 0],
    [0, 255, 255],
    [127, 255, 212],
    [70, 70, 70],
    [128, 128, 128],
    [164, 164, 164],
    [215, 215, 215],
    [160, 32, 240],
    [128, 0, 255],
    [75, 0, 130],
    [84, 44, 94],
    [22, 52, 102],
    [59, 54, 182],
    [0, 128, 255],
    [51, 151, 197],
    [100, 149, 237],
    [176, 224, 230],
    [147, 122, 219],
    [54, 78, 102],
    [0, 128, 128],
    [72, 89, 61],
    [50, 184, 50],
    [0, 255, 0],
    [0, 128, 0],
    [0, 255, 128],
    [32, 178, 170],
    [0, 250, 154],
    [124, 252, 0],
    [154, 205, 50],
    [240, 230, 140],
    [255, 255, 224],
    [255, 218, 185],
    [255, 182, 193],
    [255, 160, 122],
    [250, 128, 114],
    [255, 99, 71],
    [255, 69, 0],
    [199, 21, 133],
    [255, 0, 255],
    [218, 112, 214],
    [255, 105, 180],
  ];
  var lobbyColourTable;

  var adjustLobbyColour = function (colour) {
    if (colour[0] !== 255 && colour[1] !== 255 && colour[2] !== 255) {
      return _.cloneDeep(colour);
    }

    return _.map(colour, function (channel) {
      return Math.round(channel * LOBBY_COLOUR_BRIGHTNESS_ADJUSTMENT);
    });
  };

  var getLobbyColourTable = function () {
    if (!lobbyColourTable) {
      lobbyColourTable = _.map(LOBBY_BASE_COLOURS, adjustLobbyColour);
    }

    return lobbyColourTable;
  };

  var coloursEqual = function (a, b) {
    return !!(a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);
  };

  // Squared distance is enough - we only sort by it, and the square root would
  // preserve the ordering.
  var colourDistanceSquared = function (a, b) {
    var red = a[0] - b[0];
    var green = a[1] - b[1];
    var blue = a[2] - b[2];

    return red * red + green * green + blue * blue;
  };

  // Lobby primaries ordered from most to least similar to the host's primary. The
  // host keeps its exact faction colour, so an exact match is dropped rather than
  // handed to player 2, as are duplicate entries in the table.
  var lobbyPrimariesBySimilarity = function (hostPrimary) {
    var candidates = [];

    _.forEach(getLobbyColourTable(), function (colour) {
      var alreadyPicked = _.some(candidates, function (candidate) {
        return coloursEqual(colour, candidate.colour);
      });

      if (!coloursEqual(colour, hostPrimary) && !alreadyPicked) {
        candidates.push({
          colour: _.cloneDeep(colour),
          distance: colourDistanceSquared(colour, hostPrimary),
        });
      }
    });

    return _.map(
      _.sortBy(candidates, function (candidate) {
        return candidate.distance;
      }),
      function (candidate) {
        return candidate.colour;
      }
    );
  };

  return {
    // Colour pairs for the split human armies, index-aligned with the armies
    // gw_coop_referee.js creates. Returns fewer pairs than requested when the
    // palette runs out - the same shortfall the referee reports before refusing
    // the battle - so callers must tolerate a missing entry.
    pairsForPlayers: function (playerCount, factionColour) {
      var pairs = [_.cloneDeep(factionColour)];
      var primaries = lobbyPrimariesBySimilarity(factionColour[0]);

      while (
        pairs.length < playerCount &&
        pairs.length - 1 < primaries.length
      ) {
        pairs.push([
          _.cloneDeep(primaries[pairs.length - 1]),
          _.cloneDeep(factionColour[1]),
        ]);
      }

      return pairs;
    },

    // The order gw_lobby.js's startGame() walks when it hands the split armies to
    // clients: host first, everyone else left in join order. The UI client list
    // identifies the host by role rather than by the creator id the server uses.
    clientsInPlayerOrder: function (connectedClients) {
      if (!_.isArray(connectedClients)) {
        return [];
      }

      // _.sortBy is stable, so non-host clients keep their existing order.
      return _.sortBy(connectedClients, function (client) {
        return client && client.role === "host" ? 0 : 1;
      });
    },
  };
});
