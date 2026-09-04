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
  // A loadout built for MLA alone is shown to a race player dimmed and
  // unselectable, never hidden: the list keeps its order and the player's
  // unlock state stays visible. The race is gw_start's setting for the host
  // and the picker's observable for a co-op viewer; neither scene has the
  // other's. See races.md.
  var raceInPlay = function () {
    var settings = model.gwoDifficultySettings;

    if (settings && _.isFunction(settings.playerRace)) {
      return settings.playerRace();
    }

    return _.isFunction(model.gwoViewerRace)
      ? model.gwoViewerRace()
      : undefined;
  };

  // The card's click binding is `click: activate` and its class binding
  // `css: btnClass`, so an inert activate and an extra class are all the
  // markup needs. A locked-hint card is left as it is.
  var lockForRace = function (card) {
    var stockBtnClass = card.btnClass;
    card.gwoRaceLocked = true;
    card.activate = function () {};
    card.btnClass = ko.computed(function () {
      return stockBtnClass() + " gwo-race-locked";
    });
    return card;
  };

  var startCards = function () {
    var race = raceInPlay();
    return _.map(allCards, function (cardData) {
      if (
        _.includes(model.gwoStartingCards, cardData) ||
        GW.bank.hasStartCard(cardData) ||
        gwoBank.hasStartCard(cardData) ||
        gwoLoadoutBanks.hasStartCard(cardData)
      ) {
        var card = model.makeKnown(cardData);
        return helpers.raceLocksLoadout(race, cardData.id)
          ? lockForRace(card)
          : card;
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
