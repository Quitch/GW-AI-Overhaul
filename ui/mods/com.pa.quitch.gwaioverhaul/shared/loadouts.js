define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
], function (GW, gwoBank, gwoLoadoutIds, gwoLoadoutBanks, helpers) {
  var asCards = function (ids) {
    return _.map(ids, function (id) {
      return { id: id };
    });
  };

  // global for modder compatibility - New-GW-Cards pushes here
  model.gwoNewStartCards = _.isArray(model.gwoNewStartCards)
    ? model.gwoNewStartCards
    : [];
  Array.prototype.push.apply(
    model.gwoNewStartCards,
    asCards(gwoLoadoutIds.unlockable)
  );
  // global for modder compatibility - New-GW-Cards pushes here
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
  // A function rather than a value because a mod's bank is resolved by a
  // requireGW that may not have finished when this module's factory runs. Called
  // after gwoLoadoutBanks.resolve(), it sees every bank; called before, it falls
  // back to the two banks GWO ships and no mod loadout shows as unlocked.
  // A race player is never offered a loadout built for MLA alone. See
  // races.md.
  var offeredCards = function () {
    var settings = model.gwoDifficultySettings;
    var race =
      settings && _.isFunction(settings.playerRace) && settings.playerRace();
    if (!race || race === "mla") {
      return allCards;
    }
    return _.filter(allCards, function (cardData) {
      return !helpers.mlaOnlyCard(cardData.id);
    });
  };

  var startCards = function () {
    return _.map(offeredCards(), function (cardData) {
      if (
        _.includes(model.gwoStartingCards, cardData) ||
        GW.bank.hasStartCard(cardData) ||
        gwoBank.hasStartCard(cardData) ||
        gwoLoadoutBanks.hasStartCard(cardData)
      ) {
        return model.makeKnown(cardData);
      } else {
        return model.makeUnknown(cardData);
      }
    });
  };

  return {
    startCards: startCards,
    allCards: allCards,
    lockedBaseCards: lockedBaseCards,
  };
});
