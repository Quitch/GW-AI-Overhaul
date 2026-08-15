// Formats the Conquest elimination popup: one "winner defeated loser" line
// per elimination, with faction icons tinted via -webkit-mask. A factory in
// victory.js's style so the formatting stays measurable; gw_play/conquest.js
// instantiates it with the live faction table. See conquest.md.
define([], function () {
  var factory = function (params) {
    var sideOf = function (factionIndex) {
      var faction = params.factions[factionIndex];
      if (!faction) {
        return undefined;
      }
      return {
        name: faction.name,
        iconUrl:
          faction.icon ||
          "coui://ui/main/game/galactic_war/shared/img/icon_faction_" +
            factionIndex +
            ".png",
        cssColor: "rgb(" + faction.color[0].join(",") + ")",
      };
    };

    var iconHtml = function (side) {
      return (
        '<span class="gwo-conquest-elim-icon" style="background-color:' +
        side.cssColor +
        ";-webkit-mask-image:url('" +
        side.iconUrl +
        "')\"></span>"
      );
    };

    // A non-numeric byTeam is a player kill: the winner is the player's own
    // faction, which no AI team maps to.
    var lineOf = function (elimination) {
      var loser = sideOf(params.cfg.factions[elimination.team]);
      var winner = sideOf(
        _.isNumber(elimination.byTeam)
          ? params.cfg.factions[elimination.byTeam]
          : params.playerFaction
      );
      var winnerHtml = winner ? iconHtml(winner) + " " + winner.name : "?";
      var loserHtml = loser ? loser.name + " " + iconHtml(loser) : "?";
      return winnerHtml + " " + loc("!LOC:defeated") + " " + loserHtml;
    };

    return {
      message: function (eliminations) {
        return (
          '<div class="gwo-conquest-elim">' +
          _.map(eliminations, lineOf).join("<br>") +
          "</div>"
        );
      },
    };
  };

  return factory;
});
