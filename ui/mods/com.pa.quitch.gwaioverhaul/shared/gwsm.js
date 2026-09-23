// GW Server Mods' manifest API, or undefined while that mod is absent.
define(function () {
  return {
    manifest: function () {
      var gwsm = window.GwServerMods;
      return gwsm && gwsm.manifest && _.isFunction(gwsm.manifest.load)
        ? gwsm.manifest
        : undefined;
    },
  };
});
