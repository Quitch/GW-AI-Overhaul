// Engine promises are not jQuery promises: $.when and deferred.then both
// identify one by a `promise` method, which an engine promise has not got, so
// neither waits for one. See constraints.md.
define(function () {
  // Resolves either way, with onFailure()'s value when the call fails: jQuery
  // 2.1.4 does not turn a fail handler's return into a resolution, so the two
  // outcomes are joined here rather than left to the caller.
  var settled = function (enginePromise, onFailure) {
    var done = $.Deferred();

    enginePromise.then(
      function (result) {
        done.resolve(result);
      },
      function () {
        done.resolve(onFailure ? onFailure() : undefined);
      }
    );

    return done.promise();
  };

  return { settled: settled };
});
