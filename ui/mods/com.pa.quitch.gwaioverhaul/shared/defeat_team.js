// Dependency-free so that gw_inventory.js can require it without closing a
// cycle. See architecture.md, "Returning from a battle".
define(function () {
  var defeatTeam = function (game, defeatedTeam) {
    var remainingBosses = 0;
    var defeatedFaction;
    var teamOfFaction = {};

    api.tally.incStatInt("gw_eliminate_faction");

    _.forEach(game.galaxy().stars(), function (star) {
      var ai = star.ai();
      if (!ai || !ai.boss || ai.team === undefined) {
        return;
      }
      if (ai.team === defeatedTeam) {
        defeatedFaction = ai.faction;
      } else {
        teamOfFaction[ai.faction] = ai.team;
      }
    });

    var isDefeated = function (ai) {
      if (ai.team === defeatedTeam) {
        return true;
      }
      return (
        ai.team !== undefined &&
        defeatedFaction !== undefined &&
        ai.faction === defeatedFaction
      );
    };

    _.forEach(game.galaxy().stars(), function (star) {
      var ai = star.ai();
      var guardians = ai && ai.mirrorMode;

      if (ai && isDefeated(ai)) {
        var replacementAI = _.find(ai.foes, function (foe) {
          return _.has(teamOfFaction, foe.faction);
        });
        if (replacementAI) {
          var newAI = _.extend({}, ai, replacementAI);
          newAI.team = teamOfFaction[replacementAI.faction];
          newAI.foes = _.without(ai.foes, replacementAI);
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
