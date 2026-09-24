// The biome step of a referee hire, run with the referee as `this`. Each
// callback is a gwoPromise step, so a rejection or a throw after an engine
// call rejects the hire rather than leaving it unsettled. See galaxy.md,
// "Biome mods in a GW battle".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
], function (gwoBiomeMods, gwoBiomes, gwoPromise) {
  // A war saved before the stamp existed resolves it here instead, once, and
  // writes it onto the star's system so later launches read it.
  var stampedMods = function (system) {
    if (!system) {
      return $.Deferred().resolve([]).promise();
    }
    if (system.gwoBiomeMods || !gwoBiomes.unservableBiome(system)) {
      return $.Deferred()
        .resolve(system.gwoBiomeMods || [])
        .promise();
    }
    return gwoPromise.steps(gwoBiomeMods.providers(), [
      function (providers) {
        var mods = gwoBiomes.modsFor(system, providers);
        if (mods.length) {
          system.gwoBiomeMods = mods;
        }
        return mods;
      },
    ]);
  };

  // A cooked stamp is mounted here only to read from; its server-facing mount
  // happens in the referee's mountFiles, after the unmount there. A stamp GW
  // Server Mods serves is already mounted, and only its biomes are collected.
  return function () {
    var self = this;
    var game = self.game();
    var system = game.galaxy().stars()[game.currentStar()].system();

    self.biomeMods = [];
    self.biomeServed = {};
    return gwoPromise.steps(stampedMods(system), [
      function (mods) {
        if (!mods.length) {
          return undefined;
        }
        var split = _.partition(mods, gwoBiomes.isGwsmServed);
        var cooked = split[1];
        var cookedServed;
        // Cooking drops a mod it cannot read, so a failed mount is not fatal.
        var mounted = $.Deferred();

        self.stage("!LOC:Processing biome mods");
        gwoBiomeMods.mount(cooked).always(function () {
          mounted.resolve();
        });
        return gwoPromise.steps(mounted.promise(), [
          function () {
            return gwoBiomeMods.cook(cooked);
          },
          function (result) {
            self.files(_.assign({}, self.files(), result.files));
            self.biomeMods = result.mods;
            cookedServed = result.served;
            return gwoBiomeMods.serve(split[0]);
          },
          function (served) {
            self.biomeServed = _.assign({}, cookedServed, served.served);
          },
        ]);
      },
    ]);
  };
});
