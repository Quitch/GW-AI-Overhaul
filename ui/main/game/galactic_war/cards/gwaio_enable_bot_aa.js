// Obsolete - kept for compatibility with saves from GWO v5.9.0 and earlier
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwaioCards
) {
  return {
    visible: _.constant(false), // Can't discard this card,
    describe: _.constant(""),
    summarize: _.constant("!LOC:Additional Data Bank"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage.png"
    ),
    getContext: gwaioCards.getContext,
    deal: _.constant(false),
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1); // avoid taking up a slot
    },
    dull: function () {
      //empty
    },
  };
});
