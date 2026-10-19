// The referee hires of the launch in progress. Stock fight hires once, or
// twice on a co-op host, in a closure GWO cannot see: the second hire starts
// only after the first resolved and stock remounted the client mods. See
// architecture.md, "Saving the war".
define(function () {
  var current = null;

  // Stock starts its restore remount in the same step as the first hire's
  // failure, after the hire's own handlers, so busy2 is read a task later.
  // busy2 starts true, and in gw_play only a remount's end sets it false, so
  // a busy2 still true at the failure means no remount ran, and none follows.
  // Fixed when the hire starts: stock's own test, made once at the launch.
  var restoresAfterNext = function (launch) {
    return !!launch && launch.expected === 2 && launch.started === 0;
  };

  var afterRestore = function (fn) {
    var manager = window.CommunityModsManager;
    var busy = manager && manager.busy2;
    var idle = _.isFunction(busy) && !busy();
    _.defer(function () {
      if (!idle || !busy()) {
        fn();
        return;
      }
      var subscription = busy.subscribe(function (value) {
        if (!value) {
          subscription.dispose();
          fn();
        }
      });
    });
  };

  return {
    begin: function (expected) {
      current = {
        expected: expected,
        started: 0,
        resolved: 0,
        done: $.Deferred(),
      };
    },
    track: function (hire) {
      var launch = current;
      if (!launch) {
        return;
      }
      var restores = restoresAfterNext(launch);
      launch.started += 1;
      var end = function () {
        launch.done.resolve();
      };
      hire.then(
        function () {
          launch.resolved += 1;
          // Another mod's hire may run beside stock's.
          if (
            launch.resolved >= launch.expected &&
            launch.resolved === launch.started
          ) {
            end();
          }
        },
        function () {
          if (restores) {
            afterRestore(end);
          } else {
            end();
          }
        }
      );
    },
    // Whether stock restores the client mods after the next hire, and so
    // ends the launch itself when that hire fails.
    restoresAfterNext: function () {
      return restoresAfterNext(current);
    },
    // Resolves at once when no launch was begun, as without GWO's referee.
    settled: function () {
      return current
        ? current.done.promise()
        : $.Deferred().resolve().promise();
    },
  };
});
