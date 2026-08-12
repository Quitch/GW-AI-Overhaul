define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourite_loadouts.js",
], (favouriteLoadouts) => {
  // gwaio_-prefixed so this survives mod updates/uninstalls without colliding
  // with base-game or other mods' localStorage keys (see shared/bank.js).
  const LS_KEY = "gwaio_favourite_loadouts";

  class GwoFavourites {
    constructor() {
      this.ids = ko.observableArray().extend({ local: LS_KEY });
    }

    has(id) {
      return favouriteLoadouts.isFavourite(this.ids(), id);
    }

    toggle(id) {
      this.ids(favouriteLoadouts.toggleId(this.ids(), id));
    }
  }

  return new GwoFavourites();
});
