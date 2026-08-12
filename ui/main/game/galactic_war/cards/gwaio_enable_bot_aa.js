// Obsolete - kept for compatibility with saves from GWO v5.9.0 and earlier
define({
  visible: () => false, // Can't discard this card,
  describe: () => "",
  summarize: () => "!LOC:Additional Data Bank",
  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage.png",
  deal: () => false,
  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1); // avoid taking up a slot
  },
  dull: function () {},
});
