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

  return {
    save: function (game) {
      return limited([game], reject);
    },
    install: function () {
      var launches = 0;
      var latest = null;

      // Stock fight hands its save to $.when, whose .always reads the other
      // inputs positionally, so a rejection throws there and leaves
      // launchingFight set. Its save is the one made in the same synchronous
      // step as launchingFight turns true, however a mod defers stock fight.
      // That save is never settled; its launch is called off instead.
      model.launchingFight.subscribe(function (launching) {
        if (launching) {
          launches += 1;
          if (latest) {
            latest.launch = launches;
            latest = null;
          }
        }
      });

      manifest.saveGame = function () {
        var call = { launch: 0 };
        latest = call;
        _.defer(function () {
          if (latest === call) {
            latest = null;
          }
        });

        return limited(arguments, function (error, done) {
          if (!call.launch) {
            done.reject(error);
            return;
          }
          report(error);
          if (call.launch === launches && model.launchingFight()) {
            model.launchingFight(false);
          }
        });
      };
    },
  };
});
