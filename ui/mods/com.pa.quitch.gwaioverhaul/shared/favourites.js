define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourite_loadouts.js",
], function (favouriteLoadouts) {
  // gwaio_-prefixed so this survives mod updates/uninstalls without colliding
  // with base-game or other mods' localStorage keys (see shared/bank.js).
  var LS_KEY = "gwaio_favourite_loadouts";
  var self;

  var gwoFavourites = function () {
    self = this;
    self.ids = ko.observableArray().extend({ local: LS_KEY });
  };

  gwoFavourites.prototype = {
    has: function (id) {
      return favouriteLoadouts.isFavourite(self.ids(), id);
    },
    toggle: function (id) {
      self.ids(favouriteLoadouts.toggleId(self.ids(), id));
    },
  };

  return new gwoFavourites();
});
