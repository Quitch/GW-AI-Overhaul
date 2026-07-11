define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
], function (GW, gwoBank) {
  model.gwoNewStartCards = _.isArray(model.gwoNewStartCards)
    ? model.gwoNewStartCards
    : [];
  model.gwoNewStartCards.push(
    { id: "gwaio_start_ceo" },
    { id: "gwaio_start_paratrooper" },
    { id: "nem_start_deepspace" },
    { id: "nem_start_nuke" },
    { id: "nem_start_planetary" },
    { id: "nem_start_tower_rush" },
    { id: "gwaio_start_tourist" },
    { id: "gwaio_start_rapid" },
    { id: "tgw_start_speed" },
    { id: "tgw_start_tank" },
    { id: "gwaio_start_nomad" },
    { id: "gwaio_start_backpacker" },
    { id: "gwaio_start_hoarder" },
    { id: "gwaio_start_warp" },
    { id: "gwaio_start_terminal" },
    { id: "gwaio_start_lucky" }
  );
  model.gwoStartingCards = _.isArray(model.gwoStartingCards)
    ? model.gwoStartingCards
    : [];
  model.gwoStartingCards.push(
    { id: "gwc_start_vehicle" },
    { id: "gwc_start_air" },
    { id: "gwc_start_orbital" },
    { id: "gwc_start_bot" },
    { id: "gwaio_start_naval" }
  );
  var lockedBaseCards = [
    { id: "gwc_start_artillery" },
    { id: "gwc_start_subcdr" },
    { id: "gwc_start_combatcdr" },
    { id: "gwc_start_allfactory" },
    { id: "gwc_start_storage" },
  ];
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
