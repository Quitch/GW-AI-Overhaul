// The loadouts the host can apply. The host writes them on its own inventory,
// which a co-op viewer's copy of the war carries, and the viewer's loadout
// picker locks the rest. See coop.md, "Loadouts the host can apply".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
], function (gwoLoadoutIds, gwoDeal) {
  var TAG = "gwaioHostLoadouts";

  var cardIds = function (list) {
    return _.compact(_.pluck(_.isArray(list) ? list : [], "id"));
  };

  // undefined when the host has written none.
  var read = function (inventory) {
    var ids = inventory && inventory.getTag("global", TAG);
    return _.isArray(ids) && _.every(ids, _.isString) ? ids : undefined;
  };

  // GWO's own loadouts are on every host, so they are offered even when the
  // host's list is unknown.
  var offers = function (hostIds, id) {
    return (
      _.includes(gwoLoadoutIds.all, id) ||
      (_.isArray(hostIds) && _.includes(hostIds, id))
    );
  };

  // GWO's loadouts and every one a mod registered in this scene, less those
  // whose module does not load. Resolves the ids written.
  var publish = function (inventory) {
    var ids = _.uniq(
      gwoLoadoutIds.all.concat(
        cardIds(model.gwoStartingCards),
        cardIds(model.gwoNewStartCards)
      )
    );
    var cards = [];
    var deck = [];
    var loaded = $.Deferred();
    var written = $.Deferred();

    gwoDeal.setupGwoDeck(cards, deck, ids.length, loaded, ids);
    loaded.then(function () {
      var hostIds = _.compact(deck);
      inventory.setTag("global", TAG, hostIds);
      written.resolve(hostIds);
    });

    return written.promise();
  };

  return { read: read, offers: offers, publish: publish };
});
