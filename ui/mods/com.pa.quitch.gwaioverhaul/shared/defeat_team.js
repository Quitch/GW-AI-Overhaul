// Dependency-free so that gw_inventory.js can require it without closing a
// cycle. See architecture.md, "Returning from a battle".
define(function () {
  var defeatTeam = function (game, defeatedTeam) {
    var remainingBosses = 0;

    api.tally.incStatInt("gw_eliminate_faction");

    _.forEach(game.galaxy().stars(), function (star) {
      var ai = star.ai();
      var guardians = ai && ai.mirrorMode;

      if (ai && ai.team === defeatedTeam) {
        var replacementAI = _.first(ai.foes);
        if (replacementAI) {
          var newAI = _.extend({}, ai, replacementAI);
          newAI.foes = _.rest(ai.foes);
          delete newAI.minions;
          star.ai(newAI);
        } else {
          star.ai(undefined);
          // Delete pre-dealt cards when boss defeated
          if (!guardians) {
            star.cardList([]);
          }
        }
      } else if (ai && ai.boss) {
        ++remainingBosses;
      }
    });

    if (!remainingBosses) {
      game.gameState("won");
    }
  };

  return {
    install: function (game) {
      if (!game || game.isTutorial()) {
        return;
      }

      game.defeatTeam = function (defeatedTeam) {
        defeatTeam(game, defeatedTeam);
      };
    },
  };
});
