// The referee hires of the launch in progress. Stock fight hires once, or
// twice on a co-op host, in a closure GWO cannot see: the second hire starts
// only after the first resolved and stock remounted the client mods. See
// architecture.md, "Saving the war".
define(function () {
  var current = null;

  return {
    begin: function (expected) {
      current = { expected: expected, resolved: 0, done: $.Deferred() };
    },
    track: function (hire) {
      var launch = current;
      if (!launch) {
        return;
      }
      hire.then(
        function () {
          launch.resolved += 1;
          if (launch.resolved >= launch.expected) {
            launch.done.resolve();
          }
        },
        function () {
          launch.done.resolve();
        }
      );
    },
    // Resolves at once when no launch was begun, as without GWO's referee.
    settled: function () {
      return current
        ? current.done.promise()
        : $.Deferred().resolve().promise();
    },
  };
});
