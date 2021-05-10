define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
], function (gwaioUnitsToNames) {
  return {
    validatePaths: function (path) {
      var index = _.findIndex(gwaioUnitsToNames.units, { path: path });
      if (index === -1)
        console.warn(path, "is invalid or missing from GWO unit_names.js");
    },
    hasUnit: function (path) {
      //this.validatePaths(path);
      return _.some(model.game().inventory().units(), function (unit) {
        return path === unit;
      });
    },
  };
});
