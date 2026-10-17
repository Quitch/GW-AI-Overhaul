// The host's war save after a win, owed while the AI stars' deal, the
// star-card refresh, or a co-op AI pass runs, so one win writes the war once.
// One debt for the scene: every module gets this same object. See coop.md,
// "One save per win".
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"], function (
  gwoSave
) {
  var holds = 0;
  var debt;

  var write = function (game, withStars) {
    return gwoSave(game, withStars).fail(function (reason) {
      console.error("GWO failed to save the war: " + reason);
    });
  };

  var settle = function () {
    if (!debt || holds > 0) {
      return;
    }

    var owed = debt;
    debt = undefined;
    write(owed.game, owed.withStars).then(
      function () {
        owed.deferred.resolve();
      },
      function (reason) {
        owed.deferred.reject(reason);
      }
    );
  };

  return {
    // Saves now, or once the last hold is released. Calls that wait join
    // one write, which saves the star systems if any of them asked to.
    owe: function (game, withStars) {
      if (!holds && !debt) {
        return write(game, withStars);
      }

      if (!debt) {
        debt = { deferred: $.Deferred(), withStars: false };
      }
      debt.game = game;
      debt.withStars = debt.withStars || !!withStars;
      return debt.deferred.promise();
    },
    // Returns the release, which only its first call honours. The write
    // waits a tick, so a hold taken as another ends keeps it owed.
    hold: function () {
      holds += 1;
      return _.once(function () {
        holds -= 1;
        if (!holds && debt) {
          _.defer(settle);
        }
      });
    },
  };
});
