define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
], function (GW, gwoBank, gwoLoadoutIds) {
  var asCards = function (ids) {
    return _.map(ids, function (id) {
      return { id: id };
    });
  };

  model.gwoNewStartCards = _.isArray(model.gwoNewStartCards)
    ? model.gwoNewStartCards
    : [];
  Array.prototype.push.apply(
    model.gwoNewStartCards,
    asCards(gwoLoadoutIds.unlockable)
  );
  model.gwoStartingCards = _.isArray(model.gwoStartingCards)
    ? model.gwoStartingCards
    : [];
  Array.prototype.push.apply(
    model.gwoStartingCards,
    asCards(gwoLoadoutIds.starting)
  );
  var lockedBaseCards = asCards(gwoLoadoutIds.lockedBase);
  var allCards = model.gwoStartingCards.concat(
    lockedBaseCards,
    model.gwoNewStartCards
  );
  var startCards = _.map(allCards, function (cardData) {
    if (
      _.includes(model.gwoStartingCards, cardData) ||
      GW.bank.hasStartCard(cardData) ||
      gwoBank.hasStartCard(cardData)
    ) {
      return model.makeKnown(cardData);
    } else {
      return model.makeUnknown(cardData);
    }
  });

  return {
    startCards: startCards,
    allCards: allCards,
    lockedBaseCards: lockedBaseCards,
  };
});
