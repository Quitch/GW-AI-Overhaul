// Stock gw_lobby and gw_reconnect_loading rebuild each army tag's specs
// from local files through stock GW.specs, and mount that overlay over the
// referee's files. Before either scene's handler builds it, this swaps
// GW.specs.genUnitSpecs and modSpecs for shared/lobby_specs.js's stand-ins
// over the battle's files. See specs.md, "The lobby overlay".
(function () {
  // Stock's own loader, so the GW.specs patched is the one stock reads.
  var loader = _.isFunction(window.requireGW) ? window.requireGW : require;
  var stock;

  var swap = function (specs, lobbySpecs, gwoSpecs, files) {
    if (!stock) {
      stock = {
        genUnitSpecs: specs.genUnitSpecs,
        modSpecs: specs.modSpecs,
      };
    }
    var replacement = lobbySpecs.replacements(files, stock, gwoSpecs.mod);
    specs.genUnitSpecs = replacement.genUnitSpecs;
    specs.modSpecs = replacement.modSpecs;
  };

  // Settles once the swap has landed, or failed: either way stock runs.
  var swapFor = function (files) {
    var done = $.Deferred();
    var settle = function () {
      done.resolve();
    };
    var swapLoaded = function (GW, lobbySpecs, gwoSpecs) {
      try {
        swap(GW.specs, lobbySpecs, gwoSpecs, files);
      } catch (e) {
        console.error("Galactic War Overhaul (GWO): lobby specs: " + e);
      }
      settle();
    };
    loader(
      [
        "shared/gw_common",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/lobby_specs.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/specs.js",
      ],
      swapLoaded,
      settle
    );
    return done.promise();
  };

  var wrap = function (name, filesOf) {
    var stockHandler = handlers[name];
    if (!_.isFunction(stockHandler)) {
      return;
    }
    handlers[name] = function (message) {
      var self = this;
      var args = arguments;
      var runStock = function () {
        stockHandler.apply(self, args);
      };
      var files = message ? filesOf(message) : undefined;
      if (!_.isObject(files)) {
        runStock();
        return;
      }
      swapFor(files).always(runStock);
    };
  };

  wrap("gw_config", function (payload) {
    return payload.files;
  });
  wrap("memory_files", function (message) {
    return message.files || message;
  });
})();
