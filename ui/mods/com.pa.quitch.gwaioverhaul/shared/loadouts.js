define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
], (GW, gwoBank, gwoLoadoutIds, gwoLoadoutBanks) => {
  const asCards = (ids) =>
    _.map(ids, (id) => ({
      id,
    }));

  // global for modder compatibility - New-GW-Cards pushes here
  model.gwoNewStartCards = Array.isArray(model.gwoNewStartCards)
    ? model.gwoNewStartCards
    : [];
  Array.prototype.push.apply(
    model.gwoNewStartCards,
    asCards(gwoLoadoutIds.unlockable)
  );
  // global for modder compatibility - New-GW-Cards pushes here
  model.gwoStartingCards = Array.isArray(model.gwoStartingCards)
    ? model.gwoStartingCards
    : [];
  Array.prototype.push.apply(
    model.gwoStartingCards,
    asCards(gwoLoadoutIds.starting)
  );
  const lockedBaseCards = asCards(gwoLoadoutIds.lockedBase);
  const allCards = model.gwoStartingCards.concat(
    lockedBaseCards,
    model.gwoNewStartCards
  );
  // A function rather than a value because a mod's bank is resolved by a
  // requireGW that may not have finished when this module's factory runs. Called
  // after gwoLoadoutBanks.resolve(), it sees every bank; called before, it falls
  // back to the two banks GWO ships and no mod loadout shows as unlocked.
  const startCards = () =>
    _.map(allCards, (cardData) => {
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

  return {
    startCards,
    allCards,
    lockedBaseCards,
  };
});
