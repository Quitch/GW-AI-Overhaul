// Stock's GW.manifest.saveGame never rejects: when the write fails, its
// IndexedDB error handler calls result.fail(event), which only adds a callback.
// See architecture.md, "Saving the war".
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
], function (GW, gwoPromise) {
  var timeLimitMs = 30000;
  var manifest = GW.manifest;
  var stockSave = manifest.saveGame;

  var report = function (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  };

  // A jQuery promise, because stock passes saves to $.when. The callbacks run
  // in a native promise reaction, which would swallow a throw from a caller's
  // continuation that the engine used to log. A result that lands after the
  // limit is dropped.
  var limited = function (args, onFailure) {
    var done = $.Deferred();
    gwoPromise
      .within(stockSave.apply(manifest, args), timeLimitMs, "War save")
      .then(
        function (game) {
          try {
            done.resolve(game);
          } catch (e) {
            report(e);
          }
        },
        function (error) {
          try {
            onFailure(error, done);
          } catch (e) {
            report(e);
          }
        }
      );
    return done.promise();
  };

  var reject = function (error, done) {
    done.reject(error);
  };

  // Stock fight hands its save to $.when, whose .always reads the other inputs
  // positionally, so a rejection throws there and leaves launchingFight set. A
  // save that fails while a launch waits is never settled; the launch is called
  // off instead.
  var rejectUnlessLaunching = function (error, done) {
    if (model.launchingFight()) {
      report(error);
      model.launchingFight(false);
      return;
    }
    done.reject(error);
  };

  return {
    save: function (game) {
      return limited([game], reject);
    },
    install: function () {
      manifest.saveGame = function () {
        return limited(arguments, rejectUnlessLaunching);
      };
    },
  };
});
