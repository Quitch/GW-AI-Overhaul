define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save_limit.js",
], function (saveLimit) {
  var latest = 0;

  var settle = function (serial, finish) {
    return function (value) {
      if (serial === latest) {
        model.driveAccessInProgress(false);
      }
      finish(value);
    };
  };

  // A viewer writes no save: stock keeps its local copy of the war, and
  // cards_coop_reroll.js's result handler saves that with
  // GW.manifest.saveGame. It still clears the Saving indicator, and resolves.
  // A host's save rejects when its write has not landed in time, and only the
  // latest one clears the indicator.
  return function (gameState, saveStars) {
    if (model.isCampaignViewer()) {
      model.driveAccessInProgress(false);
      return $.Deferred().resolve().promise();
    }

    // Stock's saveGame writes the star systems while they are marked unsaved
    // and marks them saved once written, so a pending mark is kept.
    if (saveStars) {
      model.game().saved(false);
    }
    model.driveAccessInProgress(true);

    latest += 1;
    var done = $.Deferred();
    saveLimit.save(gameState).then(
      settle(latest, function () {
        done.resolve();
      }),
      settle(latest, function (error) {
        done.reject(error);
      })
    );
    return done.promise();
  };
});
