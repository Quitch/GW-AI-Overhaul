// Obsolete - kept for compatibility with GWO v5.9.0 and earlier
define({
  visible: _.constant(false), // Can't discard this card,
  describe: _.constant(""),
  summarize: _.constant("!LOC:Additional Data Bank"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage.png"
  ),
  deal: _.constant(false),
  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1); // avoid taking up a slot
  },
  dull: function () {},
});
