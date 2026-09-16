// Engine promises are not jQuery promises: $.when and deferred.then both
// identify one by a `promise` method, which an engine promise has not got, so
// neither waits for one. See constraints.md.
define(() => {
  // Resolves either way, with onFailure()'s value when the call fails: jQuery
  // 2.1.4 does not turn a fail handler's return into a resolution, so the two
  // outcomes are joined here rather than left to the caller.
  const settled = (enginePromise, onFailure) => {
    const done = $.Deferred();

    enginePromise.then(
      (result) => {
        done.resolve(result);
      },
      () => {
        done.resolve(onFailure ? onFailure() : undefined);
      },
    );

    return done.promise();
  };

  return { settled };
});
